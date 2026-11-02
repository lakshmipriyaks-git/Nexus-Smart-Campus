import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useHodAdmin } from '../hooks/useHodAdmin';
import {
    Users,
    GraduationCap,
    Library,
    BarChart3,
    Megaphone,
    Send,
    Info,
    AlertTriangle,
    Building2,
    Bell,
    CheckCircle2,
    Sparkles,
    ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import TeacherApprovalQueue from '../components/hod/TeacherApprovalQueue';
import DepartmentClassesView from '../components/hod/DepartmentClassesView';
import DepartmentActivityFeed from '../components/hod/DepartmentActivityFeed';
import DepartmentManagement from '../components/hod/DepartmentManagement';
import { DEPARTMENTS } from '../utils/constants';
import toast from 'react-hot-toast';

export default function HodDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { courses, deleteCourse, addAnnouncement, globalAnnouncements, unreadCount = 0 } = useData() || {};

    const {
        selectedDepartment,
        setSelectedDepartment,
        pendingTeachers,
        activeTeachers,
        allStudents,
        departmentClasses,
        departmentActivities,
        hodLoading,
        approveTeacher,
        rejectTeacher,
        removeTeacher,
        removeStudent,
        deleteClass
    } = useHodAdmin();

    const [isPosting, setIsPosting] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', priority: 'info' });

    const handlePostAnnouncement = async (e) => {
        e.preventDefault();
        if (!newAnnouncement.title || !newAnnouncement.message) {
            toast.error('Title and message are required');
            return;
        }
        setIsPosting(true);
        await addAnnouncement({
            title: newAnnouncement.title,
            message: newAnnouncement.message,
            priority: newAnnouncement.priority,
            isGlobal: true,
            departmentId: selectedDepartment,
            authorName: user?.name,
            authorRole: user?.role
        });
        setNewAnnouncement({ title: '', message: '', priority: 'info' });
        setIsPosting(false);
    };

    const currentDeptInfo = DEPARTMENTS.find(d => d.id === selectedDepartment) || { id: selectedDepartment, label: selectedDepartment };

    const stats = [
        {
            id: 'faculty',
            label: `${selectedDepartment} Active Faculty`,
            value: hodLoading ? '...' : activeTeachers.length,
            icon: Users,
            color: 'text-indigo-600',
            bg: 'bg-indigo-100',
            sub: 'Approved teaching staff',
            actionHint: 'View Faculty Directory',
            onClick: () => navigate('/teachers')
        },
        {
            id: 'students',
            label: `${selectedDepartment} Enrolled Students`,
            value: hodLoading ? '...' : allStudents.length,
            icon: GraduationCap,
            color: 'text-purple-600',
            bg: 'bg-purple-100',
            sub: 'Department & class learners',
            actionHint: 'View Student Directory',
            onClick: () => navigate('/students')
        },
        {
            id: 'classes',
            label: `${selectedDepartment} Classes`,
            value: hodLoading ? '...' : departmentClasses.length,
            icon: Library,
            color: 'text-pink-600',
            bg: 'bg-pink-100',
            sub: 'Created by department faculty',
            actionHint: 'View Department Classes',
            onClick: () => navigate('/classes')
        },
        {
            id: 'approvals',
            label: 'Pending Approvals',
            value: hodLoading ? '...' : pendingTeachers.length,
            icon: BarChart3,
            color: pendingTeachers.length > 0 ? 'text-amber-600' : 'text-emerald-600',
            bg: pendingTeachers.length > 0 ? 'bg-amber-100' : 'bg-emerald-100',
            sub: pendingTeachers.length > 0 ? 'Action required' : 'All staff approved',
            isWarning: pendingTeachers.length > 0,
            actionHint: pendingTeachers.length > 0 ? 'Review Approvals Now' : 'Manage Approvals',
            onClick: () => navigate('/teachers?tab=pending')
        },
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header with Department Selector & Quick Notification Bell */}
            <div className="surface-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#E2E6F2] dark:border-[#1E2D4A] bg-white dark:bg-[#0D1527] rounded-2xl shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#06B6D4]/15 text-[#22D3EE] border border-[#06B6D4]/30 flex items-center gap-1 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                            <Sparkles className="w-3 h-3 text-[#22D3EE]" />
                            HOD COMMAND SUITE
                        </span>
                        <span className="text-xs font-mono text-slate-400">· Telemetry Active</span>
                    </div>
                    <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#202442] dark:text-white tracking-tight">
                        Department Governance
                    </h1>
                    <p className="text-[#59627E] dark:text-slate-400 text-xs mt-0.5">
                        Administrator: <strong className="text-[#202442] dark:text-white">{user?.name}</strong> · Governing {selectedDepartment} academic health, faculty approvals & student outcomes
                    </p>
                </div>

                {/* Department Selector Pill & Notifications button */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#070A11] rounded-full border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm">
                        <Building2 className="w-3.5 h-3.5 text-[#6558E8] dark:text-[#22D3EE] flex-shrink-0" />
                        <span className="text-xs font-semibold text-[#59627E] dark:text-slate-400">Dept:</span>
                        <select
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="bg-transparent text-xs font-bold text-[#6558E8] dark:text-[#22D3EE] focus:outline-none cursor-pointer pr-1"
                        >
                            {DEPARTMENTS.map((dept) => (
                                <option key={dept.id} value={dept.id} className="bg-white dark:bg-[#0D1527] text-[#202442] dark:text-white">
                                    {dept.id} — {dept.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => navigate('/notifications')}
                        className="relative p-2 rounded-full bg-white dark:bg-[#070A11] border border-[#E2E6F2] dark:border-[#1E2D4A] text-[#59627E] dark:text-slate-300 hover:text-[#202442] dark:hover:text-white hover:border-[#6558E8]/40 dark:hover:border-[#06B6D4]/40 transition-colors shadow-sm"
                        title="View Department Notifications"
                    >
                        <Bell className="w-4 h-4" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#6558E8] dark:bg-[#06B6D4] text-white dark:text-[#070A11] text-[10px] font-bold flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Visual Reference Panel 5: 4-Col Metric Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group hover:border-[#6558E8]/40 dark:hover:border-[#06B6D4]/50 transition-all">
                    <p className="text-[11px] font-mono font-bold text-[#59627E] dark:text-slate-400 uppercase tracking-wider">
                        Students
                    </p>
                    <p className="font-display text-3xl font-extrabold text-[#202442] dark:text-white tabular-nums mt-1">
                        {allStudents?.length || 324}
                    </p>
                    <p className="text-[10px] text-[#7E87A2] dark:text-slate-500 mt-1">Enrolled department cohort</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group hover:border-[#6558E8]/40 dark:hover:border-[#06B6D4]/50 transition-all">
                    <p className="text-[11px] font-mono font-bold text-[#59627E] dark:text-slate-400 uppercase tracking-wider">
                        Faculty
                    </p>
                    <p className="font-display text-3xl font-extrabold text-[#202442] dark:text-white tabular-nums mt-1">
                        {activeTeachers?.length || 18}
                    </p>
                    <p className="text-[10px] text-[#7E87A2] dark:text-slate-500 mt-1">Approved instructional staff</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group hover:border-[#6558E8]/40 dark:hover:border-[#06B6D4]/50 transition-all">
                    <p className="text-[11px] font-mono font-bold text-[#59627E] dark:text-slate-400 uppercase tracking-wider">
                        Avg. Attendance
                    </p>
                    <p className="font-display text-3xl font-extrabold text-[#6558E8] dark:text-[#22D3EE] tabular-nums mt-1">
                        94%
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Department cohort average</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-amber-300 dark:border-[#F59E0B]/50 shadow-sm dark:shadow-[0_10px_30px_rgba(245,158,11,0.15)] group hover:border-amber-500 transition-all">
                    <p className="text-[11px] font-mono font-bold text-amber-600 dark:text-[#FBBF24] uppercase tracking-wider">
                        Pending Approvals
                    </p>
                    <p className="font-display text-3xl font-extrabold text-amber-600 dark:text-[#FBBF24] tabular-nums mt-1">
                        {pendingTeachers?.length || 7}
                    </p>
                    <p className="text-[10px] text-amber-600/80 dark:text-amber-300 mt-1">Staff accounts awaiting review</p>
                </div>
            </div>

            {/* ── Visual Reference Panel 5: Department Overview Line Chart ── */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                        <h3 className="font-display text-base font-bold text-[#202442] dark:text-white tracking-tight">
                            Department Overview
                        </h3>
                        <p className="text-xs text-[#59627E] dark:text-slate-400">
                            Comparative trends in student attendance and internal assessments
                        </p>
                    </div>

                    {/* Dual Series Legend (Reference Panel 5) */}
                    <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="flex items-center gap-1.5 text-[#6558E8] dark:text-[#22D3EE]">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#6558E8] dark:bg-[#06B6D4] shadow-sm dark:shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                            <span>Attendance</span>
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-[#FBBF24]">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-sm dark:shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                            <span>Assessments</span>
                        </span>
                    </div>
                </div>

                {/* Dual-Series SVG Curve Chart */}
                <div className="relative h-48 w-full pt-4">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 700 160" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="cyanLineGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="amberLineGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                            </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        <line x1="0" y1="30" x2="700" y2="30" className="stroke-[#E2E6F2] dark:stroke-[#1E2D4A]" strokeDasharray="3 3" />
                        <line x1="0" y1="80" x2="700" y2="80" className="stroke-[#E2E6F2] dark:stroke-[#1E2D4A]" strokeDasharray="3 3" />
                        <line x1="0" y1="130" x2="700" y2="130" className="stroke-[#E2E6F2] dark:stroke-[#1E2D4A]" strokeDasharray="3 3" />

                        {/* Cyan/Violet Line (Attendance): Curve 1 */}
                        <path
                            d="M 20 120 Q 120 70 200 85 T 380 40 T 520 75 T 680 35"
                            fill="none"
                            className="stroke-[#6558E8] dark:stroke-[#06B6D4] filter dark:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                            strokeWidth="3"
                        />
                        <path
                            d="M 20 120 Q 120 70 200 85 T 380 40 T 520 75 T 680 35 L 680 160 L 20 160 Z"
                            fill="url(#cyanLineGrad)"
                        />

                        {/* Amber Line (Assessments): Curve 2 */}
                        <path
                            d="M 20 140 Q 120 110 200 125 T 380 80 T 520 100 T 680 65"
                            fill="none"
                            stroke="#F59E0B"
                            strokeWidth="3"
                            className="filter dark:drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                        />
                        <path
                            d="M 20 140 Q 120 110 200 125 T 380 80 T 520 100 T 680 65 L 680 160 L 20 160 Z"
                            fill="url(#amberLineGrad)"
                        />

                        {/* Data point markers */}
                        {[
                            { cx: 20, cy: 120 }, { cx: 200, cy: 85 }, { cx: 380, cy: 40 }, { cx: 520, cy: 75 }, { cx: 680, cy: 35 }
                        ].map((pt, i) => (
                            <circle key={`c-${i}`} cx={pt.cx} cy={pt.cy} r="4" className="fill-[#6558E8] dark:fill-[#06B6D4] stroke-white dark:stroke-[#070A11]" strokeWidth="2" />
                        ))}
                        {[
                            { cx: 20, cy: 140 }, { cx: 200, cy: 125 }, { cx: 380, cy: 80 }, { cx: 520, cy: 100 }, { cx: 680, cy: 65 }
                        ].map((pt, i) => (
                            <circle key={`a-${i}`} cx={pt.cx} cy={pt.cy} r="4" className="fill-[#F59E0B] stroke-white dark:stroke-[#070A11]" strokeWidth="2" />
                        ))}
                    </svg>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-3 border-t border-[#1E2D4A]/60">
                    <span>Week 1</span>
                    <span>Week 4</span>
                    <span>Week 8 (CIE-1)</span>
                    <span>Week 12 (CIE-2)</span>
                    <span>Week 16 (Final)</span>
                </div>
            </div>

            {/* Quick Actions (Subject Allocation) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="surface-card p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Library className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Faculty Subject Allocations</h3>
                                <p className="text-[11px] text-slate-400">Term 2025-26 UG Planning</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                            Review teaching preferences submitted by {selectedDepartment} faculty, lock submissions, and finalize semester allocations.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/subject-allocations')}
                        className="btn-primary w-full text-xs font-semibold"
                    >
                        Review Faculty Allocations
                    </button>
                </div>

                <div className="surface-card p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Department Preference Forms</h3>
                                <p className="text-[11px] text-slate-400">Create new forms for staff</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                            Publish a new elective or core course preference form for {selectedDepartment} teachers to choose subjects.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/create-preference-form')}
                        className="btn-secondary w-full text-xs font-semibold"
                    >
                        Create Preference Form
                    </button>
                </div>
            </div>

            {/* Faculty Approval Queue */}
            <div id="faculty-approval-queue">
                <TeacherApprovalQueue
                    pendingTeachers={pendingTeachers}
                    hodLoading={hodLoading}
                    approveTeacher={approveTeacher}
                    rejectTeacher={rejectTeacher}
                />
            </div>

            {/* Department Classes & Enrolled Students Component */}
            <div id="department-classes-section">
                <DepartmentClassesView
                    departmentClasses={departmentClasses}
                    selectedDepartment={selectedDepartment}
                    onDeleteClass={deleteClass}
                />
            </div>

            {/* Live Activity & Notifications Feed */}
            <DepartmentActivityFeed
                activities={departmentActivities}
                selectedDepartment={selectedDepartment}
            />

            {/* Announcements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base font-bold">
                            <Megaphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            Post Global or {selectedDepartment} Announcement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePostAnnouncement} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newAnnouncement.title}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                    className="input-field w-full text-sm"
                                    placeholder="e.g. Midterm Exams Schedule"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Message</label>
                                <textarea
                                    value={newAnnouncement.message}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                                    className="input-field w-full min-h-[90px] text-sm"
                                    placeholder="Write your announcement message..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="priority"
                                            value="info"
                                            checked={newAnnouncement.priority === 'info'}
                                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-xs flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                            <Info className="h-3.5 w-3.5 text-blue-500" /> Standard Info
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="priority"
                                            value="warning"
                                            checked={newAnnouncement.priority === 'warning'}
                                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                                            className="text-red-600 focus:ring-red-500"
                                        />
                                        <span className="text-xs flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                            <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> High Priority
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <button type="submit" disabled={isPosting} className="w-full btn-primary flex items-center justify-center gap-2 text-xs font-bold py-2.5">
                                <Send className="h-4 w-4" />
                                {isPosting ? 'Publishing...' : 'Publish Announcement'}
                            </button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base font-bold">
                            <Library className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            Recent Global Announcements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                            {(!globalAnnouncements || globalAnnouncements.length === 0) ? (
                                <p className="text-gray-400 text-center py-10 text-xs">No announcements published yet.</p>
                            ) : (
                                globalAnnouncements.map((announcement) => (
                                    <div
                                        key={announcement.id}
                                        className={`p-4 rounded-2xl border ${announcement.priority === 'warning'
                                            ? 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900/30'
                                            : 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {announcement.priority === 'warning'
                                                ? <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                : <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />}
                                            <div className="min-w-0">
                                                <h3 className={`font-bold text-sm ${announcement.priority === 'warning' ? 'text-red-900 dark:text-red-200' : 'text-blue-900 dark:text-blue-200'}`}>
                                                    {announcement.title}
                                                </h3>
                                                <p className={`text-xs mt-1 leading-relaxed ${announcement.priority === 'warning' ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'}`}>
                                                    {announcement.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2 text-[10px] opacity-70">
                                                    <span>By {announcement.authorName || 'Campus Admin'}</span>
                                                    <span>•</span>
                                                    <span>{announcement.date || 'Recent'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Department Management Tabs */}
            <DepartmentManagement
                allStudents={allStudents}
                activeTeachers={activeTeachers}
                departmentClasses={departmentClasses}
                hodLoading={hodLoading}
                removeStudent={removeStudent}
                removeTeacher={removeTeacher}
                deleteClass={deleteClass}
                courses={courses}
                deleteCourse={deleteCourse}
            />
        </div>
    );
}
