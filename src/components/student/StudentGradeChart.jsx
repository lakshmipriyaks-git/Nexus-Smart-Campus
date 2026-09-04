import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Award, Target } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

export default function StudentGradeChart({ courseId, courseName }) {
    const { grades, assessments, getAssessmentAverages } = useData();
    const { user } = useAuth();

    const statistics = useMemo(() => {
        // Get student's grades for this course
        const studentGrades = grades.filter(g =>
            g.courseId === courseId && g.studentId === user.uid
        );

        if (studentGrades.length === 0) {
            return null;
        }

        // Get class averages for comparison
        const classAverages = getAssessmentAverages(courseId);

        // Calculate student stats
        const percentages = studentGrades.map(g => g.percentage);
        const average = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
        const highest = Math.max(...percentages);
        const lowest = Math.min(...percentages);

        // Calculate overall class average for this course
        const allCourseGrades = grades.filter(g => g.courseId === courseId);
        const classAverage = allCourseGrades.length > 0
            ? Math.round(allCourseGrades.reduce((sum, g) => sum + g.percentage, 0) / allCourseGrades.length)
            : 0;

        // Performance trend data - student vs class average
        const trendData = assessments
            .filter(a => a.courseId === courseId)
            .map(assessment => {
                const studentGrade = studentGrades.find(g => g.assessmentId === assessment.id);
                const classAvg = classAverages.find(a => a.name === assessment.title);

                return {
                    name: assessment.title || assessment.name || 'Assessment',
                    yourGrade: studentGrade ? studentGrade.percentage : null,
                    classAverage: classAvg ? classAvg.average : null
                };
            })
            .filter(item => item.yourGrade !== null); // Only show assessments student has taken

        // Improvement indicator
        const firstGrade = trendData.length > 0 ? trendData[0].yourGrade : 0;
        const lastGrade = trendData.length > 0 ? trendData[trendData.length - 1].yourGrade : 0;
        const improvement = lastGrade - firstGrade;

        return {
            average,
            highest,
            lowest,
            classAverage,
            trendData,
            improvement,
            totalAssessments: studentGrades.length
        };
    }, [grades, assessments, courseId, user.uid, getAssessmentAverages]);

    if (!statistics) {
        return (
            <div className="glass-card p-8 text-center">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No grades yet for this course</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Complete assessments to see your performance
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Your Average</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.average}%</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Class Average</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.classAverage}%</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Best Score</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.highest}%</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statistics.improvement >= 0
                                ? 'bg-green-100 dark:bg-green-900/30'
                                : 'bg-orange-100 dark:bg-orange-900/30'
                            }`}>
                            {statistics.improvement >= 0 ? (
                                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                                <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Trend</p>
                            <p className={`text-2xl font-bold ${statistics.improvement >= 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-orange-600 dark:text-orange-400'
                                }`}>
                                {statistics.improvement >= 0 ? '+' : ''}{statistics.improvement}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Comparison Chart */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Your Performance vs Class Average
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={statistics.trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                        <XAxis
                            dataKey="name"
                            stroke="#9ca3af"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            domain={[0, 100]}
                            stroke="#9ca3af"
                            style={{ fontSize: '12px' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="yourGrade"
                            stroke="#6366f1"
                            strokeWidth={3}
                            dot={{ fill: '#6366f1', r: 5 }}
                            activeDot={{ r: 8 }}
                            name="Your Grade"
                        />
                        <Line
                            type="monotone"
                            dataKey="classAverage"
                            stroke="#9ca3af"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#9ca3af', r: 4 }}
                            name="Class Average"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Performance Insights */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Insights</h3>
                <div className="space-y-3">
                    {statistics.average > statistics.classAverage ? (
                        <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-green-900 dark:text-green-100">Above Average!</p>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    You're performing {statistics.average - statistics.classAverage}% above the class average. Great work!
                                </p>
                            </div>
                        </div>
                    ) : statistics.average < statistics.classAverage ? (
                        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-blue-900 dark:text-blue-100">Room for Growth</p>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    You're {statistics.classAverage - statistics.average}% below class average. Consider extra practice or office hours!
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-indigo-900 dark:text-indigo-100">On Track!</p>
                                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                    You're right on par with the class average. Keep up the good work!
                                </p>
                            </div>
                        </div>
                    )}

                    {statistics.improvement > 5 && (
                        <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-green-900 dark:text-green-100">Improving Fast!</p>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Your scores improved by {statistics.improvement}% from first to latest assessment. Excellent progress!
                                </p>
                            </div>
                        </div>
                    )}

                    {statistics.improvement < -5 && (
                        <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                            <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                            <div>
                                <p className="font-medium text-orange-900 dark:text-orange-100">Need Support?</p>
                                <p className="text-sm text-orange-700 dark:text-orange-300">
                                    Your recent scores are trending down. Consider reaching out to your teacher for help.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
