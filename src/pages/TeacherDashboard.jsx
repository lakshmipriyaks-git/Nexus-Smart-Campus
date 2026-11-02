import React, { useState } from 'react';
import toast from 'react-hot-toast';
import AnalyticsDashboard from '../components/teacher/AnalyticsDashboard';
import StudentRoster from '../components/teacher/StudentRoster';
import PostAnnouncement from '../components/teacher/PostAnnouncement';
import AssessmentManager from '../components/teacher/AssessmentManager';
import GradeEntry from '../components/teacher/GradeEntry';
import GradeAnalytics from '../components/teacher/GradeAnalytics';
import GradeStatistics from '../components/teacher/GradeStatistics';
import AtRiskAnalysis from '../components/teacher/AtRiskAnalysis';
import BulkDataEntry from '../components/teacher/BulkDataEntry';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: "easeOut"
        }
    }
};
import { Tabs } from '../components/ui/Tabs';
import { LayoutDashboard, BookOpen, Users, CalendarCheck, GraduationCap, FileText, Bell, ClipboardList, UserPlus, AlertCircle, Trash2, UploadCloud, Link as LinkIcon, File, X, Download, ExternalLink, Paperclip } from 'lucide-react';
import SearchBar from '../components/ui/SearchBar';
import FilterDropdown from '../components/ui/FilterDropdown';
import EmptyState from '../components/ui/EmptyState';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import ErrorBoundaryWrapper from '../components/ui/ErrorBoundaryWrapper';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import ConfirmModal from '../components/ui/ConfirmModal';
import GlobalAnnouncementsBanner from '../components/common/GlobalAnnouncementsBanner';

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { classes, createClass, deleteClass, joinRequests, respondToJoinRequest, courses, createCourse, deleteCourse, resources, addResource, uploadResourceToStorage, downloadResource, deleteResource, addAnnouncement, findTeacherByEmail, loading, assessments, grades } = useData();

    // Debug logging
    React.useEffect(() => {
        console.log("TeacherDashboard: useData values:", {
            hasUploadResourceToStorage: !!uploadResourceToStorage,
            hasDownloadResource: !!downloadResource
        });
    }, [uploadResourceToStorage, downloadResource]);

    const [newClassName, setNewClassName] = useState('');
    const [newClassDesc, setNewClassDesc] = useState('');

    // Search and filter states
    const [requestSearch, setRequestSearch] = useState('');
    const [requestFilter, setRequestFilter] = useState('all');
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [selectedCourseId, setSelectedCourseId] = useState(null);

    // Confirmation modals
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, item: null });

    const handleCreateClass = (e) => {
        e.preventDefault();
        if (!newClassName.trim()) return;

        if (user?.status === 'pending') {
            toast.error('Your staff account is pending HOD approval before you can create classes.');
            return;
        }

        createClass({
            name: newClassName,
            description: newClassDesc,
            teacherId: user.id,
            teacherName: user.name,
            departmentId: user.departmentId || 'CSE'
        });
        setNewClassName('');
        setNewClassDesc('');
    };

    const myClasses = classes.filter(c =>
        c.teacherId === user.id ||
        courses.some(course => course.classId === c.id && course.teacherId === user.id)
    );

    // Filter and search join requests
    const myRequests = joinRequests.filter(req => {
        const reqClass = classes.find(c => c.id === req.classId);
        if (reqClass?.teacherId !== user?.id) return false;

        // Apply status filter - default to 'pending' if 'all' is selected
        const effectiveFilter = requestFilter === 'all' ? 'pending' : requestFilter;
        if (req.status !== effectiveFilter) return false;

        // Apply search
        if (requestSearch) {
            const searchLower = requestSearch.toLowerCase();
            const matchesName = req.studentName?.toLowerCase().includes(searchLower);
            const matchesEmail = req.studentEmail?.toLowerCase().includes(searchLower);
            return matchesName || matchesEmail;
        }

        return true;
    });

    // Handle confirmation for delete operations
    const handleConfirmDelete = () => {
        if (deleteModal.type === 'course') {
            deleteCourse(deleteModal.item.id);
            if (selectedCourseId === deleteModal.item.id) {
                setSelectedCourseId(null);
            }
        } else if (deleteModal.type === 'resource') {
            deleteResource(deleteModal.item.id, deleteModal.item.storagePath);
        } else if (deleteModal.type === 'class') {
            deleteClass(deleteModal.item.id);
            if (selectedClassId === deleteModal.item.id) {
                setSelectedClassId(null);
                setSelectedCourseId(null);
            }
        }
        setDeleteModal({ isOpen: false, type: null, item: null });
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'classes', label: 'Classes & Courses', icon: BookOpen },
        { id: 'content', label: 'Course Content', icon: FileText },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
        { id: 'grading', label: 'Grading', icon: GraduationCap },
    ];

    const selectedCourse = courses.find(c => c.id === selectedCourseId);

    // Build breadcrumbs based on current location
    const getBreadcrumbs = (activeTab) => {
        const breadcrumbs = [{ label: 'Teacher Dashboard', href: null }];

        if (activeTab && activeTab !== 'overview') {
            const tabLabels = {
                classes: 'Classes & Courses',
                content: 'Course Content',
                students: 'Students',
                grading: 'Grading',
                attendance: 'Attendance'
            };
            breadcrumbs.push({ label: tabLabels[activeTab] || activeTab, href: null });
        }

        if (selectedCourse) {
            breadcrumbs.push({ label: selectedCourse.name, href: null });
        }

        return breadcrumbs;
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* ── Visual Reference Panel 4: Teaching Command Header ── */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#202442] dark:text-white tracking-tight">
                                Teaching Command
                            </h1>
                            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#6558E8]/10 dark:bg-[#06B6D4]/15 text-[#6558E8] dark:text-[#22D3EE] border border-[#6558E8]/30 dark:border-[#06B6D4]/40 shadow-sm dark:shadow-[0_0_8px_rgba(6,182,212,0.25)]">
                                DEPT: {user?.departmentId || 'CSE'}
                            </span>
                        </div>
                        <p className="text-xs text-[#59627E] dark:text-slate-400 mt-1">
                            Instructor: <strong className="text-[#202442] dark:text-white font-semibold">{user?.name}</strong> · Section rosters, attendance telemetry & grading
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                            <span>FACULTY VERIFIED</span>
                        </span>
                    </div>
                </div>

                {/* ── Visual Reference Panel 4: 3-Col Metric Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group hover:border-[#6558E8]/40 dark:hover:border-[#06B6D4]/50 transition-all">
                        <p className="text-[11px] font-mono font-bold text-[#59627E] dark:text-slate-400 uppercase tracking-wider">
                            Active Classes
                        </p>
                        <p className="font-display text-3xl font-extrabold text-[#202442] dark:text-white tabular-nums mt-1">
                            {myClasses.length || 4}
                        </p>
                        <p className="text-[10px] text-[#7E87A2] dark:text-slate-500 mt-1">Semester assigned sections</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group hover:border-[#6558E8]/40 dark:hover:border-[#06B6D4]/50 transition-all">
                        <p className="text-[11px] font-mono font-bold text-[#59627E] dark:text-slate-400 uppercase tracking-wider">
                            Total Students
                        </p>
                        <p className="font-display text-3xl font-extrabold text-[#202442] dark:text-white tabular-nums mt-1">
                            128
                        </p>
                        <p className="text-[10px] text-[#7E87A2] dark:text-slate-500 mt-1">Across 4 lecture batches</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group hover:border-[#6558E8]/40 dark:hover:border-[#06B6D4]/50 transition-all">
                        <p className="text-[11px] font-mono font-bold text-[#59627E] dark:text-slate-400 uppercase tracking-wider">
                            Avg. Attendance
                        </p>
                        <p className="font-display text-3xl font-extrabold text-[#6558E8] dark:text-[#22D3EE] tabular-nums mt-1">
                            92%
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                            <span>▲ +3.4% above dept minimum</span>
                        </p>
                    </div>
                </div>

                {/* ── Visual Reference Panel 4: Attendance Trend + Today's Classes ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Attendance Trend Bar Chart (Left 7 Cols) */}
                    <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-mono font-bold text-[#202442] dark:text-slate-300 uppercase tracking-wider">
                                Attendance Trend
                            </p>
                            <span className="text-[10px] font-mono text-[#6558E8] dark:text-[#22D3EE] bg-[#6558E8]/10 dark:bg-[#06B6D4]/15 px-2 py-0.5 rounded-full border border-[#6558E8]/30 dark:border-[#06B6D4]/30">
                                2026 SEMESTER
                            </span>
                        </div>

                        {/* Visual Bar Chart matching Panel 4 */}
                        <div className="h-36 flex items-end justify-between gap-3 px-4 pt-4 border-b border-[#E2E6F2] dark:border-[#1E2D4A]/60">
                            {[
                                { month: 'Jan', val: '68%', h: '68%' },
                                { month: 'Feb', val: '84%', h: '84%' },
                                { month: 'Mar', val: '78%', h: '78%' },
                                { month: 'Apr', val: '89%', h: '89%' },
                                { month: 'May', val: '92%', h: '92%' }
                            ].map((bar) => (
                                <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 group">
                                    <span className="text-[10px] font-mono text-[#6558E8] dark:text-[#22D3EE] opacity-0 group-hover:opacity-100 transition-opacity">
                                        {bar.val}
                                    </span>
                                    <div className="w-full max-w-[42px] bg-[#EEF1FC] dark:bg-[#111A2E] rounded-t-lg overflow-hidden h-28 flex items-end">
                                        <div
                                            style={{ height: bar.h }}
                                            className="w-full bg-gradient-to-t from-[#6558E8] to-[#4389F5] dark:from-[#06B6D4] dark:to-[#22D3EE] rounded-t-lg group-hover:brightness-110 transition-all shadow-sm dark:shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                                        />
                                    </div>
                                    <span className="text-[11px] font-mono text-[#59627E] dark:text-slate-400">{bar.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Today's Classes List (Right 5 Cols) */}
                    <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-mono font-bold text-[#202442] dark:text-slate-300 uppercase tracking-wider">
                                Today's Classes
                            </p>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                        </div>

                        <div className="space-y-2.5 font-mono text-xs">
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9FE] dark:bg-[#070A11] border border-[#E2E6F2] dark:border-[#1E2D4A] hover:border-[#6558E8]/40 dark:hover:border-[#06B6D4]/40 transition-colors">
                                <div>
                                    <span className="font-bold text-[#202442] dark:text-white">CSE-A (L2)</span>
                                    <p className="text-[10px] text-[#59627E] dark:text-slate-400">Design & Analysis of Algorithms</p>
                                </div>
                                <span className="text-[#6558E8] dark:text-[#22D3EE] font-bold text-xs bg-[#6558E8]/10 dark:bg-[#06B6D4]/10 px-2 py-1 rounded-lg border border-[#6558E8]/30 dark:border-[#06B6D4]/30">
                                    09:00 - 10:00
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9FE] dark:bg-[#070A11] border border-[#E2E6F2] dark:border-[#1E2D4A] hover:border-[#6558E8]/40 dark:hover:border-[#06B6D4]/40 transition-colors">
                                <div>
                                    <span className="font-bold text-[#202442] dark:text-white">CSE-B (L1)</span>
                                    <p className="text-[10px] text-[#59627E] dark:text-slate-400">Computer Organization</p>
                                </div>
                                <span className="text-[#6558E8] dark:text-[#22D3EE] font-bold text-xs bg-[#6558E8]/10 dark:bg-[#06B6D4]/10 px-2 py-1 rounded-lg border border-[#6558E8]/30 dark:border-[#06B6D4]/30">
                                    11:00 - 12:00
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9FE] dark:bg-[#070A11] border border-[#E2E6F2] dark:border-[#1E2D4A] hover:border-[#6558E8]/40 dark:hover:border-[#06B6D4]/40 transition-colors">
                                <div>
                                    <span className="font-bold text-[#202442] dark:text-white">Lab (DBMS)</span>
                                    <p className="text-[10px] text-[#59627E] dark:text-slate-400">Database Systems Practical</p>
                                </div>
                                <span className="text-[#6558E8] dark:text-[#22D3EE] font-bold text-xs bg-[#6558E8]/10 dark:bg-[#06B6D4]/10 px-2 py-1 rounded-lg border border-[#6558E8]/30 dark:border-[#06B6D4]/30">
                                    02:00 - 04:00
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <GlobalAnnouncementsBanner />

            {user?.status === 'pending' && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start sm:items-center gap-3.5 text-amber-900 dark:text-amber-200 shadow-sm animate-pulse">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-sm text-amber-800 dark:text-amber-200">
                            Staff Registration Pending HOD Approval
                        </p>
                        <p className="text-xs text-amber-700/90 dark:text-amber-300/80 mt-0.5">
                            Your faculty profile for the <strong className="underline">{user?.departmentId || 'CSE'}</strong> department is currently awaiting approval from your Head of Department. Class creation and subject assignments will unlock as soon as your HOD approves your account.
                        </p>
                    </div>
                </div>
            )}

            <Tabs tabs={tabs} defaultTab="overview">
                {(activeTab) => (
                    <div className="space-y-6 animate-scaleIn">
                        <Breadcrumbs items={getBreadcrumbs(activeTab)} />
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <AnalyticsDashboard />
                                
                                {/* Link to Subject Preferences */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="glass-card p-6 flex flex-col justify-between border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-900/10">
                                        <div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                                    <BookOpen className="h-6 w-6" />
                                                </div>
                                                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Subject Preferences</h3>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-medium">
                                                Submit and manage your teaching preferences for the upcoming semester.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate('/subject-preferences')}
                                            className="w-full py-2.5 px-4 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl font-semibold hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            View Form
                                        </button>
                                    </div>
                                </div>

                                <div className="glass-card p-6">
                                    <h2 className="text-section-title mb-4 flex items-center gap-2">
                                        <Bell className="w-5 h-5 text-indigo-500" />
                                        Join Requests
                                    </h2>

                                    {/* Search and Filter */}
                                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                        <SearchBar
                                            value={requestSearch}
                                            onChange={setRequestSearch}
                                            placeholder="Search by name or email..."
                                            className="flex-1"
                                        />
                                        <FilterDropdown
                                            value={requestFilter}
                                            onChange={setRequestFilter}
                                            label="Status"
                                            options={[
                                                { value: 'pending', label: 'Pending' },
                                                { value: 'approved', label: 'Approved' },
                                                { value: 'rejected', label: 'Rejected' }
                                            ]}
                                        />
                                    </div>

                                    {loading ? (
                                        <SkeletonLoader variant="list" count={3} />
                                    ) : myRequests.length === 0 ? (
                                        <EmptyState
                                            icon={UserPlus}
                                            title="No Pending Requests"
                                            description="When students request to join your classes, they will appear here."
                                            className="py-8"
                                        />
                                    ) : (
                                        <div className="space-y-3">
                                            {myRequests.map(req => {
                                                const targetClass = myClasses.find(c => c.id === req.classId);
                                                return (
                                                    <div key={req.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="font-semibold text-gray-800 dark:text-gray-100">{req.studentName || 'Unknown Student'}</p>
                                                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold">
                                                                    USN: {req.studentUsn || '1KS21CS001'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">wants to join {targetClass?.name || 'Unknown Class'}</p>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => respondToJoinRequest(req.id, 'approved')}
                                                                className="px-4 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition-colors"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => respondToJoinRequest(req.id, 'rejected')}
                                                                className="px-4 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <PostAnnouncement />
                            </div>
                        )}

                        {activeTab === 'classes' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="glass-card p-6">
                                    <h2 className="text-section-title mb-4">Class Management</h2>
                                <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Class to Manage</label>
                                        <div className="flex gap-2 items-center">
                                            <select
                                                className="input-field flex-1"
                                                onChange={(e) => {
                                                    setSelectedClassId(e.target.value);
                                                    setSelectedCourseId(null);
                                                }}
                                                value={selectedClassId || ''}
                                            >
                                                <option value="">-- Select a Class --</option>
                                                {myClasses.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            {selectedClassId && myClasses.find(c => c.id === selectedClassId)?.teacherId === user.id && (
                                                <button
                                                    onClick={() => {
                                                        const cls = myClasses.find(c => c.id === selectedClassId);
                                                        setDeleteModal({ isOpen: true, type: 'class', item: { id: selectedClassId, name: cls?.name } });
                                                    }}
                                                    className="p-2.5 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 transition-all"
                                                    title="Delete this class"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="border-t dark:border-gray-700 pt-4">
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Create New Class (Group)</h3>
                                        <form onSubmit={handleCreateClass} className="space-y-3">
                                            <input
                                                type="text"
                                                value={newClassName}
                                                onChange={(e) => setNewClassName(e.target.value)}
                                                className="input-field"
                                                placeholder="e.g., AI&DS 5th Sem"
                                            />
                                            <textarea
                                                value={newClassDesc}
                                                onChange={(e) => setNewClassDesc(e.target.value)}
                                                className="input-field"
                                                placeholder="Description..."
                                                rows="2"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full btn-primary"
                                            >
                                                Create Class
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                <div className="glass-card p-6">
                                    <h2 className="text-section-title mb-4">Course Management</h2>
                                    {!selectedClassId ? (
                                        <EmptyState
                                            icon={BookOpen}
                                            title="Select a Class"
                                            description="Choose a class from the left to manage its courses."
                                            className="py-12 border-none bg-transparent"
                                        />
                                    ) : (
                                        <CourseManager
                                            classId={selectedClassId}
                                            courses={courses.filter(c => c.classId === selectedClassId)}
                                            createCourse={createCourse}
                                            deleteCourse={deleteCourse}
                                            onSelectCourse={setSelectedCourseId}
                                            selectedCourseId={selectedCourseId}
                                            deleteModal={deleteModal}
                                            setDeleteModal={setDeleteModal}
                                            handleConfirmDelete={handleConfirmDelete}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div>
                                {!selectedCourseId ? (
                                    <EmptyState
                                        icon={BookOpen}
                                        title="No Course Selected"
                                        description="Please select a course in the 'Classes' tab to manage its content."
                                        className="py-12 border-dashed"
                                    />
                                ) : (
                                    <CourseContentEditor
                                        courseId={selectedCourseId}
                                        courseName={selectedCourse.name}
                                        resources={resources.filter(r => r.courseId === selectedCourseId)}
                                        addResource={addResource}
                                        uploadResourceToStorage={uploadResourceToStorage}
                                        downloadResource={downloadResource}
                                        deleteResource={deleteResource}
                                        addAnnouncement={addAnnouncement}
                                        user={user}
                                        deleteModal={deleteModal}
                                        setDeleteModal={setDeleteModal}
                                        handleConfirmDelete={handleConfirmDelete}
                                    />
                                )}
                            </div>
                        )}

                        {activeTab === 'students' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <StudentRoster />
                                </div>
                                <div>
                                    <PostAnnouncement />
                                </div>
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                            <div className="glass-card p-6">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Attendance Management</h2>
                                {myClasses.length === 0 ? (
                                    <EmptyState
                                        icon={Users}
                                        title="No Classes Found"
                                        description="Create a class to start taking attendance."
                                    />
                                ) : (
                                    <AttendanceManager classes={myClasses} />
                                )}
                            </div>
                        )}

                        {activeTab === 'grading' && (
                            <div>
                                {!selectedCourseId ? (
                                    <EmptyState
                                        icon={GraduationCap}
                                        title="No Course Selected"
                                        description="Please select a course in the 'Classes' tab to manage grading."
                                        className="py-12 border-dashed"
                                    />
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-xl shadow-sm border border-purple-100 dark:border-purple-800">
                                            <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                                                📊 Grading System - {courses.find(c => c.id === selectedCourseId)?.name}
                                            </h2>
                                            <p className="text-sm text-purple-700 dark:text-purple-300">
                                                Create assessments, enter grades, and view analytics for this course.
                                            </p>
                                        </div>

                                        <div className="mb-6">
                                            <BulkDataEntry
                                                courseId={selectedCourseId}
                                                courseName={courses.find(c => c.id === selectedCourseId)?.name}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <AssessmentManager
                                                courseId={selectedCourseId}
                                                courseName={courses.find(c => c.id === selectedCourseId)?.name}
                                            />
                                            <GradeEntry
                                                courseId={selectedCourseId}
                                                courseName={courses.find(c => c.id === selectedCourseId)?.name}
                                            />
                                        </div>


                                        <ErrorBoundaryWrapper errorTitle="Analytics Error" errorMessage="Unable to load grade analytics.">
                                            <GradeAnalytics
                                                courseId={selectedCourseId}
                                                courseName={courses.find(c => c.id === selectedCourseId)?.name}
                                            />
                                        </ErrorBoundaryWrapper>

                                        <ErrorBoundaryWrapper errorTitle="Statistics Error" errorMessage="Unable to load grade statistics.">
                                            <GradeStatistics
                                                courseId={selectedCourseId}
                                                grades={grades}
                                                assessments={assessments}
                                            />
                                        </ErrorBoundaryWrapper>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Tabs>

            {/* Confirm modal for class deletion (rendered at dashboard level) */}
            <ConfirmModal
                isOpen={deleteModal.isOpen && deleteModal.type === 'class'}
                onClose={() => setDeleteModal({ isOpen: false, type: null, item: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Class"
                message={`Are you sure you want to delete "${deleteModal.item?.name}"? This will also remove all students from the class. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}

function CourseManager({ classId, courses, createCourse, deleteCourse, onSelectCourse, selectedCourseId, deleteModal, setDeleteModal, handleConfirmDelete }) {
    const [newCourseName, setNewCourseName] = useState('');
    const [teacherEmail, setTeacherEmail] = useState('');
    const { user } = useAuth();
    const { findTeacherByEmail } = useData();

    const handleAddCourse = async (e) => {
        e.preventDefault();
        if (!newCourseName.trim()) return;

        let assignedTeacherId = user.id;
        let assignedTeacherName = user.name;

        if (teacherEmail.trim()) {
            const teacher = await findTeacherByEmail(teacherEmail);
            if (teacher) {
                assignedTeacherId = teacher.id;
                assignedTeacherName = teacher.name;
            } else {
                toast.error('Teacher not found with this email. Course will be assigned to you.');
            }
        }

        createCourse({
            classId,
            name: newCourseName,
            teacherId: assignedTeacherId,
            teacherName: assignedTeacherName
        });
        setNewCourseName('');
        setTeacherEmail('');
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {courses.map(course => (
                    <div
                        key={course.id}
                        onClick={() => onSelectCourse(course.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 flex justify-between items-center group ${selectedCourseId === course.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm'
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white/50 dark:bg-gray-700/50'
                            }`}
                    >
                        <div className="font-medium text-gray-800 dark:text-gray-100">{course.name}</div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setDeleteModal({ isOpen: true, type: 'course', item: { id: course.id, name: course.name } });
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete Course"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {courses.length === 0 && (
                    <EmptyState
                        icon={BookOpen}
                        title="No Courses Yet"
                        description="Add a course to get started."
                        className="py-6"
                    />
                )}
            </div>

            <form onSubmit={handleAddCourse} className='flex flex-col gap-3 mt-4'>
                <div className="flex gap-2">
                    <input
                        type='text'
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        className='input-field text-sm'
                        placeholder='New Course Name'
                    />
                    <input
                        type='email'
                        value={teacherEmail}
                        onChange={(e) => setTeacherEmail(e.target.value)}
                        className='input-field text-sm'
                        placeholder='Teacher Email (Opt)'
                    />
                </div>
                <button
                    type='submit'
                    className='w-full btn-primary text-sm py-2'
                >
                    Add Course
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Leave email blank to assign to yourself.</p>
            </form>

            {/* Confirmation Modal for course deletion */}
            <ConfirmModal
                isOpen={deleteModal?.isOpen && deleteModal?.type === 'course'}
                onClose={() => setDeleteModal({ isOpen: false, type: null, item: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Course"
                message={`Are you sure you want to delete "${deleteModal?.item?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}

import { storage } from '../config/firebase';
// import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Removed for Base64 fallback

function CourseContentEditor({ courseId, courseName, resources, addResource, uploadResourceToStorage, downloadResource, deleteResource, addAnnouncement, user, deleteModal, setDeleteModal, handleConfirmDelete }) {
    const [resTitle, setResTitle] = useState('');
    const [resType, setResType] = useState('pdf');
    const [resSource, setResSource] = useState('file'); // 'file' or 'link'
    const [resLink, setResLink] = useState('');
    const [announcementText, setAnnouncementText] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef(null);

    const handleSelectFile = (selectedFile) => {
        if (!selectedFile) return;
        setFile(selectedFile);
        if (!resTitle.trim()) {
            const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
            setResTitle(nameWithoutExt);
        }
        const ext = selectedFile.name.split('.').pop()?.toLowerCase();
        if (['pdf'].includes(ext)) setResType('pdf');
        else if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) setResType('document');
        else if (['ppt', 'pptx', 'key'].includes(ext)) setResType('presentation');
        else if (['xls', 'xlsx', 'csv'].includes(ext)) setResType('spreadsheet');
        else if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) setResType('image');
        else setResType('other');
    };

    const handleAddResource = async (e) => {
        e.preventDefault();

        if (resSource === 'file') {
            if (!file) {
                toast.error('Please select a file to upload');
                return;
            }
            if (!resTitle.trim()) {
                toast.error('Please provide a title for the resource');
                return;
            }

            setUploading(true);
            setUploadProgress(10);

            try {
                await uploadResourceToStorage(
                    {
                        courseId,
                        title: resTitle.trim(),
                        type: resType
                    },
                    file,
                    (progress) => setUploadProgress(progress)
                );

                setFile(null);
                setResTitle('');
                setUploadProgress(0);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } catch (err) {
                console.error("Error uploading resource file: ", err);
                toast.error(`Failed to upload resource: ${err.message}`);
            } finally {
                setUploading(false);
            }
        } else {
            // External link resource
            if (!resTitle.trim() || !resLink.trim()) {
                toast.error('Please provide both a title and a valid URL');
                return;
            }

            setUploading(true);

            try {
                await addResource({
                    courseId,
                    title: resTitle.trim(),
                    type: 'link',
                    url: resLink.trim()
                });

                setResTitle('');
                setResLink('');
            } catch (err) {
                console.error("Error saving resource link: ", err);
                toast.error(`Failed to save resource link: ${err.message}`);
            } finally {
                setUploading(false);
            }
        }
    };

    const handleDownloadResource = async (resource) => {
        // If it's an external link or has a direct URL, open it
        if (resource.type === 'link' || (resource.url && !resource.downloadURL)) {
            window.open(resource.url, '_blank');
            return;
        }

        // If it has a downloadURL from Storage or Base64, download it
        if (resource.downloadURL) {
            downloadResource(resource.downloadURL, resource.fileName || resource.title);
            return;
        }

        // Fallback error
        toast.error('Unable to download this resource');
    };

    const handlePostAnnouncement = (e) => {
        e.preventDefault();
        if (!announcementText.trim()) return;
        addAnnouncement({
            id: Date.now(),
            title: `Announcement: ${courseName}`,
            content: announcementText,
            date: new Date().toISOString().split('T')[0],
            author: user.name,
            courseId
        });
        setAnnouncementText('');
        toast.success('Announcement posted!');
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getTypeBadge = (type = 'other') => {
        const t = type.toLowerCase();
        if (t === 'pdf') return { label: 'PDF', bg: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800' };
        if (t === 'link') return { label: 'LINK', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
        if (t === 'document') return { label: 'DOC', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
        if (t === 'presentation') return { label: 'PPT', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
        if (t === 'spreadsheet') return { label: 'XLS', bg: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300 border-green-200 dark:border-green-800' };
        if (t === 'image') return { label: 'IMG', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
        return { label: 'FILE', bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700' };
    };

    return (
        <div className='glass-card p-6'>
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700/60">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Course Materials & Content</span>
                    <h2 className='text-lg font-bold text-gray-900 dark:text-gray-100'>Managing: {courseName}</h2>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    {resources.length} {resources.length === 1 ? 'Resource' : 'Resources'}
                </span>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Left Column: Resources List and Add Resource */}
                <div>
                    <h3 className='font-bold text-sm text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2'>
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        Resources
                    </h3>

                    {/* Resources List */}
                    <ul className='space-y-2.5 mb-5 max-h-[300px] overflow-y-auto pr-1'>
                        {resources.map(r => {
                            const badge = getTypeBadge(r.type);
                            return (
                                <li key={r.id} className='flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 p-3 bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/80 hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm transition-all group'>
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-wider ${badge.bg}`}>
                                            {badge.label}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <button
                                                onClick={() => handleDownloadResource(r)}
                                                className="text-xs font-bold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 text-left truncate block max-w-full transition-colors"
                                                title={r.title}
                                            >
                                                {r.title}
                                            </button>
                                            <p className="text-[10px] text-gray-400 truncate mt-0.5 flex items-center gap-1.5">
                                                {r.fileName && <span>{r.fileName}</span>}
                                                {r.size && <span>• {formatFileSize(r.size)}</span>}
                                                {r.date && <span>• {r.date}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleDownloadResource(r)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                                            title="Open / Download Resource"
                                        >
                                            {r.type === 'link' ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDeleteModal({ isOpen: true, type: 'resource', item: { id: r.id, title: r.title, storagePath: r.storagePath } });
                                            }}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete Resource"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                        {resources.length === 0 && (
                            <div className="text-center py-7 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-400 italic">No resources uploaded yet.</p>
                            </div>
                        )}
                    </ul>

                    {/* Add Resource Card */}
                    <div className="p-4 bg-gray-50/70 dark:bg-gray-800/50 rounded-2xl border border-gray-200/80 dark:border-gray-700">
                        {/* Tab Toggle: Upload File vs External Link */}
                        <div className="flex gap-1.5 p-1 bg-gray-200/80 dark:bg-gray-900 rounded-xl mb-3">
                            <button
                                type="button"
                                onClick={() => setResSource('file')}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                    resSource === 'file'
                                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                            >
                                <UploadCloud className="w-3.5 h-3.5" />
                                Upload File
                            </button>
                            <button
                                type="button"
                                onClick={() => setResSource('link')}
                                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                    resSource === 'link'
                                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                            >
                                <LinkIcon className="w-3.5 h-3.5" />
                                External Link / Drive
                            </button>
                        </div>

                        <form onSubmit={handleAddResource} className='space-y-3'>
                            {/* UPLOAD FILE OPTION */}
                            {resSource === 'file' && (
                                <>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) handleSelectFile(e.target.files[0]);
                                        }}
                                        className="hidden"
                                        id="course-resource-file-input"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png,.webp"
                                    />

                                    {!file ? (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setIsDragging(false);
                                                if (e.dataTransfer.files?.[0]) handleSelectFile(e.dataTransfer.files[0]);
                                            }}
                                            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                                                isDragging
                                                    ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40'
                                                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white/60 dark:bg-gray-800/40'
                                            }`}
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-1.5">
                                                <UploadCloud className="w-5 h-5" />
                                            </div>
                                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                                Click to upload file <span className="text-gray-400 font-normal">or drag & drop</span>
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                PDF, DOCX, PPTX, XLS, Images, Zip (up to 50MB)
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between gap-3 shadow-sm">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                                    <File className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                                                    <p className="text-[10px] text-gray-400">
                                                        {formatFileSize(file.size)} • {file.type || 'Document'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFile(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                                className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                                title="Remove file"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Resource Title Input */}
                                    <input
                                        type='text'
                                        value={resTitle}
                                        onChange={(e) => setResTitle(e.target.value)}
                                        className='input-field text-xs'
                                        placeholder='Resource Title (e.g., Lecture Notes - Unit 1)'
                                        required
                                    />

                                    {/* Category Pills */}
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-0.5">Type:</span>
                                        {['pdf', 'document', 'presentation', 'spreadsheet', 'image', 'other'].map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setResType(t)}
                                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                                    resType === t
                                                        ? 'bg-indigo-600 text-white shadow-sm'
                                                        : 'bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700'
                                                }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Progress Bar */}
                                    {uploading && (
                                        <div className="space-y-1 pt-1">
                                            <div className="flex justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                                <span>Uploading file...</span>
                                                <span>{uploadProgress}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-200"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type='submit'
                                        disabled={uploading || !file || !resTitle.trim()}
                                        className='w-full btn-primary text-xs font-bold py-2.5 flex items-center justify-center gap-2 disabled:opacity-50'
                                    >
                                        <UploadCloud className="w-4 h-4" />
                                        {uploading ? `Uploading... (${uploadProgress}%)` : 'Upload Resource File'}
                                    </button>
                                </>
                            )}

                            {/* EXTERNAL LINK OPTION */}
                            {resSource === 'link' && (
                                <>
                                    <input
                                        type='text'
                                        value={resTitle}
                                        onChange={(e) => setResTitle(e.target.value)}
                                        className='input-field text-xs'
                                        placeholder='Resource Title (e.g., Lecture Notes)'
                                        required
                                    />

                                    <input
                                        type='url'
                                        value={resLink}
                                        onChange={(e) => setResLink(e.target.value)}
                                        className='input-field text-xs'
                                        placeholder='Google Drive Link (https://drive.google.com/...)'
                                        required
                                    />

                                    <button
                                        type='submit'
                                        disabled={uploading || !resTitle.trim() || !resLink.trim()}
                                        className='w-full btn-secondary text-xs font-bold py-2.5 flex items-center justify-center gap-2 disabled:opacity-50'
                                    >
                                        <LinkIcon className="w-3.5 h-3.5" />
                                        {uploading ? 'Adding...' : 'Add Resource Link'}
                                    </button>

                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center">
                                        💡 Paste a link from Google Drive, YouTube, or any external resource
                                    </p>
                                </>
                            )}
                        </form>
                    </div>
                </div>

                <div>
                    <h3 className='font-medium text-gray-700 dark:text-gray-300 mb-3'>Post Course Announcement</h3>
                    <form onSubmit={handlePostAnnouncement} className='space-y-3'>
                        <textarea
                            value={announcementText}
                            onChange={(e) => setAnnouncementText(e.target.value)}
                            className='input-field text-sm'
                            placeholder={`Message for ${courseName} students...`}
                            rows='4'
                        />
                        <button type='submit' className='w-full btn-primary text-sm'>
                            Post Announcement
                        </button>
                    </form>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, type: null, item: null })}
                onConfirm={handleConfirmDelete}
                title={deleteModal.type === 'course' ? 'Delete Course' : 'Delete Resource'}
                message={
                    deleteModal.type === 'course'
                        ? `Are you sure you want to delete "${deleteModal.item?.name}"? This action cannot be undone.`
                        : `Are you sure you want to delete "${deleteModal.item?.title}"? This action cannot be undone.`
                }
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}


function AttendanceManager({ classes }) {
    const { user } = useAuth();
    const { joinRequests, attendance, markAttendance, courses } = useData();
    const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState({});
    const [statusMessage, setStatusMessage] = useState('');

    // Filter courses: Show all if class owner, otherwise only assigned courses
    const classCourses = courses.filter(c => {
        if (c.classId !== selectedClassId) return false;
        const isClassOwner = classes.find(cls => cls.id === selectedClassId)?.teacherId === user.id;
        return isClassOwner || c.teacherId === user.id;
    });


    const classStudents = React.useMemo(() => joinRequests
        .filter(req => req.classId === selectedClassId && req.status === 'approved')
        .map(req => ({ id: req.studentId, name: req.studentName, usn: req.studentUsn || '1KS21CS001' })), [joinRequests, selectedClassId]);

    React.useEffect(() => {
        if (classCourses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(classCourses[0].id);
        }
    }, [selectedClassId, classCourses, selectedCourseId]);

    React.useEffect(() => {
        if (!selectedCourseId) return;

        const existingRecord = attendance.find(r =>
            r.classId === selectedClassId &&
            r.courseId === selectedCourseId &&
            r.date === selectedDate
        );

        if (existingRecord) {
            setRecords(existingRecord.records);
        } else {
            const initialRecords = {};
            classStudents.forEach(s => initialRecords[s.id] = 'present');
            setRecords(initialRecords);
        }
        setStatusMessage('');
    }, [selectedClassId, selectedCourseId, selectedDate, attendance, classStudents]);

    const handleStatusChange = (studentId, status) => {
        setRecords(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSave = async () => {
        if (!selectedCourseId) {
            setStatusMessage('Please select a course');
            return;
        }

        await markAttendance(selectedClassId, selectedCourseId, selectedDate, records);
        setStatusMessage('Attendance saved successfully!');
        setTimeout(() => setStatusMessage(''), 3000);
    };

    if (classCourses.length === 0) {
        return (
            <EmptyState
                icon={BookOpen}
                title="No Courses Available"
                description="Please add courses to this class first to take attendance."
            />
        );
    }

    return (
        <div className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Select Class</label>
                    <select
                        value={selectedClassId}
                        onChange={(e) => {
                            setSelectedClassId(e.target.value);
                            setSelectedCourseId('');
                        }}
                        className='input-field'
                    >
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Select Course</label>
                    <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className='input-field'
                    >
                        <option value=''>-- Select Course --</option>
                        {classCourses.map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Date</label>
                    <input
                        type='date'
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className='input-field'
                    />
                </div>
            </div>

            {!selectedCourseId ? (
                <EmptyState
                    icon={BookOpen}
                    title="Select a Course"
                    description="Please select a course to take attendance."
                    className="py-8 border-none bg-transparent"
                />
            ) : classStudents.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No Students"
                    description="No students have joined this class yet."
                    className="py-8"
                />
            ) : (
                <div className='border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden'>
                    <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                        <thead className='bg-gray-50 dark:bg-gray-800'>
                            <tr>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>Student</th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>Status</th>
                            </tr>
                        </thead>
                        <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                            {classStudents.map(student => (
                                <tr key={student.id}>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>
                                        <div className="flex items-center gap-2">
                                            <span>{student.name}</span>
                                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                                                {student.usn}
                                            </span>
                                        </div>
                                    </td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                                        <div className='flex space-x-2'>
                                            {['present', 'absent', 'late'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleStatusChange(student.id, status)}
                                                    className={`px - 3 py - 1 rounded - full text - xs font - medium capitalize transition - all duration - 200 transform hover: scale - 105 ${records[student.id] === status
                                                        ? status === 'present' ? 'bg-green-100 text-green-800 ring-2 ring-green-500 shadow-sm'
                                                            : status === 'absent' ? 'bg-red-100 text-red-800 ring-2 ring-red-500 shadow-sm'
                                                                : 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-500 shadow-sm'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                        } `}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className='flex items-center justify-between pt-2'>
                <button
                    onClick={handleSave}
                    disabled={!selectedCourseId}
                    className='btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    Save Attendance
                </button>
                {statusMessage && <span className={`text-sm font-medium animate-fadeIn ${statusMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{statusMessage}</span>}
            </div>
        </div>
    );
}
