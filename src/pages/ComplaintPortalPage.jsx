import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert,
    AlertTriangle,
    FileText,
    Send,
    CheckCircle2,
    Clock,
    XCircle,
    Search,
    Filter,
    Plus,
    Eye,
    Download,
    Trash2,
    Edit3,
    ArrowUpRight,
    User,
    ShieldCheck,
    GraduationCap,
    Home,
    MapPin,
    Building2,
    Lock,
    Unlock,
    Paperclip,
    ExternalLink,
    RefreshCw,
    X,
    MessageSquare,
    Check,
    AlertCircle,
    Calendar,
    UploadCloud,
    Image,
    Film,
    File,
    Music
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ROLES, DEPARTMENTS } from '../utils/constants';
import {
    getComplaints,
    subscribeComplaints,
    createComplaint,
    updateComplaint,
    deleteComplaint
} from '../services/campusUtilitiesService';

const COMPLAINT_CATEGORIES = [
    'Infrastructure & Lab Equipment',
    'Campus Wi-Fi & IT Services',
    'Academic & Faculty Matters',
    'Digital Library & Books',
    'Campus Facilities & Hygiene',
    'Transport & Bus Transit',
    'Canteen & Food Quality',
    'Hostel Accommodation',
    'Anti-Ragging & Safety',
    'Other Administrative Concerns'
];

