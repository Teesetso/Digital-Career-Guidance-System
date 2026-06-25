const express = require('express');
const router = express.Router();

const multer = require('multer');
const { Pool } = require('pg');
const { authenticate } = require('../middleware/auth');
const groqService = require('../services/groqService');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf','image/jpeg','image/jpg','image/png','image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only PDF and image files (JPG, PNG, WEBP) are accepted.'));
    }
});

function calculateAPS(subjects) {
    const exclude = ['life orientation', 'lo'];
    const eligible = subjects
        .filter(s => !exclude.includes((s.subject || '').toLowerCase().trim()))
        .sort((a, b) => b.level - a.level)
        .slice(0, 6);
    return eligible.reduce((sum, s) => sum + (s.level || 0), 0);
}

async function extractPdfText(buffer) {
    const pdfParse = require('pdf-parse');
    const result = await pdfParse(buffer);
    return result?.text || '';
}

function imageToBase64(buffer, mimetype) {
    return `data:${mimetype};base64,${buffer.toString('base64')}`;
}

async function extractFromImage(buffer, mimetype) {
    const Groq = require('groq-sdk');
    const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});
    const base64Image = imageToBase64(buffer, mimetype);

    const completion = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `You are extracting South African matric results from this report card image.

CRITICAL INSTRUCTIONS:
- Extract marks from the "Learner %" column ONLY
- IGNORE the "Grade" or "National" columns
- Levels are 1-7 (7=80-100%, 6=70-79%, 5=60-69%, 4=50-59%, 3=40-49%, 2=30-39%, 1=0-29%)

Return ONLY valid JSON, no markdown, no explanation:
{
  "subjects": [{ "subject": "exact subject name", "mark": 75, "level": 6 }],
  "year": 2024,
  "exam_type": "NSC"
}`
                    },
                    { type: 'image_url', image_url: { url: base64Image } }
                ]
            }
        ],
        temperature: 0.1,
        max_tokens: 2048,
        response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
}
router.get('/status/:uploadId', async (req, res) => {
    try {
        const { uploadId } = req.params;

        const job = await pool.query(`
            SELECT 
                ocr_status,
                groq_parsed,
                aps_score,
                ocr_error
            FROM result_uploads 
           WHERE id = $1
`, [uploadId]);

        if (job.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const data = job.rows[0];

        let parsedData = data.groq_parsed;

        if (typeof parsedData === 'string') {
            parsedData = JSON.parse(parsedData);
        }

        res.json({
            status: data.ocr_status,                 
            subjects: parsedData?.subjects || [],    
            apsScore: data.aps_score,                
            error: data.ocr_error
        });

    } catch (error) {
        console.error('Polling Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// ── 1. UPLOAD ─────────────────────────────────────────────────────────────
router.post('/upload', authenticate, upload.single('reportCard'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        const { mimetype, buffer, originalname } = req.file;
        const userId = req.user?.id;
        console.log(`[Upload] Processing ${mimetype} for user ${userId}`);

        let groqResult;

        if (mimetype === 'application/pdf') {
            console.log('[Upload] Extracting text from PDF...');
            const rawText = await extractPdfText(buffer);

            if (!rawText || rawText.trim().length < 50) {
                console.log('[Upload] PDF has no text, trying vision fallback...');
                try {
                    const imageData = await extractFromImage(buffer, mimetype);
                    groqResult = { success: true, data: groqService.validateAndClean(imageData) };
                } catch (visionErr) {
                    return res.status(422).json({
                        success: false,
                        message: 'This PDF is a scanned image with no readable text. Please upload a JPG or PNG photo of your results instead.'
                    });
                }
            } else {
                console.log('[Upload] Sending PDF text to Groq...');
                groqResult = await groqService.parseResults(rawText);
            }

        } else if (mimetype.startsWith('image/')) {
            console.log('[Upload] Sending image to Groq vision...');
            try {
                const rawData = await extractFromImage(buffer, mimetype);
                groqResult = { success: true, data: groqService.validateAndClean(rawData) };
            } catch (visionErr) {
                console.error('[Upload] Vision failed:', visionErr.message);
                return res.status(422).json({
                    success: false,
                    message: 'Could not read subjects from image. Please ensure it is clear and well-lit.'
                });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Unsupported file type.' });
        }

        if (!groqResult || !groqResult.success || !groqResult.data) {
    console.error('[Upload] Groq failed or returned invalid data:', groqResult);

    return res.status(422).json({
        success: false,
        message: 'Failed to extract subjects from document'
    });
}


        const { subjects = [], year = null, exam_type = null } = groqResult.data || {};
        const apsScore = calculateAPS(subjects);
        console.log(`[Upload] Extracted ${subjects.length} subjects, APS = ${apsScore}`);

        // Upsert student_profiles
        const profileResult = await pool.query(
            `UPDATE student_profiles SET aps_score = $1 WHERE user_id = $2 RETURNING id`,
            [apsScore, userId]
        );
        if (profileResult.rows.length === 0) {
            await pool.query(
                `INSERT INTO student_profiles (user_id, aps_score) VALUES ($1, $2)`,
                [userId, apsScore]
            );
        }

    const result = await pool.query(`
    INSERT INTO result_uploads 
    (user_id, aps_score, ocr_status, filename)
    VALUES ($1, $2, 'completed', $3)
    RETURNING id
`, [userId, apsScore, originalname]);

return res.status(200).json({
    success: true,
    status: 'completed',
    uploadId: result.rows[0].id,
    apsScore,
    subjects: subjects.map(s => ({
        subject: s.subject,
        mark: s.mark,
        level: s.level,
        aps_points: s.level
    })),
    year,
    exam_type
});
    } catch (error) {
        console.error('[Upload] CRITICAL ERROR:', error);
        return res.status(500).json({ success: false, message: 'Upload processing failed: ' + error.message });
    }
});

// ── 2. CONFIRM ────────────────────────────────────────────────────────────
router.post('/confirm', authenticate, express.json(), async (req, res) => {
    try {
        const { subjects } = req.body;
        const userId = req.user?.id;

        if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
            return res.status(400).json({ error: 'No subjects provided.' });
        }

        await pool.query('DELETE FROM results WHERE user_id = $1', [userId]);

        for (const item of subjects) {
            const subjectName = item.subject || item.name;
            const mark = parseInt(item.mark, 10);
            if (!subjectName || isNaN(mark)) continue;

            let level = parseInt(item.level, 10);
            if (isNaN(level)) {
                if (mark >= 80) level = 7;
                else if (mark >= 70) level = 6;
                else if (mark >= 60) level = 5;
                else if (mark >= 50) level = 4;
                else if (mark >= 40) level = 3;
                else if (mark >= 30) level = 2;
                else level = 1;
            }

            const apsPoints = parseInt(item.aps_points, 10) || level;
            await pool.query(
                `INSERT INTO results (user_id, subject, mark, level, aps_points) VALUES ($1, $2, $3, $4, $5)`,
                [userId, subjectName, mark, level, apsPoints]
            );
        }

        const apsScore = calculateAPS(subjects.map(s => ({
            subject: s.subject || s.name,
            level: parseInt(s.level, 10) || 1
        })));

        await pool.query(`UPDATE student_profiles SET aps_score = $1 WHERE user_id = $2`, [apsScore, userId]);
        await pool.query(
            `UPDATE result_uploads SET ocr_status = 'confirmed' WHERE user_id = $1 AND ocr_status = 'completed'`,
            [userId]
        );

        return res.status(200).json({ success: true, apsScore, message: 'Results confirmed and saved.' });

    } catch (error) {
        console.error('[Confirm] Error:', error);
        return res.status(500).json({ error: 'Failed to save results: ' + error.message });
    }
});

module.exports = router;
