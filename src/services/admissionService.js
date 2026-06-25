const { query } = require('../config/database');
const { ADMISSIONS_OFFICER_PROMPT } = require('../prompts/admissionsOfficer');
const groqService = require('./groqService');

/**
 * Validates UUID format
 */
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

// Note: Ensure helper functions (normalizeSubjectName, etc.) are defined above or imported here

class AdmissionService {

   async findMatches(userId, preferences = {}) {
    const { rows: courses } = await query('SELECT id FROM courses');

    const evaluations = await Promise.all(
        courses.map(course => this.evaluateCourse(userId, course.id)) 
    );

    const categorized = {
        eligible: [],
        conditional: [],
        missing_requirements: [],
        ineligible: []
    };

    evaluations.forEach((res, index) => {
        const item = { courseId: courses[index].id, ...res };

        if (res.eligibility_status === 'ELIGIBLE') categorized.eligible.push(item);
        else if (res.eligibility_status === 'CONDITIONAL') categorized.conditional.push(item);
        else if (res.eligibility_status === 'MISSING_REQUIREMENTS') categorized.missing_requirements.push(item);
        else categorized.ineligible.push(item);
    });

    return {
        matches: [...categorized.eligible, ...categorized.conditional],
        categorized,
        count: categorized.eligible.length + categorized.conditional.length,
        total_evaluated: evaluations.length,
        hasMore: false
    };
}
    async evaluateCourse(userId, courseId) {
        if (!isValidUUID(userId) || !isValidUUID(courseId)) {
            throw new Error('Invalid user or course ID format');
        }

        try {
            const studentData = await this.getStudentResults(userId);
            if (!studentData.subjects || studentData.subjects.length === 0) {
                return {
                    eligibility_status: 'MISSING_REQUIREMENTS',
                    confidence_score: 0,
                    narrative_reason: 'No results found. Please upload your matric results first.',
                    calculated_aps: null,
                    subject_analysis: []
                };
            }

            const courseData = await this.getCourseRequirements(courseId);
            const preCalculated = this.calculatePreliminaryAPS(studentData, courseData);
            const context = {
                student: { ...studentData, ...preCalculated },
                course: courseData
            };

            const evaluation = await groqService.evaluateAdmission(context);
            await this.storeRecommendation(userId, courseId, evaluation);
            return evaluation;
        } catch (error) {
            console.error(`Admission evaluation error for user ${userId}, course ${courseId}:`, error);
            if (error.message === 'Course not found') throw error;
            return {
                eligibility_status: 'ERROR',
                confidence_score: 0,
                narrative_reason: 'Unable to complete evaluation. Please try again later.',
                error: error.message,
                calculated_aps: null
            };
        }
    }

    async evaluateWithProspectus(userId, courseId) {
        const studentData = await this.getStudentResults(userId);
        const prospectusData = await query('SELECT prospectus_text FROM courses WHERE id = $1', [courseId]);
        
        if (prospectusData.rows.length === 0) throw new Error('Course not found');

        const prompt = `
            You are an Admissions Officer. 
            Student Subjects: ${JSON.stringify(studentData.subjects)}
            University Prospectus: ${prospectusData.rows[0].prospectus_text}
            
            Analyze if the student meets the specific requirements listed in the prospectus.
            Provide a confidence score (0-1) and a narrative explanation.
        `;

        return await groqService.evaluateAdmission({ prompt });
    }

    async evaluateCourseRuleBased(userId, courseId, courseData = null) {
        // ... (Keep your existing implementation here)
        // Ensure this method ends with the correct closing brace }
    }
} // <--- Only one closing brace here at the very end of the class

module.exports = AdmissionService;