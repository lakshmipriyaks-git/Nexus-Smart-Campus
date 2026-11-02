import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Award, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import StudentTrendChart from '../common/StudentTrendChart';

export function StudentGradesView({ selectedCourseId: propCourseId, onSelectCourse: propOnSelectCourse }) {
    const { user } = useAuth();
    const {
        courses,
        assessments,
        grades,
        joinRequests,
        classes,
        calculateOverallGrade
    } = useData();

    const STORAGE_KEY = `nexus_student_selected_grade_course_${user?.id || 'default'}`;
    const [localCourseId, setLocalCourseId] = useState(() => {
        return propCourseId || localStorage.getItem(STORAGE_KEY) || '';
    });

    const activeCourseId = propCourseId !== undefined ? propCourseId : localCourseId;

    // Get classes the student has joined
    const myJoinRequests = joinRequests.filter(
        req => req.studentId === user?.id && req.status === 'approved'
    );
    const myClassIds = myJoinRequests.map(req => req.classId);

    // Get courses in my classes
    const myCourses = courses.filter(c => myClassIds.includes(c.classId));

    // Keep course selection persisted and auto-select default if none selected
    React.useEffect(() => {
        if (myCourses.length > 0) {
            const saved = localStorage.getItem(STORAGE_KEY);
            const validActive = myCourses.some(c => c.id === activeCourseId);
            const validSaved = myCourses.some(c => c.id === saved);

            if (!validActive) {
                const targetId = validSaved ? saved : myCourses[0].id;
                setLocalCourseId(targetId);
                localStorage.setItem(STORAGE_KEY, targetId);
                if (propOnSelectCourse) propOnSelectCourse(targetId);
            }
        }
    }, [myCourses, activeCourseId, STORAGE_KEY, propOnSelectCourse]);

    const handleCourseChange = (val) => {
        setLocalCourseId(val);
        if (val) localStorage.setItem(STORAGE_KEY, val);
        if (propOnSelectCourse) propOnSelectCourse(val);
    };

    // Get grades for selected course
    const selectedCourse = courses.find(c => c.id === activeCourseId);
    const myGrades = grades.filter(
        g => g.studentId === user?.id && g.courseId === activeCourseId
    );

    // Get assessments for selected course with my grades
    const courseAssessments = assessments
        .filter(a => a.courseId === activeCourseId)
        .map(assessment => {
            const grade = myGrades.find(g => g.assessmentId === assessment.id);
            return {
                ...assessment,
                myGrade: grade
            };
        });

    // Calculate overall for selected course
    const overallGrade = activeCourseId
        ? calculateOverallGrade(user?.id, activeCourseId)
        : null;

    return (
        <Card className="border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                    <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Academic Performance & Gradebook</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                {myCourses.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No enrolled courses detected. Please join a class to access grade metrics.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Course Selection */}
                        <div className="max-w-md">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                Active Course Subject
                            </label>
                            <select
                                className="input-field"
                                value={activeCourseId}
                                onChange={(e) => handleCourseChange(e.target.value)}
                            >
                                <option value="">-- Select an Enrolled Course --</option>
                                {myCourses.map(course => {
                                    const className = classes.find(c => c.id === course.classId)?.name;
                                    return (
                                        <option key={course.id} value={course.id}>
                                            {course.name} ({className})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {activeCourseId && (
                            <>
                                {/* Performance Trend Chart */}
                                {courseAssessments.length >= 2 && (
                                    <StudentTrendChart
                                        grades={myGrades}
                                        assessments={assessments.filter(a => a.courseId === activeCourseId)}
                                        studentName="You"
                                    />
                                )}

                                {/* Overall Grade Card */}
                                {overallGrade && overallGrade.count > 0 && (
                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-subtle">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    Subject Cumulative Standing
                                                </p>
                                                <div className="flex items-baseline gap-3 mt-1">
                                                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                                                        {overallGrade.grade}
                                                    </span>
                                                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                                        {overallGrade.percentage}% Average
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="inline-flex p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                                                    <TrendingUp className="h-6 w-6" />
                                                </div>
                                                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                                                    {overallGrade.count} test{overallGrade.count !== 1 ? 's' : ''} recorded
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Assessment Grades */}
                                <div>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                                        Assessment Records — {selectedCourse?.name}
                                    </h3>

                                    {courseAssessments.length === 0 ? (
                                        <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                No assessments scheduled for this course.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {courseAssessments.map(assessment => (
                                                <div
                                                    key={assessment.id}
                                                    className="flex items-center justify-between p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/40 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-subtle"
                                                >
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                                {assessment.name}
                                                            </h4>
                                                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
                                                                assessment.type === 'internal'
                                                                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60'
                                                                    : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60'
                                                            }`}>
                                                                {assessment.type === 'internal' ? 'Internal Exam' : 'Semester Final'}
                                                            </span>
                                                        </div>
                                                        {assessment.modulesCovered && assessment.modulesCovered.length > 0 && (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                                                                Syllabus: {assessment.modulesCovered.join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        {assessment.myGrade ? (
                                                            <div>
                                                                <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                                                                    {assessment.myGrade.marksScored}
                                                                    <span className="text-xs font-normal text-slate-400">/{assessment.maxMarks}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                                                                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                                                                        {assessment.myGrade.percentage}%
                                                                    </span>
                                                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                                                        assessment.myGrade.grade === 'A+' || assessment.myGrade.grade === 'A'
                                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                                            : assessment.myGrade.grade === 'B+' || assessment.myGrade.grade === 'B'
                                                                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                                                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                                    }`}>
                                                                        {assessment.myGrade.grade}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                <span>Pending Grade</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
