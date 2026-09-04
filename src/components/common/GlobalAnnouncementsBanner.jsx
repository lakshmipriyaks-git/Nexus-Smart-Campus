import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X, AlertTriangle } from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function GlobalAnnouncementsBanner() {
    const { globalAnnouncements } = useData();
    const [hiddenIds, setHiddenIds] = React.useState(new Set());

    // Defensive check just in case
    if (!globalAnnouncements || !Array.isArray(globalAnnouncements) || globalAnnouncements.length === 0) return null;

    const visibleAnnouncements = globalAnnouncements.filter(a => !hiddenIds.has(a.id)).slice(0, 3); // show top 3 max

    if (visibleAnnouncements.length === 0) return null;

    const hideAnnouncement = (id) => {
        setHiddenIds(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
    };

    return (
        <div className="space-y-3 mb-6">
            <AnimatePresence>
                {visibleAnnouncements.map((announcement) => (
                    <motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden' }}
                        className={`relative p-4 rounded-xl border shadow-sm ${announcement.priority === 'warning'
                                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'
                                : 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-900/30'
                            }`}
                    >
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                {announcement.priority === 'warning' ? (
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                ) : (
                                    <Megaphone className="h-5 w-5 text-indigo-500" />
                                )}
                            </div>
                            <div className="flex-1 pr-8">
                                <h3 className={`text-sm font-semibold ${announcement.priority === 'warning' ? 'text-red-900 dark:text-red-200' : 'text-indigo-900 dark:text-indigo-200'
                                    }`}>
                                    {announcement.title}
                                </h3>
                                <p className={`text-sm mt-1 whitespace-pre-wrap ${announcement.priority === 'warning' ? 'text-red-700 dark:text-red-300' : 'text-indigo-700 dark:text-indigo-300'
                                    }`}>
                                    {announcement.message}
                                </p>
                                <div className="mt-2 text-xs font-medium opacity-70">
                                    Posted by {announcement.authorName || 'Admin'} {announcement.authorRole === 'hod' ? '(Head of Department)' : ''}
                                </div>
                            </div>
                            <button
                                onClick={() => hideAnnouncement(announcement.id)}
                                className="absolute top-4 right-4 p-1 rounded-md opacity-50 hover:opacity-100 transition-opacity"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
