import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Printer,
    FileText,
    Clock,
    CheckCircle2,
    Loader2,
    Minus,
    Plus,
    Copy,
    Palette,
    FlipHorizontal,
    IndianRupee,
    ListOrdered,
    Inbox,
    Home,
    Search,
    Shield,
    User,
    Sparkles,
    Bell,
    Check,
    ArrowRight,
    QrCode,
    FileImage,
    Layers,
    BookOpen,
    CheckCheck,
    Send,
    Tag,
    X,
    RefreshCw,
    UploadCloud,
    FileUp,
    FileCheck,
    Eye,
    Download,
    Trash2,
    Paperclip,
    ExternalLink,
    FileCode,
    Lock,
    ShieldCheck,
    Smartphone,
    Store
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import SearchBar from '../components/ui/SearchBar';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { initiateRazorpayCheckout } from '../services/razorpayService';
import RazorpayCheckoutModal from '../components/payment/RazorpayCheckoutModal';
import PaymentSuccessModal from '../components/payment/PaymentSuccessModal';
import {
    submitPrintJob,
    getStudentPrintJobs,
    getAllPrintJobs,
    updatePrintJobStatus,
    deletePrintJob
} from '../services/campusUtilitiesService';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

// ── Pricing Constants ────────────────────────────────────────────────────────
const RATES = {
    bwSingle: 1.0,
    bwDouble: 0.75,
    colorSingle: 5.0,
    colorDouble: 4.0,
};

const PAPER_PRICES = {
    'A4 Standard (75 GSM)': 0,
    'A4 Premium Bond (100 GSM)': 1.0,
    'Glossy Photo Paper': 15.0,
    'Legal Paper': 1.5,
    'A3 Chart / Poster': 10.0,
};

const BINDING_PRICES = {
    'None': 0,
    'Corner Staple': 2,
    'Spiral Binding': 25,
    'Soft Cover Thermal Binding': 40,
    'Hard Bound Book Binding': 120,
};

const FILE_TYPES = [
    { label: 'PDF Document', icon: FileText, color: 'text-red-500' },
    { label: 'Photos / Images', icon: FileImage, color: 'text-blue-500' },
    { label: 'Lab Record / Code', icon: Layers, color: 'text-[#06B6D4]' },
    { label: 'Assignment Notes', icon: BookOpen, color: 'text-emerald-500' },
    { label: 'Project Report', icon: Sparkles, color: 'text-amber-500' }
];

const computeJobCost = (pageCount, copies, isColor, doubleSided, paperType, bindingType) => {
    const pagesPerSheet = doubleSided ? 2 : 1;
    const sheetsPerCopy = Math.ceil(pageCount / pagesPerSheet);
    
    const baseSheetRate = isColor
        ? (doubleSided ? RATES.colorDouble : RATES.colorSingle)
        : (doubleSided ? RATES.bwDouble : RATES.bwSingle);
    
    const paperExtraPerSheet = PAPER_PRICES[paperType] || 0;
    const bindingExtra = (BINDING_PRICES[bindingType] || 0) * copies;
    
    const printingTotal = sheetsPerCopy * copies * (baseSheetRate + paperExtraPerSheet);
    return +(printingTotal + bindingExtra).toFixed(2);
};

const STATUS_CONFIG = {
    'Queued': {
        label: 'Queued (Received)',
        bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700',
        icon: Clock
    },
    'Printing': {
        label: 'Printing in Progress',
        bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700',
        icon: Loader2
    },
    'Ready for Pickup': {
        label: 'Ready for Pickup 🎉',
        bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 animate-pulse',
        icon: CheckCheck
    },
    'Completed': {
        label: 'Completed / Collected',
        bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700',
        icon: CheckCircle2
    }
};

