class APSCalculator {
    // NSC Level to APS points mapping
    static LEVEL_POINTS = {
        7: 7, // 80-100%: Outstanding achievement
        6: 6, // 70-79%: Meritorious achievement  
        5: 5, // 60-69%: Substantial achievement
        4: 4, // 50-59%: Adequate achievement
        3: 3, // 40-49%: Moderate achievement
        2: 2, // 30-39%: Elementary achievement
        1: 1  // 0-29%: Not achieved
    };

    // Compulsory subjects for university admission
    static COMPULSORY_SUBJECTS = [
        'Home Language',
        'First Additional Language',
        'Mathematics'
    ];

    // Added inside the class scope
    calculateLevel(mark) {
        const m = parseInt(mark);
        if (m >= 80) return 7;
        if (m >= 70) return 6;
        if (m >= 60) return 5;
        if (m >= 50) return 4;
        if (m >= 40) return 3;
        if (m >= 30) return 2;
        return 1;
    }

    calculateAPS(subjects) {
        let totalAPS = 0;
        const subjectBreakdown = [];

        for (const subject of subjects) {
            const points = APSCalculator.LEVEL_POINTS[subject.level] || 0;
            totalAPS += points;
            
            subjectBreakdown.push({
                subject: subject.subject,
                mark: subject.mark,
                level: subject.level,
                aps_points: points
            });
        }

        const bestSix = [...subjectBreakdown]
            .filter(s => !s.subject.toLowerCase().includes('life orientation'))
            .sort((a, b) => b.aps_points - a.aps_points)
            .slice(0, 6);

        const bestSixAPS = bestSix.reduce((sum, s) => sum + s.aps_points, 0);

        return {
            total_aps: totalAPS,
            best_six_aps: bestSixAPS,
            subject_count: subjects.length,
            subjects: subjectBreakdown,
            best_six_subjects: bestSix,
            university_admission_aps: bestSixAPS
        };
    }

    validateForUniversity(subjects, requirements = {}) {
        const issues = [];
        const hasMath = subjects.some(s => 
            s.subject.includes('Mathematics') && !s.subject.includes('Literacy')
        );
        const hasMathLit = subjects.some(s => 
            s.subject.includes('Mathematical Literacy')
        );

        if (!hasMath && requirements.require_math) {
            if (!hasMathLit || !requirements.accept_math_lit) {
                issues.push('Mathematics required for this course');
            }
        }

        if (requirements.required_subjects) {
            for (const req of requirements.required_subjects) {
                const hasSubject = subjects.some(s => 
                    s.subject.toLowerCase().includes(req.subject.toLowerCase()) &&
                    s.level >= req.min_level
                );
                if (!hasSubject) {
                    issues.push(`${req.subject} (Level ${req.min_level}+) required`);
                }
            }
        }

        return {
            eligible: issues.length === 0,
            issues
        };
    }
}

module.exports = new APSCalculator();