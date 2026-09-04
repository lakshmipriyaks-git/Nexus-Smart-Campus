import React from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Bell, Calendar } from 'lucide-react';

export default function AnnouncementFeed() {
    const { announcements } = useData();

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Class Announcements
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
                {announcements.map(announcement => (
                    <div key={announcement.id} className="p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-200 backdrop-blur-sm">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{announcement.title || 'Untitled'}</h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center gap-1 whitespace-nowrap">
                                <Calendar className="h-3 w-3" />
                                {announcement.date || 'No date'}
                            </span>
                        </div>
                        <div
                            className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: announcement.content || '<p>No content</p>' }}
                        />
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                {announcement.author?.charAt(0) || '?'}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{announcement.author || 'Unknown'}</p>
                        </div>
                    </div>
                ))}
                {announcements.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">No announcements yet.</p>
                )}
            </CardContent>
        </Card>
    );
}
