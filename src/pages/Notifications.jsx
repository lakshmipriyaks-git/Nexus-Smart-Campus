import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
    Bell,
    Calendar,
    FileText,
    School,
    Users,
    UserCheck,
    CheckCircle2,
    CheckCheck,
    Clock,
    Sparkles,
    Megaphone,
    AlertCircle
} from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

export default function Notifications() {
    const {
        notifications = [],
        unreadCount = 0,
        markAsRead,
        markAllAsRead,
        isRead,
        announcements = [],
        interventions = []
    } = useData() || {};
    const { user } = useAuth();
    const [filter, setFilter] = useState('all'); // 'all', 'unread'

    // Combine system notifications + announcements + interventions
    const allNotifications = [
        ...notifications.map(n => ({
            id: n.id,
            type: n.type || 'general',
            title: n.title,
            content: n.message,
            date: n.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent',
            rawDate: n.createdAt?.toDate?.() || new Date(0),
            author: n.author || 'Institutional System',
            departmentId: n.departmentId || null,
            data: n
        })),
        ...announcements.map(a => ({
            id: a.id,
            type: 'announcement',
            title: a.title,
            content: a.content,
            date: a.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent',
            rawDate: a.createdAt?.toDate?.() || a.date,
            author: a.authorName || 'Campus Administration',
            departmentId: a.departmentId,
            data: a
        })),
        ...interventions.map(i => ({
            id: i.id,
            type: i.type, // 'meeting' or 'action_plan'
            title: i.type === 'meeting'
                ? `Meeting Scheduled with ${user?.role === 'student' ? i.teacherName : i.studentName}`
                : `Action Plan Created for ${user?.role === 'student' ? 'You' : i.studentName}`,
            content: i.type === 'meeting'
                ? `Scheduled for ${i.date} at ${i.time}. ${i.notes ? 'Notes: ' + i.notes : ''}`
                : `Goals: ${i.goals}. Timeline: ${i.timeline}`,
            date: i.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent',
            rawDate: i.createdAt?.toDate?.() || i.date,
            author: user?.role === 'student' ? i.teacherName : 'You',
            departmentId: i.departmentId,
            data: i
        }))
    ].sort((a, b) => {
        const timeA = new Date(a.rawDate || 0).getTime();
        const timeB = new Date(b.rawDate || 0).getTime();
        return timeB - timeA;
    });

    const filteredNotifications = allNotifications.filter(n => {
        if (filter === 'unread') {
            return !isRead?.(n.id);
        }
        return true;
    });

    const getNotificationColor = (type) => {
        switch (type) {
            case 'class_created':
            case 'student_joined':
                return {
                    iconBg: 'bg-[#06B6D4]/15 text-[#22D3EE] border border-[#06B6D4]/30',
                    badge: 'bg-[#06B6D4]/15 text-[#22D3EE] border border-[#06B6D4]/30'
                };
            case 'staff_registered':
            case 'staff_approved':
                return {
                    iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
                    badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                };
            case 'meeting':
            case 'action_plan':
                return {
                    iconBg: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30',
                    badge: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                };
            default: // announcement or general
                return {
                    iconBg: 'bg-[#06B6D4]/15 text-[#22D3EE] border border-[#06B6D4]/30',
                    badge: 'bg-[#06B6D4]/15 text-[#22D3EE] border border-[#06B6D4]/30'
                };
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'class_created':
                return School;
            case 'student_joined':
                return Users;
            case 'staff_registered':
                return Clock;
            case 'staff_approved':
                return UserCheck;
            case 'meeting':
                return Calendar;
            case 'action_plan':
                return FileText;
            case 'announcement':
                return Megaphone;
            default:
                return Bell;
        }
    };

    const formatBadgeLabel = (type) => {
        switch (type) {
            case 'class_created': return 'Class Created';
            case 'student_joined': return 'Student Enrolled';
            case 'staff_registered': return 'Staff Approval Required';
            case 'staff_approved': return 'Staff Approved';
            case 'meeting': return 'Academic Meeting';
            case 'action_plan': return 'Student Action Plan';
            case 'announcement': return 'Campus Bulletin';
            default: return 'Notification';
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn text-slate-100 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#0D1527] p-6 rounded-2xl shadow-sm dark:shadow-xl border border-[#E2E6F2] dark:border-[#1E2D4A]">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#202442] dark:text-white flex items-center gap-3 tracking-tight font-display">
                        <Bell className="w-7 h-7 text-[#6558E8] dark:text-[#06B6D4]" />
                        <span>Campus Notifications</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-[#59627E] dark:text-slate-400 mt-1">
                        Real-time alerts for department classes, staff approvals, and academic schedule updates.
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Mark All Read Button */}
                    {allNotifications.some(n => !isRead?.(n.id)) && (
                        <button
                            onClick={markAllAsRead}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#EEF1FC] hover:bg-[#E2E6F2] dark:bg-[#0A0F1D] dark:hover:bg-[#1E2D4A] border border-[#E2E6F2] dark:border-[#1E2D4A] text-[#202442] dark:text-slate-200 transition-colors shadow-sm"
                        >
                            <CheckCheck className="w-3.5 h-3.5 text-[#6558E8] dark:text-[#06B6D4]" />
                            <span>Mark all read</span>
                        </button>
                    )}

                    {/* Filter Tabs */}
                    <div className="flex bg-[#EEF1FC] dark:bg-[#0A0F1D] p-1 rounded-xl border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'all'
                                ? 'bg-[#6558E8] text-white shadow-sm dark:bg-[#06B6D4] dark:text-[#070A11] dark:shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                : 'text-[#59627E] dark:text-slate-400 hover:text-[#202442] dark:hover:text-white'
                                }`}
                        >
                            All ({allNotifications.length})
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'unread'
                                ? 'bg-[#6558E8] text-white shadow-sm dark:bg-[#06B6D4] dark:text-[#070A11] dark:shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                : 'text-[#59627E] dark:text-slate-400 hover:text-[#202442] dark:hover:text-white'
                                }`}
                        >
                            Unread ({allNotifications.filter(n => !isRead?.(n.id)).length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                    <EmptyState
                        icon={Bell}
                        title="No Notifications"
                        description={filter === 'unread' ? "You have no unread notifications." : "You're all caught up with campus activities!"}
                        className="py-16"
                    />
                ) : (
                    filteredNotifications.map((notification) => {
                        const colors = getNotificationColor(notification.type);
                        const Icon = getNotificationIcon(notification.type);
                        const read = isRead?.(notification.id);

                        return (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-5 rounded-2xl border transition-all duration-200 shadow-sm ${read
                                    ? 'bg-white dark:bg-[#0D1527] border-[#E2E6F2] dark:border-[#1E2D4A] opacity-85'
                                    : 'bg-white dark:bg-[#0D1527] border-[#E2E6F2] dark:border-[#1E2D4A] border-l-4 border-l-[#6558E8] dark:border-l-[#06B6D4] shadow-sm'
                                    }`}
                            >
                                <div className="flex gap-4 items-start">
                                    {/* Icon */}
                                    <div className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${
                                        !read ? colors.iconBg : 'bg-[#EEF1FC] dark:bg-[#0A0F1D] border border-[#E2E6F2] dark:border-[#1E2D4A] text-[#7E87A2] dark:text-slate-400'
                                    }`}>
                                        <Icon className="h-5 w-5" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                                            <div className="flex items-center gap-2">
                                                {!read && (
                                                    <span className="w-2 h-2 rounded-full bg-[#6558E8] dark:bg-[#06B6D4] shadow-[0_0_8px_rgba(101,88,232,0.8)] dark:shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
                                                )}
                                                <h3 className="font-bold text-base text-[#202442] dark:text-white">
                                                    {notification.title}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {notification.departmentId && (
                                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#6558E8]/10 text-[#6558E8] dark:bg-[#06B6D4]/15 border border-[#6558E8]/30 dark:border-[#06B6D4]/30 dark:text-[#22D3EE] uppercase tracking-wider">
                                                        {notification.departmentId}
                                                    </span>
                                                )}
                                                <span className="text-xs text-[#59627E] dark:text-slate-400 whitespace-nowrap font-mono">
                                                    {notification.date}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-xs sm:text-sm mb-3.5 leading-relaxed text-[#59627E] dark:text-slate-300">
                                            {notification.content}
                                        </p>

                                        {/* Footer tags & Actions */}
                                        <div className="flex items-center justify-between pt-2 border-t border-[#E2E6F2] dark:border-[#1E2D4A] text-xs">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium px-2.5 py-1 bg-[#EEF1FC] dark:bg-[#0A0F1D] border border-[#E2E6F2] dark:border-[#1E2D4A] text-[#59627E] dark:text-slate-300 rounded-lg text-[11px]">
                                                    By {notification.author}
                                                </span>
                                                <span className={`font-semibold px-2.5 py-1 rounded-lg text-[11px] ${colors.badge}`}>
                                                    {formatBadgeLabel(notification.type)}
                                                </span>
                                            </div>

                                            {!read && (
                                                <button
                                                    onClick={() => markAsRead?.(notification.id)}
                                                    className="inline-flex items-center gap-1.5 font-bold text-xs text-[#6558E8] dark:text-[#06B6D4] hover:text-[#5244d4] dark:hover:text-[#22D3EE] transition-colors cursor-pointer"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>Mark as read</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
