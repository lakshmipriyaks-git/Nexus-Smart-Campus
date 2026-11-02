import React from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Bell, Calendar, Sparkles } from 'lucide-react';

export default function AnnouncementFeed() {
    const { announcements = [] } = useData();

    return (
        <Card className="h-full bg-white dark:bg-[#0D1527] border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <CardHeader className="border-b border-[#E2E6F2] dark:border-[#1E2D4A]/60 pb-3 bg-[#F8F9FE] dark:bg-[#0A0F1D]/50">
                <CardTitle className="flex items-center justify-between font-display text-sm font-bold text-[#202442] dark:text-white">
                    <span className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-[#6558E8] dark:text-[#06B6D4]" />
                        <span>Class Announcements</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#6558E8]/10 text-[#6558E8] border border-[#6558E8]/30 dark:bg-[#06B6D4]/15 dark:text-[#22D3EE] dark:border-[#06B6D4]/30 font-bold">
                        {announcements.length} Bulletins
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-3 max-h-[380px] overflow-y-auto custom-scrollbar">
                {announcements.map(announcement => (
                    <div
                        key={announcement.id}
                        className="p-3.5 rounded-xl bg-[#EEF1FC] dark:bg-[#0A0F1D] border border-[#E2E6F2] dark:border-[#1E2D4A] hover:border-[#6558E8]/40 dark:hover:border-[#06B6D4]/40 transition-all duration-200"
                    >
                        <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="font-semibold text-[#202442] dark:text-white text-xs leading-snug">
                                {announcement.title || 'Untitled Bulletin'}
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#6558E8]/10 text-[#6558E8] border border-[#6558E8]/30 dark:bg-[#06B6D4]/15 dark:text-[#22D3EE] dark:border-[#06B6D4]/30 flex items-center gap-1 whitespace-nowrap">
                                <Calendar className="h-3 w-3" />
                                {announcement.date || 'Today'}
                            </span>
                        </div>
                        <div
                            className="text-xs text-[#59627E] dark:text-slate-300 mb-2.5 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: announcement.content || '<p>No content</p>' }}
                        />
                        <div className="flex items-center gap-2 pt-1 border-t border-[#E2E6F2] dark:border-[#1E2D4A]/50">
                            <div className="h-5 w-5 rounded-full bg-[#6558E8]/15 border border-[#6558E8]/30 flex items-center justify-center text-[10px] font-bold text-[#6558E8] dark:bg-[#06B6D4]/20 dark:border-[#06B6D4]/40 dark:text-[#22D3EE]">
                                {announcement.author?.charAt(0) || 'F'}
                            </div>
                            <p className="text-[11px] text-[#7E87A2] dark:text-slate-400 font-medium">{announcement.author || 'Faculty Office'}</p>
                        </div>
                    </div>
                ))}
                {announcements.length === 0 && (
                    <div className="text-center py-8 space-y-2">
                        <Sparkles className="w-6 h-6 text-slate-400 dark:text-slate-600 mx-auto" />
                        <p className="text-xs text-[#59627E] dark:text-slate-400 font-medium">No class bulletins posted yet.</p>
                        <p className="text-[11px] text-[#7E87A2] dark:text-slate-600">Department notices will appear here automatically.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
