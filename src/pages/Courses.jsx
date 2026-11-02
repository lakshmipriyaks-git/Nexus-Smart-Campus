import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { BookOpen, GraduationCap, Users, Library, CheckCircle2 } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function Courses() {
    const { user } = useAuth();
    const { classes = [], courses = [], joinRequests = [] } = useData() || {};
    const [filter, setFilter] = useState('my'); // Default to 'my' courses

    const getJoinStatus = (classId) => {
        const request = joinRequests.find(req => req.classId === classId && req.studentId === user?.id);
        return request ? request.status : null;
    };

    const myClassIds = classes
        .filter(c => getJoinStatus(c.id) === 'approved')
        .map(c => c.id);

    const filteredCourses = courses.filter(course => {
        if (filter === 'my') {
            return myClassIds.includes(course.classId);
        }
        return true;
    });

    // Group courses by Class
    const coursesByClass = filteredCourses.reduce((acc, course) => {
        const className = classes.find(c => c.id === course.classId)?.name || 'General Academic Courses';
        if (!acc[className]) {
            acc[className] = [];
        }
        acc[className].push(course);
        return acc;
    }, {});

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-scaleIn text-[#202442] dark:text-slate-100 transition-colors">
            {/* Header & Filter Switcher */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-[#E2E6F2] dark:border-[#1E2D4A] pb-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#202442] dark:text-white tracking-tight flex items-center gap-2.5 font-display">
                        <Library className="w-7 h-7 text-[#6558E8] dark:text-[#06B6D4]" />
                        <span>Courses & Catalog</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-[#59627E] dark:text-slate-400 mt-1">
                        Institutional course directory, active curriculum syllabi, and enrolled academic cohorts.
                    </p>
                </div>

                <div className="flex bg-[#EEF1FC] dark:bg-[#0A0F1D] border border-[#E2E6F2] dark:border-[#1E2D4A] p-1 rounded-xl shadow-sm">
                    <button
                        onClick={() => setFilter('my')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'my'
                            ? 'bg-[#6558E8] text-white shadow-sm dark:bg-[#06B6D4] dark:text-[#070A11] dark:shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                            : 'text-[#59627E] dark:text-slate-400 hover:text-[#202442] dark:hover:text-white'
                            }`}
                    >
                        My Enrolled Courses ({filteredCourses.filter(c => myClassIds.includes(c.classId)).length})
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filter === 'all'
                            ? 'bg-[#6558E8] text-white shadow-sm dark:bg-[#06B6D4] dark:text-[#070A11] dark:shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                            : 'text-[#59627E] dark:text-slate-400 hover:text-[#202442] dark:hover:text-white'
                            }`}
                    >
                        All Campus Catalog ({courses.length})
                    </button>
                </div>
            </div>

            {Object.keys(coursesByClass).length === 0 ? (
                <EmptyState
                    icon={BookOpen}
                    title="No Courses Found"
                    description={filter === 'my' ? "You haven't enrolled in any classes with active course modules yet." : "No courses are currently published in the catalog."}
                    className="py-16"
                />
            ) : (
                <div className="space-y-8">
                    {Object.entries(coursesByClass).map(([className, classCourses]) => {
                        const targetClass = classes.find(c => c.name === className);
                        return (
                            <div key={className} className="rounded-2xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] p-6 shadow-sm dark:shadow-xl">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E6F2] dark:border-[#1E2D4A] pb-3 mb-5">
                                    <h2 className="text-lg font-bold text-[#202442] dark:text-white flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#6558E8] dark:bg-[#06B6D4] shadow-sm dark:shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                                        <span>{className}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#6558E8]/10 text-[#6558E8] dark:bg-[#06B6D4]/15 dark:text-[#22D3EE] border border-[#6558E8]/30 dark:border-[#06B6D4]/30 font-mono">
                                            {classCourses.length} {classCourses.length === 1 ? 'Module' : 'Modules'}
                                        </span>
                                    </h2>
                                    {targetClass?.teacherName && (
                                        <div className="flex items-center gap-1.5 text-xs text-[#59627E] dark:text-slate-400">
                                            <GraduationCap className="w-4 h-4 text-amber-500 dark:text-[#F59E0B]" />
                                            <span>Instructor: <strong className="text-[#202442] dark:text-slate-200">{targetClass.teacherName}</strong></span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {classCourses.map(course => {
                                        const cInfo = classes.find(c => c.id === course.classId);
                                        return (
                                            <div
                                                key={course.id}
                                                className="group p-5 rounded-xl border border-[#E2E6F2] dark:border-[#1E2D4A] bg-[#F8F9FE] dark:bg-[#0A0F1D] hover:border-[#6558E8]/60 dark:hover:border-[#06B6D4]/60 transition-all duration-300 flex flex-col justify-between shadow-sm dark:shadow-md"
                                            >
                                                <div className="space-y-2.5">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h3 className="font-bold text-base text-[#202442] dark:text-white group-hover:text-[#6558E8] dark:group-hover:text-[#22D3EE] transition-colors line-clamp-1">
                                                            {course.name}
                                                        </h3>
                                                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#6558E8]/10 dark:bg-[#06B6D4]/15 border border-[#6558E8]/30 dark:border-[#06B6D4]/30 text-[#6558E8] dark:text-[#22D3EE] font-semibold whitespace-nowrap">
                                                            {cInfo?.teacherName || 'Faculty'}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-[#59627E] dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                        {cInfo?.description || 'Core departmental module covering fundamental theoretical concepts, laboratory exercises, and evaluations.'}
                                                    </p>
                                                </div>

                                                <div className="pt-4 mt-3 border-t border-[#E2E6F2] dark:border-[#1E2D4A]/60 flex items-center justify-between text-xs text-[#59627E] dark:text-slate-400">
                                                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Active Syllabus
                                                    </span>
                                                    <span className="font-mono text-[11px] text-[#7E87A2] dark:text-slate-500">
                                                        Code: {course.id.slice(0, 6).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
