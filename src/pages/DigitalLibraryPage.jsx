import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    Library,
    Tag,
    MapPin,
    RefreshCw,
    Home,
    Plus,
    Edit3,
    Trash2,
    CheckCircle2,
    AlertTriangle,
    Clock,
    User,
    Calendar,
    Search,
    Filter,
    Shield,
    X,
    ArrowRight,
    Sparkles,
    BookMarked,
    Layers,
    SlidersHorizontal,
    Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import SearchBar from '../components/ui/SearchBar';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import {
    getBooks,
    addBook,
    updateBook,
    deleteBook,
    getBorrowings,
    getUserBorrowings,
    issueBook,
    returnBorrowedBook,
    updateBorrowing,
    borrowBook,
    returnBook,
} from '../services/campusUtilitiesService';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

const CATEGORIES = ['All', 'Computer Science', 'Artificial Intelligence', 'Mathematics', 'Database Systems', 'Networking', 'Mechanical', 'Electronics', 'General'];

const CATEGORY_THEMES = {
    'Computer Science': {
        gradient: 'from-blue-600 via-indigo-600 to-indigo-950',
        coverBg: 'from-blue-700 via-indigo-800 to-slate-950',
        badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
        accent: 'text-blue-500',
        icon: '💻',
        tag: 'CS'
    },
    'Artificial Intelligence': {
        gradient: 'from-purple-600 via-fuchsia-600 to-slate-950',
        coverBg: 'from-purple-700 via-fuchsia-800 to-slate-950',
        badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
        accent: 'text-purple-500',
        icon: '🤖',
        tag: 'AI'
    },
    'Database Systems': {
        gradient: 'from-emerald-600 via-teal-600 to-slate-950',
        coverBg: 'from-emerald-700 via-teal-800 to-slate-950',
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
        accent: 'text-emerald-500',
        icon: '🗄️',
        tag: 'DB'
    },
    'Networking': {
        gradient: 'from-cyan-600 via-blue-600 to-slate-950',
        coverBg: 'from-cyan-700 via-blue-800 to-slate-950',
        badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
        accent: 'text-cyan-500',
        icon: '🌐',
        tag: 'NET'
    },
    'Mathematics': {
        gradient: 'from-violet-600 via-purple-700 to-slate-950',
        coverBg: 'from-violet-700 via-purple-800 to-slate-950',
        badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25',
        accent: 'text-violet-500',
        icon: '📐',
        tag: 'MATH'
    },
    'Electronics': {
        gradient: 'from-amber-500 via-orange-600 to-slate-950',
        coverBg: 'from-amber-600 via-orange-700 to-slate-950',
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
        accent: 'text-amber-500',
        icon: '⚡',
        tag: 'EC'
    },
    'Mechanical': {
        gradient: 'from-orange-600 via-red-600 to-slate-950',
        coverBg: 'from-orange-700 via-red-800 to-slate-950',
        badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25',
        accent: 'text-orange-500',
        icon: '⚙️',
        tag: 'ME'
    },
    'General': {
        gradient: 'from-slate-600 via-gray-700 to-slate-950',
        coverBg: 'from-slate-700 via-gray-800 to-slate-950',
        badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25',
        accent: 'text-slate-400',
        icon: '📚',
        tag: 'GEN'
    },
    default: {
        gradient: 'from-indigo-600 via-purple-700 to-slate-950',
        coverBg: 'from-indigo-700 via-purple-800 to-slate-950',
        badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
        accent: 'text-indigo-500',
        icon: '📖',
        tag: 'LIB'
    }
};

function getCategoryTheme(category) {
    return CATEGORY_THEMES[category] || CATEGORY_THEMES.default;
}

function getCategoryGradient(category) {
    return (CATEGORY_THEMES[category] || CATEGORY_THEMES.default).gradient;
}

