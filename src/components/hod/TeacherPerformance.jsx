import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { motion } from 'framer-motion';
import { Users, GraduationCap, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export default function TeacherPerformance({ targetTeacherId }) {
    const { classes, courses, attendance, grades } = useData();

    const metrics = useMemo(() => {
        // 1. Identify Teacher's Scope
        // A teacher is in scope for a class if they own it, OR if they teach a course inside it.
        const teacherCourses = courses.filter(c => c.teacherId === targetTeacherId);
        const teacherCourseIds = new Set(teacherCourses.map(c => c.id));

        const teacherClasses = classes.filter(c =>
            c.teacherId === targetTeacherId ||
            teacherCourses.some(course => course.classId === c.id)
        );
        const teacherClassIds = new Set(teacherClasses.map(c => c.id));

        // 2. Process Attendance Data
        let teacherPresentCount = 0;
        let teacherTotalAttendance = 0;

        let deptPresentCount = 0;
        let deptTotalAttendance = 0;

        attendance.forEach(session => {
            // A session belongs to the teacher if it's for their course, or for their class
            const isTeacherSession = teacherClassIds.has(session.classId) || teacherCourseIds.has(session.courseId);

            if (session.records) {
                Object.values(session.records).forEach(status => {
                    deptTotalAttendance++;
                    if (status === 'present' || status === 'late') deptPresentCount++;

                    if (isTeacherSession) {
                        teacherTotalAttendance++;
                        if (status === 'present' || status === 'late') teacherPresentCount++;
                    }
                });
            }
        });

        const teacherAttendanceRate = teacherTotalAttendance > 0 ? (teacherPresentCount / teacherTotalAttendance) * 100 : 0;
        const deptAttendanceRate = deptTotalAttendance > 0 ? (deptPresentCount / deptTotalAttendance) * 100 : 0;

        // 3. Process Grade Data
        let teacherTotalGradePoints = 0;
        let teacherTotalGrades = 0;

        let deptTotalGradePoints = 0;
        let deptTotalGrades = 0;

        grades.forEach(grade => {
            const numScore = Number(grade.percentage); // Use percentage, same as AnalyticsDashboard
            if (isNaN(numScore)) return;

            deptTotalGradePoints += numScore;
            deptTotalGrades++;

            if (teacherCourseIds.has(grade.courseId)) {
                teacherTotalGradePoints += numScore;
                teacherTotalGrades++;
            }
        });

        const teacherAvgGrade = teacherTotalGrades > 0 ? (teacherTotalGradePoints / teacherTotalGrades) : 0;
        const deptAvgGrade = deptTotalGrades > 0 ? (deptTotalGradePoints / deptTotalGrades) : 0;

        return {
            attendance: {
                teacher: teacherAttendanceRate,
                dept: deptAttendanceRate,
                hasData: teacherTotalAttendance > 0,
                diff: teacherAttendanceRate - deptAttendanceRate
            },
            grades: {
                teacher: teacherAvgGrade,
                dept: deptAvgGrade,
                hasData: teacherTotalGrades > 0,
                diff: teacherAvgGrade - deptAvgGrade
            }
        };
    }, [classes, courses, attendance, grades, targetTeacherId]);

    const renderProgressBar = (label, teacherVal, deptVal, suffix = '%') => {
        const diff = teacherVal - deptVal;
        const isPositive = diff >= 0;

        return (
            <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {teacherVal.toFixed(1)}{suffix}
                        </span>
                        {deptVal > 0 && (
                            <span className={`text-xs font-medium flex items-center px-1.5 py-0.5 rounded-full ${isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'
                                }`}>
                                {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                {Math.abs(diff).toFixed(1)} vs Dept
                            </span>
                        )}
                    </div>
                </div>

                <div className="relative pt-4">
                    {/* Department Baseline Marker */}
                    {deptVal > 0 && (
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-500 z-10"
                            style={{ left: `${Math.min(100, deptVal)}%` }}
                            title={`Department Average: ${deptVal.toFixed(1)}${suffix}`}
                        >
                            <div className="absolute -top-4 -translate-x-1/2 text-[10px] text-gray-500 font-medium bg-white px-1 dark:bg-gray-800 dark:text-gray-400">
                                Dept Avg ({deptVal.toFixed(1)})
                            </div>
                        </div>
                    )}

                    {/* Teacher Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(0, teacherVal))}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full rounded-full ${isPositive ? 'bg-indigo-500' : 'bg-amber-500'
                                }`}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card className="border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    Teacher Performance Metrics
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

                    {/* Attendance Metric */}
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-400">
                            <Users className="w-4 h-4" />
                            <h4 className="font-medium text-sm">Class Attendance Rate</h4>
                        </div>
                        {metrics.attendance.hasData ? (
                            renderProgressBar('Average Student Attendance', metrics.attendance.teacher, metrics.attendance.dept)
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No attendance records found for this teacher's classes.</p>
                        )}
                    </div>

                    {/* Grade Metric */}
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-400">
                            <GraduationCap className="w-4 h-4" />
                            <h4 className="font-medium text-sm">Class Grade Average</h4>
                        </div>
                        {metrics.grades.hasData ? (
                            renderProgressBar('Average Assessment Score', metrics.grades.teacher, metrics.grades.dept)
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No grades recorded for this teacher's courses yet.</p>
                        )}
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}
