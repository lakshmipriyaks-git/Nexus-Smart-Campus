import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, School, Users, UserCheck, Clock, Megaphone, CheckCircle2, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export default function DepartmentActivityFeed({ activities = [], selectedDepartment = 'CSE' }) {
    const [filterType, setFilterType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredActivities = activities.filter(item => {
        if (filterType !== 'all') {
            if (filterType === 'classes' && item.type !== 'class_created') return false;
            if (filterType === 'students' && item.type !== 'student_joined' && item.type !== 'student_approved') return false;
            if (filterType === 'staff' && item.type !== 'staff_registered' && item.type !== 'staff_approved') return false;
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const titleMatch = item.title?.toLowerCase().includes(q);
            const msgMatch = item.message?.toLowerCase().includes(q);
            const actorMatch = item.actorName?.toLowerCase().includes(q);
            return titleMatch || msgMatch || actorMatch;
        }
        return true;
    });

    const getActivityIcon = (type) => {
        switch (type) {
            case 'class_created':
                return { icon: School, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950/60' };
            case 'student_joined':
                return { icon: Users, color: 'text-blue-500 bg-blue-100 dark:bg-blue-950/60' };
            case 'staff_registered':
                return { icon: Clock, color: 'text-amber-500 bg-amber-100 dark:bg-amber-950/60' };
            case 'staff_approved':
                return { icon: UserCheck, color: 'text-teal-500 bg-teal-100 dark:bg-teal-950/60' };
            default:
                return { icon: Megaphone, color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-950/60' };
        }
    };

    const formatTimestamp = (ts) => {
        if (!ts) return 'Just now';
        try {
            const date = new Date(ts);
            const diffMin = Math.round((Date.now() - date.getTime()) / (1000 * 60));
            if (diffMin < 1) return 'Just now';
            if (diffMin < 60) return `${diffMin}m ago`;
            const diffHours = Math.round(diffMin / 60);
            if (diffHours < 24) return `${diffHours}h ago`;
            return date.toLocaleDateString();
        } catch {
            return 'Recent';
        }
    };

    return (
        <Card className="border border-gray-100 dark:border-gray-700/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-transparent dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-transparent border-b border-gray-100 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-gray-900 dark:text-gray-100">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Activity className="h-5 w-5" />
                        </div>
                        <span>Live Department Activities & Audit Stream</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            {filteredActivities.length} Events
                        </span>
                    </CardTitle>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'classes', label: 'Classes' },
                            { id: 'students', label: 'Students' },
                            { id: 'staff', label: 'Faculty' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setFilterType(t.id)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                                    filterType === t.id
                                        ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
                {filteredActivities.length === 0 ? (
                    <div className="py-12 text-center">
                        <Activity className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2.5" />
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No activity recorded yet for {selectedDepartment}</p>
                        <p className="text-xs text-gray-400 mt-1">Class creations, student enrollments, and faculty approvals will stream here in real-time.</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                        <AnimatePresence initial={false}>
                            {filteredActivities.map((act) => {
                                const { icon: Icon, color } = getActivityIcon(act.type);
                                return (
                                    <motion.div
                                        key={act.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/70 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-all flex items-start gap-3.5"
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-bold text-xs text-gray-900 dark:text-gray-100 truncate">
                                                    {act.title}
                                                </p>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                    {formatTimestamp(act.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">
                                                {act.message}
                                            </p>
                                            {act.actorName && (
                                                <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                                                    <span className="font-medium text-gray-600 dark:text-gray-300">
                                                        Actor: {act.actorName}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="text-indigo-500 font-semibold">{selectedDepartment}</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
