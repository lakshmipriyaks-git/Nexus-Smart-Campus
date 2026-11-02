import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import {
    CalendarCheck,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    BookOpen,
    Filter,
    Search,
    TrendingUp,
    ShieldCheck,
    ChevronRight
} from 'lucide-react';
import EmptyState from '../ui/EmptyState';

export function StudentAttendanceView() {
    const { user } = useAuth();
    const {
        classes = [],
        courses = [],
        joinRequests = [],
        attendance = []
    } = useData();

    // Storage key to persist selected course across tab navigation
    const STORAGE_KEY = `nexus_student_selected_attendance_course_${user?.id || 'default'}`;
    const [selectedCourseId, setSelectedCourseId] = useState(() => {
        return localStorage.getItem(STORAGE_KEY) || 'all';
    });
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Approved classes for the student
    const myJoinRequests = useMemo(() => {
        return joinRequests.filter(req => req.studentId === user?.id && req.status === 'approved');
    }, [joinRequests, user?.id]);

    const myClassIds = useMemo(() => {
        return myJoinRequests.map(req => req.classId);
    }, [myJoinRequests]);

    // Enrolled courses for this student
    const myCourses = useMemo(() => {
        return courses.filter(c => myClassIds.includes(c.classId));
    }, [courses, myClassIds]);

    // Keep course selection valid
    useEffect(() => {
        if (selectedCourseId !== 'all' && myCourses.length > 0) {
            const exists = myCourses.some(c => c.id === selectedCourseId);
            if (!exists) {
                setSelectedCourseId('all');
                localStorage.setItem(STORAGE_KEY, 'all');
            }
        }
    }, [myCourses, selectedCourseId, STORAGE_KEY]);

    const handleSelectCourse = (courseId) => {
        setSelectedCourseId(courseId);
        localStorage.setItem(STORAGE_KEY, courseId);
    };

    // Calculate subject-wise attendance metrics
    const subjectMetrics = useMemo(() => {
        return myCourses.map(course => {
            const courseClass = classes.find(cls => cls.id === course.classId);
            // All attendance records for this course where this student was marked
            const courseRecords = attendance.filter(att =>
                att.courseId === course.id &&
                att.records &&
                att.records[user?.id]
            );

            let present = 0;
            let absent = 0;
            let late = 0;

            courseRecords.forEach(rec => {
                const status = rec.records[user?.id];
                if (status === 'present') present++;
                else if (status === 'absent') absent++;
                else if (status === 'late') late++;
            });

            const total = courseRecords.length;
            const percentage = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;

            return {
                courseId: course.id,
                courseName: course.name,
                courseCode: course.code || course.id.slice(0, 6).toUpperCase(),
                className: courseClass?.name || 'Class',
                teacherName: course.teacherName || courseClass?.teacherName || 'Faculty',
                total,
                present,
                absent,
                late,
                percentage
            };
        });
    }, [myCourses, classes, attendance, user?.id]);

    // Overall aggregate attendance metrics
    const overallMetrics = useMemo(() => {
        let total = 0;
        let present = 0;
        let absent = 0;
        let late = 0;

        subjectMetrics.forEach(sub => {
            total += sub.total;
            present += sub.present;
            absent += sub.absent;
            late += sub.late;
        });

        const percentage = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;
        return { total, present, absent, late, percentage };
    }, [subjectMetrics]);

    // Flatten detailed attendance logs for student
    const attendanceLogs = useMemo(() => {
        const logs = [];

        attendance.forEach(att => {
            if (att.records && att.records[user?.id]) {
                const course = courses.find(c => c.id === att.courseId);
                const cls = classes.find(c => c.id === att.classId);

                // If a course is selected and it does not match, skip
                if (selectedCourseId !== 'all' && att.courseId !== selectedCourseId) {
                    return;
                }

                logs.push({
                    id: att.id || `${att.courseId}_${att.date}`,
                    date: att.date,
                    classId: att.classId,
                    className: cls?.name || 'Assigned Class',
                    courseId: att.courseId,
                    courseName: course?.name || 'Course',
                    teacherName: course?.teacherName || cls?.teacherName || 'Faculty',
                    status: att.records[user?.id]
                });
            }
        });

        // Sort latest date first
        return logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [attendance, courses, classes, user?.id, selectedCourseId]);

    // Filtered logs based on status and search query
    const filteredLogs = useMemo(() => {
        return attendanceLogs.filter(log => {
            if (statusFilter !== 'all' && log.status !== statusFilter) return false;
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const matchCourse = log.courseName.toLowerCase().includes(term);
                const matchDate = log.date.toLowerCase().includes(term);
                const matchTeacher = log.teacherName.toLowerCase().includes(term);
                return matchCourse || matchDate || matchTeacher;
            }
            return true;
        });
    }, [attendanceLogs, statusFilter, searchTerm]);

    const getStatusBadge = (status) => {
        if (status === 'present') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Present
                </span>
            );
        }
        if (status === 'absent') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                    <XCircle className="w-3.5 h-3.5" /> Absent
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <Clock className="w-3.5 h-3.5" /> Late
            </span>
        );
    };

    if (myCourses.length === 0) {
        return (
            <Card className="rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                <CardContent className="py-12">
                    <EmptyState
                        icon={CalendarCheck}
                        title="No Enrolled Classes"
                        description="You haven't joined any classes yet. Once you join a class and your teacher marks attendance, it will appear here."
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header & Overall Summary Banner */}
            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Real-time Attendance Tracker
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                            Subject Attendance Overview
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Live attendance records recorded by your faculty across all enrolled subjects.
                        </p>
                    </div>

                    {/* Overall Percentage Badge */}
                    <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className={`p-3 rounded-2xl ${
                            overallMetrics.percentage >= 85
                                ? 'bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400'
                                : overallMetrics.percentage >= 75
                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                                    : 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 animate-pulse'
                        }`}>
                            <CalendarCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[11px] uppercase font-bold text-gray-400">Overall Attendance</p>
                            <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
                                {overallMetrics.total > 0 ? `${overallMetrics.percentage}%` : 'N/A'}
                            </p>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                overallMetrics.percentage >= 75
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                            }`}>
                                {overallMetrics.total === 0 ? 'No sessions yet' : overallMetrics.percentage >= 75 ? 'VTU Eligible (≥75%)' : 'Shortage Warning (<75%)'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    <div className="bg-white/80 dark:bg-gray-800/80 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/80">
                        <p className="text-[11px] text-gray-400 font-bold uppercase">Total Classes</p>
                        <p className="text-xl font-black text-gray-900 dark:text-gray-100 mt-0.5">{overallMetrics.total}</p>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-800/80 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/80">
                        <p className="text-[11px] text-green-600 dark:text-green-400 font-bold uppercase">Attended (Present)</p>
                        <p className="text-xl font-black text-green-600 dark:text-green-400 mt-0.5">{overallMetrics.present}</p>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-800/80 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/80">
                        <p className="text-[11px] text-red-600 dark:text-red-400 font-bold uppercase">Missed (Absent)</p>
                        <p className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5">{overallMetrics.absent}</p>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-800/80 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/80">
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold uppercase">Late Marks</p>
                        <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{overallMetrics.late}</p>
                    </div>
                </div>
            </div>

            {/* Subject-Wise Attendance Breakdown Cards */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        Enrolled Subject Breakdown
                    </h3>
                    <span className="text-xs text-gray-400">Click a subject card to filter logs</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjectMetrics.map(sub => {
                        const isSelected = selectedCourseId === sub.courseId;
                        return (
                            <div
                                key={sub.courseId}
                                onClick={() => handleSelectCourse(isSelected ? 'all' : sub.courseId)}
                                role="button"
                                tabIndex={0}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                    isSelected
                                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{sub.courseName}</h4>
                                        <p className="text-[11px] text-gray-400">{sub.className} • {sub.teacherName}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                        sub.total === 0
                                            ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                            : sub.percentage >= 75
                                                ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300'
                                                : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 animate-pulse'
                                    }`}>
                                        {sub.total > 0 ? `${sub.percentage}%` : 'N/A'}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden my-2.5">
                                    <div
                                        className={`h-full transition-all duration-300 ${
                                            sub.percentage >= 75
                                                ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                                                : 'bg-gradient-to-r from-amber-500 to-red-500'
                                        }`}
                                        style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                                    <span>{sub.present} of {sub.total} attended</span>
                                    <span>{sub.absent} missed</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Attendance History Log Section */}
            <Card className="rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/80 overflow-hidden">
                <CardHeader className="bg-gray-50/70 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            Attendance History Records
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold">
                                {filteredLogs.length} Records
                            </span>
                        </CardTitle>

                        {/* Subject Selector & Status Filter */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Course Dropdown (Persisted) */}
                            <select
                                value={selectedCourseId}
                                onChange={(e) => handleSelectCourse(e.target.value)}
                                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Subjects</option>
                                {myCourses.map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.name}
                                    </option>
                                ))}
                            </select>

                            {/* Status Pills */}
                            <div className="flex items-center gap-1 p-0.5 bg-gray-200/80 dark:bg-gray-900 rounded-xl">
                                {['all', 'present', 'absent', 'late'].map(status => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                            statusFilter === status
                                                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {filteredLogs.length === 0 ? (
                        <div className="py-12 text-center">
                            <CalendarCheck className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                No attendance records found
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                When your faculty marks attendance for classes, your subject entries will appear here in real time.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50/50 dark:bg-gray-800/40 text-[11px] text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Date</th>
                                        <th className="px-5 py-3 font-semibold">Subject / Course</th>
                                        <th className="px-5 py-3 font-semibold">Class & Faculty</th>
                                        <th className="px-5 py-3 font-semibold text-right">Attendance Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                                    {filteredLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                                            <td className="px-5 py-3.5 text-xs font-bold text-gray-900 dark:text-gray-100">
                                                {log.date}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
                                                {log.courseName}
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                                                <span>{log.className}</span>
                                                <span className="text-[10px] text-gray-400 block">{log.teacherName}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                {getStatusBadge(log.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default StudentAttendanceView;
