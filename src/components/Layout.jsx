import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { LogOut, LayoutDashboard, BookOpen, Bell, GraduationCap, Settings, HelpCircle, User, Users, BarChart3, Library, Bus, Printer, UtensilsCrossed } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import ChatWidget from './ai/ChatWidget';
import { ROLES } from '../utils/constants';


export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        const path = location.pathname.split('/')[1];
        if (path) {
            setActiveTab(path);
        } else {
            setActiveTab('dashboard');
        }
    }, [location]);

    // Campus utility items shared across all roles
    const campusNavItems = [
        { id: 'bus-tracking', label: 'Bus Tracking', icon: Bus, path: '/bus-tracking' },
        { id: 'digital-library', label: 'Digital Library', icon: Library, path: '/digital-library' },
        { id: 'print-hub', label: 'Print Hub', icon: Printer, path: '/print-hub' },
        { id: 'canteen', label: 'Canteen', icon: UtensilsCrossed, path: '/canteen' },
    ];

    const studentNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { id: 'tasks', label: 'Tasks', icon: BookOpen, path: '/tasks' },
        { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
        { id: 'courses', label: 'Courses', icon: Library, path: '/courses' },
        { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
        { id: 'help', label: 'Help', icon: HelpCircle, path: '/help' },
        { divider: true, label: 'Campus Services' },
        ...campusNavItems,
    ];

    const teacherNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { id: 'classes', label: 'Classes', icon: Library, path: '/classes' },
        { id: 'students', label: 'Students', icon: Users, path: '/students' },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
        { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
        { id: 'help', label: 'Help', icon: HelpCircle, path: '/help' },
        { divider: true, label: 'Campus Services' },
        ...campusNavItems,
    ];

    const hodNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { id: 'teachers', label: 'Teachers', icon: Users, path: '/teachers' },
        { id: 'students', label: 'Students', icon: GraduationCap, path: '/students' },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
        { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
        { divider: true, label: 'Campus Services' },
        ...campusNavItems,
    ];

    const navItems = user?.role === ROLES.HOD ? hodNavItems : (user?.role === ROLES.TEACHER ? teacherNavItems : studentNavItems);

    const handleNavClick = (item) => {
        setActiveTab(item.id);
        navigate(item.path);
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 glass-panel dark:bg-gray-800 border-r border-white/20 dark:border-gray-700 flex flex-col z-10">
                <div className="p-6 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                        EduHub
                    </span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item, idx) => {
                        if (item.divider) {
                            return (
                                <div key={`divider-${idx}`} className="pt-3 pb-1 px-4">
                                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{item.label}</p>
                                </div>
                            );
                        }
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item)}
                                className={clsx(
                                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium',
                                    activeTab === item.id
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                                )}
                            >
                                <item.icon className={clsx("h-5 w-5", activeTab === item.id ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500")} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden">
                            {user?.profilePicture ? (
                                <img src={user.profilePicture} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                                user?.name?.[0] || 'U'
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative bg-gray-50 dark:bg-gray-900">
                <div className="p-8 max-w-7xl mx-auto h-full">
                    <Outlet />
                </div>
            </main>
            <ChatWidget />

        </div>
    );
}
