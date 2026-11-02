import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import {
    LogOut,
    LayoutDashboard,
    BookOpen,
    Bell,
    GraduationCap,
    Settings,
    HelpCircle,
    User,
    Users,
    BarChart3,
    Library,
    Menu,
    X,
    Sun,
    Moon,
    Search,
    ChevronRight,
    ArrowUpRight,
    Calendar,
    ShieldCheck,
    Layers,
    Sparkles
} from 'lucide-react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { ROLES } from '../utils/constants';

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const { unreadCount = 0 } = useData() || {};
    const { darkMode, toggleDarkMode } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const path = location.pathname.split('/')[1];
        if (path) {
            setActiveTab(path);
        } else {
            setActiveTab('dashboard');
        }
        setMobileMenuOpen(false);
    }, [location]);

    const studentNavSections = [
        {
            title: 'ACADEMIC',
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
                { id: 'courses', label: 'Courses & Catalog', icon: Library, path: '/courses' },
                { id: 'tasks', label: 'Tasks & Kanban', icon: BookOpen, path: '/tasks' },
            ]
        },
        {
            title: 'COMMUNICATION',
            items: [
                { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications', badge: unreadCount },
            ]
        },
        {
            title: 'SYSTEM',
            items: [
                { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
                { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
                { id: 'help', label: 'Help & Docs', icon: HelpCircle, path: '/help' },
            ]
        }
    ];

    const teacherNavSections = [
        {
            title: 'TEACHING SUITE',
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
                { id: 'classes', label: 'Assigned Classes', icon: Library, path: '/classes' },
                { id: 'students', label: 'Student Directory', icon: Users, path: '/students' },
                { id: 'analytics', label: 'Performance Analytics', icon: BarChart3, path: '/analytics' },
            ]
        },
        {
            title: 'COMMUNICATION',
            items: [
                { id: 'notifications', label: 'Announcements', icon: Bell, path: '/notifications', badge: unreadCount },
            ]
        },
        {
            title: 'SYSTEM',
            items: [
                { id: 'profile', label: 'Faculty Profile', icon: User, path: '/profile' },
                { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
                { id: 'help', label: 'Help & Docs', icon: HelpCircle, path: '/help' },
            ]
        }
    ];

    const hodNavSections = [
        {
            title: 'DEPARTMENT OPERATIONS',
            items: [
                { id: 'dashboard', label: 'HOD Overview', icon: LayoutDashboard, path: '/dashboard' },
                { id: 'classes', label: 'Class Sections', icon: Library, path: '/classes' },
                { id: 'teachers', label: 'Faculty Approvals', icon: Users, path: '/teachers' },
                { id: 'students', label: 'Student Roster', icon: GraduationCap, path: '/students' },
                { id: 'analytics', label: 'Telemetry & Reports', icon: BarChart3, path: '/analytics' },
            ]
        },
        {
            title: 'COMMUNICATION',
            items: [
                { id: 'notifications', label: 'Department Broadcasts', icon: Bell, path: '/notifications', badge: unreadCount },
            ]
        },
        {
            title: 'SYSTEM',
            items: [
                { id: 'profile', label: 'Administrator Profile', icon: User, path: '/profile' },
                { id: 'settings', label: 'Preferences', icon: Settings, path: '/settings' },
                { id: 'help', label: 'Operations Manual', icon: HelpCircle, path: '/help' },
            ]
        }
    ];

    const navSections = user?.role === ROLES.HOD
        ? hodNavSections
        : ((user?.role === ROLES.TEACHER || user?.role === ROLES.STAFF) ? teacherNavSections : studentNavSections);

    const handleNavClick = (path, id) => {
        setActiveTab(id);
        navigate(path);
    };

    // Calculate active page display title for breadcrumbs
    const currentSection = navSections.find(sec => sec.items.some(item => item.id === activeTab));
    const currentItem = currentSection?.items.find(item => item.id === activeTab);
    const pageTitle = currentItem?.label || 'Overview';

    const renderSidebarContent = (isMobile = false) => (
        <div className="flex flex-col h-full bg-white dark:bg-[#0A0F1D] border-r border-[#E2E6F2] dark:border-[#1E2D4A] text-[#202442] dark:text-slate-300 select-none transition-colors duration-200">
            {/* Sidebar Brand Header */}
            <div className="p-4 border-b border-[#E2E6F2] dark:border-[#1E2D4A] flex items-center justify-between">
                <button
                    onClick={() => {
                        navigate('/');
                        if (isMobile) setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 text-left group min-w-0"
                >
                    <div className="h-9 w-9 rounded-lg bg-[#6558E8]/10 dark:bg-[#06B6D4]/15 border border-[#6558E8]/30 dark:border-[#06B6D4]/30 flex items-center justify-center text-[#6558E8] dark:text-[#22D3EE] font-bold shadow-sm dark:shadow-[0_0_12px_rgba(6,182,212,0.2)] group-hover:border-[#6558E8]/60 dark:group-hover:border-[#06B6D4]/60 transition-all flex-shrink-0">
                        <GraduationCap className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-display font-bold text-base tracking-tight text-[#202442] dark:text-white group-hover:text-[#6558E8] dark:group-hover:text-[#22D3EE] transition-colors">
                                NEXUS
                            </span>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#6558E8]/10 dark:bg-[#06B6D4]/20 text-[#6558E8] dark:text-[#22D3EE] border border-[#6558E8]/30 dark:border-[#06B6D4]/40 whitespace-nowrap">
                                SMART CAMPUS
                            </span>
                        </div>
                        <p className="text-[10px] font-mono text-[#59627E] dark:text-slate-400 tracking-wider truncate">
                            INTELLIGENT CAMPUS OS
                        </p>
                    </div>
                </button>
                {isMobile && (
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#202442] dark:hover:text-white hover:bg-[#EEF1FC] dark:hover:bg-[#162238] transition-colors"
                        aria-label="Close navigation"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Visual Reference: Active Role Banner Pill */}
            <div className="px-3 pt-3 pb-1">
                <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#6558E8]/10 dark:bg-[#06B6D4]/12 border border-[#6558E8]/30 dark:border-[#06B6D4]/30 text-[#6558E8] dark:text-[#22D3EE] font-mono text-xs font-bold shadow-sm dark:shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#6558E8] dark:bg-[#06B6D4] shadow-[0_0_8px_rgba(101,88,232,0.6)] dark:shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
                        <span>
                            {user?.role === ROLES.HOD
                                ? 'HOD Command'
                                : (user?.role === ROLES.TEACHER || user?.role === ROLES.STAFF)
                                ? 'Faculty OS'
                                : 'Student OS'}
                        </span>
                    </span>
                    <span className="text-[9px] font-mono uppercase px-1 rounded bg-[#EEF1FC] dark:bg-[#070A11] border border-[#6558E8]/30 dark:border-[#06B6D4]/30">
                        ACTIVE
                    </span>
                </div>
            </div>

            {/* Navigation Sections */}
            <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto custom-scrollbar">
                {navSections.map((section, sIdx) => (
                    <div key={section.title || sIdx} className="space-y-1">
                        <p className="px-3 text-[10px] font-mono font-bold text-[#7E87A2] dark:text-slate-500 uppercase tracking-wider mb-1.5">
                            {section.title}
                        </p>
                        {section.items.map((item) => {
                            const isActive = activeTab === item.id;
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        handleNavClick(item.path, item.id);
                                        if (isMobile) setMobileMenuOpen(false);
                                    }}
                                    className={clsx(
                                        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                                        isActive
                                            ? 'bg-[#6558E8]/10 text-[#6558E8] font-bold border-l-2 border-[#6558E8] dark:bg-[#06B6D4]/12 dark:text-[#22D3EE] dark:border-[#06B6D4] shadow-sm'
                                            : 'text-[#59627E] hover:bg-[#6558E8]/10 hover:text-[#202442] dark:text-slate-400 dark:hover:bg-[#111A2E] dark:hover:text-slate-200'
                                    )}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Icon className={clsx(
                                            'h-4 w-4 flex-shrink-0 transition-colors',
                                            isActive ? 'text-[#6558E8] dark:text-[#22D3EE]' : 'text-[#7E87A2] dark:text-slate-500'
                                        )} />
                                        <span className="truncate">{item.label}</span>
                                    </div>
                                    {item.badge > 0 && (
                                        <span className="ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#6558E8] text-white dark:bg-[#06B6D4] dark:text-[#070A11] shadow-sm">
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Sidebar User Footer */}
            <div className="p-3 border-t border-[#E2E6F2] dark:border-[#1E2D4A] bg-[#F8F9FE] dark:bg-[#070A11]">
                <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1.5">
                    <div className="h-8 w-8 rounded-full bg-[#6558E8]/15 dark:bg-[#06B6D4]/15 border border-[#6558E8]/30 dark:border-[#06B6D4]/30 flex items-center justify-center text-[#6558E8] dark:text-[#22D3EE] font-bold text-xs overflow-hidden flex-shrink-0">
                        {user?.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                            user?.name?.[0] || 'U'
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#202442] dark:text-white truncate">
                            {user?.name || 'Authorized User'}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            <span className="text-[9px] font-mono uppercase px-1 rounded bg-[#6558E8]/15 dark:bg-[#06B6D4]/15 text-[#6558E8] dark:text-[#22D3EE] border border-[#6558E8]/30 dark:border-[#06B6D4]/30">
                                {user?.role || 'User'}
                            </span>
                            {user?.usn && (
                                <span className="text-[9px] font-mono text-amber-600 dark:text-[#FBBF24] truncate">
                                    {user.usn}
                                </span>
                            )}
                            {user?.departmentId && (
                                <span className="text-[9px] font-mono text-[#59627E] dark:text-slate-500 truncate">
                                    [{user.departmentId}]
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={async () => {
                        await logout();
                        navigate('/login');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/30"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-[#F5F6FF] dark:bg-[#070A11] text-[#202442] dark:text-slate-100 overflow-hidden relative font-sans transition-colors duration-200">
            {/* Desktop Fixed Sidebar */}
            <aside className="hidden md:flex md:w-60 flex-col z-20 flex-shrink-0">
                {renderSidebarContent(false)}
            </aside>

            {/* Mobile Slide-over Drawer & Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 dark:bg-[#070A11]/80 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                            className="fixed inset-y-0 left-0 z-50 w-72 shadow-2xl flex flex-col md:hidden"
                        >
                            {renderSidebarContent(true)}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Viewport */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                {/* ── Desktop Top Navigation Bar ── */}
                <header className="hidden md:flex h-14 items-center justify-between px-6 border-b border-[#E2E6F2] dark:border-[#1E2D4A] bg-white/90 dark:bg-[#070A11]/90 backdrop-blur-md shrink-0 z-10 transition-colors duration-200">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-xs text-[#59627E] dark:text-slate-400">
                        <Link to="/" className="font-semibold text-[#202442] dark:text-slate-300 hover:text-[#6558E8] dark:hover:text-[#22D3EE] transition-colors flex items-center gap-1.5 font-display">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse"></span>
                            <span>NEXUS SMART CAMPUS</span>
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5 text-[#7E87A2] dark:text-slate-600" />
                        <span className="capitalize font-mono text-[11px] text-[#59627E] dark:text-slate-400">{currentSection?.title || 'Academic'}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#7E87A2] dark:text-slate-600" />
                        <span className="font-semibold text-[#6558E8] dark:text-[#22D3EE]">{pageTitle}</span>
                    </div>

                    {/* Top Right Utilities */}
                    <div className="flex items-center gap-3">
                        {/* Live Campus Hub Launcher */}
                        <Link
                            to="/"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#202442] dark:text-slate-300 hover:text-[#6558E8] dark:hover:text-white bg-[#EEF1FC] dark:bg-[#0D1527] hover:bg-[#E2E6F2] dark:hover:bg-[#111A2E] transition-all border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm"
                        >
                            <Layers className="w-3.5 h-3.5 text-[#6558E8] dark:text-[#06B6D4]" />
                            <span>Campus Hub</span>
                            <ArrowUpRight className="w-3 h-3 text-[#7E87A2] dark:text-slate-500" />
                        </Link>

                        {/* Theme Switcher Button */}
                        <button
                            type="button"
                            onClick={toggleDarkMode}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-sm bg-[#EEF1FC] dark:bg-[#0D1527] border-[#E2E6F2] dark:border-[#1E2D4A] hover:border-[#6558E8] dark:hover:border-[#06B6D4]"
                            title={darkMode ? 'Switch to Vibrant Light Theme' : 'Switch to Midnight Dark Theme'}
                            aria-label="Toggle theme"
                        >
                            {darkMode ? (
                                <>
                                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="hidden lg:inline text-xs text-slate-300">Light Mode</span>
                                </>
                            ) : (
                                <>
                                    <Moon className="w-3.5 h-3.5 text-[#6558E8]" />
                                    <span className="hidden lg:inline text-xs text-[#202442]">Dark Mode</span>
                                </>
                            )}
                        </button>

                        {/* Notifications Bell (Reference Panels 3, 4, 5) */}
                        <button
                            type="button"
                            onClick={() => navigate('/notifications')}
                            className="relative p-2 rounded-full text-[#59627E] dark:text-slate-300 hover:text-[#202442] dark:hover:text-white bg-[#EEF1FC] dark:bg-[#0D1527] hover:bg-[#E2E6F2] dark:hover:bg-[#111A2E] transition-colors border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm"
                            title="Notifications Center"
                            aria-label="View notifications"
                        >
                            <Bell className="w-4 h-4" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#6558E8] dark:bg-[#06B6D4] text-[10px] font-bold text-white dark:text-[#070A11] flex items-center justify-center shadow-sm">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Settings Cog (Reference Panels 3, 4, 5) */}
                        <button
                            type="button"
                            onClick={() => navigate('/settings')}
                            className="p-2 rounded-full text-[#59627E] dark:text-slate-300 hover:text-[#202442] dark:hover:text-white bg-[#EEF1FC] dark:bg-[#0D1527] hover:bg-[#E2E6F2] dark:hover:bg-[#111A2E] transition-colors border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm"
                            title="System Settings"
                            aria-label="Open settings"
                        >
                            <Settings className="w-4 h-4" />
                        </button>

                        <div className="h-4 w-px bg-[#E2E6F2] dark:bg-[#1E2D4A] mx-0.5" />

                        {/* User Identity Avatar with Theme Ring */}
                        <Link to="/profile" className="flex items-center gap-2 pl-1 group">
                            <div className="h-8 w-8 rounded-full bg-[#EEF1FC] dark:bg-[#0D1527] border-2 border-[#6558E8] dark:border-[#06B6D4] shadow-sm dark:shadow-[0_0_10px_rgba(6,182,212,0.4)] flex items-center justify-center text-[#6558E8] dark:text-[#22D3EE] font-bold text-xs group-hover:scale-105 transition-transform overflow-hidden">
                                {user?.profilePicture ? (
                                    <img src={user.profilePicture} alt={user.name} className="h-full w-full object-cover" />
                                ) : (
                                    user?.name?.[0] || 'U'
                                )}
                            </div>
                            <div className="text-left hidden sm:block">
                                <p className="text-xs font-semibold text-[#202442] dark:text-white leading-none group-hover:text-[#6558E8] dark:group-hover:text-[#22D3EE] transition-colors">
                                    {user?.name || 'Campus User'}
                                </p>
                                <p className="text-[10px] font-mono text-[#59627E] dark:text-slate-400 leading-none mt-0.5 capitalize">
                                    {user?.role || 'Active'}
                                </p>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* ── Mobile Top Header ── */}
                <header className="md:hidden sticky top-0 z-30 bg-white/95 dark:bg-[#070A11]/95 backdrop-blur-md border-b border-[#E2E6F2] dark:border-[#1E2D4A] px-4 py-2.5 flex items-center justify-between shrink-0 transition-colors duration-200">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 rounded-lg bg-[#EEF1FC] dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] text-[#202442] dark:text-slate-300 hover:bg-[#E2E6F2] dark:hover:bg-[#111A2E] transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-left"
                        >
                            <div className="h-7 w-7 rounded-lg bg-[#6558E8]/10 dark:bg-[#06B6D4]/15 border border-[#6558E8]/30 dark:border-[#06B6D4]/30 flex items-center justify-center text-[#6558E8] dark:text-[#22D3EE] font-bold flex-shrink-0">
                                <GraduationCap className="h-4 w-4" />
                            </div>
                            <div>
                                <span className="font-display font-bold text-sm text-[#202442] dark:text-white">
                                    NEXUS SMART CAMPUS
                                </span>
                            </div>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg bg-[#EEF1FC] dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] text-[#202442] dark:text-slate-300"
                            aria-label="Toggle theme"
                            title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                        >
                            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#6558E8]" />}
                        </button>
                        <button
                            onClick={() => navigate('/notifications')}
                            className="relative p-2 rounded-lg bg-[#EEF1FC] dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] text-[#59627E] dark:text-slate-300"
                            aria-label="Notifications"
                        >
                            <Bell className="w-4 h-4" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#6558E8] dark:bg-[#06B6D4] text-[10px] font-bold text-white dark:text-[#070A11] flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                {/* ── Scrollable Page Body ── */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#F5F6FF] dark:bg-[#070A11] text-[#202442] dark:text-slate-100 custom-scrollbar transition-colors duration-200">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
