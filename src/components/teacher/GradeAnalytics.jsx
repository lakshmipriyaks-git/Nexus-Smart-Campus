import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { BarChart2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StudentTrendChart from '../common/StudentTrendChart';
import TrendIndicator from '../common/TrendIndicator';
import { calculateTrend } from '../../utils/trendCalculator';

export default function GradeAnalytics({ courseId, courseName }) {
    const {
        assessments,
        grades,
        joinRequests,
        classes,
        courses,
        getAssessmentAverages,
        calculateOverallGrade
    } = useData();

    const { darkMode } = useTheme();
    const [selectedType, setSelectedType] = useState('all'); // 'all', 'internal', 'external'
    const [isMounted, setIsMounted] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    // Delay chart rendering to ensure layout is ready
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const assessmentAverages = getAssessmentAverages(courseId);
    const courseAssessments = assessments.filter(a => a.courseId === courseId);
    const courseGrades = grades.filter(g => g.courseId === courseId);

    // Get all students who have at least one grade in this course
    const studentsWithGrades = [...new Set(courseGrades.map(g => g.studentId))];

    // Get the classId for this course
    const currentCourse = courses.find(c => c.id === courseId);
    const courseClassId = currentCourse?.classId;

    // Get student info from join requests - only for the class this course belongs to
    const studentInfo = studentsWithGrades.map(studentId => {
        // Find join request for this specific class
        const joinRequest = joinRequests.find(req =>
            req.studentId === studentId && req.classId === courseClassId
        );
        return {
            id: studentId,
            name: joinRequest?.studentName || 'Unknown Student',
            className: classes.find(c => c.id === courseClassId)?.name || 'Unknown Class'
        };
    });

    // Filter assessments by type
    const filteredAssessments = selectedType === 'all'
        ? assessmentAverages
        : assessmentAverages.filter(a => a.type === selectedType);

    // Calculate Grade Distribution
    const gradeDistribution = {
        'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'F': 0
    };

    studentInfo.forEach(student => {
        const overall = calculateOverallGrade(student.id, courseId);
        if (overall.grade && gradeDistribution[overall.grade] !== undefined) {
            gradeDistribution[overall.grade]++;
        }
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Grade Analytics - {courseName}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {courseAssessments.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No assessments available. Create assessments and enter grades to see analytics.
                    </p>
                ) : courseGrades.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No grades entered yet. Enter grades to see analytics.
                    </p>
                ) : (
                    <div className="space-y-6">
                        {/* Assessment Type Filter */}
                        <div className="flex gap-2 p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl w-fit backdrop-blur-sm">
                            <button
                                onClick={() => setSelectedType('all')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${selectedType === 'all'
                                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setSelectedType('internal')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${selectedType === 'internal'
                                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                Internal Tests
                            </button>
                            <button
                                onClick={() => setSelectedType('external')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${selectedType === 'external'
                                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                External Exams
                            </button>
                        </div>

                        {/* Assessment-wise Averages (Bar Chart) */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Average Grades Per Test</h3>

                            {filteredAssessments.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                    No assessments of this type yet.
                                </p>
                            ) : (
                                <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                                    {isMounted && (
                                        <ResponsiveContainer width="100%" height={300} minWidth={0} debounce={1}>
                                            <BarChart
                                                data={filteredAssessments}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} vertical={false} />
                                                <XAxis
                                                    dataKey="title"
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={80}
                                                    tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#4B5563' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    domain={[0, 100]}
                                                    tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#4B5563' }}
                                                    label={{ value: 'Average %', angle: -90, position: 'insideLeft', fill: darkMode ? '#9CA3AF' : '#4B5563' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: darkMode ? '#374151' : '#f3f4f6', opacity: 0.4 }}
                                                    contentStyle={{
                                                        backgroundColor: darkMode ? '#1F2937' : 'white',
                                                        border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                                                        borderRadius: '12px',
                                                        padding: '12px',
                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                        color: darkMode ? '#F3F4F6' : '#111827'
                                                    }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload;
                                                            return (
                                                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                                                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{data.name}</p>
                                                                    <p className="text-sm text-purple-600 dark:text-purple-400">
                                                                        Average: <strong>{data.average}%</strong>
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                        {data.count} student{data.count !== 1 ? 's' : ''} graded
                                                                    </p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Bar dataKey="average" name="Average %" radius={[8, 8, 0, 0]} maxBarSize={60}>
                                                    {filteredAssessments.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                entry.average >= 90 ? '#22c55e' :
                                                                    entry.average >= 80 ? '#3b82f6' :
                                                                        entry.average >= 70 ? '#eab308' :
                                                                            entry.average >= 60 ? '#f97316' :
                                                                                '#ef4444'
                                                            }
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}

                                    {/* Legend */}
                                    <div className="flex justify-center gap-4 mt-4 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span>90-100%</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                            <span>80-89%</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                            <span>70-79%</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                            <span>60-69%</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <span>&lt;60%</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Student Performance Table */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Student Performance</h3>
                            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Student</th>
                                            <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Class</th>
                                            <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Tests Taken</th>
                                            <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Overall %</th>
                                            <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Overall Grade</th>
                                            <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
                                        {studentInfo.map(student => {
                                            const overall = calculateOverallGrade(student.id, courseId);

                                            // Calculate trend for this student
                                            const studentGrades = courseGrades.filter(g => g.studentId === student.id);
                                            const studentAssessmentData = courseAssessments
                                                .map(a => {
                                                    const grade = studentGrades.find(g => g.assessmentId === a.id);
                                                    if (!grade) return null;
                                                    return {
                                                        percentage: (grade.marksScored / a.totalMarks) * 100
                                                    };
                                                })
                                                .filter(Boolean);
                                            const trend = calculateTrend(studentAssessmentData);

                                            return (
                                                <tr key={student.id} className="hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                                                        {student.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                        {student.className}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                        {overall.count}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-semibold text-purple-600 dark:text-purple-400">
                                                            {overall.percentage}%
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${overall.grade === 'A+' || overall.grade === 'A' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                                                            overall.grade === 'B+' || overall.grade === 'B' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                                                                overall.grade === 'C' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                                                                    overall.grade === 'F' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                                                                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                                            }`}>
                                                            {overall.grade}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <TrendIndicator
                                                            direction={trend.direction}
                                                            percentageChange={trend.percentageChange}
                                                            size="sm"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Grade Distribution */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Grade Distribution</h3>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                {['A+', 'A', 'B+', 'B', 'C', 'F'].map(grade => (
                                    <div
                                        key={grade}
                                        className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700"
                                    >
                                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                            {gradeDistribution[grade] || 0}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">{grade}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
