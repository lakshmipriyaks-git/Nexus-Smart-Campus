/**
 * Utility functions for VTU Grade System calculations.
 */

// VTU converts marks into grades like this:
// 90 - 100: O (Outstanding) -> 10
// 80 - 89: A+ -> 9
// 70 - 79: A -> 8
// 60 - 69: B+ -> 7
// 55 - 59: B -> 6
// 50 - 54: C -> 5
// 40 - 49: P (Pass) -> 4
// Below 40: F (Fail) -> 0
export const getVtuGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'O', point: 10, label: 'Outstanding' };
    if (percentage >= 80) return { grade: 'A+', point: 9, label: 'Excellent' };
    if (percentage >= 70) return { grade: 'A', point: 8, label: 'Very Good' };
    if (percentage >= 60) return { grade: 'B+', point: 7, label: 'Good' };
    if (percentage >= 55) return { grade: 'B', point: 6, label: 'Above Average' };
    if (percentage >= 50) return { grade: 'C', point: 5, label: 'Average' };
    if (percentage >= 40) return { grade: 'P', point: 4, label: 'Pass' };
    return { grade: 'F', point: 0, label: 'Fail' };
};

// SGPA Formula: Sum(Credit * Grade Point) / Sum(Credits)
export const calculateSgpa = (subjects) => {
    if (!subjects || subjects.length === 0) return 0;

    let totalCreditPoints = 0;
    let totalCredits = 0;

    subjects.forEach(subject => {
        const credits = subject.credits || 4; // Default to 4 credits if not specified
        const gradeInfo = getVtuGrade(subject.percentage || 0);
        
        totalCreditPoints += (credits * gradeInfo.point);
        totalCredits += credits;
    });

    if (totalCredits === 0) return 0;
    
    // Return rounded to 2 decimal places
    return Math.round((totalCreditPoints / totalCredits) * 100) / 100;
};

// CGPA Formula: Average of SGPA of all semesters
export const calculateCgpa = (semesters) => {
    if (!semesters || semesters.length === 0) return 0;
    
    const validSgpas = semesters.map(sem => sem.sgpa).filter(sgpa => sgpa > 0);
    if (validSgpas.length === 0) return 0;

    const totalSgpa = validSgpas.reduce((sum, sgpa) => sum + sgpa, 0);
    
    // Return rounded to 2 decimal places
    return Math.round((totalSgpa / validSgpas.length) * 100) / 100;
};

// Percentage = (CGPA - 0.75) * 10
export const cgpaToPercentage = (cgpa) => {
    if (!cgpa || cgpa < 0.75) return 0;
    return Math.round((cgpa - 0.75) * 10 * 100) / 100;
};
