import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GraduationCap,
    Library,
    Printer,
    UtensilsCrossed,
    Bus,
    CalendarDays,
    ShieldAlert,
    LogIn,
    ArrowRight,
    Sun,
    Moon,
    LogOut,
    ShieldCheck,
    Search,
    Clock,
    Command,
    X,
    Building2,
    CheckCircle2,
    Layers,
    ArrowUpRight,
    Sparkles,
    Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { ROLES, getAllowedDomainsForRole } from '../utils/constants';

// ── Campus Services Domain Registry ──
const DOMAINS = [
    {
        id: 'eduhub',
        title: 'Edu-Hub',
        shortName: 'Edu-Hub',
        tagline: 'LMS, Curriculum Delivery & Student Gradebook',
        category: 'academic',
        categoryLabel: 'Edu-Hub',
        statusText: 'Online · VTU Sync Active',
        statusVariant: 'success',
        pills: ['Course Catalog', 'Class Roster', 'USN Sync', 'Gradebook'],
        path: '/dashboard',
        icon: GraduationCap,
        accent: 'cobalt',
        statsMetric: 'Classes & Roster Active'
    },
    {
        id: 'library',
        title: 'Digital Library',
        shortName: 'Library',
        tagline: 'Digital Repository, E-Journals & OPAC Catalog',
        category: 'academic',
        categoryLabel: 'Edu-Hub',
        statusText: 'OPAC Online · 12,000+ Titles',
        statusVariant: 'success',
        pills: ['E-Books & Journals', 'Auto Lending', 'Digital OPAC'],
        path: '/digital-library',
        icon: Library,
        accent: 'cobalt',
        statsMetric: '4,200+ Books Borrowed'
    },
    {
        id: 'canteen',
        title: 'Campus Canteen',
        shortName: 'Smart Canteen',
        tagline: 'Order Queue, Automated Kitchen & Token Stepper',
        category: 'auxiliary',
        categoryLabel: 'Auxiliary Commerce',
        statusText: 'Kitchen Ready · Token Desk Active',
        statusVariant: 'terracotta',
        pills: ['Instant UPI', 'Live Order Stepper', 'Counter Pickup'],
        path: '/canteen',
        icon: UtensilsCrossed,
        accent: 'terracotta',
        statsMetric: 'Instant UPI Checkout'
    },
    {
        id: 'printhub',
        title: 'Print Hub',
        shortName: 'Print Hub',
        tagline: 'Self-Service Document Printing & Xerox Counter',
        category: 'auxiliary',
        categoryLabel: 'Auxiliary Commerce',
        statusText: 'Print Desk Active · Zero Queue',
        statusVariant: 'terracotta',
        pills: ['PDF Upload', 'Razorpay & UPI', 'Desk Collection'],
        path: '/print-hub',
        icon: Printer,
        accent: 'terracotta',
        statsMetric: 'High-Speed Print Desk'
    },
    {
        id: 'bustracking',
        title: 'Bus Tracking',
        shortName: 'Bus Tracking',
        tagline: 'Real-Time Campus Fleet GPS & Route Schedules',
        category: 'logistics',
        categoryLabel: 'Fleet & Logistics',
        statusText: 'Active Routes · 14 Buses',
        statusVariant: 'success',
        pills: ['Route Schedules', 'Routes 1-8', 'Campus Transport'],
        path: '/bus-tracking',
        icon: Bus,
        accent: 'cobalt',
        statsMetric: 'Live Route Tracking'
    },
    {
        id: 'events',
        title: 'Campus Events',
        shortName: 'Events Portal',
        tagline: 'Institutional Fests, Seminars & Hackathons',
        category: 'community',
        categoryLabel: 'Campus Life',
        statusText: 'Registrations Open',
        statusVariant: 'default',
        pills: ['Technical Fests', 'Cultural Passes', 'Schedule Calendar'],
        path: '/events',
        icon: CalendarDays,
        accent: 'cobalt',
        statsMetric: 'Live Event Registration'
    },
    {
        id: 'complaints',
        title: 'Complaint Portal',
        shortName: 'Complaint Portal',
        tagline: 'Confidential Redressal & Institutional Escalation',
        category: 'community',
        categoryLabel: 'Campus Life',
        statusText: 'Support Online · 24h SLA',
        statusVariant: 'default',
        pills: ['Confidential Filing', 'HOD Escalation', 'Direct Resolution'],
        path: '/complaints',
        icon: ShieldAlert,
        accent: 'terracotta',
        statsMetric: 'Confidential Redressal'
    }
];