export default function PrintHubPage() {
    const { getDomainUser, logoutDomain } = useAuth();
    const user = getDomainUser('printhub') || { name: 'Student User', role: ROLES.STUDENT };
    const userRoleLower = (user?.role || '').toLowerCase();
    const isStudentStaffOrHod = ['student', 'staff', 'teacher', 'hod'].includes(userRoleLower);
    const isAdmin = !isStudentStaffOrHod && (userRoleLower === 'admin_xerox' || userRoleLower === ROLES.ADMIN_XEROX || (userRoleLower === 'admin' && !isStudentStaffOrHod));

    // View Tabs
    const [activeTab, setActiveTab] = useState(isAdmin ? 'adminQueue' : 'new');
    const [adminFilter, setAdminFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Jobs State
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);

    // Form Submission State
    const [fileName, setFileName] = useState('');
    const [fileType, setFileType] = useState('PDF Document');
    const [pageCount, setPageCount] = useState(1);
    const [copies, setCopies] = useState(1);
    const [isColor, setIsColor] = useState(false);
    const [doubleSided, setDoubleSided] = useState(true);
    const [paperType, setPaperType] = useState('A4 Standard (75 GSM)');
    const [bindingType, setBindingType] = useState('None');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [customerUniqueId, setCustomerUniqueId] = useState(() => {
        return user?.usn || user?.employeeId || localStorage.getItem('nexus_student_usn') || '';
    });
    const [submitting, setSubmitting] = useState(false);

    // File Upload State
    const [uploadedFile, setUploadedFile] = useState(null); // { name, size, rawSize, type, extension, dataUrl }
    const [isDragging, setIsDragging] = useState(false);
    const [isManualEntry, setIsManualEntry] = useState(false);
    const fileInputRef = React.useRef(null);

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handleFileUpload = (file) => {
        if (!file) return;

        const extension = file.name.split('.').pop().toLowerCase();
        
        // Auto-categorize based on file type
        let detectedCategory = 'PDF Document';
        if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'bmp'].includes(extension) || file.type.startsWith('image/')) {
            detectedCategory = 'Photos / Images';
        } else if (['py', 'cpp', 'c', 'java', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'zip', 'rar'].includes(extension)) {
            detectedCategory = 'Lab Record / Code';
        } else if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) {
            detectedCategory = 'Assignment Notes';
        } else if (['ppt', 'pptx'].includes(extension)) {
            detectedCategory = 'Project Report';
        } else if (extension === 'pdf') {
            detectedCategory = 'PDF Document';
        }

        setFileType(detectedCategory);
        setFileName(file.name);

        // Read file as Data URL
        const reader = new FileReader();
        reader.onload = () => {
            setUploadedFile({
                name: file.name,
                size: formatFileSize(file.size),
                rawSize: file.size,
                type: file.type,
                extension,
                dataUrl: reader.result
            });
            toast.success(`📎 "${file.name}" uploaded successfully!`);
        };
        reader.onerror = () => {
            toast.error('Failed to read file.');
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleRemoveFile = () => {
        setUploadedFile(null);
        setFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Sync Customer ID with User info only if non-empty
    useEffect(() => {
        const id = user?.usn || user?.employeeId;
        if (id) {
            setCustomerUniqueId(id);
            localStorage.setItem('nexus_student_usn', id);
        }
    }, [user?.usn, user?.employeeId]);

    // Pickup Modal / Token inspection
    const [readyCounterNote, setReadyCounterNote] = useState('Counter 1 · Box B');
    const [modalJobToReady, setModalJobToReady] = useState(null);

    // Razorpay Payment States
    const [paymentMode, setPaymentMode] = useState('razorpay'); // 'razorpay' | 'counter'
    const [razorpayFallbackOpen, setRazorpayFallbackOpen] = useState(false);
    const [fallbackPaymentData, setFallbackPaymentData] = useState(null);
    const [successPaymentData, setSuccessPaymentData] = useState(null);

    // Calculated Cost
    const totalCost = computeJobCost(pageCount, copies, isColor, doubleSided, paperType, bindingType);
    const pagesPerSheet = doubleSided ? 2 : 1;
    const sheetsPerCopy = Math.ceil(pageCount / pagesPerSheet);

    // Load Jobs with stable primitive dependencies
    const userUid = user?.uid || user?.id;
    const userEmail = user?.email;

    const fetchJobs = useCallback(async () => {
        setLoadingJobs(true);
        try {
            if (isAdmin) {
                const all = await getAllPrintJobs();
                setJobs(all || []);
            } else {
                const userJobs = await getStudentPrintJobs(userUid, userEmail, customerUniqueId);
                setJobs(userJobs || []);
            }
        } catch (err) {
            console.error('Failed to load print jobs:', err);
            toast.error('Failed to load print queue.');
        } finally {
            setLoadingJobs(false);
        }
    }, [isAdmin, userUid, userEmail, customerUniqueId]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Live Cross-Tab & Device Sync
    useEffect(() => {
        let bc = null;
        try {
            bc = new BroadcastChannel('nexus_printhub_jobs');
            bc.onmessage = () => {
                fetchJobs();
            };
        } catch (e) {}

        const onCustomStatusChange = () => {
            fetchJobs();
        };
        window.addEventListener('nexus_printhub_status_changed', onCustomStatusChange);

        const onStorage = (e) => {
            if (e.key === 'nexus_printhub_last_status_update') {
                fetchJobs();
            }
        };
        window.addEventListener('storage', onStorage);

        return () => {
            if (bc) bc.close();
            window.removeEventListener('nexus_printhub_status_changed', onCustomStatusChange);
            window.removeEventListener('storage', onStorage);
        };
    }, [fetchJobs]);

    // ── Student / Staff Submit Print Request ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!customerUniqueId.trim()) {
            toast.error('Please enter your USN or Student/Staff ID in the top ID field.');
            return;
        }
        if (!fileName.trim()) {
            toast.error('Please specify the file name or document title.');
            return;
        }

        const uid = user?.uid || user?.id;
        const pickupToken = `PX-${Math.floor(1000 + Math.random() * 9000)}`;

        const finalizePrintJob = async (paymentDetails = null) => {
            setSubmitting(true);
            try {
                await submitPrintJob({
                    userId: uid,
                    userName: user?.name || '',
                    userRole: user?.role || 'student',
                    userEmail: user?.email || '',
                    customerUniqueId: customerUniqueId.trim(),
                    pickupToken,
                    fileName: fileName.trim(),
                    fileType,
                    fileSize: uploadedFile?.size || '',
                    fileData: uploadedFile?.dataUrl || null,
                    hasRealFile: !!uploadedFile,
                    pageCount,
                    copies,
                    isColor,
                    doubleSided,
                    paperType,
                    bindingType,
                    specialInstructions: specialInstructions.trim(),
                    cost: totalCost,
                    counterNote: 'Queued for processing',
                    paymentStatus: paymentDetails ? 'Paid' : 'Pending (Counter)',
                    paymentMethod: paymentDetails ? (paymentDetails.method || 'Razorpay') : 'Cash at Counter',
                    razorpayPaymentId: paymentDetails?.paymentId || null
                });

                toast.success(`🎉 Print Request Sent! Unique Pickup Token: ${pickupToken}`, { duration: 5000 });
                
                // Reset form
                setFileName('');
                setUploadedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setPageCount(1);
                setCopies(1);
                setIsColor(false);
                setDoubleSided(true);
                setPaperType('A4 Standard (75 GSM)');
                setBindingType('None');
                setSpecialInstructions('');
                
                await fetchJobs();
                setActiveTab('queue');

                if (paymentDetails) {
                    setSuccessPaymentData({
                        ...paymentDetails,
                        token: pickupToken,
                        serviceName: 'Document & Xerox Printing'
                    });
                }
            } catch (err) {
                console.error(err);
                toast.error('Failed to submit print job.');
            } finally {
                setSubmitting(false);
            }
        };

        if (paymentMode === 'razorpay' && totalCost > 0) {
            await initiateRazorpayCheckout({
                amount: totalCost,
                currency: 'INR',
                title: 'Campus Print & Xerox Hub',
                description: `${fileType} (${pageCount} pgs × ${copies} copies)`,
                module: 'printhub',
                token: pickupToken,
                customer: {
                    name: user?.name,
                    email: user?.email,
                    uniqueId: customerUniqueId
                },
                onSuccess: (paymentRecord) => {
                    finalizePrintJob(paymentRecord);
                },
                onFailure: (err) => {
                    toast.error('Razorpay payment cancelled or failed.');
                },
                onFallbackModal: (params) => {
                    setFallbackPaymentData({
                        ...params,
                        onSuccess: (paymentRecord) => finalizePrintJob(paymentRecord)
                    });
                    setRazorpayFallbackOpen(true);
                }
            });
        } else {
            await finalizePrintJob(null);
        }
    };

    // ── Admin Queue Operations ──
    const handleAdminStatusChange = async (jobId, newStatus, counterNote = null, pickupToken = null) => {
        try {
            const extra = {
                ...(counterNote ? { counterNote } : {}),
                ...(pickupToken ? { pickupToken } : {})
            };

            // Instant optimistic update
            setJobs(prev => prev.map(j => {
                if (
                    j.id === jobId ||
                    (pickupToken && j.pickupToken === pickupToken) ||
                    (j.firestoreId && j.firestoreId === jobId)
                ) {
                    return { ...j, status: newStatus, ...extra };
                }
                return j;
            }));

            await updatePrintJobStatus(jobId, newStatus, extra);
            
            if (newStatus === 'Ready for Pickup') {
                toast.success('🔔 Notification sent to Student/Staff! Xerox marked Ready for Pickup.', { duration: 4000 });
            } else if (newStatus === 'Completed') {
                toast.success('✅ Xerox handed over to customer. Job completed!');
            } else {
                toast.success(`Job updated to: ${newStatus}`);
            }
            
            setModalJobToReady(null);
            await fetchJobs();
        } catch (err) {
            toast.error('Failed to update job status.');
        }
    };

    const handleDelete = async (jobId, pickupToken = null) => {
        if (window.confirm('Are you sure you want to remove this print job?')) {
            try {
                setJobs(prev => prev.filter(j => j.id !== jobId && (!pickupToken || j.pickupToken !== pickupToken)));
                await deletePrintJob(jobId, pickupToken);
                toast.success('Job removed.');
                await fetchJobs();
            } catch (e) {
                toast.error('Failed to delete job.');
            }
        }
    };

    // Filtered Jobs
    const filteredJobs = jobs.filter((job) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            !q ||
            job.pickupToken?.toLowerCase().includes(q) ||
            job.customerUniqueId?.toLowerCase().includes(q) ||
            job.userName?.toLowerCase().includes(q) ||
            job.fileName?.toLowerCase().includes(q);

        const matchesStatus = adminFilter === 'All' || job.status === adminFilter;
        return matchesSearch && matchesStatus;
    });

    // Check if student has ready jobs for notifications
    const readyJobsForUser = jobs.filter(j => j.status === 'Ready for Pickup');

    return (
        <div className="min-h-screen bg-[#F5F6FF] dark:bg-[#070A11] text-[#202442] dark:text-slate-100 p-4 md:p-6 lg:p-8 font-sans transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Top Bar ── */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-[#22D3EE] px-3.5 py-2 rounded-full bg-[#0D1527] border border-[#1E2D4A] shadow-sm transition-all"
                    >
                        <Home className="w-4 h-4 text-[#06B6D4]" />
                        <span>← Campus Home</span>
                    </Link>

                    <div className="flex items-center gap-2.5">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
                            isAdmin
                                ? 'bg-[#06B6D4]/15 border-[#06B6D4]/30 text-[#22D3EE]'
                                : 'bg-[#0D1527] border-[#1E2D4A] text-slate-300'
                        }`}>
                            {isAdmin ? <Shield className="w-3.5 h-3.5 text-[#22D3EE]" /> : <User className="w-3.5 h-3.5 text-[#06B6D4]" />}
                            <span>{user.name} ({isAdmin ? 'Xerox Admin Desk' : user.role?.toUpperCase()})</span>
                        </div>

                        <button
                            onClick={async () => {
                                await logoutDomain('printhub');
                                toast.success('Signed out from Print Hub');
                                window.location.href = '/login';
                            }}
                            className="text-xs px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-colors font-medium"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* ── Ready Notification Banner for Students & Staff ── */}
                {!isAdmin && readyJobsForUser.length > 0 && (
                    <div className="rounded-2xl p-4 bg-[#0D1527] border border-emerald-500/50 text-white shadow-xl flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                                <Bell className="w-5 h-5 text-emerald-400 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm sm:text-base">
                                    🖨️ Your Xerox is Ready for Pickup! ({readyJobsForUser.length} {readyJobsForUser.length === 1 ? 'Job' : 'Jobs'})
                                </h3>
                                <p className="text-xs text-slate-300">
                                    Show Token: <strong>{readyJobsForUser.map(j => j.pickupToken).join(', ')}</strong> at the Xerox counter to collect.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveTab('queue')}
                            className="px-4 py-2 rounded-xl bg-[#06B6D4] text-[#070A11] hover:bg-[#22D3EE] text-xs font-bold shadow transition-transform active:scale-95"
                        >
                            View Pickup Token
                        </button>
                    </div>
                )}

                {/* ── Header Banner (Reference Style) ── */}
                <div className="relative overflow-hidden rounded-2xl bg-[#0D1527] border border-[#1E2D4A] p-6 sm:p-8 text-white shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06B6D4]/15 text-[#22D3EE] border border-[#06B6D4]/30 text-xs font-mono font-semibold tracking-wide uppercase">
                                <Printer className="w-3.5 h-3.5" />
                                <span>High-Speed Campus Print Hub</span>
                            </div>
                            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                                Self-Service Cloud Print & Xerox Counter
                            </h1>
                        </div>
                    </div>
                </div>

                {/* ── Tab Switcher ── */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2D4A] pb-3">
                    <div className="flex gap-2 p-1 bg-[#0A0F1D] rounded-full border border-[#1E2D4A]">
                        {isAdmin ? (
                            <>
                                <button
                                    onClick={() => setActiveTab('adminQueue')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                                        activeTab === 'adminQueue'
                                            ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <ListOrdered className="w-3.5 h-3.5" />
                                    <span>Incoming Queue ({jobs.length})</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('new')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                                        activeTab === 'new'
                                            ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>New Counter Job</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('queue')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                                        activeTab === 'queue'
                                            ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span>Pickup Tokens ({jobs.length})</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setActiveTab('new')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                                        activeTab === 'new'
                                            ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Submit Print Request</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('queue')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                                        activeTab === 'queue'
                                            ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span>My Jobs & Pickup Tokens ({jobs.length})</span>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Quick Stats Pill */}
                    <div className="flex items-center gap-2 text-xs">
                        <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                            Queued: {jobs.filter(j => j.status === 'Queued').length}
                        </span>
                        <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
                            Printing: {jobs.filter(j => j.status === 'Printing').length}
                        </span>
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                            Ready: {jobs.filter(j => j.status === 'Ready for Pickup').length}
                        </span>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════════════════
                    TAB 1: SUBMIT NEW PRINT / XEROX REQUEST (CUSTOM REQUIREMENTS)
                ══════════════════════════════════════════════════════════════════════ */}
                {activeTab === 'new' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Requirements Form */}
                        <div className="lg:col-span-3 space-y-6">
                            <Card className="rounded-3xl border border-[#1E2D4A] bg-[#0D1527] shadow-xl p-6 sm:p-7 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#06B6D4]/5 to-transparent rounded-full blur-2xl pointer-events-none" />

                                <CardHeader className="p-0 pb-5 mb-5 border-b border-[#1E2D4A] relative z-10">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl font-black text-white flex items-center gap-2.5">
                                            <div className="p-2 rounded-xl bg-[#06B6D4]/10 text-[#06B6D4]">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <span>Document & Xerox Requirements</span>
                                        </CardTitle>
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20">
                                            Self Service Desk
                                        </span>
                                    </div>
                                </CardHeader>

                                <form onSubmit={handleSubmit} className="space-y-6 text-xs relative z-10">
                                    {/* Identification Bar */}
                                    <div className="p-3.5 rounded-2xl bg-[#0A0F1D] border border-[#1E2D4A] backdrop-blur-md flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/15 border border-[#06B6D4]/30 flex items-center justify-center text-[#22D3EE] shadow-sm">
                                                <Printer className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="font-extrabold text-xs text-white block">Campus Print & Xerox Desk</span>
                                                <span className="text-[10px] text-slate-400">Self-service queue & counter pickup</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-bold text-slate-300">
                                                USN / ID:
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={customerUniqueId}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCustomerUniqueId(val);
                                                    if (val) localStorage.setItem('nexus_student_usn', val);
                                                }}
                                                placeholder="Student or staff ID"
                                                className="px-3.5 py-1.5 rounded-xl font-mono font-bold text-xs bg-[#0A0F1D] border border-[#1E2D4A] text-white focus:ring-2 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4] outline-none w-40 shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* ── Document Upload Station ── */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                                                <UploadCloud className="w-4 h-4 text-[#06B6D4]" />
                                                <span>Upload Document / File for Print & Xerox <span className="text-red-500">*</span></span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setIsManualEntry(!isManualEntry)}
                                                className="text-[11px] font-semibold text-[#06B6D4] hover:underline flex items-center gap-1"
                                            >
                                                {isManualEntry ? '← Switch to File Uploader' : '+ Or enter title manually'}
                                            </button>
                                        </div>

                                        {/* Hidden file input */}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    handleFileUpload(e.target.files[0]);
                                                }
                                            }}
                                            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.py,.java,.c,.cpp,.zip,.rar,.png,.jpg,.jpeg,.webp,application/pdf,image/*,text/*"
                                        />

                                        {!isManualEntry ? (
                                            uploadedFile ? (
                                                /* Uploaded File Showcase Card */
                                                <div className="p-4 rounded-2xl bg-[#0A0F1D] border border-[#06B6D4]/40 flex items-center justify-between flex-wrap gap-3 shadow-md">
                                                    <div className="flex items-center gap-3.5 min-w-0">
                                                        <div className="w-12 h-12 rounded-2xl bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#22D3EE] flex items-center justify-center text-white shadow-lg flex-shrink-0">
                                                            {['jpg', 'jpeg', 'png', 'webp'].includes(uploadedFile.extension) ? (
                                                                <FileImage className="w-6 h-6" />
                                                            ) : uploadedFile.extension === 'pdf' ? (
                                                                <FileText className="w-6 h-6" />
                                                            ) : ['py', 'cpp', 'java', 'c', 'js', 'zip'].includes(uploadedFile.extension) ? (
                                                                <FileCode className="w-6 h-6" />
                                                            ) : (
                                                                <FileCheck className="w-6 h-6" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-extrabold text-sm text-white truncate max-w-xs sm:max-w-md block" title={uploadedFile.name}>
                                                                    {uploadedFile.name}
                                                                </span>
                                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#06B6D4] text-[#070A11] font-bold flex-shrink-0">
                                                                    {uploadedFile.extension.toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                                                <span>{uploadedFile.size}</span>
                                                                <span>•</span>
                                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                                                                    <Check className="w-3 h-3" /> Ready for Print
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {uploadedFile.dataUrl && (
                                                            <a
                                                                href={uploadedFile.dataUrl}
                                                                download={uploadedFile.name}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-3 py-1.5 rounded-xl bg-[#0D1527] border border-[#1E2D4A] hover:border-[#06B6D4]/40 text-slate-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                                                            >
                                                                <Eye className="w-3.5 h-3.5 text-[#06B6D4]" />
                                                                <span>Preview</span>
                                                            </a>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="px-3 py-1.5 rounded-xl bg-[#06B6D4] hover:bg-[#22D3EE] text-[#070A11] font-black text-xs transition-colors shadow-sm"
                                                        >
                                                            Replace
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleRemoveFile}
                                                            className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                                            title="Remove file"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Interactive Dropzone */
                                                <div
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={`p-7 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-3 ${
                                                        isDragging
                                                            ? 'border-[#06B6D4] bg-[#06B6D4]/15 scale-[1.01]'
                                                            : 'border-[#1E2D4A] hover:border-[#06B6D4]/60 bg-[#0A0F1D] hover:bg-[#0D1527]'
                                                    }`}
                                                >
                                                    <div className="w-14 h-14 rounded-2xl bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#22D3EE] flex items-center justify-center text-white shadow-xl shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                                                        <UploadCloud className="w-7 h-7 animate-pulse" />
                                                    </div>
                                                    <div>
                                                        <p className="font-extrabold text-sm sm:text-base text-white">
                                                            Click to upload or drag & drop your document
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                                            Supports PDF, Word (.docx), PowerPoint (.pptx), Photos (PNG, JPG), Code (.py, .cpp), and Text files
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                                                        {['PDF', 'DOCX', 'PPTX', 'IMAGES', 'CODE', 'ALL FILES'].map(t => (
                                                            <span key={t} className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#0D1527] border border-[#1E2D4A] text-slate-300">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        ) : (
                                            /* Manual Title Fallback */
                                            <div className="space-y-1">
                                                <input
                                                    type="text"
                                                    required
                                                    value={fileName}
                                                    onChange={(e) => setFileName(e.target.value)}
                                                    placeholder="e.g. ADA_Lab_Record_Unit4.pdf or Physical Textbook Xerox Chapter 4"
                                                    className="w-full px-4 py-3 rounded-2xl border border-[#1E2D4A] bg-[#0A0F1D] text-white focus:ring-2 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4] outline-none text-xs font-medium"
                                                />
                                                <p className="text-[11px] text-slate-400 italic">Enter the custom title or notes for materials brought physically to the counter.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Requirement / Document Type Selection */}
                                    <div>
                                        <label className="block font-bold text-slate-300 text-xs mb-2">
                                            Select Requirement Category <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                            {FILE_TYPES.map((ft) => {
                                                const Icon = ft.icon;
                                                const isSelected = fileType === ft.label;
                                                return (
                                                    <button
                                                        key={ft.label}
                                                        type="button"
                                                        onClick={() => setFileType(ft.label)}
                                                        className={`p-3 rounded-2xl border flex items-center gap-2.5 text-left transition-all ${
                                                            isSelected
                                                                ? 'border-[#06B6D4] bg-[#06B6D4]/15 text-[#22D3EE] font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)] scale-[1.02]'
                                                                : 'border-[#1E2D4A] bg-[#0A0F1D] text-slate-300 hover:border-[#06B6D4]/40 hover:text-white'
                                                        }`}
                                                    >
                                                        <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-[#06B6D4] text-[#070A11] font-bold' : 'bg-[#0D1527] text-slate-400'}`}>
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <span className="truncate text-xs">{ft.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Pages & Copies */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-3.5 rounded-2xl bg-[#0A0F1D] border border-[#1E2D4A] space-y-2">
                                            <label className="block font-bold text-slate-300 text-xs">
                                                Total Number of Pages
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={pageCount}
                                                onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                                className="w-full px-3.5 py-2 rounded-xl border border-[#1E2D4A] bg-[#0A0F1D] text-white font-extrabold text-sm focus:ring-2 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4] outline-none"
                                            />
                                            <div className="flex items-center gap-1.5">
                                                {[1, 5, 10, 25, 50].map((preset) => (
                                                    <button
                                                        key={preset}
                                                        type="button"
                                                        onClick={() => setPageCount(preset)}
                                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                                            pageCount === preset
                                                                ? 'bg-[#06B6D4] text-[#070A11] font-bold border-[#06B6D4]'
                                                                : 'bg-[#0D1527] text-slate-300 border-[#1E2D4A] hover:border-[#06B6D4]/40 hover:text-white'
                                                        }`}
                                                    >
                                                        {preset} pgs
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-3.5 rounded-2xl bg-[#0A0F1D] border border-[#1E2D4A] space-y-2">
                                            <label className="block font-bold text-slate-300 text-xs">
                                                Number of Sets / Copies
                                            </label>
                                            <div className="flex items-center justify-between p-1.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A]">
                                                <button
                                                    type="button"
                                                    onClick={() => setCopies(Math.max(1, copies - 1))}
                                                    className="w-9 h-9 rounded-lg bg-[#0D1527] border border-[#1E2D4A] text-slate-300 hover:bg-[#1E2D4A] hover:text-white flex items-center justify-center transition-colors"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="font-black text-base text-white">
                                                    {copies} {copies === 1 ? 'Set' : 'Sets'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setCopies(copies + 1)}
                                                    className="w-9 h-9 rounded-lg bg-[#06B6D4] hover:bg-[#22D3EE] text-[#070A11] font-black flex items-center justify-center shadow-md transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-slate-400 text-right">
                                                Total {pageCount * copies} printed pages
                                            </p>
                                        </div>
                                    </div>

                                    {/* Color vs B&W and Duplex */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-bold text-slate-300 text-xs mb-1.5">Color Palette Mode</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsColor(false)}
                                                    className={`py-3 px-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                                                        !isColor
                                                            ? 'border-[#06B6D4] bg-[#06B6D4]/15 text-[#22D3EE] shadow-[0_0_12px_rgba(6,182,212,0.25)] scale-[1.02]'
                                                            : 'border-[#1E2D4A] bg-[#0A0F1D] text-slate-300 hover:border-[#06B6D4]/40 hover:text-white'
                                                    }`}
                                                >
                                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-black border border-white/20" />
                                                    <span>B&W (₹1.00)</span>
                                                    <span className="text-[10px] font-normal text-slate-400">Standard ink</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsColor(true)}
                                                    className={`py-3 px-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                                                        isColor
                                                            ? 'border-[#06B6D4] bg-[#06B6D4]/15 text-[#22D3EE] shadow-[0_0_12px_rgba(6,182,212,0.25)] scale-[1.02]'
                                                            : 'border-[#1E2D4A] bg-[#0A0F1D] text-slate-300 hover:border-[#06B6D4]/40 hover:text-white'
                                                    }`}
                                                >
                                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] shadow-sm" />
                                                    <span>Color (₹5.00)</span>
                                                    <span className="text-[10px] font-normal text-[#22D3EE] font-semibold">HD Laser</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block font-bold text-slate-300 text-xs mb-1.5">Printing Sides</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setDoubleSided(true)}
                                                    className={`py-3 px-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all relative overflow-hidden ${
                                                        doubleSided
                                                            ? 'border-[#06B6D4] bg-[#06B6D4]/15 text-[#22D3EE] shadow-[0_0_12px_rgba(6,182,212,0.25)] scale-[1.02]'
                                                            : 'border-[#1E2D4A] bg-[#0A0F1D] text-slate-300 hover:border-[#06B6D4]/40 hover:text-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        <FlipHorizontal className="w-4 h-4" />
                                                        <span>2-Sided</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                                                        Save 25% Off
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDoubleSided(false)}
                                                    className={`py-3 px-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                                                        !doubleSided
                                                            ? 'border-[#06B6D4] bg-[#06B6D4]/15 text-[#22D3EE] shadow-[0_0_12px_rgba(6,182,212,0.25)] scale-[1.02]'
                                                            : 'border-[#1E2D4A] bg-[#0A0F1D] text-slate-300 hover:border-[#06B6D4]/40 hover:text-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        <FileText className="w-4 h-4" />
                                                        <span>Single-Sided</span>
                                                    </div>
                                                    <span className="text-[10px] font-normal text-slate-400">1 side per sheet</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Paper Quality & Binding Types */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-bold text-slate-300 text-xs mb-1.5">Paper Quality / Grade</label>
                                            <select
                                                value={paperType}
                                                onChange={(e) => setPaperType(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#1E2D4A] bg-[#0A0F1D] text-white font-medium text-xs focus:ring-2 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4] outline-none"
                                            >
                                                {Object.keys(PAPER_PRICES).map(p => (
                                                    <option key={p} value={p}>{p} {PAPER_PRICES[p] > 0 ? `(+₹${PAPER_PRICES[p]} / sheet)` : ''}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block font-bold text-slate-300 text-xs mb-1.5">Binding & Finishing</label>
                                            <select
                                                value={bindingType}
                                                onChange={(e) => setBindingType(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#1E2D4A] bg-[#0A0F1D] text-white font-medium text-xs focus:ring-2 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4] outline-none"
                                            >
                                                {Object.keys(BINDING_PRICES).map(b => (
                                                    <option key={b} value={b}>{b} {BINDING_PRICES[b] > 0 ? `(+₹${BINDING_PRICES[b]} / set)` : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Special Instructions */}
                                    <div>
                                        <label className="block font-bold text-slate-300 text-xs mb-1.5">
                                            Special Instructions for Operator (Page ranges, landscape, binding color...)
                                        </label>
                                        <textarea
                                            rows="2"
                                            value={specialInstructions}
                                            onChange={(e) => setSpecialInstructions(e.target.value)}
                                            placeholder="e.g. Print page 1-3 in color, remaining in B&W. Use navy blue front transparent sheet for spiral binding."
                                            className="w-full px-3.5 py-2 rounded-2xl border border-[#1E2D4A] bg-[#0A0F1D] text-white outline-none focus:ring-2 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4] text-xs"
                                        />
                                    </div>

                                    {/* Payment Method Selection */}
                                    <div className="space-y-2 pt-1">
                                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                            Select Payment Gateway
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                data-testid="payment-online-btn"
                                                onClick={() => setPaymentMode('razorpay')}
                                                className={`p-3.5 rounded-2xl border text-left font-bold text-xs flex flex-col justify-between min-h-[76px] transition-all ${
                                                    paymentMode === 'razorpay'
                                                        ? 'border-[#06B6D4] bg-[#06B6D4]/10 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-[#06B6D4]'
                                                        : 'border-[#1E2D4A] bg-[#0A0F1D] text-slate-400 hover:border-[#06B6D4]/40 hover:text-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className={`flex items-center gap-1.5 font-bold ${paymentMode === 'razorpay' ? 'text-[#22D3EE]' : 'text-slate-200'}`}>
                                                        <Smartphone className="w-4 h-4 text-[#06B6D4]" />
                                                        <span>Campus Pay Online</span>
                                                    </span>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide ${
                                                        paymentMode === 'razorpay'
                                                            ? 'bg-[#06B6D4]/20 text-[#22D3EE] border border-[#06B6D4]/30'
                                                            : 'bg-[#0D1527] text-slate-400 border border-[#1E2D4A]'
                                                    }`}>
                                                        UPI / CARDS
                                                    </span>
                                                </div>
                                                <span className={`text-[11px] font-normal ${paymentMode === 'razorpay' ? 'text-slate-300' : 'text-slate-400'}`}>
                                                    Instant Express Pickup
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                data-testid="payment-counter-btn"
                                                onClick={() => setPaymentMode('counter')}
                                                className={`p-3.5 rounded-2xl border text-left font-bold text-xs flex flex-col justify-between min-h-[76px] transition-all ${
                                                    paymentMode === 'counter'
                                                        ? 'border-[#06B6D4] bg-[#06B6D4]/10 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-[#06B6D4]'
                                                        : 'border-[#1E2D4A] bg-[#0A0F1D] text-slate-400 hover:border-[#06B6D4]/40 hover:text-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className={`flex items-center gap-1.5 font-bold ${paymentMode === 'counter' ? 'text-[#22D3EE]' : 'text-slate-200'}`}>
                                                        <Store className="w-4 h-4 text-[#06B6D4]" />
                                                        <span>Pay at Counter</span>
                                                    </span>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide ${
                                                        paymentMode === 'counter'
                                                            ? 'bg-[#06B6D4]/20 text-[#22D3EE] border border-[#06B6D4]/30'
                                                            : 'bg-[#0D1527] text-slate-400 border border-[#1E2D4A]'
                                                    }`}>
                                                        CASH / DESK
                                                    </span>
                                                </div>
                                                <span className={`text-[11px] font-normal ${paymentMode === 'counter' ? 'text-slate-300' : 'text-slate-400'}`}>
                                                    Cash / Counter POS
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-3.5 rounded-2xl bg-[#06B6D4] hover:bg-[#22D3EE] text-[#070A11] font-black text-sm shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all transform hover:scale-[1.01]"
                                    >
                                        {submitting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Authorizing Payment & Submitting...
                                            </span>
                                        ) : paymentMode === 'razorpay' ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Lock className="w-4 h-4" /> Confirm & Generate Print Token (₹{totalCost.toFixed(2)})
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <Send className="w-4 h-4" /> Submit Requirement & Pay at Counter (₹{totalCost.toFixed(2)})
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </Card>
                        </div>

                        {/* Cost & Live Summary Card */}
                        <div className="lg:col-span-2 space-y-4">
                            <Card className="rounded-3xl border border-[#1E2D4A] p-6 sticky top-6 shadow-xl bg-[#0D1527] overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-[#06B6D4]/10 rounded-full blur-2xl pointer-events-none" />

                                <CardHeader className="p-0 pb-4 mb-4 border-b border-[#1E2D4A] relative z-10">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                                            <IndianRupee className="w-5 h-5 text-[#06B6D4]" />
                                            <span>Live Cost Breakdown</span>
                                        </CardTitle>
                                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            Dynamic Rates
                                        </span>
                                    </div>
                                </CardHeader>

                                <div className="space-y-3.5 text-xs relative z-10">
                                    {/* Uploaded File status capsule */}
                                    <div className="p-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A]">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Attached Document</span>
                                        <p className="font-bold text-white truncate">
                                            {fileName || 'No file selected yet'}
                                        </p>
                                        {uploadedFile && (
                                            <span className="text-[10px] text-[#22D3EE] font-semibold">
                                                {uploadedFile.size} • {uploadedFile.extension.toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2 pt-1 border-t border-[#1E2D4A]">
                                        <div className="flex justify-between py-1">
                                            <span className="text-slate-400 font-medium">Requirement Category:</span>
                                            <span className="font-bold text-white">{fileType}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span className="text-slate-400 font-medium">Pages & Copies:</span>
                                            <span className="font-semibold text-slate-200">
                                                {pageCount} pgs × {copies} {copies === 1 ? 'copy' : 'copies'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span className="text-slate-400 font-medium">Paper Consumed:</span>
                                            <span className="font-semibold text-slate-200">
                                                {sheetsPerCopy * copies} Sheets ({doubleSided ? 'Duplex' : 'Single Sided'})
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span className="text-slate-400 font-medium">Color Palette:</span>
                                            <span className="font-semibold text-[#22D3EE]">
                                                {isColor ? 'HD Full Color (₹5/pg)' : 'Standard B&W (₹1/pg)'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span className="text-slate-400 font-medium">Paper Grade:</span>
                                            <span className="font-semibold text-slate-200 truncate max-w-[150px]">
                                                {paperType}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span className="text-slate-400 font-medium">Binding & Finish:</span>
                                            <span className="font-semibold text-slate-200">
                                                {bindingType} {BINDING_PRICES[bindingType] > 0 ? `(+₹${BINDING_PRICES[bindingType] * copies})` : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Total highlight banner */}
                                    <div className="pt-3 p-4 rounded-2xl bg-gradient-to-r from-[#06B6D4] to-[#22D3EE] text-[#070A11] flex items-center justify-between shadow-xl shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                                        <div>
                                            <span className="text-[10px] uppercase tracking-wider opacity-80 font-black block">Total Payable Amount</span>
                                            <span className="text-3xl font-black">₹{totalCost.toFixed(2)}</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-black/10 backdrop-blur-md">
                                            <QrCode className="w-7 h-7 text-[#070A11]" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════════
                    TAB 2: ADMIN QUEUE DESK & NOTIFICATION CONTROLS
                ══════════════════════════════════════════════════════════════════════ */}
                {isAdmin && activeTab === 'adminQueue' && (
                    <div className="space-y-4">
                        {/* Search & Filter Bar */}
                        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                            <div className="relative flex-1 w-full">
                                <SearchBar
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(typeof e === 'string' ? e : e.target.value)}
                                    placeholder="Search by Token ID (#PX-8421), Student USN, Staff ID, or Name..."
                                />
                            </div>

                            {/* Status Filters */}
                            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
                                {['All', 'Queued', 'Printing', 'Ready for Pickup', 'Completed'].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setAdminFilter(st)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap ${
                                            adminFilter === st
                                                ? 'bg-[#06B6D4] text-[#070A11] font-bold border-[#06B6D4] shadow'
                                                : 'bg-[#0D1527] text-slate-400 border-[#1E2D4A] hover:border-[#06B6D4]/40 hover:text-white'
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loadingJobs ? (
                            <SkeletonLoader variant="card" count={3} />
                        ) : filteredJobs.length === 0 ? (
                            <EmptyState
                                icon={Inbox}
                                title="No matching print requests"
                                description="No jobs found matching your search or status filter."
                            />
                        ) : (
                            <div className="space-y-4">
                                {filteredJobs.map((job) => {
                                    const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG['Queued'];
                                    const StatusIcon = statusCfg.icon;
                                    return (
                                        <div
                                            key={job.id}
                                            className="rounded-3xl p-5 sm:p-6 bg-[#0D1527] border border-[#1E2D4A] shadow-md hover:border-[#06B6D4]/30 transition-all space-y-4"
                                        >
                                            {/* Job Header Strip with Unique Token */}
                                            <div className="flex items-start justify-between flex-wrap gap-3 pb-3 border-b border-[#1E2D4A]">
                                                <div className="flex items-center gap-3">
                                                    {/* Unique Token Badge */}
                                                    <div className="px-3.5 py-1.5 rounded-2xl bg-[#06B6D4] text-[#070A11] font-bold shadow-md flex items-center gap-2">
                                                        <QrCode className="w-4 h-4" />
                                                        <span className="font-black text-sm sm:text-base tracking-wider">{job.pickupToken || '#PX-0000'}</span>
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center gap-2 font-bold text-white text-sm sm:text-base">
                                                            <span className="font-mono text-[#06B6D4] font-bold">
                                                                {job.customerUniqueId || 'Campus ID'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 font-mono">
                                                            Order Ref: #{job.id ? job.id.slice(0, 8) : '0000'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusCfg.bg}`}>
                                                        <StatusIcon className={`w-3.5 h-3.5 ${job.status === 'Printing' ? 'animate-spin' : ''}`} />
                                                        <span>{statusCfg.label}</span>
                                                    </span>
                                                    <button
                                                        onClick={() => handleDelete(job.id, job.pickupToken)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                        title="Delete Job"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Job Specifications & Requirements Grid */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                                <div className="p-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A]">
                                                    <span className="text-slate-400 block text-[11px]">File / Title:</span>
                                                    <p className="font-bold text-white truncate" title={job.fileName}>{job.fileName}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[10px] text-[#22D3EE] font-semibold">{job.fileType}</span>
                                                        {job.fileData && (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#06B6D4]/10 text-[#06B6D4] font-bold border border-[#06B6D4]/20">
                                                                Attached
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="p-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A]">
                                                    <span className="text-slate-400 block text-[11px]">Pages & Copies:</span>
                                                    <p className="font-bold text-white">{job.pageCount} Pages · {job.copies} Sets</p>
                                                    <span className="text-[10px] text-slate-400">{job.doubleSided ? 'Double Sided' : 'Single Sided'} · {job.isColor ? 'Color' : 'B&W'}</span>
                                                </div>

                                                <div className="p-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A]">
                                                    <span className="text-slate-400 block text-[11px]">Paper & Binding:</span>
                                                    <p className="font-bold text-white">{job.paperType}</p>
                                                    <span className="text-[10px] text-emerald-400 font-semibold">{job.bindingType}</span>
                                                </div>

                                                <div className="p-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A]">
                                                    <span className="text-slate-400 block text-[11px]">Order Cost:</span>
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <p className="font-black text-sm text-[#06B6D4]">₹{Number(job.cost).toFixed(2)}</p>
                                                        {job.paymentStatus === 'Paid' ? (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                                                                ✓ Paid (Razorpay)
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                                                                Counter Pay
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">Received {new Date(job.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>

                                            {/* Special Requirements from Customer */}
                                            {job.specialInstructions && (
                                                <div className="p-3 rounded-2xl bg-[#0A0F1D] border border-amber-500/30 text-xs">
                                                    <span className="font-bold text-amber-400 block mb-0.5">📌 Customer Special Instructions:</span>
                                                    <p className="text-slate-200">{job.specialInstructions}</p>
                                                </div>
                                            )}

                                            {/* Counter location / Admin Notes */}
                                            <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-1">
                                                <div className="flex items-center gap-1 text-slate-400">
                                                    <Tag className="w-3.5 h-3.5 text-[#22D3EE]" />
                                                    <span>Counter Location Note: <strong className="text-slate-200">{job.counterNote || 'At Main Counter'}</strong></span>
                                                </div>

                                                {/* Admin Actions Stepper */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {job.fileData && (
                                                        <a
                                                            href={job.fileData}
                                                            download={job.fileName || 'document'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-1.5 rounded-xl bg-[#06B6D4]/15 hover:bg-[#06B6D4]/25 text-[#22D3EE] border border-[#06B6D4]/30 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                                                            title="Download / View document"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            <span>Open Document</span>
                                                        </a>
                                                    )}
                                                    {job.status === 'Queued' && (
                                                        <button
                                                            onClick={() => handleAdminStatusChange(job.id, 'Printing', null, job.pickupToken)}
                                                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" />
                                                            <span>Start Printing</span>
                                                        </button>
                                                    )}

                                                    {job.status === 'Printing' && (
                                                        <button
                                                            onClick={() => setModalJobToReady(job)}
                                                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow"
                                                        >
                                                            <Bell className="w-3.5 h-3.5 animate-bounce" />
                                                            <span>Mark Ready & Notify Customer</span>
                                                        </button>
                                                    )}

                                                    {job.status === 'Ready for Pickup' && (
                                                        <button
                                                            onClick={() => handleAdminStatusChange(job.id, 'Completed', null, job.pickupToken)}
                                                            className="px-3.5 py-1.5 rounded-xl bg-[#06B6D4] hover:bg-[#22D3EE] text-[#070A11] font-bold text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>Verify Token & Handover</span>
                                                        </button>
                                                    )}

                                                    {job.status === 'Completed' && (
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                                                            <Check className="w-4 h-4" /> Delivered to Customer
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════════
                    TAB 3: DIGITAL PICKUP TOKENS & STATUS CLAIM CARDS
                ══════════════════════════════════════════════════════════════════════ */}
                {activeTab === 'queue' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <QrCode className="w-5 h-5 text-[#06B6D4]" />
                                    <span>{isAdmin ? 'Digital Pickup Token Claim Cards' : 'My Print Requests & Digital Pickup Tokens'}</span>
                                </h2>
                                <p className="text-xs text-slate-400">
                                    {isAdmin
                                        ? 'Visual overview of all issued customer pickup tokens, customer IDs, and counter ready notes.'
                                        : 'Present your unique Token ID at the Xerox counter to pick up your printed materials.'
                                    }
                                </p>
                            </div>
                            <Button
                                onClick={fetchJobs}
                                variant="outline"
                                size="sm"
                                className="text-xs flex items-center gap-1"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loadingJobs ? 'animate-spin' : ''}`} />
                                <span>Refresh Status</span>
                            </Button>
                        </div>

                        {loadingJobs ? (
                            <SkeletonLoader variant="card" count={2} />
                        ) : jobs.length === 0 ? (
                            <EmptyState
                                icon={Printer}
                                title="No Print Requests Yet"
                                description="You haven't submitted any print jobs. Create a new request to get your unique pickup token."
                                action={
                                    <Button onClick={() => setActiveTab('new')} className="bg-[#06B6D4] text-[#070A11] font-bold font-bold text-xs">
                                        Submit Print Request
                                    </Button>
                                }
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {jobs.map((job) => {
                                    const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG['Queued'];
                                    const StatusIcon = statusCfg.icon;
                                    const isReady = job.status === 'Ready for Pickup';

                                    return (
                                        <div
                                            key={job.id}
                                            className={`rounded-3xl p-5 bg-[#0D1527] border shadow-sm flex flex-col justify-between transition-all ${
                                                isReady
                                                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-emerald-500/10'
                                                    : 'border-[#1E2D4A]'
                                            }`}
                                        >
                                            {/* Digital Token Card Header */}
                                            <div>
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-3 rounded-2xl bg-[#06B6D4]/20 text-[#22D3EE] border border-[#06B6D4]/30 shadow-md">
                                                            <QrCode className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pickup Token</span>
                                                            <span className="text-xl font-black text-[#06B6D4] tracking-wider">
                                                                {job.pickupToken || '#PX-0000'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${statusCfg.bg}`}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        <span>{statusCfg.label}</span>
                                                    </span>
                                                </div>

                                                {/* Ready notification alert box */}
                                                {isReady && (
                                                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1 mb-3">
                                                        <p className="font-bold flex items-center gap-1.5">
                                                            <Bell className="w-4 h-4 text-emerald-400 animate-bounce" />
                                                            <span>Your Xerox is Ready at the Counter!</span>
                                                        </p>
                                                        <p className="text-[11px]">Location: <strong className="text-white">{job.counterNote || 'Counter 1 · Box B'}</strong></p>
                                                    </div>
                                                )}

                                                {/* Specs */}
                                                <div className="space-y-1.5 text-xs text-slate-300">
                                                    <h3 className="font-bold text-white text-sm truncate" title={job.fileName}>
                                                        {job.fileName}
                                                    </h3>
                                                    <p className="text-slate-400 text-[11px]">
                                                        Requester ID: <strong className="text-[#06B6D4] font-mono">{job.customerUniqueId || 'N/A'}</strong>
                                                    </p>

                                                    {job.fileData && (
                                                        <div className="pt-1">
                                                            <a
                                                                href={job.fileData}
                                                                download={job.fileName || 'my_document'}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#06B6D4]/15 hover:bg-[#06B6D4]/25 text-[#22D3EE] border border-[#06B6D4]/30 text-[11px] font-bold transition-colors"
                                                            >
                                                                <FileCheck className="w-3.5 h-3.5 text-[#06B6D4]" />
                                                                <span>View / Download Uploaded File</span>
                                                            </a>
                                                        </div>
                                                    )}

                                                    <div className="pt-2 grid grid-cols-2 gap-2 text-[11px]">
                                                        <div>
                                                            <span className="text-slate-400">Pages & Copies:</span>
                                                            <p className="font-semibold text-slate-200">{job.pageCount} pgs × {job.copies} copies</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400">Print Specs:</span>
                                                            <p className="font-semibold text-[#06B6D4]">{job.isColor ? 'Color' : 'B&W'} · {job.paperType}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400">Binding:</span>
                                                            <p className="font-semibold text-slate-200">{job.bindingType}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400">Total Price:</span>
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <p className="font-black text-sm text-white">₹{Number(job.cost).toFixed(2)}</p>
                                                                {job.paymentStatus === 'Paid' ? (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                                                                        ✓ Paid (Razorpay)
                                                                    </span>
                                                                ) : (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                                                                        Pay at Counter
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {job.specialInstructions && (
                                                        <p className="text-[11px] text-slate-300 italic bg-[#0A0F1D] border border-[#1E2D4A] p-2 rounded-xl mt-2">
                                                            Instructions: "{job.specialInstructions}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Footer Step Tracker */}
                                            <div className="mt-4 pt-3 border-t border-[#1E2D4A] flex items-center justify-between text-[11px] text-slate-400">
                                                <span>Submitted {new Date(job.timestamp).toLocaleDateString()}</span>
                                                <span className="font-semibold text-[#06B6D4]">Show this card at Counter</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════════════════
                MODAL: ADMIN NOTIFY & SET COUNTER LOCATION NOTE
            ══════════════════════════════════════════════════════════════════════ */}
            {modalJobToReady && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0D1527] border border-[#1E2D4A] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-[#1E2D4A] pb-2">
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <Bell className="w-4 h-4 text-emerald-500" />
                                <span>Notify Customer: Xerox Ready</span>
                            </h2>
                            <button onClick={() => setModalJobToReady(null)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                            <p><strong>Token ID:</strong> {modalJobToReady.pickupToken}</p>
                            <p><strong>Requester ID:</strong> {modalJobToReady.customerUniqueId || 'N/A'}</p>
                            <p><strong>Document:</strong> {modalJobToReady.fileName}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Pickup Counter / Box Location Note *
                            </label>
                            <input
                                type="text"
                                value={readyCounterNote}
                                onChange={(e) => setReadyCounterNote(e.target.value)}
                                placeholder="e.g. Counter 1 · Tray B or Dispatch Desk 2"
                                className="w-full px-3 py-2 rounded-xl border border-[#1E2D4A] bg-[#0A0F1D] text-white font-medium text-xs focus:ring-2 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4] outline-none"
                            />
                            <span className="text-[11px] text-gray-400 mt-1 block">
                                This note and an instant pickup alert will be dispatched to the student/staff member.
                            </span>
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setModalJobToReady(null)}>
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => handleAdminStatusChange(modalJobToReady.id, 'Ready for Pickup', readyCounterNote, modalJobToReady.pickupToken)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            >
                                Dispatch Notification
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Razorpay Fallback Checkout Modal */}
            {razorpayFallbackOpen && fallbackPaymentData && (
                <RazorpayCheckoutModal
                    isOpen={razorpayFallbackOpen}
                    onClose={() => setRazorpayFallbackOpen(false)}
                    amount={fallbackPaymentData.amount}
                    currency={fallbackPaymentData.currency}
                    title={fallbackPaymentData.title}
                    description={fallbackPaymentData.description}
                    module={fallbackPaymentData.module}
                    token={fallbackPaymentData.token}
                    customer={fallbackPaymentData.customer}
                    onPaymentSuccess={fallbackPaymentData.onSuccess}
                />
            )}

            {/* Razorpay Verified Success Receipt Modal */}
            {successPaymentData && (
                <PaymentSuccessModal
                    isOpen={!!successPaymentData}
                    onClose={() => setSuccessPaymentData(null)}
                    paymentRecord={successPaymentData}
                    orderToken={successPaymentData.token}
                    title="Payment Received"
                    serviceName={successPaymentData.serviceName || 'Document & Xerox Printing'}
                />
            )}
        </div>
    );
}
