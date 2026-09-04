import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Bell, Calendar, FileText } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function Notifications() {
    const { announcements, interventions } = useData();
    const { user } = useAuth();
    const [filter, setFilter] = useState('all'); // 'all', 'unread' (mock)

    // Mock read/unread state for demo
    const [readIds, setReadIds] = useState(new Set());

    const handleMarkRead = (id) => {
        const newReadIds = new Set(readIds);
        newReadIds.add(id);
        setReadIds(newReadIds);
    };

    // Combine announcements and interventions into a unified notification list
    const allNotifications = [
        ...announcements.map(a => ({
            id: a.id,
            type: 'announcement',
            title: a.title,
            content: a.content,
            date: a.date,
            author: a.author,
            data: a
        })),
        ...interventions.map(i => ({
            id: i.id,
            type: i.type, // 'meeting' or 'action_plan'
            title: i.type === 'meeting'
                ? `Meeting Scheduled with ${user.role === 'student' ? i.teacherName : i.studentName}`
                : `Action Plan Created for ${user.role === 'student' ? 'You' : i.studentName}`,
            content: i.type === 'meeting'
                ? `Scheduled for ${i.date} at ${i.time}. ${i.notes ? 'Notes: ' + i.notes : ''}`
                : `Goals: ${i.goals}. Timeline: ${i.timeline}`,
            date: i.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent',
            author: user.role === 'student' ? i.teacherName : 'You',
            data: i
        }))
    ].sort((a, b) => {
        // Sort by date if available, otherwise put recent items first
        const dateA = a.data.createdAt?.toDate?.() || new Date();
        const dateB = b.data.createdAt?.toDate?.() || new Date();
        return dateB - dateA;
    });

    const filteredNotifications = allNotifications.filter(n => {
        if (filter === 'unread') {
            return !readIds.has(n.id);
        }
        return true;
    });

    const getNotificationColor = (type) => {
        switch (type) {
            case 'meeting':
                return {
                    bg: 'bg-blue-50/80 dark:bg-blue-900/20',
                    border: 'border-blue-100 dark:border-blue-800/50',
                    text: 'text-blue-900 dark:text-blue-100',
                    subtext: 'text-blue-800 dark:text-blue-200',
                    badge: 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
                };
            case 'action_plan':
                return {
                    bg: 'bg-purple-50/80 dark:bg-purple-900/20',
                    border: 'border-purple-100 dark:border-purple-800/50',
                    text: 'text-purple-900 dark:text-purple-100',
                    subtext: 'text-purple-800 dark:text-purple-200',
                    badge: 'bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200'
                };
            default: // announcement
                return {
                    bg: 'bg-indigo-50/80 dark:bg-indigo-900/20',
                    border: 'border-indigo-100 dark:border-indigo-800/50',
                    text: 'text-indigo-900 dark:text-indigo-100',
                    subtext: 'text-indigo-800 dark:text-indigo-200',
                    badge: 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200'
                };
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'meeting':
                return Calendar;
            case 'action_plan':
                return FileText;
            default:
                return Bell;
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto animate-scaleIn">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        All ({allNotifications.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'unread'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        Unread ({allNotifications.filter(n => !readIds.has(n.id)).length})
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                    <EmptyState
                        icon={Bell}
                        title="No Notifications"
                        description={filter === 'unread' ? "You have no unread notifications." : "You're all caught up!"}
                        className="py-12"
                    />
                ) : (
                    filteredNotifications.map(notification => {
                        const colors = getNotificationColor(notification.type);
                        const Icon = getNotificationIcon(notification.type);
                        const isRead = readIds.has(notification.id);

                        return (
                            <div
                                key={notification.id}
                                className={`p-5 rounded-xl border transition-all duration-300 ${isRead
                                    ? 'bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                                    : `${colors.bg} ${colors.border} shadow-sm transform scale-[1.01]`
                                    }`}
                            >
                                <div className="flex gap-4">
                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!isRead ? colors.badge : 'bg-gray-100 dark:bg-gray-700'
                                        }`}>
                                        <Icon className={`h-5 w-5 ${!isRead ? colors.text : 'text-gray-500 dark:text-gray-400'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`font-semibold ${isRead ? 'text-gray-800 dark:text-gray-200' : colors.text}`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                                                {notification.date}
                                            </span>
                                        </div>
                                        <p className={`text-sm mb-3 ${isRead ? 'text-gray-600 dark:text-gray-400' : colors.subtext}`}>
                                            {notification.content}
                                        </p>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium px-2.5 py-1 bg-white/60 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 rounded-full border border-gray-100 dark:border-gray-600">
                                                    {notification.author}
                                                </span>
                                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors.badge}`}>
                                                    {notification.type === 'meeting' ? 'Meeting' : notification.type === 'action_plan' ? 'Action Plan' : 'Announcement'}
                                                </span>
                                            </div>
                                            {!isRead && (
                                                <button
                                                    onClick={() => handleMarkRead(notification.id)}
                                                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                        </div>

                                        {/* Show additional details for meetings and action plans */}
                                        {notification.type === 'meeting' && notification.data.issues && notification.data.issues.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Issues to discuss:</p>
                                                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                                    {notification.data.issues.map((issue, idx) => (
                                                        <li key={idx}>• {issue}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {notification.type === 'action_plan' && (
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                                {notification.data.resources && (
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Resources:</p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">{notification.data.resources}</p>
                                                    </div>
                                                )}
                                                {notification.data.checkIns && (
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Check-ins:</p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">{notification.data.checkIns}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