const formatRoleLabel = (role) => {
    if (!role) return 'USER';
    const r = String(role).toLowerCase();
    if (r === 'admin_library' || r === 'library' || (typeof ROLES !== 'undefined' && role === ROLES.ADMIN_LIBRARY)) return 'LIBRARY ADMIN';
    if (r === 'admin_xerox' || r === 'xerox' || (typeof ROLES !== 'undefined' && role === ROLES.ADMIN_XEROX)) return 'XEROX ADMIN';
    if (r === 'admin_canteen' || r === 'canteen' || (typeof ROLES !== 'undefined' && role === ROLES.ADMIN_CANTEEN)) return 'CANTEEN ADMIN';
    if (r === 'driver' || (typeof ROLES !== 'undefined' && role === ROLES.DRIVER)) return 'BUS DRIVER';
    return String(role).toUpperCase();
};

export default function CampusHomePage() {
    const navigate = useNavigate();
    const { user, isDomainLoggedIn, logout } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();

    const [searchQuery, setSearchQuery] = useState('');
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

    // Global keyboard shortcut listener (Ctrl+K, Cmd+K, or '/')
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
                e.preventDefault();
                setCommandPaletteOpen((prev) => !prev);
            }
            if (e.key === 'Escape') {
                setCommandPaletteOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const allowedDomains = user ? getAllowedDomainsForRole(user.role) : DOMAINS.map(d => d.id);
    const isSingleDomainAdmin = Boolean(user && allowedDomains.length === 1);
    const singleAssignedDomain = isSingleDomainAdmin ? DOMAINS.find(d => d.id === allowedDomains[0]) : null;

    // Filtered Services based on Search Query
    const filteredDomains = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return DOMAINS;
        return DOMAINS.filter((d) =>
            d.title.toLowerCase().includes(q) ||
            d.shortName.toLowerCase().includes(q) ||
            d.tagline.toLowerCase().includes(q) ||
            d.id.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    return (
        <div className="min-h-screen bg-[#F5F6FF] dark:bg-[#070A11] text-[#202442] dark:text-slate-100 flex flex-col justify-between font-sans selection:bg-[#6558E8]/20 selection:text-[#6558E8] dark:selection:bg-[#06B6D4]/30 dark:selection:text-[#22D3EE] relative overflow-x-hidden transition-colors duration-200">
            {/* Background CAD Blueprint Grid Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E6F2_1px,transparent_1px),linear-gradient(to_bottom,#E2E6F2_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#111A2E_1px,transparent_1px),linear-gradient(to_bottom,#111A2E_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

            {/* ── Main Institutional Header & Navigation ── */}
            <header className="sticky top-0 z-30 border-b border-[#E2E6F2] dark:border-[#1E2D4A] bg-white/90 dark:bg-[#070A11]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 transition-colors duration-200">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    {/* Brand Identity / Wordmark */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-full bg-[#6558E8]/10 dark:bg-[#06B6D4]/15 border border-[#6558E8]/30 dark:border-[#06B6D4]/40 flex items-center justify-center text-[#6558E8] dark:text-[#22D3EE] shadow-sm dark:shadow-[0_0_12px_rgba(6,182,212,0.3)] group-hover:border-[#6558E8]/80 dark:group-hover:border-[#06B6D4]/80 transition-all">
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-[#6558E8] dark:border-[#22D3EE]" />
                        </div>
                        <span className="font-display font-bold text-base sm:text-lg text-[#202442] dark:text-white tracking-tight group-hover:text-[#6558E8] dark:group-hover:text-[#22D3EE] transition-colors">
                            NEXUS SMART CAMPUS
                        </span>
                    </Link>

                    {/* Right Action Area */}
                    <div className="flex items-center gap-3">
                        {/* User SSO Chip */}
                        {user ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/dashboard"
                                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EEF1FC] dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] text-xs font-medium text-[#202442] dark:text-slate-200 hover:border-[#6558E8]/50 dark:hover:border-[#06B6D4]/50 transition-colors shadow-sm"
                                >
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                                    <span className="font-semibold text-[#202442] dark:text-white">{user.name}</span>
                                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-[#6558E8]/10 dark:bg-[#06B6D4]/15 text-[#6558E8] dark:text-[#22D3EE] border border-[#6558E8]/30 dark:border-[#06B6D4]/30">
                                        {formatRoleLabel(user.role)}
                                    </span>
                                </Link>
                                <button
                                    onClick={async () => {
                                        await logout();
                                        toast.success('Signed out from all campus domains');
                                        navigate('/login');
                                    }}
                                    className="px-3 py-1.5 rounded-full text-xs font-semibold text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 border border-[#E2E6F2] dark:border-[#1E2D4A] hover:border-rose-500/30 transition-colors flex items-center gap-1.5"
                                    title="Sign out of campus session"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Sign Out</span>
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="px-5 py-2 rounded-full text-xs font-bold text-white dark:text-[#070A11] bg-[#6558E8] hover:bg-[#5244d4] dark:bg-[#06B6D4] dark:hover:bg-[#22D3EE] active:bg-[#0891B2] transition-colors flex items-center gap-1.5 shadow-sm dark:shadow-[0_0_15px_rgba(6,182,212,0.35)]"
                            >
                                <span>Sign In</span>
                            </Link>
                        )}

                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-full bg-[#EEF1FC] dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] text-[#202442] dark:text-slate-400 hover:text-[#6558E8] dark:hover:text-white hover:border-[#6558E8]/40 dark:hover:border-[#06B6D4]/40 transition-colors shadow-sm"
                            title={darkMode ? 'Switch to Vibrant Light Theme' : 'Switch to Midnight Dark Theme'}
                            aria-label="Toggle visual theme"
                        >
                            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#6558E8]" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Main Command Gateway Content Deck ── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full flex flex-col justify-start relative z-10 space-y-16">
                {/* ── Visual Reference Panel 1: Architectural Hero ── */}
                <section id="hero" className="relative rounded-3xl border border-[#E2E6F2] dark:border-[#1E2D4A] bg-white/80 dark:bg-[#0A0F1D]/60 backdrop-blur-md overflow-hidden p-6 sm:p-10 lg:p-12 shadow-sm dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#6558E8]/5 dark:bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                        {/* Hero Text Content (Left 7 Cols) */}
                        <div className="lg:col-span-7 space-y-6">
                            {/* Pill Badge */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#6558E8]/10 dark:bg-[#06B6D4]/10 border border-[#6558E8]/30 dark:border-[#06B6D4]/30 text-[#6558E8] dark:text-[#22D3EE] text-[11px] font-mono font-semibold tracking-wider shadow-sm dark:shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                                <Sparkles className="w-3.5 h-3.5 text-[#6558E8] dark:text-[#22D3EE]" />
                                <span>INTELLIGENT CAMPUS OPERATING SYSTEM</span>
                            </div>

                            {/* Headline */}
                            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#202442] dark:text-white tracking-tight leading-[1.1]">
                                NEXUS<br />
                                SMART CAMPUS
                            </h1>

                            {/* Subtitle with Dot Separators */}
                            <p className="text-sm sm:text-base text-[#59627E] dark:text-slate-400 tracking-wide font-medium">
                                Academic · Services · Operations · People · Intelligence
                            </p>

                            {/* Action CTA Buttons */}
                            <div className="flex items-center gap-3 pt-2 flex-wrap">
                                <a
                                    href="#services"
                                    className="px-6 py-3 rounded-full text-xs font-bold text-white dark:text-[#070A11] bg-[#6558E8] hover:bg-[#5244d4] dark:bg-[#06B6D4] dark:hover:bg-[#22D3EE] transition-all flex items-center gap-2 shadow-sm dark:shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span>Explore NEXUS</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </a>

                                {user ? (
                                    <Link
                                        to="/dashboard"
                                        className="px-6 py-3 rounded-full text-xs font-semibold text-[#202442] dark:text-white bg-[#EEF1FC] dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] hover:border-[#6558E8]/50 dark:hover:border-[#06B6D4]/50 hover:bg-white dark:hover:bg-[#111A2E] transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <span>Open Workspace</span>
                                        <ArrowUpRight className="w-3.5 h-3.5 text-[#6558E8] dark:text-[#22D3EE]" />
                                    </Link>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="px-6 py-3 rounded-full text-xs font-semibold text-[#202442] dark:text-white bg-[#EEF1FC] dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] hover:border-[#6558E8]/50 dark:hover:border-[#06B6D4]/50 hover:bg-white dark:hover:bg-[#111A2E] transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <span>Sign In</span>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Architectural Rendering (Right 5 Cols) */}
                        <div className="lg:col-span-5 relative">
                            <div className="relative rounded-2xl overflow-hidden border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-md dark:shadow-[0_15px_40px_rgba(0,0,0,0.7)] group">
                                <img
                                    src="/assets/kssem-campus.jpg"
                                    alt="KSSEM Campus"
                                    className="w-full h-64 sm:h-72 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                        // Fallback if jpg not found
                                        e.target.src = '/assets/kssem-campus.png';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 dark:from-[#070A11]/60 via-transparent to-transparent opacity-60" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Visual Reference Panel 2: Service Discovery ── */}
                <section id="services" className="space-y-6">
                    {/* Clean Section Heading & Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E6F2] dark:border-[#1E2D4A]">
                        <div>
                            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#202442] dark:text-white tracking-tight">
                                Campus Services & Modules
                            </h2>
                            <p className="text-xs text-[#59627E] dark:text-slate-400 mt-0.5">
                                Core academic, operational, and student service touchpoints
                            </p>
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                            <Search className="w-3.5 h-3.5 text-[#7E87A2] dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search modules..."
                                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] text-[#202442] dark:text-white placeholder-[#7E87A2] dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#6558E8] dark:focus:ring-[#06B6D4] transition-all shadow-xs"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                    aria-label="Clear search"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Single Domain Admin Exclusive Terminal ── */}
                    {isSingleDomainAdmin && singleAssignedDomain ? (
                        <div className="w-full max-w-xl mx-auto my-8">
                            <div className="surface-card p-8 border border-[#E2E6F2] dark:border-[#1E2D4A] rounded-2xl shadow-xl text-center bg-white dark:bg-[#0D1527]">
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-[#06B6D4]/15 text-[#22D3EE] border border-[#06B6D4]/30 mb-4">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                    <span>Assigned Admin Terminal</span>
                                </span>
                                <h2 className="font-display text-2xl font-bold text-[#202442] dark:text-white">
                                    {singleAssignedDomain.title}
                                </h2>
                                <p className="text-sm text-[#59627E] dark:text-slate-400 mt-2 mb-6 max-w-md mx-auto">
                                    {singleAssignedDomain.tagline}
                                </p>
                                <Link
                                    to={singleAssignedDomain.path}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-[#070A11] bg-[#06B6D4] hover:bg-[#22D3EE] shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-colors"
                                >
                                    <span>Enter Management Console</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    ) : filteredDomains.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl border border-dashed border-[#E2E6F2] dark:border-[#1E2D4A] bg-white/50 dark:bg-[#0D1527]/50">
                            <p className="text-xs text-[#59627E] dark:text-slate-400">
                                No service matched your query "{searchQuery}".
                            </p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mt-2 text-xs font-semibold text-[#6558E8] dark:text-[#06B6D4] hover:underline"
                            >
                                Clear search
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {/* ── Services Grid ── */}
                            {filteredDomains.map((domain, index) => {
                                const Icon = domain.icon;
                                const isLogged = isDomainLoggedIn(domain.id);
                                const isAmber = domain.accent === 'terracotta';
                                const targetPath = isLogged ? domain.path : `/login?redirect=${encodeURIComponent(domain.path)}&domain=${domain.id}`;

                                return (
                                    <motion.div
                                        key={domain.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: index * 0.03 }}
                                        className="h-full"
                                    >
                                        <Link
                                            to={targetPath}
                                            className={`relative h-full p-6 rounded-2xl border transition-all duration-200 ease-out flex flex-col justify-between group overflow-hidden bg-white dark:bg-[#0D1527] border-[#E2E6F2] dark:border-[#1E2D4A] shadow-xs hover:shadow-md hover:-translate-y-1 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6558E8] dark:focus-visible:ring-[#06B6D4] ${
                                                isAmber
                                                    ? 'hover:border-amber-400 dark:hover:border-amber-500/50'
                                                    : 'hover:border-[#6558E8]/50 dark:hover:border-[#06B6D4]/50'
                                            }`}
                                        >
                                            {/* Subtle corner light on hover */}
                                            <div
                                                className={`absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                                                    isAmber ? 'bg-amber-500/10' : 'bg-[#6558E8]/10 dark:bg-[#06B6D4]/10'
                                                }`}
                                            />

                                            <div>
                                                {/* Icon & Title Row */}
                                                <div className="flex items-start gap-4 mb-3">
                                                    <div
                                                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200 group-hover:scale-105 ${
                                                            isAmber
                                                                ? 'bg-amber-500/10 text-amber-700 dark:text-[#FBBF24] border-amber-300 dark:border-[#F59E0B]/30'
                                                                : 'bg-[#6558E8]/10 dark:bg-[#06B6D4]/10 text-[#6558E8] dark:text-[#22D3EE] border-[#6558E8]/30 dark:border-[#06B6D4]/30'
                                                        }`}
                                                    >
                                                        <Icon className="w-6 h-6" />
                                                    </div>

                                                    <div className="flex-1 min-w-0 pt-0.5">
                                                        <h3
                                                            className={`font-display text-lg font-bold text-[#202442] dark:text-white tracking-tight transition-colors duration-150 ${
                                                                isAmber
                                                                    ? 'group-hover:text-amber-700 dark:group-hover:text-[#FBBF24]'
                                                                    : 'group-hover:text-[#6558E8] dark:group-hover:text-[#22D3EE]'
                                                            }`}
                                                        >
                                                            {domain.title}
                                                        </h3>
                                                        <p className="text-xs text-[#59627E] dark:text-slate-400 mt-1 leading-relaxed">
                                                            {domain.tagline}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Access Module Action */}
                                            <div className="flex items-center justify-between pt-3 mt-4 border-t border-[#E2E6F2] dark:border-[#1E2D4A]/60">
                                                <span
                                                    className={`text-xs font-semibold text-[#59627E] dark:text-slate-400 transition-colors duration-150 ${
                                                        isAmber
                                                            ? 'group-hover:text-amber-700 dark:group-hover:text-[#FBBF24]'
                                                            : 'group-hover:text-[#6558E8] dark:group-hover:text-[#22D3EE]'
                                                    }`}
                                                >
                                                    Access Module
                                                </span>
                                                <div
                                                    className={`p-1.5 rounded-lg border transition-all duration-150 flex items-center justify-center ${
                                                        isAmber
                                                            ? 'text-amber-700 dark:text-[#FBBF24] border-amber-300 dark:border-[#F59E0B]/30 group-hover:bg-amber-500/10 group-hover:border-amber-400'
                                                            : 'text-[#6558E8] dark:text-[#22D3EE] border-[#6558E8]/30 dark:border-[#06B6D4]/30 group-hover:bg-[#6558E8]/10 group-hover:border-[#6558E8]/60 dark:group-hover:bg-[#06B6D4]/20 dark:group-hover:border-[#06B6D4]/60'
                                                    }`}
                                                >
                                                    <ArrowUpRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            {/* ── Quick Jump Command Palette Modal ── */}
            <AnimatePresence>
                {commandPaletteOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setCommandPaletteOpen(false)}
                            className="absolute inset-0 bg-[#070A11]/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className="relative w-full max-w-lg bg-[#0D1527] border border-[#1E2D4A] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] p-5 z-10"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]">
                                <div className="flex items-center gap-2">
                                    <Command className="w-4 h-4 text-[#22D3EE]" />
                                    <h3 className="font-display font-bold text-sm text-white">
                                        Quick Service Command Jump
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setCommandPaletteOpen(false)}
                                    className="p-1 rounded-md hover:bg-[#162238] text-slate-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-xs text-slate-400 mt-2 mb-3">
                                Select any of the 7 KSSEM campus modules for direct navigation:
                            </p>

                            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                                {DOMAINS.map((domain) => {
                                    const Icon = domain.icon;
                                    return (
                                        <button
                                            key={domain.id}
                                            onClick={() => {
                                                setCommandPaletteOpen(false);
                                                navigate(domain.path);
                                            }}
                                            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-[#1E2D4A] hover:bg-[#111A2E] transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#22D3EE] flex items-center justify-center shrink-0">
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-xs text-white group-hover:text-[#22D3EE] transition-colors">
                                                        {domain.title}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">
                                                        {domain.tagline}
                                                    </div>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#22D3EE] transition-colors" />
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-4 pt-3 border-t border-[#1E2D4A] flex items-center justify-between text-[11px] font-mono text-slate-400">
                                <span>PRESS ESC TO DISMISS</span>
                                <span>KSSEM PROTOCOL</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Institutional Footer ── */}
            <footer className="border-t border-[#E2E6F2] dark:border-[#1E2D4A] bg-white/80 dark:bg-[#0A0F1D]/80 backdrop-blur-sm py-6 px-4 text-xs text-[#59627E] dark:text-slate-400 z-10 transition-colors duration-200">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="font-sans">
                        © {new Date().getFullYear()} NEXUS SMART CAMPUS · K.S. School of Engineering & Management, Bengaluru
                    </p>
                    <p className="font-mono text-[11px] text-[#7E87A2] dark:text-slate-500">
                        Intelligent Campus Operating System
                    </p>
                </div>
            </footer>
        </div>
    );
}
