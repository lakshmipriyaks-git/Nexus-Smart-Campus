import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    UserPlus,
    LogIn,
    ArrowLeft,
    GraduationCap,
    CheckCircle2,
    UserCheck,
    ShieldCheck,
    Bus,
    Library,
    Printer,
    UtensilsCrossed,
    Mail,
    Lock,
    User,
    Eye,
    EyeOff,
    Sparkles,
    AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ROLES, DEPARTMENTS, getEmailDomainBinding, ROLE_DOMAIN_NAMES, getSavedCampusEmails, saveCampusEmail } from '../utils/constants';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { validators, validate } from '../utils/validation';

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

export default function Signup() {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/';
    const domainQuery = searchParams.get('domain');

    const getDefaultRole = () => {
        if (domainQuery === 'printhub' || redirectUrl.includes('print-hub')) return ROLES.ADMIN_XEROX;
        if (domainQuery === 'canteen' || redirectUrl.includes('canteen')) return ROLES.ADMIN_CANTEEN;
        if (domainQuery === 'bustracking' || redirectUrl.includes('bus-tracking')) return ROLES.DRIVER;
        if (domainQuery === 'library' || redirectUrl.includes('digital-library')) return ROLES.ADMIN_LIBRARY;
        return ROLES.STUDENT;
    };

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        usn: '',
        password: '',
        confirmPassword: '',
        role: getDefaultRole(),
        departmentId: 'CSE'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Auto-clear entry places on mount
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            name: '',
            email: '',
            usn: '',
            password: '',
            confirmPassword: ''
        }));
        setErrors({});
    }, []);

    // Prefix-based suggestion logic:
    // If user enters first letter as before, suggest matching campus accounts.
    // If not, don't suggest any email or anything.
    const emailSuggestions = useMemo(() => {
        const trimmed = (formData.email || '').trim().toLowerCase();
        if (!trimmed) return [];
        const savedList = getSavedCampusEmails();
        return savedList.filter((item) => {
            const lower = item.toLowerCase();
            return lower.startsWith(trimmed) && lower !== trimmed;
        });
    }, [formData.email]);

    const handleSelectSuggestion = (sugEmail) => {
        const binding = getEmailDomainBinding(sugEmail);
        setFormData(prev => ({
            ...prev,
            email: sugEmail,
            ...(binding?.role ? { role: binding.role } : {})
        }));
        setShowSuggestions(false);
    };

    const selectedRoleInfo = ALL_ROLES.find(r => r.role === formData.role);
    const existingBinding = formData.email ? getEmailDomainBinding(formData.email) : null;
    const isMismatchedRole = Boolean(
        existingBinding &&
        existingBinding.role &&
        formData.role &&
        existingBinding.role.toLowerCase() !== formData.role.toLowerCase()
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        const newErrors = {};
        const nameError = validate(formData.name, [validators.required]);
        const emailError = validate(formData.email, [validators.required, validators.email]);
        const passwordError = validate(formData.password, [validators.required, validators.password]);
        const confirmError = validate(formData.confirmPassword, [
            validators.required,
            validators.confirmPassword(formData.password)
        ]);

        if (nameError) newErrors.name = nameError;
        if (emailError) newErrors.email = emailError;
        if (passwordError) newErrors.password = passwordError;
        if (confirmError) newErrors.confirmPassword = confirmError;

        // Require USN only for Student role
        if (formData.role === ROLES.STUDENT) {
            const trimmedUsn = (formData.usn || '').trim();
            if (!trimmedUsn) {
                newErrors.usn = 'Student USN is required (e.g. 1KS21CS001)';
            }
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error('Please fix the errors in the form');
            return;
        }

        if (existingBinding && isMismatchedRole) {
            const boundName = ROLE_DOMAIN_NAMES[existingBinding.role] || existingBinding.role.toUpperCase();
            toast.error(`This email has already been used in ${boundName} domain`);
            return;
        }

        // Require department for staff/HOD
        if ((formData.role === ROLES.STAFF || formData.role === ROLES.HOD) && !formData.departmentId) {
            toast.error('Please select a department');
            return;
        }

        setLoading(true);

        try {
            const result = await signup(formData);

            if (result.success) {
                // Save email to history for future suggestions
                saveCampusEmail(formData.email);

                const roleLabel = selectedRoleInfo ? selectedRoleInfo.label : formData.role.toUpperCase();

                // Auto-clear entry place after successful signup
                setFormData({
                    name: '',
                    email: '',
                    usn: '',
                    password: '',
                    confirmPassword: '',
                    role: getDefaultRole(),
                    departmentId: 'CSE'
                });
                setErrors({});
                setShowSuggestions(false);

                toast.success(`Account created! Logged in as ${roleLabel} 🚀`);

                // Navigate first to the campus home page
                navigate('/');
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('An unexpected error occurred during registration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-[#070A11] font-sans selection:bg-[#06B6D4]/30">
            {/* Ambient Background Lights & Mesh Grid */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-[#06B6D4]/10 blur-[140px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-[35%] -left-[15%] w-[55vw] h-[55vw] rounded-full bg-[#22D3EE]/5 blur-[130px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
                <div className="absolute -bottom-[20%] right-[20%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/15 blur-[140px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="w-full max-w-xl relative z-10 my-6"
            >
                {/* Main Glass Card */}
                <div className="relative rounded-3xl bg-[#0D1527] backdrop-blur-2xl border border-[#1E2D4A] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.9),0_0_30px_rgba(6,182,212,0.15)] overflow-hidden">
                    {/* Top Accent Specular Line */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#06B6D4]/80 to-transparent" />

                    <div className="p-6 sm:p-8">
                        {/* Segmented Switcher Tab */}
                        <div className="grid grid-cols-2 p-1 bg-slate-950/70 border border-slate-800/80 rounded-2xl mb-6 shadow-inner">
                            <Link
                                to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}${domainQuery ? `&domain=${domainQuery}` : ''}` : '/login'}
                                className="py-2.5 text-xs font-semibold rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-center flex items-center justify-center gap-1.5"
                            >
                                <LogIn className="w-3.5 h-3.5" />
                                <span>Sign In</span>
                            </Link>
                            <button
                                type="button"
                                className="py-2.5 text-xs font-bold rounded-xl bg-[#06B6D4] text-[#070A11] font-black shadow-md shadow-[#06B6D4]/25 flex items-center justify-center gap-1.5"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Create Account</span>
                            </button>
                        </div>

                        {/* Card Header */}
                        <div className="text-center mb-6">
                            <motion.div
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 220, delay: 0.1 }}
                                className="w-14 h-14 bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#22D3EE] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-[#06B6D4]/20"
                            >
                                <UserPlus className="h-7 w-7 text-white" />
                            </motion.div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Create Campus Account
                            </h1>
                            <p className="text-slate-400 text-xs sm:text-sm mt-1">
                                One account grants Single Sign-On access across all KSSEM domains
                            </p>
                        </div>

                        {/* Registration Form with Disabled Native Autocomplete */}
                        <form onSubmit={handleSubmit} autoComplete="off" spellCheck="false" className="space-y-4">
                            {/* Full Name & Email Inputs (2-col on sm) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Name Input */}
                                <div className="space-y-1">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#06B6D4] transition-colors">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            name="nexus_user_name"
                                            autoComplete="off"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Full Name"
                                            disabled={loading}
                                            required
                                            className={`w-full pl-10 pr-4 py-3 bg-slate-950/70 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                                                errors.name
                                                    ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20'
                                                    : 'border-slate-800 focus:border-[#06B6D4] focus:ring-[#06B6D4]/20'
                                            }`}
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="text-xs text-red-400 flex items-center gap-1 pl-1 pt-0.5">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span>{errors.name}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Email Input with Prefix Autocomplete Suggestions */}
                                <div className="space-y-1 relative">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#06B6D4] transition-colors">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="email"
                                            name="nexus_user_email"
                                            autoComplete="off"
                                            autoCorrect="off"
                                            autoCapitalize="none"
                                            spellCheck="false"
                                            value={formData.email}
                                            onChange={(e) => {
                                                setFormData({ ...formData, email: e.target.value });
                                                setShowSuggestions(true);
                                            }}
                                            onFocus={() => {
                                                if (formData.email.trim()) setShowSuggestions(true);
                                            }}
                                            onBlur={() => {
                                                setTimeout(() => setShowSuggestions(false), 200);
                                            }}
                                            placeholder="Campus Email"
                                            disabled={loading}
                                            required
                                            className={`w-full pl-10 pr-4 py-3 bg-slate-950/70 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                                                errors.email
                                                    ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20'
                                                    : 'border-slate-800 focus:border-[#06B6D4] focus:ring-[#06B6D4]/20'
                                            }`}
                                        />
                                    </div>

                                    {/* Custom Prefix Suggestions Dropdown */}
                                    {showSuggestions && emailSuggestions.length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.85),0_0_20px_rgba(168,85,247,0.25)] overflow-hidden">
                                            <div className="px-3 py-1.5 bg-slate-950/90 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                                <span className="flex items-center gap-1.5">
                                                    <Sparkles className="w-3 h-3 text-[#06B6D4]" />
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
                                                            className="w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between gap-2 hover:bg-[#06B6D4]/20 hover:text-white text-slate-200 transition-colors group cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className="w-6 h-6 rounded-lg bg-[#06B6D4]/20 text-[#22D3EE] flex items-center justify-center flex-shrink-0 group-hover:bg-[#06B6D4] group-hover:text-white transition-colors">
                                                                    <Mail className="w-3.5 h-3.5" />
                                                                </div>
                                                                <span className="font-medium truncate group-hover:text-[#22D3EE]">
                                                                    {sug}
                                                                </span>
                                                            </div>
                                                            {binding?.domainName && (
                                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 group-hover:border-[#06B6D4]/50 group-hover:text-[#22D3EE] flex-shrink-0">
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
                            </div>

                            {/* Student USN Input — only shown and required for Student role */}
                            {formData.role === ROLES.STUDENT && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-1"
                                >
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                                            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                                            <span>Student USN (University Seat Number) *</span>
                                        </label>
                                        <span className="text-[10px] text-slate-400 font-mono">e.g. 1KS21CS001</span>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-400 group-focus-within:text-indigo-300 font-mono font-bold text-xs tracking-wider">
                                            USN
                                        </div>
                                        <input
                                            type="text"
                                            name="nexus_student_usn"
                                            autoComplete="off"
                                            spellCheck="false"
                                            value={formData.usn}
                                            onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
                                            placeholder="Enter your USN (e.g. 1KS21CS001)"
                                            disabled={loading}
                                            required
                                            className={`w-full pl-14 pr-4 py-3 bg-slate-950/70 border rounded-xl text-white placeholder-slate-500 font-mono tracking-wider text-sm focus:outline-none focus:ring-2 transition-all ${
                                                errors.usn
                                                    ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20'
                                                    : 'border-indigo-500/50 focus:border-indigo-400 focus:ring-indigo-500/25 bg-indigo-950/10'
                                            }`}
                                        />
                                    </div>
                                    {errors.usn ? (
                                        <p className="text-xs text-red-400 flex items-center gap-1 pl-1 pt-0.5">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span>{errors.usn}</span>
                                        </p>
                                    ) : (
                                        <p className="text-[11px] text-slate-400 pl-1">
                                            Staff and HOD use this USN to track student enrollment and attendance
                                        </p>
                                    )}
                                </motion.div>
                            )}

                            {/* Password & Confirm Password (2-col on sm) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Password */}
                                <div className="space-y-1">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#06B6D4] transition-colors">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="nexus_user_password"
                                            autoComplete="new-password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Password (min 6)"
                                            disabled={loading}
                                            required
                                            className={`w-full pl-10 pr-10 py-3 bg-slate-950/70 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                                                errors.password
                                                    ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20'
                                                    : 'border-slate-800 focus:border-[#06B6D4] focus:ring-[#06B6D4]/20'
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                                            tabIndex={-1}
                                            title={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-xs text-red-400 flex items-center gap-1 pl-1 pt-0.5">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span>{errors.password}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-1">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#06B6D4] transition-colors">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="nexus_user_confirm_password"
                                            autoComplete="new-password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            placeholder="Confirm Password"
                                            disabled={loading}
                                            required
                                            className={`w-full pl-10 pr-10 py-3 bg-slate-950/70 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                                                errors.confirmPassword
                                                    ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20'
                                                    : 'border-slate-800 focus:border-[#06B6D4] focus:ring-[#06B6D4]/20'
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                                            tabIndex={-1}
                                            title={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="text-xs text-red-400 flex items-center gap-1 pl-1 pt-0.5">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            <span>{errors.confirmPassword}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* ── Symmetrical Role Selector ── */}
                            <div className="space-y-3.5 pt-2">
                                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Select Role</span>
                                    </span>
                                    <span className="text-[11px] text-slate-400">Applies across all domains</span>
                                </div>

                                {/* Section 1: Academic Community (3 Equal Columns) */}
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
                                        Academic Community · Full Access
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {ACADEMIC_ROLES.map((item) => {
                                            const isSelected = formData.role === item.role;
                                            const Icon = item.icon;
                                            return (
                                                <button
                                                    key={item.role}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, role: item.role })}
                                                    className={`p-2.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between gap-1.5 hover:scale-[1.02] active:scale-[0.98] ${
                                                        isSelected
                                                            ? item.activeStyle
                                                            : `border-slate-800 bg-slate-900/60 text-slate-300 ${item.glowColor} hover:text-white hover:bg-slate-800/70`
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
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
                                        Service Desk Admins · Domain Specific
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {SERVICE_ROLES.map((item) => {
                                            const isSelected = formData.role === item.role;
                                            const Icon = item.icon;
                                            return (
                                                <button
                                                    key={item.role}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, role: item.role })}
                                                    className={`p-2.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between gap-1.5 hover:scale-[1.02] active:scale-[0.98] ${
                                                        isSelected
                                                            ? item.activeStyle
                                                            : `border-slate-800 bg-slate-900/60 text-slate-300 ${item.glowColor} hover:text-white hover:bg-slate-800/70`
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

                            {/* Department Selection — shown for Student, Staff, and HOD */}
                            {(formData.role === ROLES.STUDENT || formData.role === ROLES.STAFF || formData.role === ROLES.HOD || formData.role === ROLES.TEACHER) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-1.5 overflow-hidden pt-2"
                                >
                                    <label className="text-xs font-semibold text-slate-300">
                                        {formData.role === ROLES.HOD
                                            ? 'Department you lead:'
                                            : formData.role === ROLES.STUDENT
                                            ? 'Your Student Department / Branch:'
                                            : 'Assigned Faculty Department:'}
                                    </label>
                                    <select
                                        value={formData.departmentId}
                                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                        disabled={loading}
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white text-sm focus:border-[#06B6D4] focus:outline-none transition-colors"
                                    >
                                        {DEPARTMENTS.map((dept) => (
                                            <option key={dept.id} value={dept.id} className="bg-slate-900 text-white">
                                                {dept.label} ({dept.id})
                                            </option>
                                        ))}
                                    </select>
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full overflow-hidden bg-[#06B6D4] hover:bg-[#22D3EE] text-[#070A11] py-3.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        <span>Creating account...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Create Account as {selectedRoleInfo?.label || 'Campus User'}</span>
                                        <UserPlus className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 text-center">
                        <p className="text-slate-400 text-xs">
                            Already have an account?{' '}
                            <Link
                                to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
                                className="text-[#06B6D4] font-bold hover:text-[#22D3EE] transition-colors inline-flex items-center gap-1 ml-1"
                            >
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
