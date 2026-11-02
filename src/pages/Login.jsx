import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    LogIn,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    GraduationCap,
    UserCheck,
    ShieldCheck,
    Printer,
    UtensilsCrossed,
    Bus,
    Library,
    CheckCircle2,
    Mail,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    Sun,
    Moon
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { validators, validate } from '../utils/validation';
import { ROLES, getEmailDomainBinding, ROLE_DOMAIN_NAMES, getSavedCampusEmails, saveCampusEmail } from '../utils/constants';

// Campus Roles — Categorized for Balanced Visual Hierarchy
const ACADEMIC_ROLES = [
    {
        role: ROLES.STUDENT,
        label: 'Student',
        shortDesc: 'All Domains',
        icon: GraduationCap,
        glowColor: 'hover:border-[#06B6D4]/60 hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]',
        activeStyle: 'border-[#06B6D4] bg-[#06B6D4]/15 text-[#22D3EE] ring-1 ring-[#06B6D4]/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]',
        iconBg: 'bg-[#06B6D4]/15 text-[#22D3EE]'
    },
    {
        role: ROLES.STAFF,
        label: 'Staff / Faculty',
        shortDesc: 'All Domains',
        icon: UserCheck,
        glowColor: 'hover:border-[#06B6D4]/60 hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]',
        activeStyle: 'border-[#06B6D4] bg-[#06B6D4]/15 text-[#22D3EE] ring-1 ring-[#06B6D4]/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]',
        iconBg: 'bg-[#06B6D4]/15 text-[#22D3EE]'
    },
    {
        role: ROLES.HOD,
        label: 'HOD',
        shortDesc: 'All Domains',
        icon: ShieldCheck,
        glowColor: 'hover:border-[#F59E0B]/60 hover:shadow-[0_0_12px_rgba(245,158,11,0.2)]',
        activeStyle: 'border-[#F59E0B] bg-[#F59E0B]/15 text-[#FBBF24] ring-1 ring-[#F59E0B]/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
        iconBg: 'bg-[#F59E0B]/15 text-[#FBBF24]'
    }
];

const SERVICE_ROLES = [
    {
        role: ROLES.ADMIN_XEROX,
        label: 'Xerox Admin',
        shortDesc: 'Print Hub Desk',
        icon: Printer,
        glowColor: 'hover:border-violet-500/60 hover:shadow-violet-500/10',
        activeStyle: 'border-violet-500 bg-violet-500/20 text-white ring-1 ring-violet-500/60 shadow-lg shadow-violet-500/20',
        iconBg: 'bg-violet-500/20 text-violet-400'
    },
    {
        role: ROLES.ADMIN_CANTEEN,
        label: 'Canteen Admin',
        shortDesc: 'Kitchen Desk',
        icon: UtensilsCrossed,
        glowColor: 'hover:border-amber-500/60 hover:shadow-amber-500/10',
        activeStyle: 'border-amber-500 bg-amber-500/20 text-white ring-1 ring-amber-500/60 shadow-lg shadow-amber-500/20',
        iconBg: 'bg-amber-500/20 text-amber-400'
    },
    {
        role: ROLES.DRIVER,
        label: 'Bus Driver',
        shortDesc: 'Transit Desk',
        icon: Bus,
        glowColor: 'hover:border-emerald-500/60 hover:shadow-emerald-500/10',
        activeStyle: 'border-emerald-500 bg-emerald-500/20 text-white ring-1 ring-emerald-500/60 shadow-lg shadow-emerald-500/20',
        iconBg: 'bg-emerald-500/20 text-emerald-400'
    },
    {
        role: ROLES.ADMIN_LIBRARY,
        label: 'Library Admin',
        shortDesc: 'Library Desk',
        icon: Library,
        glowColor: 'hover:border-blue-500/60 hover:shadow-blue-500/10',
        activeStyle: 'border-blue-500 bg-blue-500/20 text-white ring-1 ring-blue-500/60 shadow-lg shadow-blue-500/20',
        iconBg: 'bg-blue-500/20 text-blue-400'
    }
];

const ALL_ROLES = [...ACADEMIC_ROLES, ...SERVICE_ROLES];

