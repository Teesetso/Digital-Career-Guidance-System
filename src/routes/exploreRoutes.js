// routes/exploreRoutes.js
// ─────────────────────────────────────────────────────────────────
// Handles the /explore/courses route that was returning 404
// ─────────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();

// Middleware: ensure user is logged in (adapt to your own auth middleware)
function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// ── GET /explore/courses ────────────────────────────────────────
router.get('/courses', requireAuth, async (req, res) => {
    try {
        const user = req.session.user;

        // ── Optional: load AI recommendations if user has uploaded results ──
        // If the user has uploaded results and got recommendations stored in DB,
        // fetch them here and pass to the view. Example (adapt to your DB):
        //
        // const db = req.app.get('db'); // or however you access your DB
        // const recommendations = await db.query(
        //   `SELECT university_id, course_name FROM recommendations WHERE user_id = $1`,
        //   [user.id]
        // );
        // const recommendedKeys = recommendations.rows.map(r => `${r.university_id}-${r.course_name}`);
        //
        // For now we send an empty array — the page still shows all courses:
        const recommendedKeys = [];

        res.render('explore', {
            title: 'Explore Courses',
            user,
            recommendedKeys,   // passed to EJS, used by the JS inside the template
        });

    } catch (err) {
        console.error('Error loading explore page:', err);
        res.status(500).render('error', { message: 'Could not load courses page.' });
    }
});

// ── GET /explore/courses/:uniId/:courseName ─────────────────────
// Individual course detail page (optional — wire up later)
router.get('/courses/:uniId/:courseName', requireAuth, (req, res) => {
    const { uniId, courseName } = req.params;
    // For now redirect back to explore with a filter applied
    // You can build a full detail page here later
    res.redirect(`/explore/courses?university=${uniId}&search=${encodeURIComponent(courseName)}`);
});

module.exports = router;
