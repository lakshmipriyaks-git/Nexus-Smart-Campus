import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDays,
    Calendar,
    Clock,
    MapPin,
    Users,
    Sparkles,
    Plus,
    Search,
    Filter,
    CheckCircle2,
    Ticket,
    Share2,
    Download,
    ExternalLink,
    Trash2,
    Edit3,
    AlertCircle,
    X,
    FileText,
    Phone,
    Mail,
    Award,
    Tag,
    ChevronRight,
    Home,
    User,
    ShieldCheck,
    GraduationCap,
    Eye,
    QrCode,
    Printer,
    Radio,
    Flame,
    ArrowUpRight,
    RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROLES, DEPARTMENTS } from '../utils/constants';
import { initiateRazorpayCheckout } from '../services/razorpayService';
import RazorpayCheckoutModal from '../components/payment/RazorpayCheckoutModal';
import PaymentSuccessModal from '../components/payment/PaymentSuccessModal';
import {
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventRegistrations,
    registerForEvent,
    cancelEventRegistration
} from '../services/campusUtilitiesService';

// Curated Poster Presets for Staff & HOD Uploads
const BANNER_PRESETS = [
    { label: 'Hackathon & Coding', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80' },
    { label: 'AI & Neural Tech', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Cultural & Music Fest', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Robotics & Hardware', url: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Cloud & Tech Keynote', url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Sports & Athletics', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Seminar & Workshop', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80' },
    { label: 'Design & Creative Arts', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80' },
];

const CATEGORIES = [
    'All',
    'Hackathon',
    'Workshop',
    'Tech Symposium',
    'Cultural Fest',
    'Guest Lecture',
    'Sports',
    'Seminar',
    'Webinar'
];

const CATEGORY_COLORS = {
    'Hackathon': 'bg-[#06B6D4]/15 text-[#22D3EE] border-[#06B6D4]/30',
    'Workshop': 'bg-[#06B6D4]/15 text-[#22D3EE] border-[#06B6D4]/30',
    'Tech Symposium': 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30',
    'Cultural Fest': 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/30',
    'Guest Lecture': 'bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/30',
    'Sports': 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30',
    'Seminar': 'bg-[#06B6D4]/15 text-[#22D3EE] border-[#06B6D4]/30',
    'Webinar': 'bg-[#06B6D4]/15 text-[#22D3EE] border-[#06B6D4]/30',
};

export default function EventManagementPage() {
    const navigate = useNavigate();
    const { getDomainUser, logoutDomain } = useAuth();
    const user = getDomainUser('events');

    const isStaffOrHod = user?.role === ROLES.STAFF || user?.role === ROLES.HOD || user?.role === ROLES.ADMIN || user?.role === ROLES.TEACHER;
    const isHod = user?.role === ROLES.HOD;

    // Core Data
    const [events, setEvents] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters & Navigation
    const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'registered' | 'manage'
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [timeFilter, setTimeFilter] = useState('upcoming'); // 'all' | 'upcoming' | 'past'
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('All');

    // Modals
    const [selectedEvent, setSelectedEvent] = useState(null); // Details modal
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // Upload modal
    const [editingEvent, setEditingEvent] = useState(null); // Edit modal
    const [attendeesModalEvent, setAttendeesModalEvent] = useState(null); // Attendees list modal
    const [activeTicket, setActiveTicket] = useState(null); // E-Pass modal

    // Form State for Event Upload / Edit
    const initialFormState = {
        title: '',
        tagline: '',
        category: 'Hackathon',
        department: user?.department || 'Computer Science & Engineering',
        departmentId: user?.departmentId || 'CSE',
        organizerName: user?.name || '',
        organizerRole: user?.role || 'staff',
        organizerEmail: user?.email || '',
        organizerPhone: user?.phone || '',
        venue: 'APJ Abdul Kalam Main Auditorium',
        venueType: 'In-Person',
        meetingLink: '',
        eventDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        startTime: '10:00 AM',
        endTime: '04:30 PM',
        bannerImage: BANNER_PRESETS[0].url,
        maxCapacity: 150,
        registrationDeadline: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
        registrationFee: 0,
        isFeatured: false,
        status: 'Upcoming',
        tags: 'Hackathon, Innovation, AI',
        eligibility: 'Open to all BE / B.Tech students across all semesters',
        perks: 'Certificate of Participation, Cash Prizes, Free Lunch & Swag',
        description: ''
    };

    const [eventForm, setEventForm] = useState(initialFormState);
    const [submitting, setSubmitting] = useState(false);
    const [attendeeSearch, setAttendeeSearch] = useState('');

    // Razorpay Checkout States
    const [razorpayFallbackOpen, setRazorpayFallbackOpen] = useState(false);
    const [fallbackPaymentData, setFallbackPaymentData] = useState(null);
    const [successPaymentData, setSuccessPaymentData] = useState(null);

    // Fetch Events & Registrations
    const loadData = async () => {
        setLoading(true);
        try {
            const [evts, regs] = await Promise.all([
                getEvents(),
                getEventRegistrations()
            ]);
            setEvents(evts);
            setRegistrations(regs);
        } catch (error) {
            console.error('Error fetching event data:', error);
            toast.error('Failed to load campus events');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Helper: Is current student registered for an event
    const isUserRegistered = (eventId) => {
        return registrations.some(
            r => r.eventId === eventId &&
            (r.userId === user?.id || r.userId === user?.uid || r.userEmail === user?.email) &&
            r.status !== 'Cancelled'
        );
    };

    // Helper: Get user's registration object for an event
    const getUserRegistration = (eventId) => {
        return registrations.find(
            r => r.eventId === eventId &&
            (r.userId === user?.id || r.userId === user?.uid || r.userEmail === user?.email) &&
            r.status !== 'Cancelled'
        );
    };

    // Filtered Events
    const filteredEvents = useMemo(() => {
        return events.filter(evt => {
            // Category filter
            if (selectedCategory !== 'All' && evt.category !== selectedCategory) return false;

            // Department filter
            if (departmentFilter !== 'All' && evt.department !== departmentFilter && evt.departmentId !== departmentFilter && evt.department !== 'All Departments') {
                return false;
            }

            // Time filter
            const todayStr = new Date().toISOString().split('T')[0];
            if (timeFilter === 'upcoming' && evt.eventDate < todayStr && evt.status !== 'Live Now') return false;
            if (timeFilter === 'past' && evt.eventDate >= todayStr && evt.status !== 'Completed') return false;

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchTitle = evt.title?.toLowerCase().includes(q);
                const matchDesc = evt.description?.toLowerCase().includes(q) || evt.tagline?.toLowerCase().includes(q);
                const matchVenue = evt.venue?.toLowerCase().includes(q);
                const matchOrganizer = evt.organizerName?.toLowerCase().includes(q);
                const matchDept = evt.department?.toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchVenue && !matchOrganizer && !matchDept) return false;
            }

            return true;
        });
    }, [events, selectedCategory, departmentFilter, timeFilter, searchQuery]);

    // Student's Registered Events
    const registeredEvents = useMemo(() => {
        const userRegEventIds = registrations
            .filter(r => (r.userId === user?.id || r.userId === user?.uid || r.userEmail === user?.email) && r.status !== 'Cancelled')
            .map(r => r.eventId);
        return events.filter(e => userRegEventIds.includes(e.id));
    }, [events, registrations, user]);

    // Staff/HOD Uploaded Events
    const myUploadedEvents = useMemo(() => {
        if (!isStaffOrHod) return [];
        return events.filter(e => {
            if (isHod) return true; // HOD can manage all events
            return e.organizerEmail === user?.email || e.organizerName === user?.name;
        });
    }, [events, isStaffOrHod, isHod, user]);

    // Featured Hero Event
    const featuredEvent = useMemo(() => {
        return events.find(e => e.isFeatured && e.status !== 'Completed') || events[0];
    }, [events]);

    // ── Handle Register For Event ──
    const handleRegister = async (event) => {
        if (!user) {
            toast.error('Please login to register for events');
            return;
        }

        if (isUserRegistered(event.id)) {
            const reg = getUserRegistration(event.id);
            setActiveTicket({ event, registration: reg });
            return;
        }

        if (event.registeredCount >= event.maxCapacity) {
            toast.error('Registration is full for this event');
            return;
        }

        const isPaid = !event.isFree && parseFloat(event.registrationFee) > 0;
        const feeAmount = parseFloat(event.registrationFee) || 0;

        const completeRegistration = async (paymentDetails = null) => {
            try {
                const newReg = await registerForEvent(event.id, {
                    userId: user.id || user.uid,
                    userName: user.name || '',
                    userEmail: user.email || '',
                    userRole: user.role || ROLES.STUDENT,
                    usn: user.usn || '',
                    semester: user.semester || '',
                    department: user.department || '',
                    phone: user.phone || '',
                    paymentStatus: isPaid ? 'Paid' : 'Free',
                    paymentAmount: feeAmount,
                    paymentMethod: paymentDetails ? (paymentDetails.method || 'Razorpay') : (isPaid ? 'Razorpay' : 'Free RSVP'),
                    razorpayPaymentId: paymentDetails?.paymentId || null
                });

                toast.success(`🎉 Registered successfully for ${event.title}!`);
                await loadData();
                setActiveTicket({ event, registration: newReg });

                if (paymentDetails) {
                    setSuccessPaymentData({
                        ...paymentDetails,
                        token: newReg?.id ? newReg.id.slice(0, 8).toUpperCase() : 'TICKET',
                        serviceName: `Event Pass: ${event.title}`
                    });
                }
            } catch (error) {
                console.error('Registration failed:', error);
                toast.error(error.message || 'Registration failed');
            }
        };

        if (isPaid) {
            await initiateRazorpayCheckout({
                amount: feeAmount,
                currency: 'INR',
                title: 'Campus Events Desk',
                description: `Ticket: ${event.title}`,
                module: 'events',
                token: event.id ? event.id.slice(0, 8).toUpperCase() : 'EVT',
                customer: {
                    name: user?.name,
                    email: user?.email,
                    uniqueId: user?.usn
                },
                onSuccess: (paymentRecord) => {
                    completeRegistration(paymentRecord);
                },
                onFailure: (err) => {
                    toast.error('Event ticket payment was cancelled or failed.');
                },
                onFallbackModal: (params) => {
                    setFallbackPaymentData({
                        ...params,
                        onSuccess: (paymentRecord) => completeRegistration(paymentRecord)
                    });
                    setRazorpayFallbackOpen(true);
                }
            });
        } else {
            await completeRegistration(null);
        }
    };

    // ── Handle Cancel RSVP ──
    const handleCancelRegistration = async (eventId) => {
        const reg = getUserRegistration(eventId);
        if (!reg) return;

        if (window.confirm('Are you sure you want to cancel your event registration?')) {
            try {
                await cancelEventRegistration(reg.id, eventId);
                toast.success('Registration cancelled.');
                setActiveTicket(null);
                await loadData();
            } catch (error) {
                toast.error('Failed to cancel registration');
            }
        }
    };

    // ── Handle Upload / Create Event (Staff & HOD) ──
    const handleSaveEvent = async (e) => {
        e.preventDefault();
        if (!eventForm.title.trim()) {
            toast.error('Please provide an event title');
            return;
        }

        setSubmitting(true);
        try {
            const tagsArray = eventForm.tags.split(',').map(t => t.trim()).filter(Boolean);
            const perksArray = eventForm.perks.split(',').map(p => p.trim()).filter(Boolean);

            const payload = {
                ...eventForm,
                tags: tagsArray,
                perks: perksArray,
                maxCapacity: parseInt(eventForm.maxCapacity, 10) || 100,
                registrationFee: parseFloat(eventForm.registrationFee) || 0,
                organizerRole: user?.role || 'staff',
                organizerName: eventForm.organizerName || user?.name,
                organizerEmail: eventForm.organizerEmail || user?.email
            };

            if (editingEvent) {
                await updateEvent(editingEvent.id, payload);
                toast.success('Event updated successfully! 🚀');
            } else {
                await createEvent(payload);
                toast.success('New Campus Event published! 📢');
            }

            setIsUploadModalOpen(false);
            setEditingEvent(null);
            setEventForm(initialFormState);
            await loadData();
        } catch (error) {
            console.error('Save event failed:', error);
            toast.error('Failed to save event');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Handle Delete Event ──
    const handleDeleteEvent = async (eventId, eventTitle) => {
        if (window.confirm(`Are you sure you want to delete "${eventTitle}"? This cannot be undone.`)) {
            try {
                await deleteEvent(eventId);
                toast.success('Event deleted.');
                await loadData();
            } catch (error) {
                toast.error('Failed to delete event');
            }
        }
    };

    // Open Edit Modal
    const handleEditClick = (event) => {
        setEditingEvent(event);
        setEventForm({
            ...event,
            tags: Array.isArray(event.tags) ? event.tags.join(', ') : (event.tags || ''),
            perks: Array.isArray(event.perks) ? event.perks.join(', ') : (event.perks || '')
        });
        setIsUploadModalOpen(true);
    };

    // Export Attendees to CSV
    const handleExportAttendeesCSV = (event) => {
        const eventRegs = registrations.filter(r => r.eventId === event.id && r.status !== 'Cancelled');
        if (eventRegs.length === 0) {
            toast.error('No registered attendees found to export.');
            return;
        }

        const headers = ['Ticket Number', 'Student Name', 'USN', 'Semester', 'Department', 'Email', 'Phone', 'Registration Date', 'Status'];
        const rows = eventRegs.map(r => [
            r.ticketNumber,
            `"${r.userName}"`,
            r.usn,
            r.semester,
            `"${r.department}"`,
            r.userEmail,
            r.phone,
            r.registrationDate?.split('T')[0] || '',
            r.status
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Attendees.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${eventRegs.length} attendees to CSV! 📥`);
    };

    return (
        <div className="min-h-screen bg-[#F5F6FF] dark:bg-[#070A11] text-[#202442] dark:text-slate-100 font-sans p-4 sm:p-6 lg:p-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Top Bar & Domain Header ── */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-[#22D3EE] px-3.5 py-2 rounded-full bg-[#0D1527] border border-[#1E2D4A] shadow-sm transition-all"
                    >
                        <Home className="w-4 h-4 text-[#06B6D4]" />
                        <span>← Campus Home</span>
                    </Link>

                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#22D3EE] text-xs font-semibold">
                            {isHod ? <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B]" /> : isStaffOrHod ? <Award className="w-3.5 h-3.5 text-[#22D3EE]" /> : <GraduationCap className="w-3.5 h-3.5 text-[#06B6D4]" />}
                            <span>{user?.name} ({user?.role?.toUpperCase()})</span>
                        </div>

                        {/* Create Event Button for Staff and HOD */}
                        {isStaffOrHod && (
                            <button
                                onClick={() => {
                                    setEditingEvent(null);
                                    setEventForm(initialFormState);
                                    setIsUploadModalOpen(true);
                                }}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#06B6D4] hover:bg-[#22D3EE] text-[#070A11] text-xs font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Create Event</span>
                            </button>
                        )}

                        <button
                            onClick={() => {
                                logoutDomain('events');
                                toast.success('Signed out from Event Management');
                                navigate('/login');
                            }}
                            className="text-xs px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* ── Header Banner (Reference Style) ── */}
                <div className="relative overflow-hidden rounded-2xl bg-[#0D1527] border border-[#1E2D4A] p-6 sm:p-8 text-white shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06B6D4]/15 text-[#22D3EE] border border-[#06B6D4]/30 text-xs font-mono font-semibold tracking-wide uppercase">
                                <CalendarDays className="w-3.5 h-3.5" />
                                <span>Campus Events & Hackathon Radar</span>
                            </div>
                            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                                Campus Events & Symposium Desk
                            </h1>
                            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                                Institutional technical symposiums, hackathons, guest keynotes, and verified digital event passes.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-3.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                                <div>
                                    <div className="text-xs font-bold text-white font-mono">
                                        {events.filter(e => e.status === 'Live Now' || e.status === 'Upcoming').length} Active Events
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                        {registrations.length} Total RSVPs
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Main Navigation Tabs ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2D4A] pb-3">
                    <div className="flex gap-2 p-1 bg-[#0A0F1D] rounded-full border border-[#1E2D4A]">
                        <button
                            onClick={() => setActiveTab('browse')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                                activeTab === 'browse'
                                    ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Discover Events ({events.length})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('registered')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 relative ${
                                activeTab === 'registered'
                                    ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Ticket className="w-3.5 h-3.5" />
                            <span>My Registered Events</span>
                            {registeredEvents.length > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-[#F59E0B] text-[#070A11] text-[10px] font-black">
                                    {registeredEvents.length}
                                </span>
                            )}
                        </button>

                        {isStaffOrHod && (
                            <button
                                onClick={() => setActiveTab('manage')}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                                    activeTab === 'manage'
                                        ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{isHod ? 'All Department Events' : 'My Events'} ({myUploadedEvents.length})</span>
                            </button>
                        )}
                    </div>

                    {/* Quick Stats Pill */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                            {events.filter(e => e.status === 'Live Now' || e.status === 'Upcoming').length} Active
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#22D3EE]" />
                            {registrations.length} Total Registrations
                        </span>
                    </div>
                </div>

                {/* ── FEATURED HERO SPOTLIGHT BANNER (Only on Browse Tab) ── */}
                {activeTab === 'browse' && featuredEvent && !searchQuery && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 group min-h-[340px] flex flex-col justify-end p-6 sm:p-10"
                    >
                        {/* Background Poster Image with gradient overlay */}
                        <img
                            src={featuredEvent.bannerImage}
                            alt={featuredEvent.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.45]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />

                        {/* Content */}
                        <div className="relative z-10 max-w-3xl space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-[#F59E0B] text-[#070A11] flex items-center gap-1 shadow-md font-black">
                                    <Flame className="w-3.5 h-3.5" /> Featured Spotlight
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
                                    {featuredEvent.category}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/40 text-[#22D3EE] border border-[#06B6D4]/30">
                                    {featuredEvent.department}
                                </span>
                            </div>

                            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                                {featuredEvent.title}
                            </h2>

                            <p className="text-sm sm:text-base text-gray-200 line-clamp-2 max-w-2xl font-normal">
                                {featuredEvent.tagline || featuredEvent.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs text-gray-300 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-[#06B6D4]" />
                                    <span>{featuredEvent.eventDate}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-amber-400" />
                                    <span>{featuredEvent.startTime} - {featuredEvent.endTime}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-emerald-400" />
                                    <span>{featuredEvent.venue}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-cyan-400" />
                                    <span>{featuredEvent.registeredCount} / {featuredEvent.maxCapacity} Registered</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-3 pt-3">
                                {isUserRegistered(featuredEvent.id) ? (
                                    <button
                                        onClick={() => {
                                            const reg = getUserRegistration(featuredEvent.id);
                                            setActiveTicket({ event: featuredEvent, registration: reg });
                                        }}
                                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>View Your Pass</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleRegister(featuredEvent)}
                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-[#070A11] text-white font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-transform active:scale-95"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>1-Click Register (Free)</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => setSelectedEvent(featuredEvent)}
                                    className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs sm:text-sm border border-white/20 flex items-center gap-2 transition-colors"
                                >
                                    <span>View Details & Agenda</span>
                                    <ArrowUpRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── SEARCH & FILTER CONTROLS (On Browse & Manage Tabs) ── */}
                {activeTab !== 'registered' && (
                    <div className="p-4 rounded-2xl bg-[#0D1527] border border-[#1E2D4A] shadow-sm space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            {/* Search Input */}
                            <div className="relative flex-1 min-w-[240px]">
                                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search events by title, organizer, topic, venue..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40 focus:border-[#06B6D4]"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Time Filters */}
                            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs">
                                <button
                                    onClick={() => setTimeFilter('upcoming')}
                                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                                        timeFilter === 'upcoming'
                                            ? 'bg-[#06B6D4] text-[#070A11] shadow-sm'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
                                    }`}
                                >
                                    Upcoming
                                </button>
                                <button
                                    onClick={() => setTimeFilter('all')}
                                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                                        timeFilter === 'all'
                                            ? 'bg-[#06B6D4] text-[#070A11] shadow-sm'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
                                    }`}
                                >
                                    All Dates
                                </button>
                                <button
                                    onClick={() => setTimeFilter('past')}
                                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                                        timeFilter === 'past'
                                            ? 'bg-[#06B6D4] text-[#070A11] shadow-sm'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
                                    }`}
                                >
                                    Past
                                </button>
                            </div>
                        </div>

                        {/* Category Pills Slider */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                        selectedCategory === cat
                                            ? 'bg-[#06B6D4] text-[#070A11] shadow-sm'
                                            : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── TAB 1: BROWSE EVENTS GRID (STUDENT & ALL ROLES) ── */}
                {activeTab === 'browse' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-[#06B6D4]" />
                                <span>Published Campus Events</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#06B6D4]/10 text-[#06B6D4] dark:text-[#06B6D4] font-bold">
                                    {filteredEvents.length}
                                </span>
                            </h3>

                            {isStaffOrHod && (
                                <button
                                    onClick={() => {
                                        setEditingEvent(null);
                                        setEventForm(initialFormState);
                                        setIsUploadModalOpen(true);
                                    }}
                                    className="text-xs font-bold text-[#06B6D4] dark:text-[#06B6D4] hover:underline flex items-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Create New Event</span>
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(n => (
                                    <div key={n} className="rounded-2xl h-80 bg-gray-200 dark:bg-white/5 animate-pulse" />
                                ))}
                            </div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="text-center py-16 px-4 rounded-2xl bg-[#0D1527] border border-dashed border-[#1E2D4A] shadow-lg">
                                <div className="w-12 h-12 rounded-2xl bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20 flex items-center justify-center mx-auto mb-3"><CalendarDays className="w-6 h-6" /></div>
                                <h4 className="text-base font-extrabold text-white">No events found</h4>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                                    No events match your current search and category filters. Try clearing your search query or selecting "All".
                                </p>
                                <button
                                    onClick={() => {
                                        setSelectedCategory('All');
                                        setSearchQuery('');
                                        setTimeFilter('all');
                                    }}
                                    className="mt-4 px-5 py-2.5 rounded-xl bg-[#06B6D4] hover:bg-[#22D3EE] text-[#070A11] text-xs font-black shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all active:scale-95"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredEvents.map(event => {
                                    const registered = isUserRegistered(event.id);
                                    const seatsLeft = Math.max(0, event.maxCapacity - (event.registeredCount || 0));
                                    const isFull = seatsLeft === 0;
                                    const percentBooked = Math.min(100, Math.round(((event.registeredCount || 0) / event.maxCapacity) * 100));

                                    return (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="group rounded-2xl overflow-hidden backdrop-blur-xl bg-[#0D1527] border border-[#1E2D4A] hover:border-[#06B6D4]/60 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                                        >
                                            {/* Top Banner Image with badges */}
                                            <div className="relative h-44 overflow-hidden bg-gray-900">
                                                <img
                                                    src={event.bannerImage}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-black/40" />

                                                {/* Category & Status Badges */}
                                                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-md border ${CATEGORY_COLORS[event.category] || 'bg-white/20 text-white border-white/20'}`}>
                                                        {event.category}
                                                    </span>

                                                    {event.status === 'Live Now' ? (
                                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-emerald-500 text-white flex items-center gap-1 shadow-md animate-pulse">
                                                            <Radio className="w-3 h-3" /> Live Now
                                                        </span>
                                                    ) : event.isFeatured ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow-md">
                                                            <Flame className="w-3 h-3" /> Featured
                                                        </span>
                                                    ) : null}
                                                </div>

                                                {/* Date Pill at bottom left of banner */}
                                                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/10">
                                                    <Calendar className="w-3.5 h-3.5 text-[#06B6D4]" />
                                                    <span>{event.eventDate}</span>
                                                </div>

                                                {/* Free / Paid Pill at bottom right */}
                                                <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                                                    {event.isFree ? 'FREE' : `₹${event.registrationFee}`}
                                                </div>
                                            </div>

                                            {/* Card Content Body */}
                                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                                <div className="space-y-2">
                                                    <div className="text-[11px] font-semibold text-[#06B6D4] dark:text-[#06B6D4] truncate">
                                                        {event.department}
                                                    </div>

                                                    <h4 className="text-base font-bold text-white line-clamp-2 leading-snug group-hover:text-[#06B6D4] dark:group-hover:text-[#06B6D4] transition-colors">
                                                        {event.title}
                                                    </h4>

                                                    <p className="text-xs text-slate-400 line-clamp-2">
                                                        {event.tagline || event.description}
                                                    </p>

                                                    <div className="space-y-1.5 pt-2 text-xs text-slate-400">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                            <span>{event.startTime} - {event.endTime}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                            <span className="truncate">{event.venue}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                            <span className="truncate">Organized by: {event.organizerName}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Seats & Progress Bar */}
                                                <div className="space-y-1.5 pt-1">
                                                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                                                        <span>Seats: {event.registeredCount || 0} / {event.maxCapacity}</span>
                                                        <span className={isFull ? 'text-red-500' : 'text-emerald-500'}>
                                                            {isFull ? 'Housefull' : `${seatsLeft} seats left`}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                percentBooked >= 90 ? 'bg-red-500' : percentBooked >= 70 ? 'bg-amber-500' : 'bg-[#06B6D4]'
                                                            }`}
                                                            style={{ width: `${percentBooked}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Card Footer Actions */}
                                                <div className="pt-2 flex items-center gap-2">
                                                    {registered ? (
                                                        <button
                                                            onClick={() => {
                                                                const reg = getUserRegistration(event.id);
                                                                setActiveTicket({ event, registration: reg });
                                                            }}
                                                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>✓ Registered · View Pass</span>
                                                        </button>
                                                    ) : isFull ? (
                                                        <button
                                                            disabled
                                                            className="flex-1 py-2 px-3 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 text-xs font-bold cursor-not-allowed"
                                                        >
                                                            Registration Full
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleRegister(event)}
                                                            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-[#070A11] text-white text-xs font-bold shadow-md shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                                                        >
                                                            <Ticket className="w-3.5 h-3.5" />
                                                            <span>Register Now</span>
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => setSelectedEvent(event)}
                                                        className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-slate-300 transition-colors"
                                                        title="View full event details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB 2: MY REGISTERED EVENTS (STUDENT TICKETS & PASSES) ── */}
                {activeTab === 'registered' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                                <Ticket className="w-5 h-5 text-[#06B6D4]" />
                                <span>My Registered Events & Digital Passes</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#06B6D4]/10 text-[#06B6D4] dark:text-[#06B6D4] font-bold">
                                    {registeredEvents.length}
                                </span>
                            </h3>
                        </div>

                        {registeredEvents.length === 0 ? (
                            <div className="text-center py-16 px-4 rounded-2xl bg-[#0D1527] border border-dashed border-[#1E2D4A] shadow-lg">
                                <div className="w-12 h-12 rounded-2xl bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20 flex items-center justify-center mx-auto mb-3"><Ticket className="w-6 h-6" /></div>
                                <h4 className="text-base font-extrabold text-white">No registered events yet</h4>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                                    Browse published campus events and reserve your seat with 1-click registration to get your official QR ticket pass.
                                </p>
                                <button
                                    onClick={() => setActiveTab('browse')}
                                    className="mt-4 px-5 py-2.5 rounded-xl bg-[#06B6D4] hover:bg-[#22D3EE] text-[#070A11] text-xs font-black shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all active:scale-95"
                                >
                                    Explore Events Now
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {registeredEvents.map(event => {
                                    const reg = getUserRegistration(event.id);
                                    return (
                                        <div
                                            key={event.id}
                                            className="rounded-2xl overflow-hidden backdrop-blur-xl bg-[#0D1527] border border-emerald-500/30 shadow-lg p-5 flex flex-col justify-between space-y-4 relative"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Confirmed
                                                    </span>
                                                    <span className="text-xs font-mono font-bold text-slate-400">
                                                        {reg?.ticketNumber}
                                                    </span>
                                                </div>

                                                <h4 className="text-base font-bold text-white line-clamp-2">
                                                    {event.title}
                                                </h4>

                                                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5 text-[#06B6D4]" />
                                                        <span>{event.eventDate} ({event.startTime})</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                                        <span className="truncate">{event.venue}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-[#1E2D4A] flex items-center gap-2">
                                                <button
                                                    onClick={() => setActiveTicket({ event, registration: reg })}
                                                    className="flex-1 py-2 px-3 rounded-xl bg-[#06B6D4] hover:bg-[#22D3EE] text-[#070A11] text-xs font-bold shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5"
                                                >
                                                    <QrCode className="w-3.5 h-3.5" />
                                                    <span>View QR Pass</span>
                                                </button>

                                                <button
                                                    onClick={() => handleCancelRegistration(event.id)}
                                                    className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold transition-colors"
                                                    title="Cancel Registration"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB 3: MANAGE UPLOADED EVENTS (STAFF & HOD ONLY) ── */}
                {activeTab === 'manage' && isStaffOrHod && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                                    <span>{isHod ? 'Department Event Management Desk' : 'Faculty Event Management Desk'}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#06B6D4]/10 text-[#06B6D4] dark:text-[#06B6D4] font-bold">
                                        {myUploadedEvents.length} Events
                                    </span>
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Create new campus fests, modify event schedules, and monitor student attendee registrations in real-time.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setEditingEvent(null);
                                    setEventForm(initialFormState);
                                    setIsUploadModalOpen(true);
                                }}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-[#070A11] text-white text-xs font-bold shadow-md flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Create New Event</span>
                            </button>
                        </div>

                        {myUploadedEvents.length === 0 ? (
                            <div className="text-center py-16 px-4 rounded-2xl bg-[#0D1527] border border-dashed border-[#1E2D4A] shadow-lg">
                                <div className="w-12 h-12 rounded-2xl bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20 flex items-center justify-center mx-auto mb-3"><CalendarDays className="w-6 h-6" /></div>
                                <h4 className="text-base font-extrabold text-white">No events posted yet</h4>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                                    Click the button below to publish your first campus workshop, hackathon, or seminar.
                                </p>
                                <button
                                    onClick={() => {
                                        setEditingEvent(null);
                                        setEventForm(initialFormState);
                                        setIsUploadModalOpen(true);
                                    }}
                                    className="mt-4 px-5 py-2.5 rounded-xl bg-[#06B6D4] hover:bg-[#22D3EE] text-[#070A11] text-xs font-black shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all active:scale-95"
                                >
                                    + Create First Event
                                </button>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-[#1E2D4A] bg-[#0D1527] overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-100/70 dark:bg-white/5 border-b border-[#1E2D4A] text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                                            <tr>
                                                <th className="p-3.5">Event Details</th>
                                                <th className="p-3.5">Category & Dept</th>
                                                <th className="p-3.5">Date & Venue</th>
                                                <th className="p-3.5">Registrations</th>
                                                <th className="p-3.5">Status</th>
                                                <th className="p-3.5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                            {myUploadedEvents.map(event => {
                                                const eventRegs = registrations.filter(r => r.eventId === event.id && r.status !== 'Cancelled');
                                                return (
                                                    <tr key={event.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                                                        <td className="p-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <img
                                                                    src={event.bannerImage}
                                                                    alt={event.title}
                                                                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                                                                />
                                                                <div className="min-w-0">
                                                                    <div className="font-bold text-white truncate max-w-xs">
                                                                        {event.title}
                                                                    </div>
                                                                    <div className="text-[11px] text-gray-500 truncate max-w-xs">
                                                                        By: {event.organizerName}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3.5 whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${CATEGORY_COLORS[event.category] || 'bg-gray-100'}`}>
                                                                {event.category}
                                                            </span>
                                                            <div className="text-[11px] text-gray-500 mt-1">{event.department}</div>
                                                        </td>
                                                        <td className="p-3.5 whitespace-nowrap">
                                                            <div className="font-semibold text-slate-200">{event.eventDate}</div>
                                                            <div className="text-[11px] text-gray-500 truncate max-w-[140px]">{event.venue}</div>
                                                        </td>
                                                        <td className="p-3.5 whitespace-nowrap">
                                                            <div className="font-bold text-white">
                                                                {eventRegs.length} / {event.maxCapacity}
                                                            </div>
                                                            <button
                                                                onClick={() => setAttendeesModalEvent(event)}
                                                                className="text-[11px] text-[#06B6D4] dark:text-[#06B6D4] hover:underline font-semibold"
                                                            >
                                                                View {eventRegs.length} Attendees →
                                                            </button>
                                                        </td>
                                                        <td className="p-3.5 whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                                event.status === 'Live Now'
                                                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                                                    : event.status === 'Completed'
                                                                    ? 'bg-gray-500/20 text-gray-500'
                                                                    : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                                            }`}>
                                                                {event.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-3.5 whitespace-nowrap text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button
                                                                    onClick={() => handleExportAttendeesCSV(event)}
                                                                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"
                                                                    title="Export Attendees CSV"
                                                                >
                                                                    <Download className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEditClick(event)}
                                                                    className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                                                                    title="Edit Event Details"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteEvent(event.id, event.title)}
                                                                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400"
                                                                    title="Delete Event"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
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
                MODAL 1: UPLOAD & EDIT EVENT (FOR STAFF & HOD)
            ══════════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-3xl rounded-3xl bg-[#0D1527] border border-[#1E2D4A] text-slate-100 shadow-2xl overflow-hidden my-8"
                        >
                            <div className="p-6 border-b border-[#1E2D4A] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/15 border border-[#06B6D4]/30 text-[#22D3EE] flex items-center justify-center text-white">
                                        <CalendarDays className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">
                                            {editingEvent ? 'Edit Campus Event' : 'Create New Campus Event'}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Published by {user?.name} ({user?.role?.toUpperCase()})
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsUploadModalOpen(false);
                                        setEditingEvent(null);
                                    }}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveEvent} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                                {/* Title & Tagline */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Event Title *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Nexus HackFest 2026: 36-Hour National Campus Hackathon"
                                            value={eventForm.title}
                                            onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40 focus:border-[#06B6D4]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Catchy Subtitle / Tagline
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Build AI agents, smart IoT, and decentralized web solutions"
                                            value={eventForm.tagline}
                                            onChange={(e) => setEventForm({ ...eventForm, tagline: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40 focus:border-[#06B6D4]"
                                        />
                                    </div>
                                </div>

                                {/* Category, Department & Status */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Category
                                        </label>
                                        <select
                                            value={eventForm.category}
                                            onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                        >
                                            {CATEGORIES.filter(c => c !== 'All').map(c => (
                                                <option key={c} value={c} className="bg-gray-900 text-white">{c}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Organizing Department
                                        </label>
                                        <select
                                            value={eventForm.department}
                                            onChange={(e) => {
                                                const d = DEPARTMENTS.find(dep => dep.label === e.target.value);
                                                setEventForm({
                                                    ...eventForm,
                                                    department: e.target.value,
                                                    departmentId: d ? d.id : 'ALL'
                                                });
                                            }}
                                            className="w-full px-3 py-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                        >
                                            <option value="All Departments" className="bg-gray-900 text-white">Campus Wide / All Departments</option>
                                            {DEPARTMENTS.map(d => (
                                                <option key={d.id} value={d.label} className="bg-gray-900 text-white">{d.label}</option>
                                            ))}
                                            <option value="Cultural Committee" className="bg-gray-900 text-white">Student Cultural Committee</option>
                                            <option value="Sports Council" className="bg-gray-900 text-white">Campus Sports Council</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={eventForm.status}
                                            onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                        >
                                            <option value="Upcoming" className="bg-gray-900 text-white">Upcoming</option>
                                            <option value="Live Now" className="bg-gray-900 text-white">Live Now</option>
                                            <option value="Completed" className="bg-gray-900 text-white">Completed</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Event Start Date *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={eventForm.eventDate}
                                            onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Event End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={eventForm.endDate}
                                            onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Start Time
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="10:00 AM"
                                            value={eventForm.startTime}
                                            onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            End Time
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="04:30 PM"
                                            value={eventForm.endTime}
                                            onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                        />
                                    </div>
                                </div>

                                {/* Venue & Type */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Venue / Campus Location *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. APJ Abdul Kalam Auditorium / Lab 3"
                                            value={eventForm.venue}
                                            onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Venue Type
                                        </label>
                                        <select
                                            value={eventForm.venueType}
                                            onChange={(e) => setEventForm({ ...eventForm, venueType: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                        >
                                            <option value="In-Person" className="bg-gray-900 text-white">In-Person</option>
                                            <option value="Online (Virtual)" className="bg-gray-900 text-white">Online (Virtual)</option>
                                            <option value="Hybrid" className="bg-gray-900 text-white">Hybrid</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Poster Preset Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        Select Banner Poster Artwork
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                                        {BANNER_PRESETS.map((preset, idx) => (
                                            <button
                                                type="button"
                                                key={idx}
                                                onClick={() => setEventForm({ ...eventForm, bannerImage: preset.url })}
                                                className={`relative rounded-xl overflow-hidden h-16 border-2 transition-all ${
                                                    eventForm.bannerImage === preset.url
                                                        ? 'border-[#06B6D4] scale-102 ring-2 ring-[#06B6D4]/40'
                                                        : 'border-transparent opacity-75 hover:opacity-100'
                                                }`}
                                            >
                                                <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                                                <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] font-bold text-white px-1 py-0.5 truncate text-center">
                                                    {preset.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="url"
                                        placeholder="Or paste custom banner image URL..."
                                        value={eventForm.bannerImage}
                                        onChange={(e) => setEventForm({ ...eventForm, bannerImage: e.target.value })}
                                        className="w-full px-3 py-1.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs text-white"
                                    />
                                </div>

                                {/* Capacity, Deadline & Fees */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Max Seat Capacity *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={eventForm.maxCapacity}
                                            onChange={(e) => setEventForm({ ...eventForm, maxCapacity: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Registration Deadline
                                        </label>
                                        <input
                                            type="date"
                                            value={eventForm.registrationDeadline}
                                            onChange={(e) => setEventForm({ ...eventForm, registrationDeadline: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Registration Fee (₹ 0 for Free)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={eventForm.registrationFee}
                                            onChange={(e) => setEventForm({ ...eventForm, registrationFee: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white"
                                        />
                                    </div>
                                </div>

                                {/* Description & Agenda */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        Full Description & Highlights
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Detailed event information, judging criteria, speakers, or schedule..."
                                        value={eventForm.description}
                                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40 focus:border-[#06B6D4]"
                                    />
                                </div>

                                {/* Tags & Perks */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Tags (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="AI/ML, Hackathon, Cash Prize, Python"
                                            value={eventForm.tags}
                                            onChange={(e) => setEventForm({ ...eventForm, tags: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1">
                                            Perks & Goodies (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Certificate, Free Lunch, VTU Points, Prizes"
                                            value={eventForm.perks}
                                            onChange={(e) => setEventForm({ ...eventForm, perks: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs text-white"
                                        />
                                    </div>
                                </div>

                                {/* Featured Toggle */}
                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="featuredToggle"
                                        checked={eventForm.isFeatured}
                                        onChange={(e) => setEventForm({ ...eventForm, isFeatured: e.target.checked })}
                                        className="w-4 h-4 rounded text-[#06B6D4] focus:ring-[#06B6D4]/40 focus:border-[#06B6D4]"
                                    />
                                    <label htmlFor="featuredToggle" className="text-xs font-bold text-slate-300 cursor-pointer flex items-center gap-1.5">
                                        <Flame className="w-4 h-4 text-amber-500" />
                                        <span>Mark as Featured Event (Spotlight banner on Home feed)</span>
                                    </label>
                                </div>

                                {/* Actions */}
                                <div className="pt-4 border-t border-[#1E2D4A] flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsUploadModalOpen(false);
                                            setEditingEvent(null);
                                        }}
                                        className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-300 text-xs font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-[#070A11] text-white text-xs font-bold shadow-lg shadow-[0_0_15px_rgba(6,182,212,0.25)] disabled:opacity-50"
                                    >
                                        {submitting ? 'Saving...' : editingEvent ? 'Save Changes' : 'Publish Event'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════════════════
                MODAL 2: EVENT DETAILS & FULL AGENDA (FOR STUDENTS & EVERYONE)
            ══════════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {selectedEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl rounded-3xl bg-[#0D1527] border border-[#1E2D4A] text-slate-100 shadow-2xl overflow-hidden my-8"
                        >
                            {/* Header Poster */}
                            <div className="relative h-56 bg-gray-900">
                                <img
                                    src={selectedEvent.bannerImage}
                                    alt={selectedEvent.title}
                                    className="w-full h-full object-cover brightness-75"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-black/40 to-transparent" />
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-4 left-6 right-6 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase border ${CATEGORY_COLORS[selectedEvent.category] || 'bg-white/20 text-white'}`}>
                                            {selectedEvent.category}
                                        </span>
                                        <span className="text-xs text-[#22D3EE] font-semibold">{selectedEvent.department}</span>
                                    </div>
                                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                                        {selectedEvent.title}
                                    </h3>
                                </div>
                            </div>

                            {/* Details Body */}
                            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto text-xs sm:text-sm">
                                {/* Key Highlights Bar */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs">
                                    <div>
                                        <div className="text-gray-400 font-medium">Date</div>
                                        <div className="font-bold text-white mt-0.5">{selectedEvent.eventDate}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 font-medium">Time</div>
                                        <div className="font-bold text-white mt-0.5">{selectedEvent.startTime}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 font-medium">Fee</div>
                                        <div className="font-bold text-emerald-500 mt-0.5">{selectedEvent.isFree ? 'Free' : `₹${selectedEvent.registrationFee}`}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 font-medium">Seats</div>
                                        <div className="font-bold text-white mt-0.5">{selectedEvent.registeredCount || 0} / {selectedEvent.maxCapacity}</div>
                                    </div>
                                </div>

                                {/* Venue */}
                                <div className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300">
                                    <MapPin className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold text-white">Venue: </span>
                                        {selectedEvent.venue} ({selectedEvent.venueType})
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-1.5">
                                        About This Event
                                    </h5>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                                        {selectedEvent.description || selectedEvent.tagline}
                                    </p>
                                </div>

                                {/* Eligibility */}
                                {selectedEvent.eligibility && (
                                    <div>
                                        <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-1">
                                            Eligibility & Prerequisites
                                        </h5>
                                        <p className="text-gray-600 dark:text-gray-300 text-xs">
                                            {selectedEvent.eligibility}
                                        </p>
                                    </div>
                                )}

                                {/* Perks / Benefits */}
                                {selectedEvent.perks && selectedEvent.perks.length > 0 && (
                                    <div>
                                        <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-1.5">
                                            Participant Perks & Takeaways
                                        </h5>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(Array.isArray(selectedEvent.perks) ? selectedEvent.perks : [selectedEvent.perks]).map((p, i) => (
                                                <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1">
                                                    <Award className="w-3.5 h-3.5" /> {p}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Coordinator Info */}
                                <div className="p-3.5 rounded-2xl bg-[#0A0F1D] border border-[#1E2D4A] flex items-center justify-between flex-wrap gap-2 text-xs">
                                    <div>
                                        <div className="font-bold text-white">
                                            Coordinator: {selectedEvent.organizerName}
                                        </div>
                                        <div className="text-gray-500">{selectedEvent.organizerEmail}</div>
                                    </div>
                                    {selectedEvent.organizerPhone && (
                                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300 font-medium">
                                            <Phone className="w-3.5 h-3.5 text-[#06B6D4]" />
                                            <span>{selectedEvent.organizerPhone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer CTA */}
                            <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-[#1E2D4A] flex items-center justify-between">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        toast.success('Event link copied to clipboard!');
                                    }}
                                    className="p-2.5 rounded-xl bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-[#06B6D4] font-semibold text-xs flex items-center gap-1.5 border border-[#1E2D4A]"
                                >
                                    <Share2 className="w-4 h-4" />
                                    <span>Share</span>
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedEvent(null)}
                                        className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 font-bold text-xs"
                                    >
                                        Close
                                    </button>

                                    {isUserRegistered(selectedEvent.id) ? (
                                        <button
                                            onClick={() => {
                                                const reg = getUserRegistration(selectedEvent.id);
                                                setSelectedEvent(null);
                                                setActiveTicket({ event: selectedEvent, registration: reg });
                                            }}
                                            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>View My E-Pass</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                handleRegister(selectedEvent);
                                                setSelectedEvent(null);
                                            }}
                                            className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-[#070A11] text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                                        >
                                            <Ticket className="w-4 h-4" />
                                            <span>Register for Event</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════════════════
                MODAL 3: DIGITAL E-TICKET & EVENT PASS WITH QR CODE
            ══════════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {activeTicket && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md rounded-3xl bg-[#0D1527] border border-[#1E2D4A] text-slate-100 shadow-2xl overflow-hidden my-8"
                        >
                            {/* Pass Top Banner */}
                            <div className="p-6 bg-gradient-to-br from-[#0D1527] via-[#0A0F1D] to-[#1E2D4A] border-b border-[#1E2D4A] text-white relative">
                                <button
                                    onClick={() => setActiveTicket(null)}
                                    className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-2 text-[#22D3EE] text-xs font-semibold uppercase tracking-wider">
                                    <Ticket className="w-4 h-4" />
                                    <span>Official Campus Event Pass</span>
                                </div>
                                <h3 className="text-lg font-black text-white mt-1 leading-snug">
                                    {activeTicket.event.title}
                                </h3>
                                <p className="text-xs text-slate-300 mt-0.5">
                                    {activeTicket.event.venue}
                                </p>
                            </div>

                            {/* Pass Middle Details */}
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs">
                                    <div>
                                        <div className="text-gray-400 font-medium">Attendee</div>
                                        <div className="font-bold text-white mt-0.5">{activeTicket.registration.userName}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 font-medium">USN / ID</div>
                                        <div className="font-mono font-bold text-white mt-0.5">{activeTicket.registration.usn}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 font-medium">Date & Time</div>
                                        <div className="font-bold text-white mt-0.5">{activeTicket.event.eventDate}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 font-medium">Ticket Number</div>
                                        <div className="font-mono font-bold text-[#06B6D4] dark:text-[#06B6D4] mt-0.5">{activeTicket.registration.ticketNumber}</div>
                                    </div>
                                </div>

                                {/* Simulated High-Quality QR Code */}
                                <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10">
                                    <div className="w-36 h-36 p-3 bg-white rounded-2xl shadow-md flex items-center justify-center border border-gray-200">
                                        <svg viewBox="0 0 100 100" className="w-full h-full text-gray-900">
                                            {/* Simulated QR Code blocks */}
                                            <rect x="10" y="10" width="25" height="25" fill="currentColor" rx="2" />
                                            <rect x="15" y="15" width="15" height="15" fill="white" rx="1" />
                                            <rect x="18" y="18" width="9" height="9" fill="currentColor" />

                                            <rect x="65" y="10" width="25" height="25" fill="currentColor" rx="2" />
                                            <rect x="70" y="15" width="15" height="15" fill="white" rx="1" />
                                            <rect x="73" y="18" width="9" height="9" fill="currentColor" />

                                            <rect x="10" y="65" width="25" height="25" fill="currentColor" rx="2" />
                                            <rect x="15" y="70" width="15" height="15" fill="white" rx="1" />
                                            <rect x="18" y="73" width="9" height="9" fill="currentColor" />

                                            {/* Data dots */}
                                            <rect x="42" y="15" width="6" height="6" fill="currentColor" />
                                            <rect x="52" y="15" width="6" height="6" fill="currentColor" />
                                            <rect x="42" y="27" width="6" height="6" fill="currentColor" />
                                            <rect x="52" y="27" width="6" height="6" fill="currentColor" />

                                            <rect x="15" y="42" width="6" height="6" fill="currentColor" />
                                            <rect x="27" y="42" width="6" height="6" fill="currentColor" />
                                            <rect x="42" y="42" width="16" height="16" fill="currentColor" rx="2" />
                                            <rect x="65" y="42" width="6" height="6" fill="currentColor" />
                                            <rect x="77" y="42" width="6" height="6" fill="currentColor" />

                                            <rect x="42" y="65" width="6" height="6" fill="currentColor" />
                                            <rect x="52" y="75" width="6" height="6" fill="currentColor" />
                                            <rect x="65" y="65" width="10" height="10" fill="currentColor" />
                                            <rect x="79" y="75" width="8" height="8" fill="currentColor" />
                                        </svg>
                                    </div>
                                    <span className="text-[11px] text-gray-500 font-mono mt-2">
                                        Scan at Venue Gate for Check-in
                                    </span>
                                </div>
                            </div>

                            {/* Pass Footer Actions */}
                            <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-[#1E2D4A] flex items-center justify-between gap-2">
                                <button
                                    onClick={() => {
                                        window.print();
                                    }}
                                    className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Print Ticket</span>
                                </button>

                                <button
                                    onClick={() => {
                                        const event = activeTicket.event;
                                        const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.eventDate.replace(/-/g, '')}T090000Z/${event.eventDate.replace(/-/g, '')}T170000Z&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.venue || '')}`;
                                        window.open(gcalUrl, '_blank');
                                    }}
                                    className="flex-1 py-2 rounded-xl bg-[#06B6D4] hover:bg-[#22D3EE] text-[#070A11] text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Add to Calendar</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════════════════════════
                MODAL 4: VIEW ATTENDEES LIST (FOR STAFF & HOD)
            ══════════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {attendeesModalEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-3xl rounded-3xl bg-[#0D1527] border border-[#1E2D4A] text-slate-100 shadow-2xl overflow-hidden my-8"
                        >
                            <div className="p-6 border-b border-[#1E2D4A] flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        Registered Students List
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        {attendeesModalEvent.title} · {attendeesModalEvent.venue}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setAttendeesModalEvent(null)}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Search & Export Row */}
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="relative flex-1 min-w-[200px]">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by student name, USN, or email..."
                                            value={attendeeSearch}
                                            onChange={(e) => setAttendeeSearch(e.target.value)}
                                            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0A0F1D] border border-[#1E2D4A] text-xs text-white"
                                        />
                                    </div>

                                    <button
                                        onClick={() => handleExportAttendeesCSV(attendeesModalEvent)}
                                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Download CSV Report</span>
                                    </button>
                                </div>

                                {/* Table */}
                                <div className="rounded-2xl border border-[#1E2D4A] overflow-hidden max-h-[50vh] overflow-y-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50 dark:bg-white/5 border-b border-[#1E2D4A] text-[10px] uppercase font-bold text-gray-500">
                                            <tr>
                                                <th className="p-3">Ticket #</th>
                                                <th className="p-3">Student</th>
                                                <th className="p-3">USN</th>
                                                <th className="p-3">Department</th>
                                                <th className="p-3">Registered On</th>
                                                <th className="p-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                            {registrations
                                                .filter(r => r.eventId === attendeesModalEvent.id && r.status !== 'Cancelled')
                                                .filter(r => {
                                                    if (!attendeeSearch.trim()) return true;
                                                    const q = attendeeSearch.toLowerCase().trim();
                                                    return (
                                                        r.userName?.toLowerCase().includes(q) ||
                                                        r.usn?.toLowerCase().includes(q) ||
                                                        r.userEmail?.toLowerCase().includes(q) ||
                                                        r.ticketNumber?.toLowerCase().includes(q)
                                                    );
                                                })
                                                .map(reg => (
                                                    <tr key={reg.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                                                        <td className="p-3 font-mono font-bold text-[#06B6D4] dark:text-[#06B6D4]">
                                                            {reg.ticketNumber}
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="font-bold text-white">{reg.userName}</div>
                                                            <div className="text-[11px] text-gray-500">{reg.userEmail}</div>
                                                        </td>
                                                        <td className="p-3 font-mono font-semibold">{reg.usn}</td>
                                                        <td className="p-3 text-slate-400">{reg.department}</td>
                                                        <td className="p-3 text-gray-500">{reg.registrationDate?.split('T')[0]}</td>
                                                        <td className="p-3">
                                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                                {reg.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-[#1E2D4A] flex justify-end">
                                <button
                                    onClick={() => setAttendeesModalEvent(null)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-200 text-xs font-bold"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                    title="Registration Payment Confirmed"
                    serviceName={successPaymentData.serviceName || 'Campus Event Pass'}
                />
            )}
        </div>
    );
}
