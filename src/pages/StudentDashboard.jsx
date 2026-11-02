import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import PomodoroTimer from '../components/student/PomodoroTimer';
import AnnouncementFeed from '../components/student/AnnouncementFeed';
import CalendarWidget from '../components/common/CalendarWidget';
import NotesWidget from '../components/common/NotesWidget';
import { StudentGradesView } from '../components/student/StudentGradesView';
import { StudentAttendanceView } from '../components/student/StudentAttendanceView';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Tabs } from '../components/ui/Tabs';
import {
    Home,
    BookOpen,
    UserPlus,
    GraduationCap,
    CalendarCheck,
    CheckCircle2,
    Clock,
    FileText,
    Download,
    Layers,
    ShieldCheck,
    Sparkles,
    Search,
    ClipboardList,
    UtensilsCrossed,
    Printer,
    Bus,
    Calendar,
    Library,
    ArrowUpRight
} from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import SearchBar from '../components/ui/SearchBar';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import GlobalAnnouncementsBanner from '../components/common/GlobalAnnouncementsBanner';

export default function StudentDashboard() {
    const { user } = useAuth();
    const { classes, joinRequests, requestJoinClass, courses, resources, getCourseAnnouncements, downloadResource, loading } = useData();
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [selectedGradeCourseId, setSelectedGradeCourseId] = useState(() => {
        return localStorage.getItem(`nexus_student_selected_grade_course_${user?.id || 'default'}`) || '';
    });
    const [classSearch, setClassSearch] = useState('');
    const studentUsn = user?.usn || (typeof localStorage !== 'undefined' ? localStorage.getItem('nexus_student_usn') : null) || '1KS21CS088';

    // Time-aware greeting using local device time:
    // 05:00–11:59: Good Morning
    // 12:00–16:59: Good Afternoon
    // 17:00–20:59: Good Evening
    // 21:00–04:59: Welcome Back
    const getDynamicGreeting = (date = new Date()) => {
        const currentHour = date.getHours();
        if (currentHour >= 5 && currentHour < 12) return 'Good Morning';
        if (currentHour >= 12 && currentHour < 17) return 'Good Afternoon';
        if (currentHour >= 17 && currentHour < 21) return 'Good Evening';
        return 'Welcome Back';
    };

    const [greeting, setGreeting] = useState(() => getDynamicGreeting());

    useEffect(() => {
        const interval = setInterval(() => {
            setGreeting(getDynamicGreeting());
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const studentFirstName = user?.name?.split(' ')?.[0] || 'Ananya';

    const handleJoin = async (classId) => {
        if (!user?.id) return;
        const success = await requestJoinClass(classId, user.id, user.name, studentUsn);
        if (success) {
            toast.success("Enrollment request transmitted to course coordinator.");
        }
    };

    const getJoinStatus = (classId) => {
        const request = joinRequests.find(req => req.classId === classId && req.studentId === user.id);
        if (!request) return null;
        return request.status;
    };

    const joinedClasses = classes.filter(c => getJoinStatus(c.id) === 'approved');
    const availableClasses = classes.filter(c => {
        if (getJoinStatus(c.id) === 'approved') return false;

        // Apply search filter
        if (classSearch) {
            const searchLower = classSearch.toLowerCase();
            const matchesName = c.name?.toLowerCase().includes(searchLower);
            const matchesTeacher = c.teacherName?.toLowerCase().includes(searchLower);
            return matchesName || matchesTeacher;
        }

        return true;
    });

    const myClasses = joinedClasses;
    const selectedClass = classes.find(c => c.id === selectedClassId);
    const coursesInSelectedClass = courses.filter(c => c.classId === selectedClassId);
    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    const courseResources = resources.filter(r => r.courseId === selectedCourseId);
    const courseAnnouncements = selectedCourseId ? getCourseAnnouncements(selectedCourseId) : [];

    const handleDownloadResource = (resource) => {
        if (resource.url && !resource.downloadURL) {
            window.open(resource.url, '_blank');
            return;
        }

        if (resource.downloadURL) {
            downloadResource(resource.downloadURL, resource.fileName || resource.title);
            return;
        }

        if (resource.isChunked) {
            toast.error('This legacy resource requires faculty re-synchronization.');
            return;
        }

        toast.error('Unable to access resource repository.');
    };

    const tabs = [
        { id: 'home', label: 'Academic Workspace', icon: Home },
        { id: 'classes', label: 'Enrolled Classes', icon: BookOpen },
        { id: 'join', label: 'Course Catalog', icon: UserPlus },
        { id: 'grades', label: 'Gradebook & GPA', icon: GraduationCap },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* ── Visual Reference Panel 3: Student Cockpit Header ── */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#202442] dark:text-white tracking-tight">
                                {greeting}, {studentFirstName} 👋
                            </h1>
                            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#6558E8]/10 text-[#6558E8] border border-[#6558E8]/30 dark:bg-[#06B6D4]/15 dark:text-[#22D3EE] dark:border-[#06B6D4]/40 shadow-xs dark:shadow-[0_0_8px_rgba(6,182,212,0.25)]">
                                {user?.semester || 'II Semester'} · {user?.departmentId || 'CSE'}
                            </span>
                        </div>
                        <p className="text-xs text-[#59627E] dark:text-slate-400 mt-1">
                            Academic Command Center · K.S. School of Engineering & Management
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        {studentUsn && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm">
                                <span className="text-[10px] font-mono font-bold uppercase text-[#7E87A2] dark:text-slate-500">USN</span>
                                <span className="font-mono text-xs font-bold text-[#C87910] dark:text-[#FBBF24]">
                                    {studentUsn}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Visual Reference Panel 3: 3-Card Cockpit Row ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. Radial Attendance Gauge Card */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-between group hover:border-[#6558E8]/50 dark:hover:border-[#06B6D4]/50 transition-all">
                        <div className="space-y-1.5">
                            <p className="text-[11px] font-mono font-bold text-[#59627E] dark:text-slate-400 uppercase tracking-wider">
                                Attendance
                            </p>
                            <p className="font-display text-2xl font-bold text-[#202442] dark:text-white">
                                78% <span className="text-xs font-mono font-normal text-[#59627E] dark:text-slate-400">Target: 75%</span>
                            </p>
                            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                                <span>+4 Classes Safe Margin</span>
                            </div>
                        </div>

                        {/* Circular SVG Gauge */}
                        <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                    className="text-[#CCD3E5] dark:text-[#1E2D4A]"
                                    strokeWidth="3.5"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                    className="text-[#6558E8] dark:text-[#06B6D4]"
                                    strokeDasharray="78, 100"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                            </svg>
                            <span className="absolute font-display font-bold text-xs text-[#202442] dark:text-white">78%</span>
                        </div>
                    </div>

                    {/* 2. Today's Schedule Card */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group hover:border-[#6558E8]/50 dark:hover:border-[#06B6D4]/50 transition-all flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[11px] font-mono font-bold text-[#59627E] dark:text-slate-400 uppercase tracking-wider">
                                Today's Schedule
                            </p>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                        </div>
                        <div className="space-y-1.5 font-mono text-xs">
                            <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8F9FE] dark:bg-[#070A11]/60 border border-[#E2E6F2] dark:border-[#1E2D4A]/60 transition-colors hover:border-[#6558E8]/40 dark:hover:border-[#06B6D4]/40">
                                <span className="text-xs font-mono font-bold text-[#6558E8] dark:text-[#22D3EE] px-1.5 py-0.5 rounded bg-[#6558E8]/10 dark:bg-[#06B6D4]/10">09:00 AM</span>
                                <span className="text-xs font-semibold text-[#202442] dark:text-white">DSA (L2)</span>
                                <span className="text-[11px] font-mono text-[#59627E] dark:text-slate-400 font-medium">LH-302</span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8F9FE] dark:bg-[#070A11]/60 border border-[#E2E6F2] dark:border-[#1E2D4A]/60 transition-colors hover:border-[#6558E8]/40 dark:hover:border-[#06B6D4]/40">
                                <span className="text-xs font-mono font-bold text-[#6558E8] dark:text-[#22D3EE] px-1.5 py-0.5 rounded bg-[#6558E8]/10 dark:bg-[#06B6D4]/10">11:00 AM</span>
                                <span className="text-xs font-semibold text-[#202442] dark:text-white">COA (L1)</span>
                                <span className="text-[11px] font-mono text-[#59627E] dark:text-slate-400 font-medium">LH-305</span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8F9FE] dark:bg-[#070A11]/60 border border-[#E2E6F2] dark:border-[#1E2D4A]/60 transition-colors hover:border-[#6558E8]/40 dark:hover:border-[#06B6D4]/40">
                                <span className="text-xs font-mono font-bold text-[#6558E8] dark:text-[#22D3EE] px-1.5 py-0.5 rounded bg-[#6558E8]/10 dark:bg-[#06B6D4]/10">02:00 PM</span>
                                <span className="text-xs font-semibold text-[#202442] dark:text-white">DBMS (L3)</span>
                                <span className="text-[11px] font-mono text-[#59627E] dark:text-slate-400 font-medium">Lab-4</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Assignments Card */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group hover:border-amber-500/50 dark:hover:border-[#F59E0B]/50 transition-all flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[11px] font-mono font-bold text-[#59627E] dark:text-slate-400 uppercase tracking-wider">
                                Assignments
                            </p>
                            <p className="font-display text-2xl font-bold text-[#202442] dark:text-white">
                                2 Due <span className="text-xs font-normal text-[#59627E] dark:text-slate-400">This Week</span>
                            </p>
                            <Link to="/tasks" className="text-xs font-semibold text-[#C87910] dark:text-[#FBBF24] hover:underline inline-flex items-center gap-1.5 mt-1">
                                <span>Open Kanban Board</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 dark:bg-[#F59E0B]/15 border border-amber-500/30 dark:border-[#F59E0B]/30 flex items-center justify-center text-[#C87910] dark:text-[#FBBF24] shadow-sm flex-shrink-0">
                            <ClipboardList className="w-7 h-7" />
                        </div>
                    </div>
                </div>
            </div>

            <GlobalAnnouncementsBanner />

            <Tabs tabs={tabs} defaultTab="home">
                {(activeTab) => (
                    <div className="space-y-6 animate-scaleIn">
                        {activeTab === 'home' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <PomodoroTimer />
                                        <CalendarWidget />
                                    </div>
                                    <NotesWidget />
                                </div>
                                <div>
                                    <AnnouncementFeed />
                                </div>
                            </div>
                        )}

                        {activeTab === 'classes' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-1 space-y-4">
                                    <div className="surface-card p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                My Classes ({myClasses.length})
                                            </h2>
                                        </div>
                                        {loading ? (
                                            <SkeletonLoader variant="list" count={3} />
                                        ) : myClasses.length === 0 ? (
                                            <EmptyState
                                                icon={BookOpen}
                                                title="No Classes Joined"
                                                description="Join an active class section from the Course Catalog tab."
                                                className="py-8"
                                            />
                                        ) : (
                                            <div className="space-y-2">
                                                {myClasses.map(cls => (
                                                    <div
                                                        key={cls.id}
                                                        onClick={() => {
                                                            setSelectedClassId(cls.id);
                                                            setSelectedCourseId(null);
                                                        }}
                                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                                                            selectedClassId === cls.id
                                                                ? 'border-[#6558E8] dark:border-[#06B6D4] bg-[#6558E8]/10 dark:bg-[#06B6D4]/12 shadow-sm dark:shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                                                : 'border-[#E2E6F2] dark:border-[#1E2D4A] bg-white dark:bg-[#0D1527] hover:border-[#6558E8]/40 dark:hover:border-slate-600'
                                                        }`}
                                                    >
                                                        <h3 className="text-sm font-semibold text-[#202442] dark:text-white">
                                                            {cls.name}
                                                        </h3>
                                                        <p className="text-xs text-[#59627E] dark:text-slate-400 mt-0.5">
                                                            Instructor: {cls.teacherName || 'Faculty Member'}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {selectedClass && (
                                        <div className="surface-card p-5 animate-fadeIn">
                                            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                                                Curriculum Modules
                                            </h2>
                                            {loading ? (
                                                <SkeletonLoader variant="card" count={2} />
                                            ) : coursesInSelectedClass.length === 0 ? (
                                                <div className="text-center py-6">
                                                    <p className="text-xs text-slate-400">
                                                        No syllabus courses assigned to this section yet.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {coursesInSelectedClass.map(course => (
                                                        <div
                                                            key={course.id}
                                                            onClick={() => setSelectedCourseId(course.id)}
                                                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                                                selectedCourseId === course.id
                                                                    ? 'border-[#6558E8] dark:border-[#06B6D4] bg-[#6558E8]/10 dark:bg-[#06B6D4]/12 font-semibold text-[#6558E8] dark:text-[#22D3EE]'
                                                                    : 'border-[#E2E6F2] dark:border-[#1E2D4A] bg-white dark:bg-[#0D1527] hover:bg-[#EEF1FC] dark:hover:bg-[#111A2E] text-[#202442] dark:text-slate-200'
                                                            }`}
                                                        >
                                                            <div className="text-xs font-medium">{course.name}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="lg:col-span-2">
                                    {selectedCourseId ? (
                                        <div className="surface-card p-6 animate-fadeIn space-y-6">
                                            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                                                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                                    {selectedCourse?.name}
                                                </h2>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                    Course Resources, Syllabi & Section Broadcasts
                                                </p>
                                            </div>

                                            <div>
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                                                    Course Material & Handouts
                                                </h3>
                                                <ul className="space-y-2">
                                                    {courseResources.map(r => (
                                                        <li
                                                            key={r.id}
                                                            className="flex items-center justify-between text-xs p-3 bg-[#0A0F1D] rounded-xl border border-[#1E2D4A] hover:border-[#06B6D4]/40 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <FileText className="w-4 h-4 text-[#22D3EE] flex-shrink-0" />
                                                                <button
                                                                    onClick={() => handleDownloadResource(r)}
                                                                    className="hover:text-[#22D3EE] text-left font-medium truncate text-white"
                                                                >
                                                                    {r.title}
                                                                </button>
                                                            </div>
                                                            <span className="text-[11px] font-mono text-slate-400 ml-4 flex-shrink-0">
                                                                {r.date || 'Active'}
                                                            </span>
                                                        </li>
                                                    ))}
                                                    {courseResources.length === 0 && (
                                                        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                                No digital resources uploaded for this module yet.
                                                            </p>
                                                        </div>
                                                    )}
                                                </ul>
                                            </div>

                                            <div>
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                                                    Faculty Notices
                                                </h3>
                                                <div className="space-y-2.5">
                                                    {courseAnnouncements.map(a => (
                                                        <div key={a.id} className="p-3.5 bg-[#0A0F1D] rounded-xl border border-[#1E2D4A]">
                                                            <p className="text-xs text-slate-200 leading-relaxed">
                                                                {a.content}
                                                            </p>
                                                            <p className="text-[10px] font-mono text-slate-400 mt-2">
                                                                {a.date} • {a.author}
                                                            </p>
                                                        </div>
                                                    ))}
                                                    {courseAnnouncements.length === 0 && (
                                                        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                                No announcements for this section.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <EmptyState
                                            icon={BookOpen}
                                            title="Select a Curriculum Course"
                                            description="Choose a class and course from the left roster to view syllabus resources."
                                            className="h-full border-dashed"
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'join' && (
                            <div className="surface-card p-6 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                            Institutional Course Catalog
                                        </h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Search and request enrollment in accredited semester sections.
                                        </p>
                                    </div>
                                    <div className="w-full sm:w-72">
                                        <SearchBar
                                            value={classSearch}
                                            onChange={setClassSearch}
                                            placeholder="Search by class or instructor..."
                                        />
                                    </div>
                                </div>

                                {loading ? (
                                    <SkeletonLoader variant="card" count={3} />
                                ) : availableClasses.length === 0 ? (
                                    <EmptyState
                                        icon={UserPlus}
                                        title="All Classes Enrolled"
                                        description="You are currently registered in all available class sections."
                                        className="py-12"
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                                        {availableClasses.map(cls => {
                                            const status = getJoinStatus(cls.id);
                                            return (
                                                <div
                                                    key={cls.id}
                                                    className="p-5 border border-[#1E2D4A] bg-[#0D1527] rounded-xl hover:border-[#06B6D4]/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all flex flex-col justify-between"
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start gap-2 mb-2">
                                                            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                                                                {cls.name}
                                                            </h3>
                                                            <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md shrink-0">
                                                                {cls.teacherName || 'Faculty'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                                                            {cls.description || 'Curricular program offered by department.'}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        {status === 'pending' ? (
                                                            <button
                                                                disabled
                                                                className="w-full px-3 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 rounded-lg text-xs font-semibold cursor-not-allowed opacity-80"
                                                            >
                                                                Enrollment Request Pending
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleJoin(cls.id)}
                                                                className="w-full btn-primary text-xs"
                                                            >
                                                                Enroll in Class
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'grades' && (
                            <StudentGradesView
                                selectedCourseId={selectedGradeCourseId}
                                onSelectCourse={setSelectedGradeCourseId}
                            />
                        )}

                        {activeTab === 'attendance' && (
                            <StudentAttendanceView />
                        )}
                    </div>
                )}
            </Tabs>
        </div>
    );
}
