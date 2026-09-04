/**
 * Student Performance Trend Calculator
 * Analyzes grade progression and determines improvement/decline trends
 */

/**
 * Calculate trend direction and statistics for a student's grades
 * @param {Array} assessments - Array of assessment objects with scores
 * @returns {Object} Trend analysis with direction, percentage change, and averages
 */
export function calculateTrend(assessments) {
    if (!assessments || assessments.length === 0) {
        return {
            direction: 'insufficient-data',
            percentageChange: 0,
            averageScore: 0,
            recentAverage: 0,
            hasEnoughData: false
        };
    }

    // Need at least 2 assessments to calculate a trend
    if (assessments.length < 2) {
        return {
            direction: 'insufficient-data',
            percentageChange: 0,
            averageScore: assessments[0]?.percentage || 0,
            recentAverage: assessments[0]?.percentage || 0,
            hasEnoughData: false
        };
    }

    // Calculate overall average
    const totalPercentage = assessments.reduce((sum, a) => sum + (a.percentage || 0), 0);
    const averageScore = totalPercentage / assessments.length;

    // Calculate recent average (last 2-3 assessments)
    const recentCount = Math.min(3, Math.floor(assessments.length / 2));
    const recentAssessments = assessments.slice(-recentCount);
    const recentTotal = recentAssessments.reduce((sum, a) => sum + (a.percentage || 0), 0);
    const recentAverage = recentTotal / recentAssessments.length;

    // Calculate percentage change
    const percentageChange = recentAverage - averageScore;

    // Determine trend direction (threshold: ±5%)
    let direction;
    if (percentageChange >= 5) {
        direction = 'improving';
    } else if (percentageChange <= -5) {
        direction = 'declining';
    } else {
        direction = 'stable';
    }

    return {
        direction,
        percentageChange: Number(percentageChange.toFixed(1)),
        averageScore: Number(averageScore.toFixed(1)),
        recentAverage: Number(recentAverage.toFixed(1)),
        hasEnoughData: true
    };
}

/**
 * Format assessment data for chart display
 * @param {Array} grades - Raw grade data
 * @param {Array} assessments - Assessment metadata
 * @returns {Array} Formatted data for Recharts
 */
export function formatTrendData(grades, assessments) {
    if (!grades || !assessments) return [];

    return assessments
        .map(assessment => {
            const grade = grades.find(g => g.assessmentId === assessment.id);
            if (!grade) return null;

            // Handle multiple possible field names for max score
            const maxScore = assessment.totalMarks || assessment.maxMarks || assessment.maxScore || 100;
            const percentage = maxScore > 0
                ? ((grade.marksScored / maxScore) * 100)
                : 0;

            return {
                name: assessment.name,
                percentage: Number(percentage.toFixed(1)),
                score: grade.marksScored,
                total: maxScore,
                date: assessment.createdAt || assessment.date
            };
        })
        .filter(Boolean)
        .sort((a, b) => {
            // Sort by date if available
            if (a.date && b.date) {
                return new Date(a.date) - new Date(b.date);
            }
            return 0;
        });
}

/**
 * Get motivational message based on trend
 * @param {string} direction - Trend direction
 * @param {number} percentageChange - Change percentage
 * @returns {string} Motivational message
 */
export function getTrendMessage(direction, percentageChange) {
    const messages = {
        improving: [
            `📈 Great progress! You've improved by ${Math.abs(percentageChange)}%!`,
            `🎉 Keep it up! Your grades are trending upward by ${Math.abs(percentageChange)}%!`,
            `⭐ Excellent improvement! You're ${Math.abs(percentageChange)}% better than your average!`
        ],
        declining: [
            `📉 Your grades have dropped by ${Math.abs(percentageChange)}%. Let's work on improving!`,
            `💪 Don't worry! With some effort, you can turn this ${Math.abs(percentageChange)}% decline around!`,
            `📚 Grades are down ${Math.abs(percentageChange)}%. Reach out to your teacher for help!`
        ],
        stable: [
            `➡️ Your performance is consistent. Keep up the steady work!`,
            `✅ You're maintaining a stable performance. Great consistency!`,
            `🎯 Steady as she goes! Your grades are holding steady.`
        ],
        'insufficient-data': [
            `📊 Complete more assessments to see your performance trend!`,
            `🔍 We need more data to show your progress. Keep working!`,
            `📝 Your trend will appear after a few more assessments.`
        ]
    };

    const messageArray = messages[direction] || messages['insufficient-data'];
    return messageArray[Math.floor(Math.random() * messageArray.length)];
}

/**
 * Get color for trend direction
 * @param {string} direction - Trend direction
 * @returns {Object} Color configuration
 */
export function getTrendColor(direction) {
    const colors = {
        improving: {
            line: '#22c55e',
            gradient: ['#22c55e88', '#22c55e00'],
            badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        },
        declining: {
            line: '#ef4444',
            gradient: ['#ef444488', '#ef444400'],
            badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        },
        stable: {
            line: '#3b82f6',
            gradient: ['#3b82f688', '#3b82f600'],
            badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        },
        'insufficient-data': {
            line: '#9ca3af',
            gradient: ['#9ca3af88', '#9ca3af00'],
            badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
        }
    };

    return colors[direction] || colors['insufficient-data'];
}