export default function Login() {
    const { login } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectUrl = searchParams.get('redirect');
    const domainQuery = searchParams.get('domain');

    const getDefaultRole = () => {
        if (domainQuery === 'printhub' || redirectUrl?.includes('print-hub')) return ROLES.ADMIN_XEROX;
        if (domainQuery === 'canteen' || redirectUrl?.includes('canteen')) return ROLES.ADMIN_CANTEEN;
        if (domainQuery === 'bustracking' || redirectUrl?.includes('bus-tracking')) return ROLES.DRIVER;
        if (domainQuery === 'library' || redirectUrl?.includes('digital-library')) return ROLES.ADMIN_LIBRARY;
        return ROLES.STUDENT;
    };

    const [selectedRole, setSelectedRole] = useState(getDefaultRole);
    const [email, setEmail] = useState('');
    const [studentUsn, setStudentUsn] = useState(() => {
        return typeof localStorage !== 'undefined' ? (localStorage.getItem('nexus_student_usn') || '') : '';
    });
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Auto-clear entry places when landing on login page
    useEffect(() => {
        setEmail('');
        setPassword('');
        setErrors({});
    }, []);

    // Prefix-based suggestion logic:
    // If user enters first letter as before, suggest matching campus accounts.
    // If not, don't suggest any email or anything.
    const emailSuggestions = useMemo(() => {
        const trimmed = (email || '').trim().toLowerCase();
        if (!trimmed) return [];
        const savedList = getSavedCampusEmails();
        return savedList.filter((item) => {
            const lower = item.toLowerCase();
            return lower.startsWith(trimmed) && lower !== trimmed;
        });
    }, [email]);

    const handleSelectSuggestion = (sugEmail) => {
        setEmail(sugEmail);
        setShowSuggestions(false);
        // Automatically sync bound domain/role if previously bound
        const binding = getEmailDomainBinding(sugEmail);
        if (binding && binding.role) {
            setSelectedRole(binding.role);
        }
    };

    const selectedRoleInfo = ALL_ROLES.find(r => r.role === selectedRole);
    const boundInfo = email ? getEmailDomainBinding(email) : null;
    const isMismatchedRole = Boolean(
        boundInfo &&
        boundInfo.role &&
        selectedRole &&
        boundInfo.role.toLowerCase() !== selectedRole.toLowerCase()
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        const emailError = validate(email, [validators.required, validators.email]);
        const passwordError = validate(password, [validators.required]);

        if (emailError) newErrors.email = emailError;
        if (passwordError) newErrors.password = passwordError;

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error('Please fix the errors in the form');
            return;
        }

        if (isMismatchedRole) {
            const boundName = ROLE_DOMAIN_NAMES[boundInfo.role] || boundInfo.role.toUpperCase();
            toast.error(`This email has already been used in ${boundName} domain`);
            return;
        }

        setLoading(true);

        try {
            const result = await login(email, password, selectedRole, selectedRole === ROLES.STUDENT ? studentUsn : null);

            if (!result.success) {
                toast.error(result.message || 'Login failed');
            } else {
                // Save email to history for future suggestions
                saveCampusEmail(email);

                // Auto clear entry places after successful login
                setEmail('');
                setPassword('');
                setErrors({});
                setShowSuggestions(false);

                const userRole = (selectedRole || result.user?.role || '').toLowerCase();
                const loggedRole = selectedRoleInfo ? selectedRoleInfo.label : userRole.toUpperCase();
                toast.success(`Signed in as ${loggedRole}!`);

                // Navigate first to the campus home page
                navigate('/');
            }
        } catch (error) {
            toast.error('An unexpected error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-[#F5F6FF] dark:bg-[#070A11] font-sans selection:bg-[#6558E8]/30 dark:selection:bg-[#06B6D4]/30 transition-colors duration-200">
            {/* Ambient Background Lights & Mesh Grid */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-[#6558E8]/10 dark:bg-[#06B6D4]/10 blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-[35%] -right-[15%] w-[55vw] h-[55vw] rounded-full bg-[#6558E8]/5 dark:bg-[#22D3EE]/5 blur-[130px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
                <div className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-violet-600/10 dark:bg-cyan-600/15 blur-[140px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
                <div className="absolute inset-0 bg-[radial-gradient(#2024420a_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
            </div>

            {/* Top Bar with Gateway Link & Theme Switcher */}
            <div className="absolute top-4 inset-x-4 sm:inset-x-8 flex items-center justify-between z-20">
                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#59627E] dark:text-slate-300 hover:text-[#202442] dark:hover:text-white bg-white/80 dark:bg-[#0D1527]/80 backdrop-blur-md border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm hover:shadow transition-all"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Campus Gateway</span>
                </Link>
                <button
                    type="button"
                    onClick={toggleDarkMode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#59627E] dark:text-slate-300 hover:text-[#202442] dark:hover:text-white bg-white/80 dark:bg-[#0D1527]/80 backdrop-blur-md border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm hover:shadow transition-all"
                    aria-label="Toggle theme"
                >
                    {darkMode ? (
                        <>
                            <Sun className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-xs">Light Mode</span>
                        </>
                    ) : (
                        <>
                            <Moon className="w-3.5 h-3.5 text-[#6558E8]" />
                            <span className="text-xs">Dark Mode</span>
                        </>
                    )}
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="w-full max-w-xl relative z-10 my-12"
            >
                {/* Main Glass Card */}
                <div className="relative rounded-3xl bg-white dark:bg-[#0D1527] backdrop-blur-2xl border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-xl dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9),0_0_30px_rgba(6,182,212,0.15)] overflow-hidden">
                    {/* Top Accent Specular Line */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#6558E8] dark:via-[#06B6D4]/80 to-transparent" />

                    <div className="p-6 sm:p-8">
                        {/* Segmented Switcher Tab */}
                        <div className="grid grid-cols-2 p-1 bg-[#EEF1FC] dark:bg-slate-950/70 border border-[#E2E6F2] dark:border-slate-800/80 rounded-2xl mb-6 shadow-inner">
                            <button
                                type="button"
                                className="py-2.5 text-xs font-bold rounded-xl bg-[#6558E8] text-white dark:bg-[#06B6D4] dark:text-[#070A11] font-black shadow-md shadow-[#6558E8]/20 dark:shadow-[#06B6D4]/25 flex items-center justify-center gap-1.5"
                            >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>Sign In</span>
                            </button>
                            <Link
                                to={redirectUrl ? `/signup?redirect=${encodeURIComponent(redirectUrl)}${domainQuery ? `&domain=${domainQuery}` : ''}` : '/signup'}
                                className="py-2.5 text-xs font-semibold rounded-xl text-[#59627E] dark:text-slate-400 hover:text-[#202442] dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 transition-all text-center flex items-center justify-center gap-1.5"
                            >
                                <span>Create Account</span>
                            </Link>
                        </div>

                        {/* Card Header */}
                        <div className="text-center mb-6">
                            <motion.div
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 220, delay: 0.1 }}
                                className="w-14 h-14 bg-[#6558E8]/10 dark:bg-[#06B6D4]/15 border border-[#6558E8]/30 dark:border-[#06B6D4]/30 text-[#6558E8] dark:text-[#22D3EE] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md dark:shadow-xl dark:shadow-[#06B6D4]/20"
                            >
                                <LogIn className="h-7 w-7 text-[#6558E8] dark:text-[#22D3EE]" />
                            </motion.div>
                            <h1 className="text-2xl sm:text-3xl font-black text-[#202442] dark:text-white tracking-tight">
                                Nexus <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6558E8] to-[#4389F5] dark:from-[#06B6D4] dark:to-[#22D3EE]">Smart Campus</span>
                            </h1>
                            <p className="text-[#59627E] dark:text-slate-400 text-xs sm:text-sm mt-1">
                                Select your campus role and authenticate across all domains
                            </p>
                        </div>

                        {/* ── Symmetrical Role Selector ── */}
                        <div className="space-y-3.5 mb-6">
                            <div className="flex items-center justify-between border-b border-[#E2E6F2] dark:border-slate-800/80 pb-2">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-[#202442] dark:text-slate-300 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                                    <span>Select Role</span>
                                </span>
                                <span className="text-[11px] text-[#59627E] dark:text-slate-400">Applies across all domains</span>
                            </div>

                            {/* Section 1: Academic Community (3 Equal Columns) */}
                            <div>
                                <div className="text-[10px] font-bold text-[#59627E] dark:text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
                                    Academic Community · Full Access
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {ACADEMIC_ROLES.map((item) => {
                                        const isSelected = selectedRole === item.role;
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                key={item.role}
                                                type="button"
                                                onClick={() => setSelectedRole(item.role)}
                                                className={`p-2.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between gap-1.5 hover:scale-[1.02] active:scale-[0.98] ${
                                                    isSelected
                                                        ? item.activeStyle
                                                        : `border-[#E2E6F2] dark:border-slate-800 bg-[#F8F9FE] dark:bg-slate-900/60 text-[#59627E] dark:text-slate-300 ${item.glowColor} hover:text-[#202442] dark:hover:text-white hover:bg-[#EEF1FC] dark:hover:bg-slate-800/70`
                                                }`}
                                                disabled={loading}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                        isSelected ? 'bg-white/20 text-white' : item.iconBg
                                                    }`}>
                                                        <Icon className="w-3.5 h-3.5" />
                                                    </div>
                                                    {isSelected && (
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-xs leading-tight truncate">
                                                        {item.label}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Section 2: Service Desks (4 Equal Columns) */}
                            <div>
                                <div className="text-[10px] font-bold text-[#59627E] dark:text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
                                    Service Desk Admins · Domain Specific
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {SERVICE_ROLES.map((item) => {
                                        const isSelected = selectedRole === item.role;
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                key={item.role}
                                                type="button"
                                                onClick={() => setSelectedRole(item.role)}
                                                className={`p-2.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between gap-1.5 hover:scale-[1.02] active:scale-[0.98] ${
                                                    isSelected
                                                        ? item.activeStyle
                                                        : `border-[#E2E6F2] dark:border-slate-800 bg-[#F8F9FE] dark:bg-slate-900/60 text-[#59627E] dark:text-slate-300 ${item.glowColor} hover:text-[#202442] dark:hover:text-white hover:bg-[#EEF1FC] dark:hover:bg-slate-800/70`
                                                }`}
                                                disabled={loading}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                        isSelected ? 'bg-white/20 text-white' : item.iconBg
                                                    }`}>
                                                        <Icon className="w-3.5 h-3.5" />
                                                    </div>
                                                    {isSelected && (
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-xs leading-tight truncate">
                                                        {item.label}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="relative flex items-center justify-center my-5">
                            <div className="border-t border-[#E2E6F2] dark:border-slate-800 w-full" />
                            <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-bold text-[#59627E] dark:text-slate-400 uppercase tracking-widest absolute">
                                Enter Credentials
                            </span>
                        </div>

                        {/* Email & Password Form with Rich Inputs & Disabled Native Autocomplete */}
                        <form onSubmit={handleSubmit} autoComplete="off" spellCheck="false" className="space-y-4">
                            {/* Email Input with Mail Icon & Prefix Autocomplete Suggestions */}
                            <div className="space-y-1 relative">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7E87A2] dark:text-slate-400 group-focus-within:text-[#6558E8] dark:group-focus-within:text-[#06B6D4] transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="email"
                                        name="nexus_user_email"
                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="none"
                                        spellCheck="false"
                                        value={email}
                                        onChange={(e) => {
                                             setEmail(e.target.value);
                                             setShowSuggestions(true);
                                        }}
                                        onFocus={() => {
                                             if (email.trim()) setShowSuggestions(true);
                                        }}
                                        onBlur={() => {
                                             setTimeout(() => setShowSuggestions(false), 200);
                                        }}
                                        placeholder="Campus email address"
                                        disabled={loading}
                                        required
                                        className={`w-full pl-10 pr-4 py-3 bg-[#F8F9FE] dark:bg-slate-950/70 border rounded-xl text-[#202442] dark:text-white placeholder-[#7E87A2] dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                                            errors.email
                                                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-[#CCD3E5] dark:border-slate-800 focus:border-[#6558E8] dark:focus:border-[#06B6D4] focus:ring-[#6558E8]/20 dark:focus:ring-[#06B6D4]/20'
                                        }`}
                                    />
                                </div>

                                {/* Custom Prefix Suggestions Dropdown */}
                                {showSuggestions && emailSuggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.85),0_0_20px_rgba(99,102,241,0.25)] overflow-hidden">
                                        <div className="px-3 py-1.5 bg-slate-950/90 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <Sparkles className="w-3 h-3 text-indigo-400" />
                                                <span>Saved Campus Accounts</span>
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-normal">Click to fill</span>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/60">
                                            {emailSuggestions.map((sug) => {
                                                const binding = getEmailDomainBinding(sug);
                                                return (
                                                    <button
                                                        key={sug}
                                                        type="button"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            handleSelectSuggestion(sug);
                                                        }}
                                                        className="w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between gap-2 hover:bg-indigo-600/20 hover:text-white text-slate-200 transition-colors group cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                                                <Mail className="w-3.5 h-3.5" />
                                                            </div>
                                                            <span className="font-medium truncate group-hover:text-indigo-200">
                                                                {sug}
                                                            </span>
                                                        </div>
                                                        {binding?.domainName && (
                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 group-hover:border-indigo-500/50 group-hover:text-indigo-200 flex-shrink-0">
                                                                {binding.domainName}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {errors.email && (
                                    <p className="text-xs text-red-400 flex items-center gap-1 pl-1 pt-0.5">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>{errors.email}</span>
                                    </p>
                                )}
                            </div>

                            {/* Student USN Input — shown only when logging in as Student */}
                            {selectedRole === ROLES.STUDENT && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-1"
                                >
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                                            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                                            <span>Student USN</span>
                                        </label>
                                        <span className="text-[10px] text-slate-400 font-mono">e.g. 1KS21CS001</span>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400 group-focus-within:text-indigo-300 font-mono font-bold text-xs tracking-wider">
                                            USN
                                        </div>
                                        <input
                                            type="text"
                                            name="nexus_student_usn_login"
                                            autoComplete="off"
                                            spellCheck="false"
                                            value={studentUsn}
                                            onChange={(e) => setStudentUsn(e.target.value.toUpperCase())}
                                            placeholder="Student USN (e.g. 1KS21CS001)"
                                            disabled={loading}
                                            className="w-full pl-14 pr-4 py-3 bg-slate-950/70 border border-indigo-500/50 rounded-xl text-white placeholder-slate-500 font-mono tracking-wider text-sm focus:outline-none focus:ring-2 focus:border-indigo-400 focus:ring-indigo-500/25 bg-indigo-950/10 transition-all"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-400 pl-1">
                                        Helps staff and HOD recognize and track your academic records
                                    </p>
                                </motion.div>
                            )}

                            {/* Password Input with Lock Icon & Eye Toggle */}
                            <div className="space-y-1">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7E87A2] dark:text-slate-400 group-focus-within:text-[#6558E8] dark:group-focus-within:text-[#06B6D4] transition-colors">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="nexus_user_password"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Account password"
                                        disabled={loading}
                                        required
                                        className={`w-full pl-10 pr-10 py-3 bg-[#F8F9FE] dark:bg-slate-950/70 border rounded-xl text-[#202442] dark:text-white placeholder-[#7E87A2] dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                                            errors.password
                                                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-[#CCD3E5] dark:border-slate-800 focus:border-[#6558E8] dark:focus:border-[#06B6D4] focus:ring-[#6558E8]/20 dark:focus:ring-[#06B6D4]/20'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7E87A2] dark:text-slate-400 hover:text-[#202442] dark:hover:text-slate-200 transition-colors focus:outline-none"
                                        tabIndex={-1}
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-rose-500 flex items-center gap-1 pl-1 pt-0.5">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>{errors.password}</span>
                                    </p>
                                )}
                            </div>

                            {/* Role Label & Forgot Password Link */}
                            <div className="flex items-center justify-between text-xs pt-0.5">
                                <span className="text-[#59627E] dark:text-slate-400 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#6558E8] dark:bg-[#06B6D4]" />
                                    <span>Role: <strong className="text-[#202442] dark:text-slate-200 font-semibold">{selectedRoleInfo?.label}</strong></span>
                                </span>
                                <Link
                                    to="/forgot-password"
                                    className="text-[#6558E8] dark:text-[#06B6D4] hover:underline font-semibold transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full overflow-hidden bg-[#6558E8] hover:bg-[#5245D0] active:bg-[#4336B8] text-white dark:bg-[#06B6D4] dark:hover:bg-[#22D3EE] dark:text-[#070A11] py-3.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg dark:shadow-[0_0_20px_rgba(6,182,212,0.35)] dark:hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In as {selectedRoleInfo?.label || 'Campus User'}</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-[#F8F9FE] dark:bg-slate-950/80 border-t border-[#E2E6F2] dark:border-slate-800/80 text-center">
                        <p className="text-[#59627E] dark:text-slate-400 text-xs">
                            Don't have a campus account?{' '}
                            <Link
                                to={redirectUrl ? `/signup?redirect=${encodeURIComponent(redirectUrl)}${domainQuery ? `&domain=${domainQuery}` : ''}` : '/signup'}
                                className="text-[#6558E8] dark:text-[#06B6D4] font-bold hover:underline transition-colors inline-flex items-center gap-1 ml-1"
                            >
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