const SEVERITY_LEVELS = [
    { value: 'Low', label: 'Low', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    { value: 'Medium', label: 'Medium', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    { value: 'High', label: 'High', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
    { value: 'Urgent', label: 'Urgent / Critical', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 font-black' }
];

const TARGET_AUTHORITIES = [
    'HOD (Head of Department)',
    'Staff Advisor (Faculty Mentor)',
    'Campus Maintenance Desk',
    'Hostel & Transit Warden',
    'Anti-Ragging & Disciplinary Cell'
];

const STATUS_CONFIG = {
    'Pending Review': {
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        icon: Clock,
        step: 1
    },
    'In Progress': {
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        icon: AlertCircle,
        step: 2
    },
    'Resolved': {
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        icon: CheckCircle2,
        step: 3
    },
    'Dismissed': {
        color: 'bg-gray-500/10 text-slate-400 border-gray-500/30',
        icon: XCircle,
        step: 0
    }
};

export default function ComplaintPortalPage() {
    const navigate = useNavigate();
    const { getDomainUser, logoutDomain } = useAuth();
    const user = getDomainUser('complaints');

    const isStudent = user?.role === ROLES.STUDENT;
    const isStaffOrHod = user?.role === ROLES.STAFF || user?.role === ROLES.HOD || user?.role === ROLES.ADMIN || user?.role === ROLES.TEACHER;
    const isHod = user?.role === ROLES.HOD;

    // State
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    // Tab Navigation:
    // Students can switch between 'submit' (Lodge Complaint) and 'myComplaints' (Track Complaints)
    // Staff/HOD see 'allComplaints' (Review All Complaints) and 'analytics'
    const [activeTab, setActiveTab] = useState(isStudent ? 'myComplaints' : 'allComplaints');

    // Filters for Staff / HOD view
    const [statusFilter, setStatusFilter] = useState('All');
    const [severityFilter, setSeverityFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [selectedComplaint, setSelectedComplaint] = useState(null); // Detail modal
    const [resolvingComplaint, setResolvingComplaint] = useState(null); // Resolution action modal

    // Resolution Form State for Staff & HOD
    const [actionForm, setActionForm] = useState({
        status: 'In Progress',
        officialRemarks: '',
        assignedTo: ''
    });
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Complaint Submission Form State (for Students)
    const initialFormState = {
        title: '',
        category: COMPLAINT_CATEGORIES[0],
        department: user?.department || 'Computer Science & Engineering',
        departmentId: user?.departmentId || 'CSE',
        severity: 'Medium',
        targetAuthority: TARGET_AUTHORITIES[0],
        location: '',
        description: '',
        isAnonymous: false,
        attachmentUrl: ''
    };
    const [form, setForm] = useState(initialFormState);
    const [submitting, setSubmitting] = useState(false);

    // Multi-File Upload & Evidence State (Photos, Videos, PDFs & All Formats)
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkName, setLinkName] = useState('');
    const fileInputRef = React.useRef(null);

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getAttachmentType = (att) => {
        if (att?.type && ['image', 'video', 'audio', 'pdf', 'document', 'spreadsheet', 'archive'].includes(att.type)) {
            return att.type;
        }
        const url = (att?.url || '').toLowerCase();
        const name = (att?.name || '').toLowerCase();
        const mime = (att?.mimeType || '').toLowerCase();

        if (mime.startsWith('image/') || url.startsWith('data:image/') || url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i) || name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)) {
            return 'image';
        }
        if (mime.startsWith('video/') || url.startsWith('data:video/') || url.match(/\.(mp4|webm|ogg|mov|mkv|avi|m4v)(\?.*)?$/i) || name.match(/\.(mp4|webm|ogg|mov|mkv|avi|m4v)$/i)) {
            return 'video';
        }
        if (mime.startsWith('audio/') || url.startsWith('data:audio/') || url.match(/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i) || name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
            return 'audio';
        }
        if (mime === 'application/pdf' || url.startsWith('data:application/pdf') || url.includes('.pdf') || name.endsWith('.pdf')) {
            return 'pdf';
        }
        if (name.match(/\.(doc|docx|odt|rtf|txt)$/i)) {
            return 'document';
        }
        if (name.match(/\.(xls|xlsx|csv)$/i)) {
            return 'spreadsheet';
        }
        if (name.match(/\.(zip|rar|7z|tar|gz)$/i)) {
            return 'archive';
        }
        return 'file';
    };

    const handleFiles = (filesList) => {
        const files = Array.from(filesList || []);
        if (!files.length) return;

        files.forEach(file => {
            let type = 'file';
            const nameLower = file.name.toLowerCase();
            if (file.type.startsWith('image/') || nameLower.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)) type = 'image';
            else if (file.type.startsWith('video/') || nameLower.match(/\.(mp4|webm|mov|mkv|avi|m4v)$/i)) type = 'video';
            else if (file.type.startsWith('audio/') || nameLower.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) type = 'audio';
            else if (file.type === 'application/pdf' || nameLower.endsWith('.pdf')) type = 'pdf';
            else if (nameLower.match(/\.(doc|docx|odt|rtf|txt)$/i)) type = 'document';
            else if (nameLower.match(/\.(xls|xlsx|csv)$/i)) type = 'spreadsheet';
            else if (nameLower.match(/\.(zip|rar|7z|tar|gz)$/i)) type = 'archive';

            const reader = new FileReader();
            reader.onload = (e) => {
                setAttachedFiles(prev => [
                    ...prev,
                    {
                        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                        name: file.name,
                        url: e.target.result,
                        type,
                        mimeType: file.type || 'application/octet-stream',
                        size: formatFileSize(file.size),
                        sizeBytes: file.size,
                        uploadedAt: new Date().toISOString()
                    }
                ]);
            };
            reader.readAsDataURL(file);
        });
        toast.success(`Attached ${files.length} file${files.length > 1 ? 's' : ''}`);
    };

    const handleAddLinkAttachment = (e) => {
        if (e) e.preventDefault();
        if (!linkUrl.trim()) {
            toast.error('Please enter a valid URL');
            return;
        }
        const url = linkUrl.trim();
        const lower = url.toLowerCase();
        let type = 'file';
        if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) type = 'image';
        else if (lower.match(/\.(mp4|webm|mov|mkv|avi)(\?.*)?$/i) || lower.includes('youtube.com') || lower.includes('youtu.be')) type = 'video';
        else if (lower.match(/\.(mp3|wav|ogg)(\?.*)?$/i)) type = 'audio';
        else if (lower.includes('.pdf')) type = 'pdf';

        setAttachedFiles(prev => [
            ...prev,
            {
                id: `att-link-${Date.now()}`,
                name: linkName.trim() || 'Evidence Cloud/Web Link',
                url: url,
                type: type,
                size: 'Web Link',
                isExternal: true
            }
        ]);
        setLinkUrl('');
        setLinkName('');
        setShowLinkInput(false);
        toast.success('Evidence link added!');
    };

    const removeAttachment = (id) => {
        setAttachedFiles(prev => prev.filter(a => a.id !== id));
    };

    // Fetch Complaints (role-aware)
    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getComplaints(user);
            setComplaints(data);
        } catch (err) {
            console.error('Failed to load complaints:', err);
            toast.error('Failed to load complaint data');
        } finally {
            setLoading(false);
        }
    };

    // Real-time listener for role-aware complaints
    useEffect(() => {
        if (!user?.id) {
            setComplaints([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeComplaints(
            user,
            (data) => {
                setComplaints(data);
                setLoading(false);
            },
            () => setLoading(false)
        );

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user?.id, user?.role, user?.departmentId, user?.department, user?.isDemo]);

    // Filtered Complaints for Staff & HOD
    const filteredComplaints = useMemo(() => {
        return complaints.filter(c => {
            if (statusFilter !== 'All' && c.status !== statusFilter) return false;
            if (severityFilter !== 'All' && c.severity !== severityFilter) return false;
            if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchTicket = c.ticketNumber?.toLowerCase().includes(q);
                const matchTitle = c.title?.toLowerCase().includes(q);
                const matchDesc = c.description?.toLowerCase().includes(q);
                const matchStudent = c.studentName?.toLowerCase().includes(q) || c.studentUsn?.toLowerCase().includes(q);
                const matchDept = c.department?.toLowerCase().includes(q);
                const matchLoc = c.location?.toLowerCase().includes(q);
                if (!matchTicket && !matchTitle && !matchDesc && !matchStudent && !matchDept && !matchLoc) return false;
            }

            return true;
        });
    }, [complaints, statusFilter, severityFilter, categoryFilter, searchQuery]);

    // Student's Own Filed Complaints (includes tracked anonymous complaints)
    const myComplaints = useMemo(() => {
        if (isStudent) {
            // All complaints returned from role-aware student query & tracked subcollection belong to this student
            return complaints;
        }
        return complaints.filter(c => {
            return (
                (c.studentId === user?.id || c.studentId === user?.uid || c.studentEmail === user?.email || (c.studentUsn === user?.usn && !c.isAnonymous))
            );
        });
    }, [complaints, user, isStudent]);

    // Summary Metrics
    const metrics = useMemo(() => {
        const total = complaints.length;
        const pending = complaints.filter(c => c.status === 'Pending Review').length;
        const inProgress = complaints.filter(c => c.status === 'In Progress').length;
        const resolved = complaints.filter(c => c.status === 'Resolved').length;
        const urgent = complaints.filter(c => c.severity === 'Urgent' && c.status !== 'Resolved').length;
        return { total, pending, inProgress, resolved, urgent };
    }, [complaints]);

    // ── Student: Submit Complaint ──
    const handleStudentSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) {
            toast.error('Please enter a complaint subject');
            return;
        }
        if (!form.description.trim()) {
            toast.error('Please provide a detailed description of the issue');
            return;
        }

        setSubmitting(true);
        try {
            const finalAttachments = [...attachedFiles];
            if (form.attachmentUrl && form.attachmentUrl.trim()) {
                finalAttachments.push({
                    id: `att-link-${Date.now()}`,
                    name: 'Evidence Cloud Link',
                    url: form.attachmentUrl.trim(),
                    type: 'file',
                    size: 'Web Link',
                    isExternal: true
                });
            }

            const newComplaint = await createComplaint({
                title: form.title,
                category: form.category,
                department: form.department,
                severity: form.severity,
                targetAuthority: form.targetAuthority,
                location: form.location || 'Campus Premises',
                description: form.description,
                isAnonymous: form.isAnonymous,
                studentId: user?.id || user?.uid,
                studentName: user?.name || '',
                studentUsn: user?.usn || '',
                studentEmail: user?.email || '',
                studentPhone: user?.phone || '',
                attachments: finalAttachments
            });

            toast.success(`Complaint registered! Ticket #${newComplaint.ticketNumber} 📋`, { duration: 5000 });
            setForm(initialFormState);
            setAttachedFiles([]);
            setLinkUrl('');
            setLinkName('');
            setShowLinkInput(false);
            await loadData();
            setActiveTab('myComplaints');
        } catch (err) {
            console.error(err);
            toast.error('Failed to submit complaint');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Staff & HOD: Open Resolution Modal ──
    const handleOpenResolutionModal = (complaint) => {
        setResolvingComplaint(complaint);
        setActionForm({
            status: complaint.status || 'In Progress',
            officialRemarks: complaint.officialRemarks || '',
            assignedTo: complaint.assignedTo || user?.name
        });
    };

    // ── Staff & HOD: Save Status / Resolution ──
    const handleSaveResolution = async (e) => {
        e.preventDefault();
        if (!resolvingComplaint) return;

        setUpdatingStatus(true);
        try {
            const updates = {
                status: actionForm.status,
                officialRemarks: actionForm.officialRemarks.trim(),
                assignedTo: actionForm.assignedTo.trim() || user?.name,
                resolvedAt: actionForm.status === 'Resolved' ? new Date().toISOString() : null
            };

            await updateComplaint(resolvingComplaint.id, updates);
            toast.success(`Ticket #${resolvingComplaint.ticketNumber} updated to ${actionForm.status}!`);
            setResolvingComplaint(null);
            await loadData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to update complaint status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    // ── HOD: Delete Complaint ──
    const handleDeleteComplaint = async (complaintId, ticketNumber) => {
        if (window.confirm(`Are you sure you want to delete complaint #${ticketNumber}?`)) {
            try {
                await deleteComplaint(complaintId);
                toast.success('Complaint record removed.');
                await loadData();
            } catch (err) {
                toast.error('Failed to delete complaint');
            }
        }
    };

    // ── Export Complaints to CSV (Staff & HOD) ──
    const handleExportCSV = () => {
        if (complaints.length === 0) {
            toast.error('No complaints to export.');
            return;
        }

        const headers = ['Ticket Number', 'Subject', 'Category', 'Department', 'Severity', 'Status', 'Submitted By', 'USN', 'Target Authority', 'Location', 'Submitted At', 'Remarks'];
        const rows = complaints.map(c => [
            c.ticketNumber,
            `"${c.title?.replace(/"/g, '""')}"`,
            `"${c.category}"`,
            `"${c.department}"`,
            c.severity,
            c.status,
            `"${c.isAnonymous ? 'Anonymous' : c.studentName}"`,
            c.isAnonymous ? 'N/A' : c.studentUsn,
            `"${c.targetAuthority}"`,
            `"${c.location}"`,
            c.submittedAt?.split('T')[0] || '',
            `"${(c.officialRemarks || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Campus_Grievance_Log_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${complaints.length} complaint records to CSV! 📥`);
    };

    return (
        <div className="min-h-screen bg-[#F5F6FF] dark:bg-[#070A11] text-[#202442] dark:text-slate-100 font-sans p-4 sm:p-6 lg:p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Top Bar ── */}
                <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl backdrop-blur-xl bg-[#0D1527] border border-[#1E2D4A] shadow-sm">
                    {/* Back to Campus Home */}
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-white px-3.5 py-2 rounded-xl bg-[#0A0F1D] hover:bg-[#1E2D4A]/50 border border-[#1E2D4A] transition-all shadow-sm"
                        >
                            <Home className="w-4 h-4 text-red-500" />
                            <span>Campus Home</span>
                        </Link>

                        <div className="h-4 w-px bg-gray-300 dark:bg-white/10" />

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-500/20">
                                <ShieldAlert className="w-4 h-4" />
                            </div>
                            <div>
                                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                                    Complaint <span className="text-red-600 dark:text-red-400">Portal</span>
                                </h1>
                                <p className="text-[10px] text-slate-400">
                                    {isStaffOrHod ? 'Staff & HOD Review & Redressal Console' : 'Student Complaint Lodging & Resolution Tracker'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* User Session & Control */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Current User Pill */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold">
                            {isHod ? <ShieldCheck className="w-3.5 h-3.5 text-rose-500" /> : isStaffOrHod ? <Building2 className="w-3.5 h-3.5 text-purple-500" /> : <GraduationCap className="w-3.5 h-3.5 text-red-500" />}
                            <span>{user?.name} ({user?.role?.toUpperCase()})</span>
                        </div>

                        {/* Sign Out */}
                        <button
                            onClick={() => {
                                logoutDomain('complaints');
                                toast.success('Signed out from Complaint Portal');
                                navigate('/login');
                            }}
                            className="text-xs px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 font-medium transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </header>

                {/* ── Key Metrics Ribbon (Visible to Staff & HOD, or Summary for Student) ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-[#0D1527] border border-[#1E2D4A] shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-semibold text-slate-400">Total Grievances</div>
                            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{metrics.total}</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#0D1527] border border-[#1E2D4A] shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-semibold text-slate-400">Pending Review</div>
                            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{metrics.pending}</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#0D1527] border border-[#1E2D4A] shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-semibold text-slate-400">In Progress</div>
                            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{metrics.inProgress}</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#0D1527] border border-[#1E2D4A] shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-semibold text-slate-400">Action Taken / Resolved</div>
                            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{metrics.resolved}</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* ── Main Navigation Tabs ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2D4A] pb-3">
                    <div className="flex items-center gap-2">
                        {/* Student Tabs */}
                        {isStudent && (
                            <>
                                <button
                                    onClick={() => setActiveTab('submit')}
                                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                                        activeTab === 'submit'
                                            ? 'bg-red-600 text-white shadow-md shadow-red-500/25'
                                            : 'bg-white/60 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
                                    }`}
                                >
                                    <Send className="w-4 h-4" />
                                    <span>Lodge New Complaint</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('myComplaints')}
                                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 relative ${
                                        activeTab === 'myComplaints'
                                            ? 'bg-red-600 text-white shadow-md shadow-red-500/25'
                                            : 'bg-white/60 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
                                    }`}
                                >
                                    <FileText className="w-4 h-4" />
                                    <span>My Filed Complaints</span>
                                    {myComplaints.length > 0 && (
                                        <span className="w-5 h-5 rounded-full bg-white text-red-600 dark:bg-red-950 dark:text-red-200 text-[11px] font-black flex items-center justify-center">
                                            {myComplaints.length}
                                        </span>
                                    )}
                                </button>
                            </>
                        )}

                        {/* Staff & HOD Tabs */}
                        {isStaffOrHod && (
                            <>
                                <button
                                    onClick={() => setActiveTab('allComplaints')}
                                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                                        activeTab === 'allComplaints'
                                            ? 'bg-red-600 text-white shadow-md shadow-red-500/25'
                                            : 'bg-white/60 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
                                    }`}
                                >
                                    <ShieldAlert className="w-4 h-4" />
                                    <span>All Student Complaints ({complaints.length})</span>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Staff & HOD Export Button */}
                    {isStaffOrHod && (
                        <button
                            onClick={handleExportCSV}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0A0F1D] hover:bg-[#1E2D4A]/50 border border-[#1E2D4A] text-xs font-bold text-gray-700 dark:text-gray-200 shadow-sm transition-all"
                        >
                            <Download className="w-3.5 h-3.5 text-red-500" />
                            <span>Export Report (.CSV)</span>
                        </button>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════════════════
                    STUDENT VIEW: LODGE NEW COMPLAINT FORM
                ══════════════════════════════════════════════════════════════════════ */}
                {isStudent && activeTab === 'submit' && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl bg-[#0D1527] border border-[#1E2D4A] shadow-lg p-6 sm:p-8"
                    >
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div>
                                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                                    <Send className="w-5 h-5 text-red-500" />
                                    <span>Submit a Complaint / Grievance</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                                    Your grievance will be directly routed to the department HOD and faculty committee for prompt investigation and resolution.
                                </p>
                            </div>

                            <form onSubmit={handleStudentSubmit} className="space-y-5">
                                {/* Title */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        Complaint Subject / Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Lab 3 Projector failure during afternoon practical sessions"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>

                                {/* Category & Department */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Category *
                                        </label>
                                        <select
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                        >
                                            {COMPLAINT_CATEGORIES.map(cat => (
                                                <option key={cat} value={cat} className="bg-gray-900 text-white">{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Related Department
                                        </label>
                                        <select
                                            value={form.department}
                                            onChange={(e) => {
                                                const dep = DEPARTMENTS.find(d => d.label === e.target.value);
                                                setForm({
                                                    ...form,
                                                    department: e.target.value,
                                                    departmentId: dep ? dep.id : 'ALL'
                                                });
                                            }}
                                            className="w-full px-3 py-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                        >
                                            <option value="All Departments" className="bg-gray-900 text-white">Campus Wide / All Departments</option>
                                            {DEPARTMENTS.map(d => (
                                                <option key={d.id} value={d.label} className="bg-gray-900 text-white">{d.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Severity & Target Authority */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Urgency / Severity Level
                                        </label>
                                        <select
                                            value={form.severity}
                                            onChange={(e) => setForm({ ...form, severity: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                        >
                                            {SEVERITY_LEVELS.map(sev => (
                                                <option key={sev.value} value={sev.value} className="bg-gray-900 text-white">{sev.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Submit Directly To
                                        </label>
                                        <select
                                            value={form.targetAuthority}
                                            onChange={(e) => setForm({ ...form, targetAuthority: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                        >
                                            {TARGET_AUTHORITIES.map(auth => (
                                                <option key={auth} value={auth} className="bg-gray-900 text-white">{auth}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        Campus Location / Room / Lab No.
                                    </label>
                                    <div className="relative">
                                        <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="e.g. Lab 3, 4th Floor, CSE Block"
                                            value={form.location}
                                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        Detailed Grievance Statement *
                                    </label>
                                    <textarea
                                        rows={4}
                                        required
                                        placeholder="Please provide full facts, affected equipment/systems, times observed, and any prior communication..."
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>

                                {/* Evidence & Supporting Files (Photos, Videos, PDFs & All Files) */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-slate-300">
                                            Evidence & Supporting Proof (Photos, Videos & All Files)
                                        </label>
                                        <span className="text-[11px] font-semibold text-gray-500">
                                            {attachedFiles.length} {attachedFiles.length === 1 ? 'file' : 'files'} attached
                                        </span>
                                    </div>

                                    {/* Drag & Drop Upload Zone */}
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDragging(false);
                                            if (e.dataTransfer?.files?.length) {
                                                handleFiles(e.dataTransfer.files);
                                            }
                                        }}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`relative p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center group ${
                                            isDragging
                                                ? 'border-red-500 bg-red-500/10 scale-[1.01]'
                                                : 'border-gray-300 dark:border-white/15 bg-gray-50/70 dark:bg-white/[0.02] hover:border-red-400 hover:bg-red-50/40 dark:hover:bg-red-950/10'
                                        }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept="*/*"
                                            onChange={(e) => {
                                                if (e.target.files?.length) {
                                                    handleFiles(e.target.files);
                                                    e.target.value = '';
                                                }
                                            }}
                                            className="hidden"
                                        />

                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                                <UploadCloud className="w-6 h-6" />
                                            </div>

                                            <div>
                                                <p className="text-xs sm:text-sm font-bold text-slate-200">
                                                    Click to browse or drag & drop files here
                                                </p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    Upload photos, incident videos, PDFs, docs, audio, or any proof files
                                                </p>
                                            </div>

                                            {/* File category tags */}
                                            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[10px]">
                                                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
                                                    📷 Photos (JPG, PNG, GIF, WEBP)
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-medium">
                                                    🎥 Videos (MP4, WEBM, MOV)
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                                                    📄 Documents (PDF, DOCX, TXT)
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                                                    📦 All File Formats
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Optional Cloud Link Form */}
                                    <div>
                                        {!showLinkInput ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowLinkInput(true)}
                                                className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold flex items-center gap-1.5"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>+ Or paste a Cloud / Drive link (Google Drive, OneDrive, YouTube, Dropbox)</span>
                                            </button>
                                        ) : (
                                            <div className="p-3.5 rounded-2xl bg-[#0A0F1D] border border-[#1E2D4A] space-y-2.5">
                                                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                                                    <span className="flex items-center gap-1.5">
                                                        <Paperclip className="w-3.5 h-3.5 text-red-500" />
                                                        <span>Add Cloud / Web Evidence Link</span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowLinkInput(false)}
                                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Label (e.g. Lab CCTV Video Drive)"
                                                        value={linkName}
                                                        onChange={(e) => setLinkName(e.target.value)}
                                                        className="sm:col-span-1 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-xs text-white"
                                                    />
                                                    <input
                                                        type="url"
                                                        placeholder="https://drive.google.com/..."
                                                        value={linkUrl}
                                                        onChange={(e) => setLinkUrl(e.target.value)}
                                                        className="sm:col-span-2 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 text-xs text-white"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowLinkInput(false)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddLinkAttachment}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 shadow-sm"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        <span>Add Link</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Attached Files Previews Grid */}
                                    {attachedFiles.length > 0 && (
                                        <div className="space-y-2 pt-1">
                                            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                Attached Evidence ({attachedFiles.length})
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                {attachedFiles.map((file) => {
                                                    const attType = file.type || getAttachmentType(file);

                                                    return (
                                                        <div
                                                            key={file.id}
                                                            className="p-2.5 rounded-xl border border-[#1E2D4A] bg-white dark:bg-white/5 flex items-center justify-between gap-3 shadow-sm hover:border-red-300 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                {attType === 'image' && file.url ? (
                                                                    <img
                                                                        src={file.url}
                                                                        alt={file.name}
                                                                        className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-black/10"
                                                                    />
                                                                ) : attType === 'video' ? (
                                                                    <div className="w-11 h-11 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                                                                        <Film className="w-5 h-5" />
                                                                    </div>
                                                                ) : attType === 'audio' ? (
                                                                    <div className="w-11 h-11 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                                                                        <Music className="w-5 h-5" />
                                                                    </div>
                                                                ) : attType === 'pdf' ? (
                                                                    <div className="w-11 h-11 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 border border-red-500/20">
                                                                        <FileText className="w-5 h-5" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-11 h-11 rounded-lg bg-gray-500/10 text-slate-400 flex items-center justify-center flex-shrink-0 border border-gray-500/20">
                                                                        <File className="w-5 h-5" />
                                                                    </div>
                                                                )}

                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold text-white truncate" title={file.name}>
                                                                        {file.name}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                                                                        <span className="uppercase font-semibold px-1 py-0.2 rounded bg-gray-100 dark:bg-white/10 text-slate-300">
                                                                            {attType}
                                                                        </span>
                                                                        <span>{file.size}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => removeAttachment(file.id)}
                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex-shrink-0"
                                                                title="Remove file"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Anonymous Submission Toggle */}
                                <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/10 border border-red-200/80 dark:border-red-500/20 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
                                            {form.isAnonymous ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white">
                                                Submit Anonymously
                                            </div>
                                            <div className="text-[11px] text-gray-500">
                                                {form.isAnonymous
                                                    ? 'Your name, USN, and contact will be completely hidden from faculty & HOD.'
                                                    : `Submitting as: ${user?.name} (${user?.usn || 'Student'})`}
                                            </div>
                                        </div>
                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={form.isAnonymous}
                                        onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                                        className="w-5 h-5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="pt-2 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-red-500/25 transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        <span>{submitting ? 'Registering...' : 'Lodge Complaint Now'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* ══════════════════════════════════════════════════════════════════════
                    STUDENT VIEW: MY FILED COMPLAINTS
                ══════════════════════════════════════════════════════════════════════ */}
                {isStudent && activeTab === 'myComplaints' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-red-500" />
                                <span>My Registered Grievances</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-bold">
                                    {myComplaints.length}
                                </span>
                            </h3>

                            <button
                                onClick={() => setActiveTab('submit')}
                                className="px-3.5 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-red-500 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Lodge Another Complaint</span>
                            </button>
                        </div>

                        {myComplaints.length === 0 ? (
                            <div className="text-center py-16 px-4 rounded-2xl bg-[#0D1527] border border-dashed border-[#1E2D4A]">
                                <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <h4 className="text-base font-bold text-slate-200">No active complaints lodged</h4>
                                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                                    If you are facing any academic, laboratory, Wi-Fi, or campus facilities issue, lodge a complaint and track real-time resolution.
                                </p>
                                <button
                                    onClick={() => setActiveTab('submit')}
                                    className="mt-4 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-md hover:bg-amber-600 transition-colors"
                                >
                                    + Lodge Complaint
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {myComplaints.map(c => {
                                    const statusObj = STATUS_CONFIG[c.status] || STATUS_CONFIG['Pending Review'];
                                    const StatusIcon = statusObj.icon;

                                    return (
                                        <div
                                            key={c.id}
                                            className="rounded-2xl p-5 bg-[#0D1527] border border-[#1E2D4A] shadow-md hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                                                        #{c.ticketNumber}
                                                    </span>

                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 border ${statusObj.color}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {c.status}
                                                    </span>
                                                </div>

                                                <h4 className="text-base font-bold text-white line-clamp-2">
                                                    {c.title}
                                                </h4>

                                                <p className="text-xs text-slate-400 line-clamp-2">
                                                    {c.description}
                                                </p>

                                                <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-gray-500 border-t border-gray-100 dark:border-white/5">
                                                    <div>
                                                        <span className="text-gray-400">Category: </span>
                                                        <span className="font-medium text-slate-300 truncate block">{c.category}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Target Authority: </span>
                                                        <span className="font-medium text-slate-300 truncate block">{c.targetAuthority}</span>
                                                    </div>
                                                </div>

                                                {/* Attached Files Indicator */}
                                                {c.attachments && c.attachments.length > 0 && (
                                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-lg w-fit">
                                                        <Paperclip className="w-3 h-3" />
                                                        <span>{c.attachments.length} Evidence File{c.attachments.length > 1 ? 's' : ''} Attached</span>
                                                    </div>
                                                )}

                                                {/* Official Remarks Preview */}
                                                {c.officialRemarks && (
                                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                                                        <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-0.5">
                                                            <Check className="w-3.5 h-3.5" /> Official Action Remark:
                                                        </div>
                                                        <p className="text-slate-300 text-[11px] line-clamp-2">
                                                            {c.officialRemarks}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-white/5 text-xs">
                                                <span className="text-gray-400">
                                                    Filed: {c.submittedAt?.split('T')[0]}
                                                </span>

                                                <button
                                                    onClick={() => setSelectedComplaint(c)}
                                                    className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold flex items-center gap-1 transition-colors"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>View Full Progress</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════════
                    STAFF & HOD VIEW: REVIEW ALL POSTED COMPLAINTS
                ══════════════════════════════════════════════════════════════════════ */}
                {isStaffOrHod && activeTab === 'allComplaints' && (
                    <div className="space-y-4">
                        {/* Filter Bar */}
                        <div className="p-4 rounded-2xl bg-[#0D1527] border border-[#1E2D4A] shadow-sm space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                {/* Search */}
                                <div className="relative flex-1 min-w-[240px]">
                                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by ticket #, USN, student name, keyword..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Status Filter */}
                                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs">
                                    {['All', 'Pending Review', 'In Progress', 'Resolved'].map(st => (
                                        <button
                                            key={st}
                                            onClick={() => setStatusFilter(st)}
                                            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                                                statusFilter === st
                                                    ? 'bg-red-600 text-white shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
                                            }`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Secondary Filters */}
                            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-gray-400 font-semibold">Severity:</span>
                                    <select
                                        value={severityFilter}
                                        onChange={(e) => setSeverityFilter(e.target.value)}
                                        className="px-2.5 py-1 rounded-lg bg-[#0A0F1D] border border-[#1E2D4A] text-slate-200"
                                    >
                                        <option value="All" className="bg-gray-900 text-white">All Severities</option>
                                        <option value="Urgent" className="bg-gray-900 text-white">Urgent / Critical</option>
                                        <option value="High" className="bg-gray-900 text-white">High</option>
                                        <option value="Medium" className="bg-gray-900 text-white">Medium</option>
                                        <option value="Low" className="bg-gray-900 text-white">Low</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <span className="text-gray-400 font-semibold">Category:</span>
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="px-2.5 py-1 rounded-lg bg-[#0A0F1D] border border-[#1E2D4A] text-slate-200"
                                    >
                                        <option value="All" className="bg-gray-900 text-white">All Categories</option>
                                        {COMPLAINT_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat} className="bg-gray-900 text-white">{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Complaint Feed / Table */}
                        {filteredComplaints.length === 0 ? (
                            <div className="text-center py-16 px-4 rounded-2xl bg-[#0D1527] border border-dashed border-[#1E2D4A]">
                                <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <h4 className="text-base font-bold text-slate-200">No complaints matching filters</h4>
                                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                                    All student grievances under this criteria have been resolved or no matching records exist.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-[#1E2D4A] bg-white/80 dark:bg-white/[0.03] overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-100/70 dark:bg-white/5 border-b border-[#1E2D4A] text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                                            <tr>
                                                <th className="p-3.5">Ticket & Student</th>
                                                <th className="p-3.5">Subject & Location</th>
                                                <th className="p-3.5">Category & Dept</th>
                                                <th className="p-3.5">Severity</th>
                                                <th className="p-3.5">Status</th>
                                                <th className="p-3.5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#1E2D4A]">
                                            {filteredComplaints.map(c => {
                                                const statusObj = STATUS_CONFIG[c.status] || STATUS_CONFIG['Pending Review'];
                                                const StatusIcon = statusObj.icon;
                                                const sevObj = SEVERITY_LEVELS.find(s => s.value === c.severity) || SEVERITY_LEVELS[1];

                                                return (
                                                    <tr key={c.id} className="hover:bg-[#0A0F1D]/80 transition-colors">
                                                        <td className="p-3.5 whitespace-nowrap">
                                                            <div className="font-mono font-bold text-red-600 dark:text-red-400">
                                                                #{c.ticketNumber}
                                                            </div>
                                                            <div className="text-[11px] font-semibold text-slate-200">
                                                                {c.isAnonymous ? '🔒 Anonymous Student' : c.studentName}
                                                            </div>
                                                            {!c.isAnonymous && c.studentUsn && (
                                                                <div className="text-[10px] font-mono text-gray-400">
                                                                    {c.studentUsn}
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className="p-3.5">
                                                            <div className="font-bold text-white line-clamp-1 max-w-xs">
                                                                {c.title}
                                                            </div>
                                                            <div className="text-[11px] text-gray-500 truncate max-w-xs flex items-center gap-1 mt-0.5">
                                                                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                                <span>{c.location || 'Campus'}</span>
                                                            </div>
                                                            {c.attachments && c.attachments.length > 0 && (
                                                                <div className="flex items-center gap-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400 mt-1">
                                                                    <Paperclip className="w-2.5 h-2.5" />
                                                                    <span>{c.attachments.length} attached file{c.attachments.length > 1 ? 's' : ''}</span>
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className="p-3.5 whitespace-nowrap">
                                                            <div className="font-medium text-slate-200">{c.category}</div>
                                                            <div className="text-[10px] text-gray-500 mt-0.5">{c.department}</div>
                                                        </td>

                                                        <td className="p-3.5 whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${sevObj.color}`}>
                                                                {c.severity}
                                                            </span>
                                                        </td>

                                                        <td className="p-3.5 whitespace-nowrap">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 border ${statusObj.color} w-fit`}>
                                                                <StatusIcon className="w-3 h-3" />
                                                                {c.status}
                                                            </span>
                                                        </td>

                                                        <td className="p-3.5 whitespace-nowrap text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button
                                                                    onClick={() => setSelectedComplaint(c)}
                                                                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-300"
                                                                    title="View Details"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                </button>

                                                                <button
                                                                    onClick={() => handleOpenResolutionModal(c)}
                                                                    className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-[11px] flex items-center gap-1"
                                                                    title="Update Status / Add Remarks"
                                                                >
                                                                    <Edit3 className="w-3 h-3" />
                                                                    <span>Action</span>
                                                                </button>

                                                                {isHod && (
                                                                    <button
                                                                        onClick={() => handleDeleteComplaint(c.id, c.ticketNumber)}
                                                                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400"
                                                                        title="Delete Record"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════════════════
                MODAL 1: VIEW COMPLAINT DETAILS & RESOLUTION TIMELINE
            ══════════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {selectedComplaint && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl rounded-3xl bg-[#0D1527] border border-[#1E2D4A] text-slate-100 shadow-2xl overflow-hidden my-8"
                        >
                            <div className="p-6 border-b border-[#1E2D4A] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-mono font-black text-sm">
                                        #{selectedComplaint.ticketNumber.split('-')[1]}
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                                            {selectedComplaint.title}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Filed on {selectedComplaint.submittedAt?.split('T')[0]} · {selectedComplaint.category}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedComplaint(null)}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs sm:text-sm">
                                {/* Meta Pill Bar */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs">
                                    <div>
                                        <div className="text-gray-400 font-medium">Status</div>
                                        <div className="font-bold text-white mt-0.5">{selectedComplaint.status}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 font-medium">Severity</div>
                                        <div className="font-bold text-orange-500 mt-0.5">{selectedComplaint.severity}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 font-medium">Authority</div>
                                        <div className="font-bold text-white mt-0.5">{selectedComplaint.targetAuthority}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 font-medium">Student</div>
                                        <div className="font-bold text-white mt-0.5">
                                            {selectedComplaint.isAnonymous ? '🔒 Anonymous' : selectedComplaint.studentName}
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-xs">
                                    <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <span><strong>Location:</strong> {selectedComplaint.location}</span>
                                </div>

                                {/* Full Grievance Statement */}
                                <div>
                                    <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-1.5">
                                        Grievance Statement
                                    </h5>
                                    <p className="p-4 rounded-2xl bg-[#0A0F1D] border border-[#1E2D4A] text-slate-300 whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                                        {selectedComplaint.description}
                                    </p>
                                </div>

                                {/* Evidence & Attached Files (Photos, Videos, PDFs, All Formats) */}
                                {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                                    <div>
                                        <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5">
                                                <Paperclip className="w-4 h-4 text-red-500" />
                                                <span>Submitted Evidence & Files ({selectedComplaint.attachments.length})</span>
                                            </span>
                                            <span className="text-[11px] text-gray-500 font-normal">
                                                Photos, Videos & Documents
                                            </span>
                                        </h5>

                                        <div className="space-y-3">
                                            {selectedComplaint.attachments.map((att, idx) => {
                                                const attType = getAttachmentType(att);

                                                if (attType === 'image') {
                                                    return (
                                                        <div key={idx} className="rounded-2xl overflow-hidden border border-[#1E2D4A] bg-gray-950/20 shadow-md">
                                                            <div className="relative group flex items-center justify-center bg-gray-900/60 p-2">
                                                                <img
                                                                    src={att.url}
                                                                    alt={att.name || 'Complaint Evidence Photo'}
                                                                    className="max-h-80 w-auto object-contain rounded-xl shadow"
                                                                />
                                                            </div>
                                                            <div className="p-3 bg-[#0A0F1D] border-t border-[#1E2D4A] text-xs flex items-center justify-between">
                                                                <div className="flex items-center gap-2 truncate">
                                                                    <Image className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                                                    <span className="font-medium text-slate-200 truncate">{att.name || 'Photo Evidence'}</span>
                                                                    {att.size && <span className="text-[10px] text-gray-400">({att.size})</span>}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <a
                                                                        href={att.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-slate-300 font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-colors"
                                                                    >
                                                                        <ExternalLink className="w-3 h-3" />
                                                                        <span>Full View</span>
                                                                    </a>
                                                                    <a
                                                                        href={att.url}
                                                                        download={att.name || 'evidence-photo.jpg'}
                                                                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-colors"
                                                                    >
                                                                        <Download className="w-3 h-3" />
                                                                        <span>Download</span>
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (attType === 'video') {
                                                    return (
                                                        <div key={idx} className="rounded-2xl overflow-hidden border border-[#1E2D4A] bg-gray-950 shadow-md">
                                                            <video
                                                                controls
                                                                playsInline
                                                                preload="metadata"
                                                                src={att.url}
                                                                className="w-full max-h-96 bg-black"
                                                            >
                                                                Your browser does not support HTML5 video.
                                                            </video>
                                                            <div className="p-3 bg-gray-900 border-t border-white/10 text-xs text-white flex items-center justify-between">
                                                                <div className="flex items-center gap-2 truncate">
                                                                    <Film className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                                                    <span className="font-medium truncate">{att.name || 'Recorded Video Evidence'}</span>
                                                                    {att.size && <span className="text-[10px] text-gray-400">({att.size})</span>}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <a
                                                                        href={att.url}
                                                                        download={att.name || 'evidence-video.mp4'}
                                                                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-colors"
                                                                    >
                                                                        <Download className="w-3 h-3" />
                                                                        <span>Download</span>
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (attType === 'audio') {
                                                    return (
                                                        <div key={idx} className="p-3.5 rounded-2xl border border-[#1E2D4A] bg-[#0A0F1D] space-y-2">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <div className="flex items-center gap-2 truncate">
                                                                    <Music className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                                                    <span className="font-bold text-white truncate">{att.name || 'Audio Recording'}</span>
                                                                    {att.size && <span className="text-[10px] text-gray-400">({att.size})</span>}
                                                                </div>
                                                                <a
                                                                    href={att.url}
                                                                    download={att.name || 'evidence-audio.mp3'}
                                                                    className="text-red-500 hover:underline flex items-center gap-1 font-semibold text-[11px]"
                                                                >
                                                                    <Download className="w-3 h-3" /> Download
                                                                </a>
                                                            </div>
                                                            <audio controls src={att.url} className="w-full h-9 rounded-lg" />
                                                        </div>
                                                    );
                                                }

                                                // Document, PDF, Spreadsheet, Archive, or Generic File
                                                return (
                                                    <div key={idx} className="p-3.5 rounded-2xl border border-[#1E2D4A] bg-[#0A0F1D] flex items-center justify-between gap-3 shadow-sm">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0">
                                                                {attType === 'pdf' ? <FileText className="w-5 h-5 text-red-500" /> : <File className="w-5 h-5 text-blue-500" />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-bold text-xs sm:text-sm text-white truncate">
                                                                    {att.name || 'Evidence Document'}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                                                                    <span className="uppercase font-semibold px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-slate-300">
                                                                        {attType.toUpperCase()}
                                                                    </span>
                                                                    {att.size && <span>{att.size}</span>}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <a
                                                                href={att.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-2.5 py-1.5 rounded-xl bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold text-xs flex items-center gap-1 transition-colors"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                                <span className="hidden sm:inline">Open</span>
                                                            </a>
                                                            <a
                                                                href={att.url}
                                                                download={att.name || 'evidence-file'}
                                                                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-colors"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                                <span>Download</span>
                                                            </a>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Official Action / Remarks Section */}
                                <div>
                                    <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        <span>Faculty & Department Resolution Notes</span>
                                    </h5>
                                    {selectedComplaint.officialRemarks ? (
                                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm text-slate-200 space-y-1">
                                            <p className="whitespace-pre-line leading-relaxed">{selectedComplaint.officialRemarks}</p>
                                            <div className="text-[11px] text-gray-500 pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                                                <span>Handled by: <strong>{selectedComplaint.assignedTo || 'Department Review Committee'}</strong></span>
                                                {selectedComplaint.resolvedAt && (
                                                    <span>Resolved on: {selectedComplaint.resolvedAt.split('T')[0]}</span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-2xl bg-[#0A0F1D] border border-dashed border-gray-300 dark:border-white/10 text-xs text-gray-500 text-center">
                                            No official remarks recorded yet. Investigation is in progress.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-[#0A0F1D] border-t border-[#1E2D4A] flex items-center justify-between">
                                <button
                                    onClick={() => setSelectedComplaint(null)}
                                    className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 font-bold text-xs"
                                >
                                    Close
                                </button>

                                {isStaffOrHod && (
                                    <button
                                        onClick={() => {
                                            const c = selectedComplaint;
                                            setSelectedComplaint(null);
                                            handleOpenResolutionModal(c);
                                        }}
                                        className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        <span>Take Action / Update</span>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════════════════
                MODAL 2: RESOLUTION / ACTION TAKEN MODAL (FOR STAFF & HOD)
            ══════════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {resolvingComplaint && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg rounded-3xl bg-[#0D1527] border border-[#1E2D4A] text-slate-100 shadow-2xl overflow-hidden my-8"
                        >
                            <div className="p-6 border-b border-[#1E2D4A] flex items-center justify-between">
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-white">
                                        Update Grievance Status
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Ticket #{resolvingComplaint.ticketNumber} · {resolvingComplaint.title}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setResolvingComplaint(null)}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveResolution} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        New Resolution Status *
                                    </label>
                                    <select
                                        value={actionForm.status}
                                        onChange={(e) => setActionForm({ ...actionForm, status: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white font-bold"
                                    >
                                        <option value="In Progress" className="bg-gray-900 text-white">In Progress (Under Investigation)</option>
                                        <option value="Resolved" className="bg-gray-900 text-white">Action Taken / Resolved</option>
                                        <option value="Pending Review" className="bg-gray-900 text-white">Pending Review</option>
                                        <option value="Dismissed" className="bg-gray-900 text-white">Dismissed / Inapplicable</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        Assigned Officer / Reviewer
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Staff member or maintenance team"
                                        value={actionForm.assignedTo}
                                        onChange={(e) => setActionForm({ ...actionForm, assignedTo: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        Official Action Remarks (Visible to Student) *
                                    </label>
                                    <textarea
                                        rows={4}
                                        required
                                        placeholder="Explain the findings, steps taken, repair details, or resolution ETA..."
                                        value={actionForm.officialRemarks}
                                        onChange={(e) => setActionForm({ ...actionForm, officialRemarks: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                    />
                                </div>

                                <div className="pt-3 border-t border-[#1E2D4A] flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setResolvingComplaint(null)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updatingStatus}
                                        className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs shadow-md disabled:opacity-50"
                                    >
                                        {updatingStatus ? 'Updating...' : 'Save Resolution'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
