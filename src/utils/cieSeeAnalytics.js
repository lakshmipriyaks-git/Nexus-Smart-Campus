/**
 * @typedef {Object} StudentMarks
 * @property {string} student_id
 * @property {string} name
 * @property {string} subject_code
 * @property {number} cie_marks - Max 50
 * @property {number} see_marks - Max 50
 */

/**
 * Analyzes student marks and calculates gap, result, and risk category.
 * @param {StudentMarks[]} marksData Array of student marks objects
 * @param {number} seePassThreshold The threshold for SEE to pass (default 18)
 * @returns {Object[]} Analyzed data with totalMarks, gap, result, and riskCategory
 */
export const analyzeStudentMarks = (marksData, seePassThreshold = 18) => {
  return marksData.map(student => {
    const totalMarks = student.cie_marks + student.see_marks;
    const gap = student.cie_marks - student.see_marks;
    const result = student.see_marks >= seePassThreshold ? 'Pass' : 'Fail';
    
    let riskCategory = '';
    
    // Risk Categories logic 
    // Assuming CIE >= 25 is "High" and < 25 is "Low" (based on 50 max marks)
    if (student.cie_marks >= 25 && student.see_marks < seePassThreshold) {
      riskCategory = 'High CIE but Failed SEE';
    } else if (student.cie_marks < 25 && student.see_marks >= seePassThreshold) {
      riskCategory = 'Low CIE but Passed SEE';
    } else if (student.cie_marks >= 25 && student.see_marks >= seePassThreshold) {
      riskCategory = 'Consistent Pass';
    } else {
      riskCategory = 'Consistent Fail';
    }

    return {
      ...student,
      totalMarks,
      gap,
      result,
      riskCategory
    };
  });
};

/**
 * Calculates class-wide aggregates, including Pearson Correlation between CIE and SEE.
 * @param {Object[]} analyzedData The output from analyzeStudentMarks
 * @returns {Object|null} Aggregate metrics or null if no data
 */
export const calculateClassAggregates = (analyzedData) => {
  const totalStudents = analyzedData.length;
  if (totalStudents === 0) return null;

  let sumCIE = 0;
  let sumSEE = 0;
  let passCount = 0;
  let failCount = 0;

  const riskCounts = {
    'High CIE but Failed SEE': 0,
    'Low CIE but Passed SEE': 0,
    'Consistent Pass': 0,
    'Consistent Fail': 0,
  };

  // Compute sums and counts
  analyzedData.forEach(student => {
    sumCIE += student.cie_marks;
    sumSEE += student.see_marks;
    
    if (student.result === 'Pass') {
      passCount++;
    } else {
      failCount++;
    }
    
    if (riskCounts[student.riskCategory] !== undefined) {
      riskCounts[student.riskCategory]++;
    }
  });

  const avgCIE = sumCIE / totalStudents;
  const avgSEE = sumSEE / totalStudents;

  // Pearson Correlation Coefficient Calculation
  let sumCieDiffMuxSeeDiff = 0;
  let sumCieDiffSq = 0;
  let sumSeeDiffSq = 0;

  analyzedData.forEach(student => {
    const cieDiff = student.cie_marks - avgCIE;
    const seeDiff = student.see_marks - avgSEE;
    
    sumCieDiffMuxSeeDiff += cieDiff * seeDiff;
    sumCieDiffSq += cieDiff * cieDiff;
    sumSeeDiffSq += seeDiff * seeDiff;
  });

  let correlation = 0;
  if (sumCieDiffSq > 0 && sumSeeDiffSq > 0) {
    correlation = sumCieDiffMuxSeeDiff / Math.sqrt(sumCieDiffSq * sumSeeDiffSq);
  }

  // Interpretation string
  let interpretation = '';
  if (correlation > 0.70) {
    interpretation = 'Strong alignment';
  } else if (correlation >= 0.50) {
    interpretation = 'Moderate alignment';
  } else {
    interpretation = 'Weak alignment';
  }

  return {
    totalStudents,
    avgCIE: Number(avgCIE.toFixed(2)),
    avgSEE: Number(avgSEE.toFixed(2)),
    passCount,
    failCount,
    passPercentage: Number(((passCount / totalStudents) * 100).toFixed(1)),
    failPercentage: Number(((failCount / totalStudents) * 100).toFixed(1)),
    correlation: Number(correlation.toFixed(3)),
    interpretation,
    riskCounts
  };
};
