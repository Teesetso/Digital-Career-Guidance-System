const { query } = require('../config/database');
const geminiService = require('../services/geminiService');
const groqService = require('../services/groqService');
const apsCalculator = require('../services/apsCalculator');
const cloudinary = require('../services/cloudinaryService');

class ResultsController {
    // POST /api/results/upload
    async upload(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const userId = req.user.id;
            const file = req.file;

            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!allowedTypes.includes(file.mimetype)) {
                return res.status(400).json({ error: 'Invalid file type. Use JPG, PNG, or PDF' });
            }

            const cloudinaryResult = await cloudinary.uploadFile(file.buffer, {
                folder: 'dcgs/results',
                public_id: `${userId}_${Date.now()}`,
                resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image'
            });

            const uploadRecord = await query(`
                INSERT INTO result_uploads 
                (user_id, filename, original_name, cloudinary_url, cloudinary_public_id, ocr_status)
                VALUES ($1, $2, $3, $4, $5, 'processing')
                RETURNING id
            `, [userId, file.filename, file.originalname, cloudinaryResult.secure_url, cloudinaryResult.public_id]);

            this.processOCR(uploadRecord.rows[0].id, cloudinaryResult.secure_url, file.mimetype);

            res.status(202).json({
                message: 'File uploaded successfully. Processing...',
                uploadId: uploadRecord.rows[0].id,
                status: 'processing',
                url: cloudinaryResult.secure_url
            });

        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ error: 'Upload failed' });
        }
    }

    // Consolidated Async OCR processing
    async processOCR(uploadId, imageUrl, mimeType) {
        try {
            const imageBuffer = await this.downloadImage(imageUrl);
            const base64 = imageBuffer.toString('base64');

            // Step 1: Gemini OCR
            const geminiResult = await geminiService.extractTextFromImage(base64, mimeType);
            if (!geminiResult.success) throw new Error(`Gemini OCR failed: ${geminiResult.error}`);

            if (geminiResult.rawText.trim().length < 20) {
                throw new Error('Gemini returned too little text — report card may be unreadable');
            }

            // Step 2: Clean and Parse with Groq
            let groqData;
            try {
                const rawText = geminiResult.rawText;
                const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '');
                const groqResult = await groqService.parseResults(cleanJson);
                
                if (!groqResult.success) throw new Error(`Groq parsing failed: ${groqResult.error}`);
                groqData = groqResult.data;
            } catch (e) {
                console.error("AI Data Parsing Error:", e);
                throw new Error("AI returned invalid data format");
            }

            // Final sanity check
            if (!groqData.subjects || groqData.subjects.length < 5) {
                throw new Error(`Insufficient subjects found`);
            }

            // Step 3: Calculate APS & Update DB
            const apsResult = apsCalculator.calculateAPS(groqData.subjects);
            await query(`
                UPDATE result_uploads 
                SET groq_parsed = $1, aps_score = $2, ocr_status = 'completed', processed_at = CURRENT_TIMESTAMP
                WHERE id = $3
            `, [JSON.stringify(groqData), apsResult.best_six_aps, uploadId]);

            console.log(`OCR completed for upload ${uploadId}. APS: ${apsResult.best_six_aps}`);

        } catch (error) {
            console.error('OCR Processing error:', error);
            await this.failUpload(uploadId, error.message);
        }
    }

    async failUpload(uploadId, errorMessage) {
        try {
            await query(`
                UPDATE result_uploads
                SET ocr_status = 'failed', ocr_error = $2
                WHERE id = $1
            `, [uploadId, errorMessage]);
        } catch (err) {
            console.error('failUpload error:', err);
        }
    }

    async downloadImage(url) {
        const https = require('https');
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Image download timed out after 20s')), 20000);
            https.get(url, (res) => {
                const data = [];
                res.on('data', chunk => data.push(chunk));
                res.on('end', () => {
                    clearTimeout(timeout);
                    resolve(Buffer.concat(data));
                });
            }).on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    }

    async getStatus(req, res) {
        try {
            const { uploadId } = req.params;
            const userId = req.user.id;

            const result = await query(`
                SELECT id, ocr_status, aps_score, groq_parsed, ocr_error, processed_at, created_at
                FROM result_uploads
                WHERE id = $1 AND user_id = $2
            `, [uploadId, userId]);

            if (result.rows.length === 0) return res.status(404).json({ error: 'Upload not found' });

            const upload = result.rows[0];
            let parsedData = typeof upload.groq_parsed === 'string' ? JSON.parse(upload.groq_parsed) : upload.groq_parsed;

            res.json({
                id: upload.id,
                status: upload.ocr_status,
                apsScore: upload.aps_score,
                subjects: parsedData?.subjects || null,
                error: upload.ocr_error,
                processedAt: upload.processed_at,
                createdAt: upload.created_at
            });
        } catch (error) {
            console.error('GetStatus error:', error);
            res.status(500).json({ error: 'Failed to get status' });
        }
    }

    async getLatest(req, res) {
        try {
            const userId = req.user.id;
            const uploadResult = await query(`
                SELECT groq_parsed, aps_score, processed_at
                FROM result_uploads
                WHERE user_id = $1 AND ocr_status = 'completed'
                ORDER BY processed_at DESC LIMIT 1
            `, [userId]);

            if (uploadResult.rows.length === 0) return res.json({ hasResults: false });

            const resultsResult = await query(`
                SELECT subject, mark, level, aps_points
                FROM results WHERE user_id = $1 ORDER BY aps_points DESC
            `, [userId]);

            const enrichedSubjects = resultsResult.rows.map(s => ({
                ...s,
                aps_points: s.aps_points || apsCalculator.LEVEL_POINTS[s.level] || 0
            }));

            res.json({
                hasResults: true,
                apsScore: uploadResult.rows[0].aps_score,
                processedAt: uploadResult.rows[0].processed_at,
                subjects: enrichedSubjects,
                raw: uploadResult.rows[0].groq_parsed
            });
        } catch (error) {
            console.error('Error fetching latest results:', error);
            res.status(500).json({ error: 'Failed to fetch results' });
        }
    }

    async confirmResults(req, res) {
        try {
            const { subjects, uploadId } = req.body;
            const userId = req.user.id;

            if (!Array.isArray(subjects) || subjects.length === 0) return res.status(400).json({ error: 'No subjects provided' });

            const apsResult = apsCalculator.calculateAPS(subjects);
            await query('DELETE FROM results WHERE user_id = $1', [userId]);

            for (const subject of apsResult.subjects) {
                await query(`
                    INSERT INTO results (user_id, subject, mark, level, aps_points, year)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [userId, subject.subject, subject.mark, subject.level, subject.aps_points, new Date().getFullYear()]);
            }

            await query(`UPDATE student_profiles SET profile_completion = LEAST(profile_completion + 25, 100) WHERE user_id = $1`, [userId]);

            if (uploadId && uploadId !== 'mock-upload-id') {
                await query(`UPDATE result_uploads SET ocr_status = 'confirmed' WHERE id = $1`, [uploadId]);
            }

            res.json({ message: 'Results saved successfully', apsScore: apsResult.best_six_aps, subjects: apsResult.subjects });
        } catch (error) {
            console.error('Confirm results error:', error);
            res.status(500).json({ error: 'Failed to save results' });
        }
    }

    async updateResult(req, res) {
        try {
            const { id } = req.params;
            const { mark } = req.body;
            const level = apsCalculator.calculateLevel(mark);
            const apsPoints = apsCalculator.LEVEL_POINTS[level];

            await query(`
                UPDATE results 
                SET mark = $1, level = $2, aps_points = $3, updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
            `, [mark, level, apsPoints, id]);

            res.json({ message: 'Result updated', mark, level, aps_points: apsPoints });
        } catch (error) {
            console.error('Update error:', error);
            res.status(500).json({ error: 'Update failed' });
        }
    }
}

module.exports = new ResultsController();