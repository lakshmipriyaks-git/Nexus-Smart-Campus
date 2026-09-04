import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useHodAdmin } from '../hooks/useHodAdmin';
import { Users, GraduationCap, Library, BarChart3, Megaphone, Send, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import TeacherApprovalQueue from '../components/hod/TeacherApprovalQueue';
import DepartmentManagement from '../components/hod/DepartmentManagement';
import toast from 'react-hot-toast';

export default function HodDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { platformStats, platformStatsLoading, classes, courses, deleteCourse, addAnnouncement, globalAnnouncements } = useData();
    const { pendingTeachers, activeTeachers, allStudents, departmentClasses, hodLoading, approveTeacher, rejectTeacher, removeTeacher, removeStudent, deleteClass } = useHodAdmin();

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
            authorName: user?.name,
            authorRole: user?.role
        });
        setNewAnnouncement({ title: '', message: '', priority: 'info' });
        setIsPosting(false);
    };

    const stats = [
        { label: 'Active Teachers', value: hodLoading ? '...' : activeTeachers.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
        { label: 'Total Students', value: hodLoading ? '...' : allStudents.length, icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-100' },
        { label: 'Total Classes', value: classes?.length || 0, icon: Library, color: 'text-pink-600', bg: 'bg-pink-100' },
        { label: 'Pending Approvals', value: hodLoading ? '...' : pendingTeachers.length, icon: BarChart3, color: pendingTeachers.length > 0 ? 'text-amber-600' : 'text-emerald-600', bg: pendingTeachers.length > 0 ? 'bg-amber-100' : 'bg-emerald-100' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">HOD Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back, {user?.name}. Here's an overview of the department.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${stat.bg} dark:bg-opacity-20`}>
                                <stat.icon className={`h-6 w-6 ${stat.color} dark:brightness-150`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900/30 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Library className="h-5 w-5" />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">Subject Allocations</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">
                            Review teacher preferences and finalize subject allocations for the department.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/subject-allocations')}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        Review Allocations
                    </button>
                </div>
            </div>

            {/* Approval Queue */}
            <TeacherApprovalQueue
                pendingTeachers={pendingTeachers}
                hodLoading={hodLoading}
                approveTeacher={approveTeacher}
                rejectTeacher={rejectTeacher}
            />

            {/* Announcements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Megaphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            Post Global Announcement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePostAnnouncement} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newAnnouncement.title}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                    className="input-field w-full"
                                    placeholder="e.g. Midterm Exams Schedule"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                                <textarea
                                    value={newAnnouncement.message}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                                    className="input-field w-full min-h-[100px]"
                                    placeholder="Write your message here..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="priority" value="info"
                                            checked={newAnnouncement.priority === 'info'}
                                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                            <Info className="h-4 w-4 text-blue-500" /> Info
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="priority" value="warning"
                                            checked={newAnnouncement.priority === 'warning'}
                                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                                            className="text-red-600 focus:ring-red-500"
                                        />
                                        <span className="text-sm flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                            <AlertTriangle className="h-4 w-4 text-red-500" /> Warning
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <button type="submit" disabled={isPosting} className="w-full btn-primary flex items-center justify-center gap-2">
                                <Send className="h-4 w-4" />
                                {isPosting ? 'Posting...' : 'Post Announcement'}
                            </button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Library className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            Recent Global Announcements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {(!globalAnnouncements || globalAnnouncements.length === 0) ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">No global announcements posted yet.</p>
                            ) : (
                                globalAnnouncements.map((announcement) => (
                                    <motion.div
                                        key={announcement.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-xl border ${announcement.priority === 'warning'
                                            ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                                            : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {announcement.priority === 'warning'
                                                ? <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                : <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />}
                                            <div>
                                                <h3 className={`font-medium ${announcement.priority === 'warning' ? 'text-red-900 dark:text-red-200' : 'text-blue-900 dark:text-blue-200'}`}>
                                                    {announcement.title}
                                                </h3>
                                                <p className={`text-sm mt-1 whitespace-pre-wrap ${announcement.priority === 'warning' ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'}`}>
                                                    {announcement.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-3 text-xs opacity-70">
                                                    <span>By {announcement.authorName}</span>
                                                    <span>•</span>
                                                    <span>{announcement.date || 'Just now'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

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
