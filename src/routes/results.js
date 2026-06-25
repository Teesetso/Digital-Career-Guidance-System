const express = require('express');
const router = express.Router();

const multer = require('multer');
const { Pool } = require('pg');

// ✅ MUST BE HERE (top)
const { authenticate } = require('../middleware/auth');

const groqService = require('../services/groqService');
// ── Paste the code right below your upload route ───────────────────────────
router.post('/confirm', authenticate, async (req, res) => { // Added your 'authenticate' middleware to pull the real session user id
    const { subjects } = req.body;
    
    // Safely pulls your logged-in student user UUID from session cookies
    const userId = req.user ? req.user.id : null; 

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid payload structure: Subjects array is required.' 
        });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Updates parent tracking rows inside result_uploads to match your Neon history console layout
        const updateUploadQuery = `
            UPDATE result_uploads 
            SET ocr_status = $1 
            WHERE user_id = $2 AND ocr_status = 'completed'
            RETURNING id;
        `;
        await client.query(updateUploadQuery, ['confirmed', userId]);

        // 2. Inserts individual validated subject scores into the 'results' table
        const insertResultQuery = `
            INSERT INTO results (user_id, subject, mark, level, aps_points, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW());
        `;

        for (const subject of subjects) {
            const subjectName = subject.name.trim();
            const mark = parseInt(subject.mark, 10);
            
            // Re-calculates NSC levels and points dynamically to ensure database synchronization integrity
            let level = 1;
            if (mark >= 80) level = 7;
            else if (mark >= 70) level = 6;
            else if (mark >= 60) level = 5;
            else if (mark >= 50) level = 4;
            else if (mark >= 40) level = 3;
            else if (mark >= 30) level = 2;

            if (!subjectName || isNaN(mark)) {
                throw new Error(`Malformed subject entry detected: ${JSON.stringify(subject)}`);
            }

            // Syncs precisely with your dashboard table properties schema ('subject', 'mark', 'level', 'aps_points')
            await client.query(insertResultQuery, [userId, subjectName, mark, level, level]);
        }

        await client.query('COMMIT');

        res.status(200).json({
            success: true,
            message: 'Academic metrics confirmed and successfully synchronized.'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Database Confirmation Transaction Error:', error);
        
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error encountered while saving records.'
        });
    } finally {
        client.release();
    }
});
// Add this to src/routes/results.js
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

// Leave this as the absolute last line of your file!
module.exports = router;