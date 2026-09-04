import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ROLES } from '../../utils/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RechartsPie, Pie, Legend } from 'recharts';
import { motion } from 'framer-motion';

const chartVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: "easeOut" }
    }
};

export default function AnalyticsDashboard({ targetTeacherId }) {
    const { assessments, grades, getAssessmentAverages, joinRequests, classes, courses, attendance } = useData();
    const { user } = useAuth();
    const { darkMode } = useTheme();
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [selectedRisk, setSelectedRisk] = useState(null);
    const [isMounted, setIsMounted] = useState(false);

    // Delay chart rendering to ensure layout is ready (fixes Recharts width issue during transitions)
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Get assessment averages only for courses assigned to this teacher
    const allAssessmentAverages = [];
    // Get only the target teacher's course IDs, or all courses if HOD and no target is selected
    const effectiveTeacherId = targetTeacherId || user?.id;
    const targetCourseIds = courses
        .filter(c => (user?.role === ROLES.HOD && !targetTeacherId) || c.teacherId === effectiveTeacherId)
        .map(c => c.id);

    // Get unique course IDs from assessments that belong to teacher's courses
    const uniqueCourseIds = [...new Set(
        assessments
            .filter(a => targetCourseIds.includes(a.courseId))
            .map(a => a.courseId)
    )];

    uniqueCourseIds.forEach(courseId => {
        const courseAssessmentAverages = getAssessmentAverages(courseId);
        allAssessmentAverages.push(...courseAssessmentAverages);
    });

    // If no grading data, show placeholder
    const hasGradingData = allAssessmentAverages.length > 0 && allAssessmentAverages.some(a => a.count > 0);

    // Calculate Student Risk Distribution based on real data
    // Include classes where target teacher owns OR has courses assigned, or all classes if HOD and no target
    const myClasses = classes.filter(c =>
        user?.role === ROLES.HOD || c.teacherId === effectiveTeacherId ||
        courses.some(course => course.classId === c.id && course.teacherId === effectiveTeacherId)
    );
    const myClassIds = myClasses.map(c => c.id);
    const approvedStudents = joinRequests.filter(
        req => myClassIds.includes(req.classId) && req.status === 'approved'
    );

    // Calculate risk for each student based on attendance and grades
    const studentsWithRisk = approvedStudents.map(req => {
        // Calculate attendance percentage
        const studentAttendance = attendance.filter(record =>
            record.records && record.records[req.studentId] && targetCourseIds.includes(record.courseId)
        );
        const totalClasses = studentAttendance.length;
        const presentCount = studentAttendance.filter(
            record => record.records[req.studentId] === 'present'
        ).length;
        const lateCount = studentAttendance.filter(
            record => record.records[req.studentId] === 'late'
        ).length;
        const attendancePercent = totalClasses > 0
            ? Math.round(((presentCount + (lateCount * 0.5)) / totalClasses) * 100)
            : 100;

        // Calculate average grade across evaluated courses
        const studentGrades = grades.filter(g => g.studentId === req.studentId && targetCourseIds.includes(g.courseId));
        const avgGrade = studentGrades.length > 0
            ? Math.round(studentGrades.reduce((sum, g) => sum + g.percentage, 0) / studentGrades.length)
            : 100; // Default to 100 to avoid false positives for new students without grades

        // Determine risk level based on actual performance data presence
        let risk = 'low';
        if ((totalClasses > 0 && attendancePercent < 60) || (studentGrades.length > 0 && avgGrade < 50)) {
            risk = 'high';
        } else if ((totalClasses > 0 && attendancePercent < 80) || (studentGrades.length > 0 && avgGrade < 70)) {
            risk = 'medium';
        }

        return {
            id: req.studentId,
            name: req.studentName,
            className: myClasses.find(c => c.id === req.classId)?.name || 'Unknown',
            attendance: attendancePercent,
            avgGrade,
            risk
        };
    });

    const riskCounts = studentsWithRisk.reduce((acc, student) => {
        acc[student.risk] = (acc[student.risk] || 0) + 1;
        return acc;
    }, { low: 0, medium: 0, high: 0 });

    const riskData = [
        { name: 'Low Risk', value: riskCounts.low || 0, color: '#22c55e', students: studentsWithRisk.filter(s => s.risk === 'low') },
        { name: 'Medium Risk', value: riskCounts.medium || 0, color: '#eab308', students: studentsWithRisk.filter(s => s.risk === 'medium') },
        { name: 'High Risk', value: riskCounts.high || 0, color: '#ef4444', students: studentsWithRisk.filter(s => s.risk === 'high') },
    ];

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recharts Bar Chart: Average Grades Per Test */}
                <motion.div
                    variants={chartVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                Average Grades per Test
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!hasGradingData ? (
                                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                    <div className="text-center">
                                        <p className="text-sm">No grading data yet.</p>
                                        <p className="text-xs mt-1">Create assessments and enter grades to see analytics.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">Click bars for student details</div>
                                    <div className="h-64">
                                        {isMounted && (
                                            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={1}>
                                                <BarChart
                                                    data={allAssessmentAverages.filter(a => a.count > 0)}
                                                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                                    onClick={(data) => {
                                                        if (data && data.activePayload) {
                                                            setSelectedAssessment(data.activePayload[0].payload);
                                                        }
                                                    }}
                                                >
                                                    <XAxis
                                                        dataKey="name"
                                                        angle={-45}
                                                        textAnchor="end"
                                                        height={80}
                                                        tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#4B5563' }}
                                                    />
                                                    <YAxis
                                                        domain={[0, 100]}
                                                        label={{ value: 'Average %', angle: -90, position: 'insideLeft', fill: darkMode ? '#9CA3AF' : '#4B5563' }}
                                                        tick={{ fill: darkMode ? '#9CA3AF' : '#4B5563' }}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: darkMode ? '#374151' : '#f3f4f6', opacity: 0.4 }}
                                                        contentStyle={{
                                                            backgroundColor: darkMode ? '#1F2937' : 'white',
                                                            border: darkMode ? '1px solid #374151' : 'none',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                            color: darkMode ? '#F3F4F6' : '#111827'
                                                        }}
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const data = payload[0].payload;
                                                                return (
                                                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                                                        <p className="font-semibold text-gray-900 dark:text-gray-100">{data.name}</p>
                                                                        <p className="text-sm text-purple-600 dark:text-purple-400">Average: <strong>{data.average}%</strong></p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{data.count} student{data.count !== 1 ? 's' : ''} graded</p>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Bar dataKey="average" fill="#3b82f6" radius={[8, 8, 0, 0]} cursor="pointer">
                                                        {allAssessmentAverages.filter(a => a.count > 0).map((entry, index) => (
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
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Recharts Pie Chart: Risk Assessment */}
                <motion.div
                    variants={chartVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.2 }}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                Student Risk Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Click segments for student list</div>
                            <div className="h-64 w-full">
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={1}>
                                        <RechartsPie>
                                            <Pie
                                                data={riskData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, value }) => `${name}: ${value}`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                onClick={(data) => setSelectedRisk(data)}
                                                cursor="pointer"
                                            >
                                                {riskData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                                                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{data.name}</p>
                                                                <p className="text-sm" style={{ color: data.color }}>
                                                                    {data.value} student{data.value !== 1 ? 's' : ''}
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Legend wrapperStyle={{ color: darkMode ? '#9CA3AF' : '#4B5563' }} />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Assessment Detail Modal */}
            {selectedAssessment && (
                <AssessmentDetailModal
                    assessmentData={selectedAssessment}
                    onClose={() => setSelectedAssessment(null)}
                />
            )}

            {/* Risk Detail Modal */}
            {selectedRisk && (
                <RiskDetailModal
                    riskData={selectedRisk}
                    onClose={() => setSelectedRisk(null)}
                />
            )}
        </>
    );
}

function AssessmentDetailModal({ assessmentData, onClose }) {
    const { grades, joinRequests } = useData();
    const ChartModal = React.lazy(() => import('../common/ChartModal'));

    // Get grades for this assessment
    const assessmentGrades = grades.filter(g => g.assessmentId === assessmentData.id);

    // Get student info
    const studentsWithGrades = assessmentGrades.map(grade => {
        const student = joinRequests.find(req => req.studentId === grade.studentId);
        return {
            name: student?.studentName || 'Unknown Student',
            marksScored: grade.marksScored,
            maxMarks: grade.maxMarks,
            percentage: grade.percentage,
            grade: grade.grade
        };
    });

    return (
        <React.Suspense fallback={null}>
            <ChartModal isOpen={true} onClose={onClose} title={`${assessmentData.name} - Student Grades`}>
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{assessmentData.average}%</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Average Grade</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{assessmentData.count} student{assessmentData.count !== 1 ? 's' : ''} graded</p>
                    </div>

                    {/* Student List */}
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Student Grades</h3>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {studentsWithGrades
                                .sort((a, b) => b.percentage - a.percentage)
                                .map((student, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-200">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{student.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {student.marksScored}/{student.maxMarks}
                                            </span>
                                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${student.grade === 'A+' || student.grade === 'A' ? 'bg-green-100 text-green-700' :
                                                student.grade === 'B+' || student.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                                    student.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {student.percentage}% ({student.grade})
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </ChartModal>
        </React.Suspense>
    );
}

function RiskDetailModal({ riskData, onClose }) {
    const ChartModal = React.lazy(() => import('../common/ChartModal'));

    return (
        <React.Suspense fallback={null}>
            <ChartModal isOpen={true} onClose={onClose} title={`${riskData.name} Students`}>
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="p-4 rounded-xl text-center backdrop-blur-sm" style={{ backgroundColor: `${riskData.color}20` }}>
                        <p className="text-3xl font-bold" style={{ color: riskData.color }}>{riskData.value}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Students in {riskData.name}</p>
                    </div>

                    {/* Student List */}
                    {riskData.students.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No students in this category yet.</p>
                    ) : (
                        <div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Student Details</h3>
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {riskData.students.map((student, index) => (
                                    <div key={index} className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-800 dark:text-gray-200">{student.name}</span>
                                            <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full">
                                                {student.className}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="bg-white/60 dark:bg-gray-900/60 p-2 rounded-lg">
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Attendance</div>
                                                <div className={`font-semibold ${student.attendance >= 80 ? 'text-green-600 dark:text-green-400' :
                                                    student.attendance >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                                                        'text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {student.attendance}%
                                                </div>
                                            </div>
                                            <div className="bg-white/60 dark:bg-gray-900/60 p-2 rounded-lg">
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Avg Grade</div>
                                                <div className={`font-semibold ${student.avgGrade >= 70 ? 'text-green-600 dark:text-green-400' :
                                                    student.avgGrade >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                                                        'text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {student.avgGrade}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </ChartModal>
        </React.Suspense>
    );
}