// 3D Realistic Tactile Book Cover Component
function BookCoverMockup({ book, theme }) {
    const cleanTitle = (book.title || 'Book').replace(/[^a-zA-Z0-9\s]/g, '');
    const words = cleanTitle.split(/\s+/).filter(Boolean);
    const initials = words.length > 1
        ? (words[0][0] + (words[1][0] || '') + (words[2] ? words[2][0] : '')).toUpperCase()
        : cleanTitle.slice(0, 3).toUpperCase();

    return (
        <div className="relative group/cover flex-shrink-0 select-none my-auto">
            {/* Ambient drop shadow under book */}
            <div className={`absolute -inset-1 rounded-xl bg-gradient-to-br ${theme.gradient} opacity-25 blur-md group-hover/cover:opacity-45 transition-opacity duration-300`} />

            {/* 3D Book Container with perspective */}
            <div className="relative w-24 sm:w-28 h-36 sm:h-40 rounded-r-lg rounded-l-sm bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col justify-between shadow-xl shadow-black/50 border-y border-r border-white/20 transform group-hover:-translate-y-1 group-hover:rotate-1 group-hover:scale-105 transition-all duration-300">
                {/* Book Spine (Left 3D crease & ridge effect) */}
                <div className="absolute top-0 bottom-0 left-0 w-3.5 bg-gradient-to-r from-black/90 via-black/50 to-transparent border-r border-white/10 flex flex-col items-center justify-between py-2 z-20">
                    <div className="w-1.5 h-1 bg-amber-400/80 rounded-full" />
                    <span className="text-[7px] font-mono font-bold tracking-widest text-white/50 rotate-90 origin-center whitespace-nowrap">
                        {theme.tag}
                    </span>
                    <div className="w-1.5 h-1 bg-amber-400/80 rounded-full" />
                </div>

                {/* Right Edge: Realistic Layered Pages Texture */}
                <div className="absolute top-1 bottom-1 -right-2 w-2 rounded-r-sm bg-gradient-to-r from-amber-100/90 via-amber-50 to-amber-200/90 shadow-sm border-r border-black/30 flex flex-col justify-evenly py-1 opacity-90 z-0">
                    <div className="h-[1px] bg-amber-300/60 w-full" />
                    <div className="h-[1px] bg-amber-300/60 w-full" />
                    <div className="h-[1px] bg-amber-300/60 w-full" />
                </div>

                {/* Hanging Silk Ribbon Bookmark */}
                <div className="absolute -bottom-2 right-4 w-2.5 h-5 bg-gradient-to-b from-amber-400 to-amber-500 shadow-md rounded-b-[2px] z-20" />

                {/* Book Cover Face Art */}
                <div className={`relative h-full w-full pl-3 rounded-sm bg-gradient-to-br ${theme.coverBg} border border-white/15 p-2 flex flex-col justify-between overflow-hidden z-10`}>
                    {/* Decorative ambient subtle circle glow */}
                    <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-white/10 blur-sm pointer-events-none" />

                    {/* Top: Discipline Icon & Stamp */}
                    <div className="flex items-center justify-between relative z-10">
                        <span className="text-sm" role="img" aria-label="genre">
                            {theme.icon}
                        </span>
                        <span className="text-[7.5px] font-mono font-bold tracking-tight uppercase px-1 py-0.5 rounded bg-black/40 text-white/90 border border-white/15">
                            {theme.tag}
                        </span>
                    </div>

                    {/* Center: Embossed Monogram */}
                    <div className="my-auto text-center relative z-10 px-0.5">
                        <div className="font-black text-xs sm:text-sm tracking-wider text-amber-300 font-serif drop-shadow-sm">
                            {initials}
                        </div>
                        <div className="h-[1px] w-6 mx-auto my-1 bg-amber-400/40" />
                        <p className="text-[8px] font-semibold text-white/90 line-clamp-2 leading-tight">
                            {book.title}
                        </p>
                    </div>

                    {/* Bottom: Author */}
                    <div className="relative z-10 border-t border-white/15 pt-1">
                        <p className="text-[7px] text-white/70 truncate font-mono">
                            {book.author}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DigitalLibraryPage() {
    const { getDomainUser, logoutDomain } = useAuth();
    const user = getDomainUser('library') || { name: 'Library Guest', role: ROLES.STUDENT };
    
    // Check if user has administrative / librarian rights (Student, Staff, and HOD use as regular patrons)
    const userRoleLower = (user?.role || '').toLowerCase();
    const isStudentStaffOrHod = ['student', 'staff', 'teacher', 'hod'].includes(userRoleLower);
    const isAdmin = !isStudentStaffOrHod && (userRoleLower === 'admin_library' || userRoleLower === ROLES.ADMIN_LIBRARY || (userRoleLower === 'admin' && !isStudentStaffOrHod));

    // Main States
    const [books, setBooks] = useState([]);
    const [borrowings, setBorrowings] = useState([]);
    const [userBorrowings, setUserBorrowings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all', 'available', 'borrowed'

    // Active View Tab
    const [adminTab, setAdminTab] = useState('inventory'); // 'inventory', 'registry', 'analytics'
    const [studentTab, setStudentTab] = useState('catalog'); // 'catalog', 'myBooks', 'policy'

    // Modals State
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [selectedBookForIssue, setSelectedBookForIssue] = useState(null);
    const [extendingBorrowing, setExtendingBorrowing] = useState(null);

    // Form States for Add / Edit Book
    const [bookForm, setBookForm] = useState({
        title: '',
        author: '',
        category: 'Computer Science',
        isbn: '',
        shelfLocation: 'CS-Rack-01',
        totalCopies: 5,
        availableCopies: 5,
        isAvailable: true,
        expectedAvailableDate: 'Available Now',
        notes: ''
    });

    // Form State for Issue Book
    const [issueForm, setIssueForm] = useState({
        bookId: '',
        userName: '',
        userEmail: '',
        userRole: 'student',
        borrowDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        notes: ''
    });

    // Form State for Extend Due Date
    const [newDueDate, setNewDueDate] = useState('');

    // Fetch all library data
    const refreshData = async () => {
        setLoading(true);
        try {
            const [bks, brws] = await Promise.all([getBooks(), getBorrowings()]);
            setBooks(bks || []);
            setBorrowings(brws || []);
            
            const currentUid = user?.uid || user?.id;
            const userBrws = (brws || []).filter(b => b.userId === currentUid || b.userName === user?.name || b.userEmail === user?.email);
            setUserBorrowings(userBrws);
        } catch (err) {
            console.error('Error fetching library data:', err);
            toast.error('Failed to load library catalog.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, [user]);

    // ── Admin Book Operations ──
    const handleOpenAdd = () => {
        setBookForm({
            title: '',
            author: '',
            category: 'Computer Science',
            isbn: '978-' + Math.floor(1000000000 + Math.random() * 9000000000),
            shelfLocation: 'CS-Rack-01',
            totalCopies: 5,
            availableCopies: 5,
            isAvailable: true,
            expectedAvailableDate: 'Available Now',
            notes: ''
        });
        setShowAddModal(true);
    };

    const handleOpenEdit = (book) => {
        setEditingBook(book);
        setBookForm({
            title: book.title || '',
            author: book.author || '',
            category: book.category || 'Computer Science',
            isbn: book.isbn || '',
            shelfLocation: book.shelfLocation || '',
            totalCopies: book.totalCopies ?? 1,
            availableCopies: book.availableCopies ?? 1,
            isAvailable: book.isAvailable !== false && (book.availableCopies ?? 1) > 0,
            expectedAvailableDate: book.expectedAvailableDate || (book.availableCopies > 0 ? 'Available Now' : 'Pending Return'),
            notes: book.notes || ''
        });
    };

    const handleSaveBook = async (e) => {
        e.preventDefault();
        if (!bookForm.title.trim() || !bookForm.author.trim()) {
            toast.error('Title and Author are required.');
            return;
        }

        try {
            if (editingBook) {
                await updateBook(editingBook.id, bookForm);
                toast.success(`Updated "${bookForm.title}" successfully!`);
                setEditingBook(null);
            } else {
                await addBook(bookForm);
                toast.success(`Added "${bookForm.title}" to library catalog!`);
                setShowAddModal(false);
            }
            await refreshData();
        } catch (err) {
            toast.error('Failed to save book changes.');
        }
    };

    const handleDeleteBook = async (bookId, title) => {
        if (window.confirm(`Are you sure you want to remove "${title}" from the library?`)) {
            try {
                await deleteBook(bookId);
                toast.success(`Removed "${title}" from catalog.`);
                await refreshData();
            } catch (err) {
                toast.error('Failed to delete book.');
            }
        }
    };

    const handleToggleBookAvailability = async (book) => {
        const nextAvail = !book.isAvailable;
        const newCopies = nextAvail ? (book.availableCopies > 0 ? book.availableCopies : 1) : 0;
        const newExpected = nextAvail ? 'Available Now' : 'Temporarily Reserved';
        try {
            await updateBook(book.id, {
                isAvailable: nextAvail,
                availableCopies: newCopies,
                expectedAvailableDate: newExpected
            });
            toast.success(`"${book.title}" set to ${nextAvail ? 'Available' : 'Unavailable'}.`);
            await refreshData();
        } catch (e) {
            toast.error('Failed to toggle availability.');
        }
    };

    // ── Lending / Borrowing Operations ──
    const handleOpenIssueModal = (book = null) => {
        setSelectedBookForIssue(book);
        setIssueForm({
            bookId: book?.id || (books[0]?.id || ''),
            userName: user?.name || '',
            userEmail: user?.email || '',
            userRole: 'student',
            borrowDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            notes: ''
        });
        setShowIssueModal(true);
    };

    const handleIssueBookSubmit = async (e) => {
        e.preventDefault();
        const bookToIssue = books.find(b => b.id === issueForm.bookId);
        if (!bookToIssue) {
            toast.error('Please select a valid book.');
            return;
        }

        try {
            await issueBook({
                bookId: bookToIssue.id,
                bookTitle: bookToIssue.title,
                userId: `user-${Date.now()}`,
                userName: issueForm.userName.trim(),
                userEmail: issueForm.userEmail.trim(),
                userRole: issueForm.userRole,
                borrowDate: issueForm.borrowDate,
                dueDate: issueForm.dueDate,
                notes: issueForm.notes
            });
            toast.success(`Issued "${bookToIssue.title}" to ${issueForm.userName}! Due: ${issueForm.dueDate}`);
            setShowIssueModal(false);
            await refreshData();
        } catch (err) {
            toast.error('Failed to issue book.');
        }
    };

    const handleReturnRecord = async (borrowing) => {
        try {
            await returnBorrowedBook(borrowing.id, borrowing.bookId);
            toast.success(`Book "${borrowing.bookTitle}" marked as returned! Stock restored.`);
            await refreshData();
        } catch (err) {
            toast.error('Failed to process book return.');
        }
    };

    const handleOpenExtend = (borrowing) => {
        setExtendingBorrowing(borrowing);
        setNewDueDate(borrowing.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    };

    const handleSaveExtendedDueDate = async () => {
        if (!extendingBorrowing || !newDueDate) return;
        try {
            await updateBorrowing(extendingBorrowing.id, {
                dueDate: newDueDate,
                status: 'active'
            });
            // Also update book expected return date if it is out of stock
            await updateBook(extendingBorrowing.bookId, {
                expectedAvailableDate: newDueDate
            });
            toast.success(`Due date extended to ${newDueDate}!`);
            setExtendingBorrowing(null);
            await refreshData();
        } catch (err) {
            toast.error('Failed to extend due date.');
        }
    };

    // ── Student / Teacher Self-Service Borrowing ──
    const handleStudentSelfBorrow = async (book) => {
        if (book.availableCopies <= 0 || !book.isAvailable) {
            toast.error(`"${book.title}" is currently out of stock. Expected on ${book.expectedAvailableDate || 'soon'}.`);
            return;
        }

        try {
            const res = await borrowBook(book.id, user);
            if (res) {
                toast.success(`🎉 You borrowed "${book.title}"! Due date: ${res.dueDate}`);
                await refreshData();
            } else {
                toast.error('Unable to borrow book at this time.');
            }
        } catch (err) {
            toast.error('Failed to borrow book.');
        }
    };

    const handleStudentSelfReturn = async (bookId) => {
        try {
            const uid = user?.uid || user?.id;
            const res = await returnBook(bookId, uid);
            if (res) {
                toast.success('Book returned successfully! Thank you. 📚');
                await refreshData();
            }
        } catch (err) {
            toast.error('Failed to return book.');
        }
    };

    // ── Filtering Logic ──
    const filteredBooks = books.filter((book) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            !q ||
            book.title?.toLowerCase().includes(q) ||
            book.author?.toLowerCase().includes(q) ||
            book.isbn?.toLowerCase().includes(q) ||
            book.shelfLocation?.toLowerCase().includes(q);

        const matchesCategory = activeCategory === 'All' || book.category === activeCategory;

        const isAvail = book.isAvailable !== false && book.availableCopies > 0;
        const matchesAvail =
            availabilityFilter === 'all' ||
            (availabilityFilter === 'available' && isAvail) ||
            (availabilityFilter === 'borrowed' && !isAvail);

        return matchesSearch && matchesCategory && matchesAvail;
    });

    const activeBorrowingsCount = borrowings.filter(b => b.status === 'active' || b.status === 'overdue').length;
    const overdueBorrowingsCount = borrowings.filter(b => b.status === 'overdue').length;
    const totalBookCopies = books.reduce((sum, b) => sum + (Number(b.totalCopies) || 0), 0);
    const availableBookCopies = books.reduce((sum, b) => sum + (Number(b.availableCopies) || 0), 0);

    return (
        <div className="min-h-screen bg-[#F5F6FF] dark:bg-[#070A11] text-[#202442] dark:text-slate-100 p-4 md:p-6 lg:p-8 font-sans transition-colors duration-200">
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
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
                            isAdmin
                                ? 'bg-[#06B6D4]/15 border-[#06B6D4]/30 text-[#22D3EE]'
                                : 'bg-[#0D1527] border-[#1E2D4A] text-slate-300'
                        }`}>
                            {isAdmin ? <Shield className="w-3.5 h-3.5 text-[#22D3EE]" /> : <User className="w-3.5 h-3.5 text-[#06B6D4]" />}
                            <span>{user.name} ({isAdmin ? 'Librarian / Admin' : user.role?.toUpperCase()})</span>
                        </div>

                        <button
                            onClick={async () => {
                                await logoutDomain('library');
                                toast.success('Signed out from Digital Library');
                                window.location.href = '/login';
                            }}
                            className="text-xs px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-colors font-medium"
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
                                <Library className="w-3.5 h-3.5" />
                                <span>Digital Library OPAC & Circulation</span>
                            </div>
                            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                                Digital Library & Research Access
                            </h1>
                            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                                E-Books, institutional journals, OPAC physical shelf catalog, and automated circulation management.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {isAdmin && (
                                <>
                                    <Button
                                        onClick={handleOpenAdd}
                                        className="bg-white text-indigo-900 hover:bg-blue-50 font-bold shadow-lg flex items-center gap-2 text-xs sm:text-sm px-4 py-2.5 rounded-xl"
                                    >
                                        <Plus className="w-4 h-4 text-indigo-700" />
                                        <span>Add New Book</span>
                                    </Button>
                                    <Button
                                        onClick={() => handleOpenIssueModal()}
                                        variant="outline"
                                        className="border-white/30 text-white hover:bg-white/10 font-bold flex items-center gap-2 text-xs sm:text-sm px-4 py-2.5 rounded-xl"
                                    >
                                        <BookMarked className="w-4 h-4" />
                                        <span>Issue / Lend Book</span>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* ── KPI Stats Dashboard ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl border border-[#1E2D4A] bg-[#0D1527] shadow-sm flex flex-col justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Titles</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-black text-[#22D3EE]">{books.length}</span>
                            <span className="text-xs text-slate-500">({totalBookCopies} copies)</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-[#1E2D4A] bg-[#0D1527] shadow-sm flex flex-col justify-between">
                        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Available in Stock</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{availableBookCopies}</span>
                            <span className="text-xs text-emerald-400/70">Ready to read</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-[#1E2D4A] bg-[#0D1527] shadow-sm flex flex-col justify-between">
                        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Currently Borrowed</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-black text-amber-400">{activeBorrowingsCount}</span>
                            <span className="text-xs text-amber-400/70">With Students/Staff</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-[#1E2D4A] bg-[#0D1527] shadow-sm flex flex-col justify-between">
                        <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Overdue Returns</span>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-black text-rose-400">{overdueBorrowingsCount}</span>
                            <span className="text-xs text-rose-400/70">Pending action</span>
                        </div>
                    </div>
                </div>

                {/* ── Navigation Tabs (Admin vs Student/Teacher) ── */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E2D4A] pb-3">
                    {isAdmin ? (
                        <div className="flex gap-2 p-1 bg-[#0A0F1D] rounded-full border border-[#1E2D4A]">
                            <button
                                onClick={() => setAdminTab('inventory')}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                                    adminTab === 'inventory'
                                        ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>Master Inventory</span>
                                <span className="text-[11px] px-1.5 py-0.2 bg-white/20 rounded-full">{books.length}</span>
                            </button>

                            <button
                                onClick={() => setAdminTab('registry')}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                                    adminTab === 'registry'
                                        ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <BookMarked className="w-3.5 h-3.5" />
                                <span>Borrowings Registry</span>
                                {activeBorrowingsCount > 0 && (
                                    <span className="text-[11px] px-1.5 py-0.2 bg-amber-400 text-gray-900 font-bold rounded-full">{activeBorrowingsCount}</span>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2 p-1 bg-[#0A0F1D] rounded-full border border-[#1E2D4A]">
                            <button
                                onClick={() => setStudentTab('catalog')}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                                    studentTab === 'catalog'
                                        ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Browse Catalog & Live Status</span>
                            </button>

                            <button
                                onClick={() => setStudentTab('myBooks')}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                                    studentTab === 'myBooks'
                                        ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <BookMarked className="w-3.5 h-3.5" />
                                <span>My Borrowed Books</span>
                                {userBorrowings.length > 0 && (
                                    <span className="text-[11px] px-1.5 py-0.2 bg-[#06B6D4] text-[#070A11] font-bold rounded-full">{userBorrowings.length}</span>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Filter by Stock Status */}
                    <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400 mr-1 font-medium">Filter Stock:</span>
                        {[
                            { key: 'all', label: 'All Books' },
                            { key: 'available', label: '🟢 In Stock' },
                            { key: 'borrowed', label: '🟠 Checked Out' }
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setAvailabilityFilter(f.key)}
                                className={`px-2.5 py-1 rounded-lg font-medium border transition-colors ${
                                    availabilityFilter === f.key
                                        ? 'bg-[#06B6D4] text-[#070A11] border-[#06B6D4] font-bold'
                                        : 'bg-[#0D1527] text-slate-400 border-[#1E2D4A] hover:text-white'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Search & Categories ── */}
                <div className="space-y-3">
                    <SearchBar
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(typeof e === 'string' ? e : e.target.value)}
                        placeholder="Search books by title, author, ISBN, or shelf location (e.g. CS-Rack-01)..."
                    />

                    <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                                    activeCategory === cat
                                        ? 'bg-[#06B6D4] text-[#070A11] border-[#06B6D4] font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                        : 'bg-[#0D1527] text-slate-400 border-[#1E2D4A] hover:text-white hover:border-[#06B6D4]/40'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════════════════
                    ADMIN VIEW: 1. INVENTORY & AVAILABILITY CONTROLS
                ══════════════════════════════════════════════════════════════════════ */}
                {isAdmin && adminTab === 'inventory' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
                                <span>Master Book Inventory ({filteredBooks.length} titles)</span>
                            </h2>
                            <Button
                                onClick={handleOpenAdd}
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" /> Add Book
                            </Button>
                        </div>

                        {loading ? (
                            <SkeletonLoader variant="grid" />
                        ) : filteredBooks.length === 0 ? (
                            <EmptyState
                                icon={BookOpen}
                                title="No matching books in inventory"
                                description="Adjust your filters or add a new book to the library."
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredBooks.map((book) => {
                                    const inStock = book.isAvailable !== false && book.availableCopies > 0;
                                    const theme = getCategoryTheme(book.category);

                                    return (
                                        <div
                                            key={book.id}
                                            className="group relative rounded-3xl bg-white/90 dark:bg-[#121929]/90 border border-gray-200/80 dark:border-white/10 hover:border-indigo-500/50 p-5 shadow-md hover:shadow-2xl hover:shadow-indigo-500/15 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
                                        >
                                            {/* Ambient backdrop glow */}
                                            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br ${theme.gradient} opacity-10 group-hover:opacity-25 blur-3xl transition-opacity pointer-events-none`} />

                                            {/* Top Showcase: 3D Book Cover & Details */}
                                            <div className="flex items-start gap-3.5 sm:gap-4 relative z-10">
                                                <BookCoverMockup book={book} theme={theme} />

                                                <div className="flex-1 min-w-0 space-y-2">
                                                    {/* Category & Admin Stock Toggle */}
                                                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.badge}`}>
                                                            {book.category}
                                                        </span>

                                                        <button
                                                            onClick={() => handleToggleBookAvailability(book)}
                                                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border transition-colors flex items-center gap-1 ${
                                                                inStock
                                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                                                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                                                            }`}
                                                            title="Click to toggle availability"
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                            <span>{inStock ? 'In Stock' : 'Out of Stock'}</span>
                                                        </button>
                                                    </div>

                                                    {/* Title */}
                                                    <h3 className="font-extrabold text-gray-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {book.title}
                                                    </h3>

                                                    {/* Author */}
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        <span>By</span>
                                                        <span className="font-bold text-gray-800 dark:text-gray-200 truncate">{book.author}</span>
                                                    </p>

                                                    {/* Chips: Shelf & ISBN */}
                                                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
                                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 font-semibold" title="Campus Shelf Location">
                                                            <MapPin className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                                            <span className="truncate">{book.shelfLocation}</span>
                                                        </div>

                                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-mono text-[10px]" title="ISBN Catalog Number">
                                                            <Tag className="w-2.5 h-2.5 text-indigo-400 flex-shrink-0" />
                                                            <span className="truncate">{book.isbn}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Circulation & Return Schedule */}
                                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 space-y-2 relative z-10">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1 text-[11px]">
                                                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                        <span>Schedule:</span>
                                                    </span>
                                                    <span className={`text-[11px] font-bold ${inStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                        {book.expectedAvailableDate || (inStock ? 'Available Now' : 'Pending Return')}
                                                    </span>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span className="text-gray-400 font-medium">Catalog Copies</span>
                                                        <span className={`font-bold ${inStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                                            {book.availableCopies} / {book.totalCopies} Available
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                inStock ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-rose-500'
                                                            }`}
                                                            style={{ width: `${Math.max(8, Math.min(100, Math.round(((book.availableCopies || 0) / (book.totalCopies || 1)) * 100)))}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Admin Action Toolbar */}
                                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2 relative z-10">
                                                <button
                                                    onClick={() => handleOpenIssueModal(book)}
                                                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <BookMarked className="w-3.5 h-3.5" />
                                                    <span>Issue Book</span>
                                                </button>

                                                <button
                                                    onClick={() => handleOpenEdit(book)}
                                                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors"
                                                    title="Edit Book Details & Availability"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteBook(book.id, book.title)}
                                                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition-colors"
                                                    title="Delete Book from Catalog"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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
                    ADMIN VIEW: 2. BORROWINGS & RETURN REGISTRY TABLE
                ══════════════════════════════════════════════════════════════════════ */}
                {isAdmin && adminTab === 'registry' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <BookMarked className="w-5 h-5 text-indigo-500" />
                                    <span>Borrowings & Return Registry</span>
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Track borrower details, due return dates, and mark books returned</p>
                            </div>
                            <Button
                                onClick={() => handleOpenIssueModal()}
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" /> Issue Book to User
                            </Button>
                        </div>

                        {borrowings.length === 0 ? (
                            <EmptyState
                                icon={BookMarked}
                                title="No Borrowing Records"
                                description="No books are currently issued. Use 'Issue Book' to record a new loan."
                            />
                        ) : (
                            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/80 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3.5">Borrower</th>
                                                <th className="px-4 py-3.5">Book Title</th>
                                                <th className="px-4 py-3.5">Borrow Date</th>
                                                <th className="px-4 py-3.5">Return Due Date</th>
                                                <th className="px-4 py-3.5">Status</th>
                                                <th className="px-4 py-3.5 text-right">Admin Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                            {borrowings.map((b) => {
                                                const isReturned = b.status === 'returned';
                                                const isOverdue = !isReturned && (b.status === 'overdue' || (b.dueDate && new Date(b.dueDate) < new Date()));
                                                return (
                                                    <tr key={b.id} className="hover:bg-indigo-50/40 dark:hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                                                    <span>{b.userName}</span>
                                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold uppercase">
                                                                        {b.userRole || 'Student'}
                                                                    </span>
                                                                </div>
                                                                <div className="text-gray-400 text-[11px]">{b.userEmail || 'No email provided'}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 max-w-[220px] truncate" title={b.bookTitle}>
                                                            {b.bookTitle}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono">
                                                            {b.borrowDate || '—'}
                                                        </td>
                                                        <td className="px-4 py-3 font-mono">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-gray-900 dark:text-white font-semibold'}>
                                                                    {b.dueDate || '—'}
                                                                </span>
                                                                {isOverdue && (
                                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 font-bold">
                                                                        OVERDUE
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {isReturned ? (
                                                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Returned ({b.returnDate || 'Done'})
                                                                </span>
                                                            ) : isOverdue ? (
                                                                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-xs">
                                                                    <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold text-xs">
                                                                    <Clock className="w-3.5 h-3.5" /> Active Loan
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {!isReturned && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleReturnRecord(b)}
                                                                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1"
                                                                            title="Mark this book as returned"
                                                                        >
                                                                            <Check className="w-3.5 h-3.5" />
                                                                            <span>Return Book</span>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleOpenExtend(b)}
                                                                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-medium text-xs transition-colors"
                                                                            title="Extend Due Date"
                                                                        >
                                                                            Extend Due Date
                                                                        </button>
                                                                    </>
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

                {/* ══════════════════════════════════════════════════════════════════════
                    STUDENT / TEACHER VIEW: 1. CATALOG WITH LIVE AVAILABILITY STATUS
                ══════════════════════════════════════════════════════════════════════ */}
                {!isAdmin && studentTab === 'catalog' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-500" />
                                <span>Browse Library Catalog ({filteredBooks.length} available titles)</span>
                            </h2>
                        </div>

                        {loading ? (
                            <SkeletonLoader variant="grid" />
                        ) : filteredBooks.length === 0 ? (
                            <EmptyState
                                icon={BookOpen}
                                title="No books found"
                                description="Try adjusting your search keywords or category filters."
                            />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredBooks.map((book) => {
                                    const inStock = book.isAvailable !== false && book.availableCopies > 0;
                                    const isUserBorrowingThis = userBorrowings.some(b => b.bookId === book.id && b.status !== 'returned');
                                    const theme = getCategoryTheme(book.category);

                                    return (
                                        <div
                                            key={book.id}
                                            className="group relative rounded-2xl bg-[#0D1527] border border-[#1E2D4A] hover:border-[#06B6D4]/60 p-5 shadow-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300 flex flex-col justify-between overflow-hidden"
                                        >
                                            {/* Ambient backdrop glow */}
                                            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br ${theme.gradient} opacity-10 group-hover:opacity-25 blur-3xl transition-opacity pointer-events-none`} />

                                            {/* Top Showcase: 3D Book Cover & Details */}
                                            <div className="flex items-start gap-3.5 sm:gap-4 relative z-10">
                                                {/* 3D Realistic Book Cover */}
                                                <BookCoverMockup book={book} theme={theme} />

                                                {/* Details Column */}
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    {/* Category & Live Stock Pills */}
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.badge}`}>
                                                            {book.category}
                                                        </span>

                                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 border ${
                                                            inStock
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                                        }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                            <span>{inStock ? `${book.availableCopies} Available` : 'Out of Stock'}</span>
                                                        </span>
                                                    </div>

                                                    {/* Title */}
                                                    <h3 className="font-extrabold text-white text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[#22D3EE] transition-colors">
                                                        {book.title}
                                                    </h3>

                                                    {/* Author */}
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        <span>By</span>
                                                        <span className="font-bold text-gray-800 dark:text-gray-200 truncate">{book.author}</span>
                                                    </p>

                                                    {/* Chips: Shelf & ISBN */}
                                                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
                                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 font-semibold" title="Campus Shelf Location">
                                                            <MapPin className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                                            <span className="truncate">{book.shelfLocation}</span>
                                                        </div>

                                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-mono text-[10px]" title="ISBN Catalog Number">
                                                            <Tag className="w-2.5 h-2.5 text-indigo-400 flex-shrink-0" />
                                                            <span className="truncate">{book.isbn}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Middle: Circulation & Live Timeline Status */}
                                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 space-y-2 relative z-10">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1 text-[11px] font-medium">
                                                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                                        <span>Status:</span>
                                                    </span>
                                                    <span className={`text-[11px] font-bold ${inStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                        {inStock ? 'Available for Checkout' : `Return: ${book.expectedAvailableDate || 'Upcoming'}`}
                                                    </span>
                                                </div>

                                                {/* Lending Circulation Meter */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span className="text-gray-400 font-medium">Shelf Circulation</span>
                                                        <span className={`font-bold ${inStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                                            {book.availableCopies} of {book.totalCopies} Copies
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                inStock ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-rose-500'
                                                            }`}
                                                            style={{ width: `${Math.max(8, Math.min(100, Math.round(((book.availableCopies || 0) / (book.totalCopies || 1)) * 100)))}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Action CTA */}
                                            <div className="mt-4 pt-2 relative z-10">
                                                {isUserBorrowingThis ? (
                                                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
                                                        <span className="text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1.5">
                                                            <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                            <span className="truncate">In your possession</span>
                                                        </span>
                                                        <button
                                                            onClick={() => handleStudentSelfReturn(book.id)}
                                                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex-shrink-0"
                                                        >
                                                            Return Book
                                                        </button>
                                                    </div>
                                                ) : inStock ? (
                                                    <button
                                                        onClick={() => handleStudentSelfBorrow(book)}
                                                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#070A11] bg-[#06B6D4] hover:bg-[#22D3EE] shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-[1.01]"
                                                    >
                                                        <BookMarked className="w-4 h-4 text-[#070A11]" />
                                                        <span>Borrow Book (14 Days)</span>
                                                    </button>
                                                ) : (
                                                    <div className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center gap-1.5 select-none">
                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                        <span>Checked Out · Expected {book.expectedAvailableDate || 'Soon'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════════
                    STUDENT / TEACHER VIEW: 2. MY BORROWED BOOKS
                ══════════════════════════════════════════════════════════════════════ */}
                {!isAdmin && studentTab === 'myBooks' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <BookMarked className="w-5 h-5 text-indigo-500" />
                                    <span>My Borrowed Books ({userBorrowings.length})</span>
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Manage your currently issued library books and due return dates</p>
                            </div>
                        </div>

                        {userBorrowings.length === 0 ? (
                            <EmptyState
                                icon={BookOpen}
                                title="No Active Borrowings"
                                description="You haven't borrowed any books yet. Browse the catalog to borrow reading materials."
                                action={
                                    <Button onClick={() => setStudentTab('catalog')} className="bg-indigo-600 text-white font-bold text-xs">
                                        Browse Library Catalog
                                    </Button>
                                }
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {userBorrowings.map((b) => {
                                    const isOverdue = b.status === 'overdue' || (b.dueDate && new Date(b.dueDate) < new Date());
                                    return (
                                        <div
                                            key={b.id}
                                            className="p-5 rounded-2xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                                                        {b.bookTitle}
                                                    </h3>
                                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                                        isOverdue
                                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                                    }`}>
                                                        {isOverdue ? '⚠️ Overdue' : 'Active Loan'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 pt-1">
                                                    <div>
                                                        <span className="text-gray-400">Borrow Date:</span>
                                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{b.borrowDate || 'Recently'}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">Return Due Date:</span>
                                                        <p className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                                            {b.dueDate || '14 Days from loan'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {b.notes && (
                                                    <p className="text-xs text-gray-500 italic bg-gray-50 dark:bg-white/[0.02] p-2 rounded-lg">
                                                        Note from Admin: {b.notes}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Standard 14-day borrowing</span>
                                                <button
                                                    onClick={() => handleStudentSelfReturn(b.bookId)}
                                                    className="py-1.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>Return Book</span>
                                                </button>
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
                MODAL: ADD / EDIT BOOK (ADMIN ONLY)
            ══════════════════════════════════════════════════════════════════════ */}
            {(showAddModal || editingBook) && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-500" />
                                <span>{editingBook ? 'Edit Book & Availability' : 'Add New Library Book'}</span>
                            </h2>
                            <button
                                onClick={() => { setShowAddModal(false); setEditingBook(null); }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveBook} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Book Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={bookForm.title}
                                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                                    placeholder="e.g. Design of Algorithmic Systems"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Author *</label>
                                    <input
                                        type="text"
                                        required
                                        value={bookForm.author}
                                        onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                                        placeholder="e.g. Thomas Cormen"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                    <select
                                        value={bookForm.category}
                                        onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        {CATEGORIES.filter(c => c !== 'All').map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">ISBN Code</label>
                                    <input
                                        type="text"
                                        value={bookForm.isbn}
                                        onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                                        placeholder="978-8131502479"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Shelf Location</label>
                                    <input
                                        type="text"
                                        value={bookForm.shelfLocation}
                                        onChange={(e) => setBookForm({ ...bookForm, shelfLocation: e.target.value })}
                                        placeholder="e.g. CS-Rack-02"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Total Copies</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={bookForm.totalCopies}
                                        onChange={(e) => setBookForm({ ...bookForm, totalCopies: parseInt(e.target.value, 10) || 1 })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Available Copies</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={bookForm.availableCopies}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value, 10) || 0;
                                            setBookForm({
                                                ...bookForm,
                                                availableCopies: val,
                                                isAvailable: val > 0,
                                                expectedAvailableDate: val > 0 ? 'Available Now' : bookForm.expectedAvailableDate
                                            });
                                        }}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Expected Availability Date (Admin controls what students see!) */}
                            <div>
                                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    When Will It Be Available? (Shown to Students)
                                </label>
                                <input
                                    type="text"
                                    value={bookForm.expectedAvailableDate}
                                    onChange={(e) => setBookForm({ ...bookForm, expectedAvailableDate: e.target.value })}
                                    placeholder="e.g. 2026-04-10 or 'Available Now'"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                />
                                <span className="text-[11px] text-gray-400 mt-1 block">
                                    If out of stock, enter the expected date or return deadline when this book will be back.
                                </span>
                            </div>

                            <div>
                                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Notes / Remarks</label>
                                <textarea
                                    rows="2"
                                    value={bookForm.notes}
                                    onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                                    placeholder="e.g. Core reference for 6th Sem, 2 copies reserved for faculty"
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { setShowAddModal(false); setEditingBook(null); }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                    {editingBook ? 'Save Changes' : 'Add to Catalog'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════
                MODAL: ISSUE / LEND BOOK TO USER (ADMIN ONLY)
            ══════════════════════════════════════════════════════════════════════ */}
            {showIssueModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <BookMarked className="w-5 h-5 text-indigo-500" />
                                <span>Issue Book to Student or Teacher</span>
                            </h2>
                            <button
                                onClick={() => setShowIssueModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleIssueBookSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Select Book *</label>
                                <select
                                    required
                                    value={issueForm.bookId}
                                    onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {books.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.title} ({b.availableCopies} available)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Borrower Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={issueForm.userName}
                                        onChange={(e) => setIssueForm({ ...issueForm, userName: e.target.value })}
                                        placeholder="Borrower name"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Borrower Role</label>
                                    <select
                                        value={issueForm.userRole}
                                        onChange={(e) => setIssueForm({ ...issueForm, userRole: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="staff">Staff</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Email / Student ID</label>
                                <input
                                    type="text"
                                    value={issueForm.userEmail}
                                    onChange={(e) => setIssueForm({ ...issueForm, userEmail: e.target.value })}
                                    placeholder="Borrower email or ID"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Borrow Date</label>
                                    <input
                                        type="date"
                                        value={issueForm.borrowDate}
                                        onChange={(e) => setIssueForm({ ...issueForm, borrowDate: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Return Due Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={issueForm.dueDate}
                                        onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-600 dark:text-indigo-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Remarks</label>
                                <input
                                    type="text"
                                    value={issueForm.notes}
                                    onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                                    placeholder="e.g. Borrowed for Midterms"
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setShowIssueModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                    Issue & Save Record
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════
                MODAL: EXTEND / UPDATE DUE DATE (ADMIN ONLY)
            ══════════════════════════════════════════════════════════════════════ */}
            {extendingBorrowing && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-2">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">Extend Return Due Date</h2>
                            <button onClick={() => setExtendingBorrowing(null)} className="text-gray-400 hover:text-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-xs space-y-2 text-gray-600 dark:text-gray-300">
                            <p><strong>Book:</strong> {extendingBorrowing.bookTitle}</p>
                            <p><strong>Borrower:</strong> {extendingBorrowing.userName}</p>
                            <p><strong>Current Due Date:</strong> {extendingBorrowing.dueDate}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">New Return Due Date *</label>
                            <input
                                type="date"
                                value={newDueDate}
                                onChange={(e) => setNewDueDate(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setExtendingBorrowing(null)}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleSaveExtendedDueDate} className="bg-indigo-600 text-white font-bold">
                                Update Due Date
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
