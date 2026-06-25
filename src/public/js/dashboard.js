// Dashboard specific interactivity
document.addEventListener('DOMContentLoaded', () => {
    // Animate progress bar on load
    const progressBar = document.querySelector('.bg-indigo-600');
    if (progressBar) {
        const width = progressBar.style.width;
        progressBar.style.width = '0%';
        setTimeout(() => {
            progressBar.style.width = width;
        }, 300);
    }
});
router.get('/dashboard', authenticate, async (req, res) => {
    const userId = req.user.id;

    // ✅ Get APS
    const profile = await query(`
        SELECT aps_score
        FROM student_profiles
        WHERE user_id_user_id = $1
    `, [userId]);

    const apsScore = profile.rows[0]?.aps_score || 0;

    // ✅ Get subjects from results table
    const results = await query(`
        SELECT subject, mark, level, aps_points
        FROM results
        WHERE user_id = $1
        ORDER BY subject ASC
    `, [userId]);

    res.render('pages/dashboard', {
        user: req.user,
        apsScore,
        subjects: results.rows   // ✅ SEND TO FRONTEND
    });
});
``