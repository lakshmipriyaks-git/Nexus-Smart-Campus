import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, AlertTriangle, Info, CheckCircle, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export default function DepartmentInsights() {
    const { classes, courses, attendance, grades, joinRequests } = useData();

    const insights = useMemo(() => {
        const generatedInsights = [];

        // Return blank if no data is available
        if (!classes.length || (!attendance.length && !grades.length)) return [];

        // --- 1. Class Risk Analysis ---
        // Iterate through all classes to determine the number of High-Risk students.
        classes.forEach(cls => {
            // Find approved students in this class
            const classStudents = joinRequests.filter(req => req.classId === cls.id && req.status === 'approved');
            if (!classStudents.length) return;

            let highRiskCount = 0;

            classStudents.forEach(student => {
                // Determine Student's Attendance Average
                const studentAttendance = attendance.filter(record =>
                    record.classId === cls.id && record.records && record.records[student.studentId]
                );
                const totalSessions = studentAttendance.length;
                let presentCount = 0;

                studentAttendance.forEach(record => {
                    if (record.records[student.studentId] === 'present') presentCount += 1;
                    if (record.records[student.studentId] === 'late') presentCount += 0.5;
                });

                const attendancePercent = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 100;

                // Determine Student's Grade Average (across courses in this class)
                const studentGrades = grades.filter(g => g.studentId === student.studentId && courses.some(c => c.id === g.courseId && c.classId === cls.id));
                const gradePercent = studentGrades.length > 0
                    ? studentGrades.reduce((sum, g) => sum + Number(g.percentage), 0) / studentGrades.length
                    : 100;

                // Risk threshold logic matching the platform standard
                if ((totalSessions > 0 && attendancePercent < 60) || (studentGrades.length > 0 && gradePercent < 50)) {
                    highRiskCount++;
                }
            });

            // Threshold: More than 3 students in high risk triggers a warning
            if (highRiskCount > 3) {
                generatedInsights.push({
                    id: `risk-${cls.id}`,
                    type: 'warning',
                    title: 'Anomaly: Elevated High-Risk Count',
                    message: `There are currently ${highRiskCount} students at High Risk in ${cls.name}. Immediate intervention is recommended.`,
                    icon: AlertTriangle,
                    color: 'text-red-500',
                    bgColor: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/20'
                });
            }
        });

        // --- 2. Low Class Attendance ---
        classes.forEach(cls => {
            const classAttendance = attendance.filter(a => a.classId === cls.id);
            if (classAttendance.length < 3) return; // Needs minimum data points (e.g. at least 3 sessions)

            let totalSessions = 0;
            let totalPresent = 0;

            classAttendance.forEach(session => {
                if (session.records) {
                    Object.values(session.records).forEach(status => {
                        totalSessions++;
                        if (status === 'present' || status === 'late') totalPresent++;
                    });
                }
            });

            const overallRate = totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 100;

            // Threshold: Drop below 75% average attendance
            if (overallRate < 75) {
                generatedInsights.push({
                    id: `attendance-${cls.id}`,
                    type: 'alert',
                    title: 'Warning: Low Attendance',
                    message: `Average attendance in ${cls.name} has dropped to ${overallRate.toFixed(1)}%.`,
                    icon: TrendingDown,
                    color: 'text-amber-500',
                    bgColor: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/20'
                });
            } else if (overallRate >= 95) {
                generatedInsights.push({
                    id: `success-att-${cls.id}`,
                    type: 'success',
                    title: 'Success: Exemplary Attendance',
                    message: `${cls.name} is maintaining an excellent attendance rate of ${overallRate.toFixed(1)}%.`,
                    icon: CheckCircle,
                    color: 'text-green-500',
                    bgColor: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/20'
                });
            }
        });

        // --- 3. Course Grade Bottlenecks ---
        courses.forEach(course => {
            const courseGrades = grades.filter(g => g.courseId === course.id);
            if (courseGrades.length < 5) return; // Need some significance

            const avgGrade = courseGrades.reduce((sum, g) => sum + Number(g.percentage), 0) / courseGrades.length;

            if (avgGrade < 60) {
                generatedInsights.push({
                    id: `grade-${course.id}`,
                    type: 'info',
                    title: 'Note: Average Assessments Drop',
                    message: `The average score for ${course.name} is currently ${avgGrade.toFixed(1)}%, which is below the department target.`,
                    icon: Info,
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/20'
                });
            }
        });

        // If no anomalies caught, generate a default "All Clear" insight to assure the user the engine is running
        if (generatedInsights.length === 0) {
            generatedInsights.push({
                id: 'all-clear',
                type: 'success',
                title: 'All Clear',
                message: 'No significant anomalies detected in department performance this week.',
                icon: CheckCircle,
                color: 'text-green-500',
                bgColor: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/20'
            });
        }

        // Return a randomized/sorted selection (or all) if too many exist to prevent UI clutter
        // For now, prioritize warnings first
        return generatedInsights.sort((a, b) => {
            const weights = { warning: 3, alert: 2, info: 1, success: 0 };
            return weights[b.type] - weights[a.type];
        }).slice(0, 5); // Show top 5 max

    }, [classes, courses, attendance, grades, joinRequests]);

    return (
        <Card className="h-full bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-900/10 dark:to-gray-800 border-indigo-100 dark:border-indigo-900/30">
            <CardHeader className="pb-3 border-b border-indigo-100 dark:border-indigo-900/30">
                <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 text-base">
                    <Lightbulb className="w-5 h-5 text-indigo-500 animate-pulse" />
                    Automated AI Insights
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence>
                        {insights.map((insight) => {
                            const Icon = insight.icon;
                            return (
                                <motion.div
                                    key={insight.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`relative p-3.5 rounded-xl border shadow-sm ${insight.bgColor} flex gap-3`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        <Icon className={`w-5 h-5 ${insight.color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`text-sm font-semibold mb-0.5 ${insight.color}`}>{insight.title}</h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {insight.message}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    {insights.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p className="text-sm italic">Analyzing department data...</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
