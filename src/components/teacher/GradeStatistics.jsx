import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, Users, Target } from 'lucide-react';

export default function GradeStatistics({ grades, assessments, courseId }) {
    const statistics = useMemo(() => {
        // Filter grades for this course
        const courseGrades = grades.filter(g => g.courseId === courseId);

        if (courseGrades.length === 0) {
            return null;
        }

        // Calculate basic stats
        const percentages = courseGrades.map(g => g.percentage);
        const sorted = [...percentages].sort((a, b) => a - b);

        const average = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
        const median = sorted[Math.floor(sorted.length / 2)];
        const highest = sorted[sorted.length - 1];
        const lowest = sorted[0];
        const passCount = percentages.filter(p => p >= 50).length;
        const passRate = Math.round((passCount / percentages.length) * 100);

        // Grade distribution
        const distribution = [
            { range: '0-10', count: percentages.filter(p => p >= 0 && p < 10).length },
            { range: '10-20', count: percentages.filter(p => p >= 10 && p < 20).length },
            { range: '20-30', count: percentages.filter(p => p >= 20 && p < 30).length },
            { range: '30-40', count: percentages.filter(p => p >= 30 && p < 40).length },
            { range: '40-50', count: percentages.filter(p => p >= 40 && p < 50).length },
            { range: '50-60', count: percentages.filter(p => p >= 50 && p < 60).length },
            { range: '60-70', count: percentages.filter(p => p >= 60 && p < 70).length },
            { range: '70-80', count: percentages.filter(p => p >= 70 && p < 80).length },
            { range: '80-90', count: percentages.filter(p => p >= 80 && p < 90).length },
            { range: '90-100', count: percentages.filter(p => p >= 90 && p <= 100).length },
        ].filter(d => d.count > 0); // Only show ranges with data

        // Assessment trends
        const courseAssessments = assessments.filter(a => a.courseId === courseId);
        const trends = courseAssessments.map(assessment => {
            const assessmentGrades = courseGrades.filter(g => g.assessmentId === assessment.id);
            const avg = assessmentGrades.length > 0
                ? Math.round(assessmentGrades.reduce((sum, g) => sum + g.percentage, 0) / assessmentGrades.length)
                : 0;

            return {
                name: assessment.title || assessment.name || 'Assessment',
                average: avg,
                count: assessmentGrades.length
            };
        });

        // Pass/Fail pie chart
        const passFailData = [
            { name: 'Pass', value: passCount, color: '#10b981' },
            { name: 'Fail', value: percentages.length - passCount, color: '#ef4444' }
        ];

        return {
            average,
            median,
            highest,
            lowest,
            passRate,
            totalStudents: percentages.length,
            distribution,
            trends,
            passFailData
        };
    }, [grades, assessments, courseId]);

    if (!statistics) {
        return (
            <div className="text-center py-12">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No grades available yet</p>
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
                            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Class Average</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.average}%</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.passRate}%</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                            <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Highest Score</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.highest}%</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalStudents}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grade Distribution */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Grade Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statistics.distribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                            <XAxis
                                dataKey="range"
                                stroke="#9ca3af"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
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
                            <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pass/Fail Ratio */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pass/Fail Ratio</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statistics.passFailData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statistics.passFailData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2937',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Assessment Trends */}
            {statistics.trends.length > 0 && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assessment Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={statistics.trends}>
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
                                dataKey="average"
                                stroke="#6366f1"
                                strokeWidth={3}
                                dot={{ fill: '#6366f1', r: 5 }}
                                activeDot={{ r: 8 }}
                                name="Average Score (%)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
