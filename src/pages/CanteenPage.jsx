import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    UtensilsCrossed,
    ShoppingCart,
    Clock,
    Plus,
    Minus,
    Trash2,
    X,
    ChefHat,
    PackageCheck,
    ClipboardList,
    CheckCircle2,
    Loader2,
    RefreshCw,
    Home,
    Search,
    Shield,
    User,
    Sparkles,
    Bell,
    Check,
    Flame,
    QrCode,
    Tag,
    Edit3,
    ArrowRight,
    Send,
    Coffee,
    Leaf,
    AlertCircle,
    Info,
    Store,
    CreditCard,
    Lock,
    ShieldCheck,
    Smartphone
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
    getMenu,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemAvailability,
    placeOrder,
    getUserOrders,
    getAllCanteenOrders,
    updateOrderStatus,
    deleteCanteenOrder,
    playPaymentChime,
    subscribeCanteenOrders
} from '../services/campusUtilitiesService';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';

// ── Categories & Status Configurations ─────────────────────────────────────────
const CATEGORIES = ['All', 'Breakfast', 'Meals / Lunch', 'Snacks', 'Beverages', 'Today Specials'];
const MEAL_SLOTS = ['All Day', 'Morning Breakfast', 'Afternoon Lunch', 'Evening Snacks'];
const DIETARY_TYPES = ['All', 'Veg', 'Non-Veg', 'Vegan'];

const PRESET_FOOD_IMAGES = [
    { label: 'Masala Dosa', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400' },
    { label: 'Veg Thali Meal', url: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400' },
    { label: 'Paneer Gravy & Roti', url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400' },
    { label: 'Samosa Chaat', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400' },
    { label: 'Filter Coffee', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400' },
    { label: 'Mint Lime Juice', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400' },
    { label: 'Hakka Noodles', url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400' },
    { label: 'Veg Biryani', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400' },
    { label: 'Club Sandwich', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400' }
];

const STATUS_CONFIG = {
    'Placed': {
        label: 'Order Placed (Kitchen Queue)',
        bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700',
        icon: ClipboardList,
    },
    'Preparing': {
        label: 'Preparing in Kitchen 👨‍🍳',
        bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700',
        icon: ChefHat,
    },
    'Ready for Pickup': {
        label: 'Ready for Pickup 🎉',
        bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 animate-pulse',
        icon: PackageCheck,
    },
    'Completed': {
        label: 'Completed / Collected ✅',
        bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700',
        icon: CheckCircle2,
    },
    'Delivered': {
        label: 'Completed / Collected ✅',
        bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700',
        icon: CheckCircle2,
    }
};

const formatTime = (ts) => {
    if (!ts) return '—';
    try {
        const d = ts?.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '—';
    }
};

export default function CanteenPage() {
    const { getDomainUser, logoutDomain } = useAuth();
    const user = getDomainUser('canteen') || { name: 'Student User', role: ROLES.STUDENT };
    const userRoleLower = (user?.role || '').toLowerCase();
    const isStudentStaffOrHod = ['student', 'staff', 'teacher', 'hod'].includes(userRoleLower);
    const isAdmin = !isStudentStaffOrHod && (userRoleLower === 'admin_canteen' || userRoleLower === ROLES.ADMIN_CANTEEN || (userRoleLower === 'admin' && !isStudentStaffOrHod));

    // Navigation Tabs
    const [activeTab, setActiveTab] = useState(isAdmin ? 'adminOrders' : 'menu');

    // Menu State
    const [menuItems, setMenuItems] = useState([]);
    const [loadingMenu, setLoadingMenu] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [dietaryFilter, setDietaryFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Orders State
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [orderFilter, setOrderFilter] = useState('All');
    const [orderSearchQuery, setOrderSearchQuery] = useState('');

    // Cart State
    const [cart, setCart] = useState({});
    const [cartOpen, setCartOpen] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [customerUniqueId, setCustomerUniqueId] = useState(
        user?.usn || user?.employeeId || ''
    );

    // Sync Customer ID with User info
    useEffect(() => {
        const id = user?.usn || user?.employeeId || '';
        if (id) {
            setCustomerUniqueId(id);
        }
    }, [user?.usn, user?.employeeId]);

    // Razorpay Payment States
    const [paymentMode, setPaymentMode] = useState('razorpay'); // 'razorpay' | 'counter'
    const [razorpayFallbackOpen, setRazorpayFallbackOpen] = useState(false);
    const [fallbackPaymentData, setFallbackPaymentData] = useState(null);
    const [successPaymentData, setSuccessPaymentData] = useState(null);

    // Admin Add / Edit Item State
    const [editingItem, setEditingItem] = useState(null);
    const [itemForm, setItemForm] = useState({
        itemName: '',
        category: 'Breakfast',
        price: '',
        prepTimeMinutes: '5',
        dietaryType: 'Veg',
        mealSlot: 'Morning Breakfast',
        description: '',
        imageUrl: PRESET_FOOD_IMAGES[0].url,
        isAvailable: true,
        isSpecial: false
    });
    const [savingItem, setSavingItem] = useState(false);

    // Admin Order Notification Station Modal
    const [modalOrderToReady, setModalOrderToReady] = useState(null);
    const [pickupStationNote, setPickupStationNote] = useState('Counter 1 · Hot Food Desk');

    // Admin Real-time Payment Alerts & Highlighting
    const [latestPaidOrderNotification, setLatestPaidOrderNotification] = useState(null);
    const [newlyPaidOrderIds, setNewlyPaidOrderIds] = useState(new Set());

    // ── Fetch Menu Data ──────────────────────────────────────────────────────────
    const fetchMenuData = useCallback(async () => {
        setLoadingMenu(true);
        try {
            const data = await getMenu();
            setMenuItems(data || []);
        } catch (err) {
            console.error('Error fetching menu:', err);
            toast.error('Could not load canteen menu.');
        } finally {
            setLoadingMenu(false);
        }
    }, []);

    // ── Fetch Orders Data ────────────────────────────────────────────────────────
    const fetchOrdersData = useCallback(async () => {
        setLoadingOrders(true);
        try {
            if (isAdmin) {
                const all = await getAllCanteenOrders();
                setOrders(all || []);
            } else {
                const uid = user?.uid || user?.id;
                const uEmail = user?.email;
                const userOrders = await getUserOrders(uid, uEmail, customerUniqueId);
                setOrders(userOrders || []);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            toast.error('Could not load orders.');
        } finally {
            setLoadingOrders(false);
        }
    }, [isAdmin, user?.uid, user?.id, user?.email, customerUniqueId]);

    // ── Initial Data Load ────────────────────────────────────────────────────────
    useEffect(() => {
        fetchMenuData();
        fetchOrdersData();
    }, [fetchMenuData, fetchOrdersData]);

    // ── Live Payment & Order Notifications ───────────────────────────────────────
    useEffect(() => {
        const handlePaidNotification = (paidOrder) => {
            if (!paidOrder) return;

            // 1. Refresh orders list so the new order appears
            fetchOrdersData();

            // 2. Play cash register sound chime
            playPaymentChime();

            // 3. Set top alert banner for admin
            setLatestPaidOrderNotification(paidOrder);

            // 4. Highlight newly paid order
            setNewlyPaidOrderIds(prev => new Set(prev).add(paidOrder.id || paidOrder.orderToken));

            // 5. Toast alert
            toast.custom((t) => (
                <div className={`p-4 rounded-2xl bg-gray-900 border-2 border-emerald-500 shadow-2xl text-white flex items-center gap-3.5 max-w-md ${t.visible ? 'animate-in fade-in zoom-in-95' : 'animate-out fade-out'}`}>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold flex-shrink-0">
                        💰
                    </div>
                    <div className="flex-1 text-xs">
                        <p className="font-black text-white text-sm">
                            New Payment Received!
                        </p>
                        <p className="text-gray-200 mt-0.5">
                            Token <strong className="text-emerald-400 font-mono font-black">#{paidOrder.orderToken}</strong> • <span className="font-bold">₹{parseFloat(paidOrder.totalAmount || 0).toFixed(2)}</span>
                        </p>
                        <p className="text-gray-400 text-[10px] mt-0.5">
                            {paidOrder.userName || 'Student'} • {paidOrder.paymentMethod || 'Slice UPI QR'}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            setActiveTab('adminOrders');
                            setOrderSearchQuery(paidOrder.orderToken);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors flex-shrink-0"
                    >
                        View
                    </button>
                </div>
            ), { duration: 10000 });
        };

        // BroadcastChannel listener
        let bc = null;
        try {
            bc = new BroadcastChannel('nexus_canteen_orders');
            bc.onmessage = (event) => {
                fetchOrdersData();
                if (isAdmin && event.data?.type === 'NEW_PAID_CANTEEN_ORDER' && event.data?.order) {
                    handlePaidNotification(event.data.order);
                }
            };
        } catch (e) {}

        // Custom event listener for same window/tab
        const onCustomEvent = (e) => {
            fetchOrdersData();
            if (isAdmin && e.detail) {
                handlePaidNotification(e.detail);
            }
        };
        window.addEventListener('nexus_canteen_paid_order', onCustomEvent);

        const onStatusChange = () => {
            fetchOrdersData();
        };
        window.addEventListener('nexus_canteen_order_status_changed', onStatusChange);

        // Storage event for other browser tabs/windows
        const onStorage = (e) => {
            if (e.key === 'nexus_last_canteen_paid_order' && e.newValue) {
                fetchOrdersData();
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (isAdmin && parsed) {
                        handlePaidNotification(parsed);
                    }
                } catch (err) {}
            }
            if (e.key === 'nexus_canteen_last_order_status_update') {
                fetchOrdersData();
            }
        };
        window.addEventListener('storage', onStorage);

        return () => {
            if (bc) bc.close();
            window.removeEventListener('nexus_canteen_paid_order', onCustomEvent);
            window.removeEventListener('nexus_canteen_order_status_changed', onStatusChange);
            window.removeEventListener('storage', onStorage);
        };
    }, [isAdmin, fetchOrdersData]);

    // ── Cart Operations ─────────────────────────────────────────────────────────
    const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    const cartEntries = Object.entries(cart).filter(([, qty]) => qty > 0);
    const cartTotal = cartEntries.reduce((sum, [id, qty]) => {
        const item = menuItems.find((m) => m.id === id);
        return sum + (item ? item.price * qty : 0);
    }, 0);

    const handleAddToCart = (item) => {
        if (!item.isAvailable) {
            toast.error('This dish is currently Sold Out.');
            return;
        }
        setCart((prev) => ({ ...prev, [item.id]: 1 }));
        setCartOpen(true);
        toast.success(`Added ${item.itemName} to cart`);
    };

    const handleIncrement = (id) => {
        setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    };

    const handleDecrement = (id) => {
        setCart((prev) => {
            const current = prev[id] || 0;
            if (current <= 1) {
                const next = { ...prev };
                delete next[id];
                return next;
            }
            return { ...prev, [id]: current - 1 };
        });
    };

    const handleClearCart = () => {
        setCart({});
    };

    // ── Customer Submit Order ───────────────────────────────────────────────────
    const handlePlaceOrder = async () => {
        if (cartEntries.length === 0) {
            toast.error('Your cart is empty.');
            return;
        }

        const items = cartEntries.map(([id, qty]) => {
            const item = menuItems.find((m) => m.id === id);
            return {
                itemId: id,
                itemName: item?.itemName || 'Food Item',
                qty,
                price: item?.price || 0,
                dietaryType: item?.dietaryType || 'Veg'
            };
        });

        const uid = user?.uid || user?.id;
        const orderToken = `CT-${Math.floor(1000 + Math.random() * 9000)}`;

        const finalizeOrder = async (paymentDetails = null) => {
            setPlacingOrder(true);
            try {
                await placeOrder({
                    userId: uid,
                    userName: user?.name || '',
                    userRole: user?.role || 'student',
                    userEmail: user?.email || '',
                    customerUniqueId: customerUniqueId.trim(),
                    orderToken,
                    items,
                    totalAmount: cartTotal,
                    specialInstructions: specialInstructions.trim(),
                    status: 'Placed',
                    pickupStation: 'Counter 1 · Main Serving Desk',
                    paymentStatus: paymentDetails ? 'Paid' : 'Pending (Counter)',
                    paymentMethod: paymentDetails ? (paymentDetails.method || 'Razorpay') : 'Cash at Counter',
                    razorpayPaymentId: paymentDetails?.paymentId || null
                });

                toast.success(`🎉 Order Placed! Food Token #${orderToken}`, { duration: 5000 });
                setCart({});
                setCartOpen(false);
                setSpecialInstructions('');
                await fetchOrdersData();
                setActiveTab('myOrders');

                if (paymentDetails) {
                    setSuccessPaymentData({
                        ...paymentDetails,
                        token: orderToken,
                        serviceName: 'Smart Canteen Order'
                    });
                }
            } catch (err) {
                console.error(err);
                toast.error('Failed to place canteen order.');
            } finally {
                setPlacingOrder(false);
            }
        };

        if (paymentMode === 'razorpay') {
            await initiateRazorpayCheckout({
                amount: cartTotal,
                currency: 'INR',
                title: 'Campus Smart Canteen',
                description: `Canteen Food Tray (${items.length} items)`,
                module: 'canteen',
                token: orderToken,
                customer: {
                    name: user?.name,
                    email: user?.email,
                    uniqueId: customerUniqueId
                },
                onSuccess: (paymentRecord) => {
                    finalizeOrder(paymentRecord);
                },
                onFailure: (err) => {
                    toast.error('Razorpay payment cancelled or failed.');
                },
                onFallbackModal: (params) => {
                    setFallbackPaymentData({
                        ...params,
                        onSuccess: (paymentRecord) => finalizeOrder(paymentRecord)
                    });
                    setRazorpayFallbackOpen(true);
                }
            });
        } else {
            await finalizeOrder(null);
        }
    };

    // ── Admin Menu Item Create / Update / Delete ────────────────────────────────
    const handleSaveMenuItem = async (e) => {
        e.preventDefault();
        if (!itemForm.itemName.trim()) {
            toast.error('Please provide item name.');
            return;
        }
        if (!itemForm.price || parseFloat(itemForm.price) <= 0) {
            toast.error('Please provide a valid price.');
            return;
        }

        setSavingItem(true);
        try {
            if (editingItem) {
                await updateMenuItem(editingItem.id, itemForm);
                toast.success(`✅ Updated "${itemForm.itemName}" on daily menu!`);
                setEditingItem(null);
            } else {
                await addMenuItem(itemForm);
                toast.success(`🎉 Added "${itemForm.itemName}" to today's menu!`);
                // Reset form
                setItemForm({
                    itemName: '',
                    category: 'Breakfast',
                    price: '',
                    prepTimeMinutes: '5',
                    dietaryType: 'Veg',
                    mealSlot: 'Morning Breakfast',
                    description: '',
                    imageUrl: PRESET_FOOD_IMAGES[0].url,
                    isAvailable: true,
                    isSpecial: false
                });
                setActiveTab('adminMenu');
            }
            await fetchMenuData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save menu item.');
        } finally {
            setSavingItem(false);
        }
    };

    const handleToggleStock = async (item) => {
        try {
            await toggleMenuItemAvailability(item.id, !item.isAvailable);
            toast.success(`"${item.itemName}" marked ${!item.isAvailable ? 'In Stock 🟢' : 'Sold Out 🔴'}`);
            await fetchMenuData();
        } catch (e) {
            toast.error('Failed to toggle stock status.');
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Are you sure you want to remove this item from the canteen menu?')) {
            try {
                await deleteMenuItem(itemId);
                toast.success('Menu item deleted.');
                await fetchMenuData();
            } catch (e) {
                toast.error('Failed to delete item.');
            }
        }
    };

    // ── Admin Kitchen Status Stepper & Notification Dispatch ────────────────────
    const handleAdminStatusChange = async (orderId, newStatus, pickupStation = null, orderToken = null) => {
        try {
            const extra = {
                ...(pickupStation ? { pickupStation } : {}),
                ...(orderToken ? { orderToken } : {})
            };

            // 1. Instant optimistic state update for silky-smooth UI response
            setOrders(prev => prev.map(o => {
                if (
                    o.id === orderId ||
                    (orderToken && o.orderToken === orderToken) ||
                    (o.firestoreId && o.firestoreId === orderId)
                ) {
                    return { ...o, status: newStatus, ...extra };
                }
                return o;
            }));

            // 2. Persist update in database and local cache
            await updateOrderStatus(orderId, newStatus, extra);

            if (newStatus === 'Ready for Pickup') {
                toast.success('🔔 Food Ready Notification dispatched to Customer!', { duration: 5000 });
            } else if (newStatus === 'Completed') {
                toast.success('✅ Meal handed over. Order marked Completed!');
            } else {
                toast.success(`Order moved to: ${newStatus}`);
            }

            setModalOrderToReady(null);
            await fetchOrdersData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to update order status.');
        }
    };

    const handleDeleteOrder = async (orderId, orderToken = null) => {
        if (window.confirm('Cancel/Delete this canteen order?')) {
            try {
                setOrders(prev => prev.filter(o => o.id !== orderId && (!orderToken || o.orderToken !== orderToken)));
                await deleteCanteenOrder(orderId, orderToken);
                toast.success('Order removed.');
                await fetchOrdersData();
            } catch (e) {
                toast.error('Failed to delete order.');
            }
        }
    };

    // ── Filtered Menus & Orders ─────────────────────────────────────────────────
    const filteredMenu = menuItems.filter((item) => {
        const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
        const matchesDietary = dietaryFilter === 'All' || item.dietaryType === dietaryFilter;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
            !q ||
            item.itemName?.toLowerCase().includes(q) ||
            item.description?.toLowerCase().includes(q) ||
            item.category?.toLowerCase().includes(q);

        return matchesCategory && matchesDietary && matchesSearch;
    });

    const filteredOrders = orders.filter((order) => {
        const q = orderSearchQuery.toLowerCase().trim();
        const matchesSearch =
            !q ||
            order.orderToken?.toLowerCase().includes(q) ||
            order.customerUniqueId?.toLowerCase().includes(q) ||
            order.userName?.toLowerCase().includes(q) ||
            order.items?.some(i => i.itemName?.toLowerCase().includes(q));

        const matchesStatus = orderFilter === 'All' || order.status === orderFilter;
        return matchesSearch && matchesStatus;
    });

    // Check if customer has orders ready for pickup
    const readyOrdersForUser = orders.filter(o => o.status === 'Ready for Pickup');

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
                            <span>{user.name} ({isAdmin ? 'Canteen Admin Desk' : user.role?.toUpperCase()})</span>
                        </div>

                        {/* Cart Trigger button for Students/Staff */}
                        {!isAdmin && (
                            <button
                                onClick={() => setCartOpen(true)}
                                className="relative flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full bg-[#06B6D4] text-[#070A11] shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:bg-[#22D3EE] transition-colors"
                            >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>Cart ({cartCount})</span>
                                {cartCount > 0 && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
                                )}
                            </button>
                        )}

                        <button
                            onClick={async () => {
                                await logoutDomain('canteen');
                                toast.success('Signed out from Smart Canteen');
                                window.location.href = '/login';
                            }}
                            className="text-xs px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-colors font-medium"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* ── Ready Food Alert Banner for Students & Teachers ── */}
                {!isAdmin && readyOrdersForUser.length > 0 && (
                    <div className="rounded-2xl p-4 bg-[#0D1527] border border-emerald-500/50 text-white shadow-xl flex items-center justify-between flex-wrap gap-3 animate-fade-in">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                                <Bell className="w-6 h-6 text-emerald-400 animate-bounce" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                                    <span>🍲 Your Canteen Order is Ready for Pickup!</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                                        {readyOrdersForUser.length} {readyOrdersForUser.length === 1 ? 'Order' : 'Orders'}
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-300 mt-0.5">
                                    Show Token: <strong>{readyOrdersForUser.map(o => o.orderToken).join(', ')}</strong> at <strong>{readyOrdersForUser[0]?.pickupStation || 'Counter 1'}</strong> to collect your meal.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveTab('myOrders')}
                            className="px-4 py-2 rounded-xl bg-[#06B6D4] text-[#070A11] hover:bg-[#22D3EE] text-xs font-black shadow-md transition-transform active:scale-95"
                        >
                            View Food Token Card
                        </button>
                    </div>
                )}

                {/* ── Visual Reference Panel 7: Canteen Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2D4A] pb-4">
                    <div>
                        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                            <span>Campus Canteen</span>
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">
                            {isAdmin ? 'Canteen Daily Menu & Kitchen Order Desk' : 'Order, Pay & Pickup · Unified Food Telemetry (UPI Enabled)'}
                        </p>
                    </div>

                    {/* Role Tab Switcher (Reference Panel 7) */}
                    <div className="flex gap-2 p-1 bg-[#0A0F1D] rounded-full border border-[#1E2D4A] flex-wrap">
                        {isAdmin ? (
                            <>
                                <button
                                    onClick={() => setActiveTab('adminOrders')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        activeTab === 'adminOrders'
                                            ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Kitchen Orders ({orders.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('adminMenu')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        activeTab === 'adminMenu'
                                            ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Menu Manager ({menuItems.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('menu')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        activeTab === 'menu'
                                            ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Menu
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setActiveTab('menu')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        activeTab === 'menu'
                                            ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Menu
                                </button>
                                <button
                                    onClick={() => setActiveTab('myOrders')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        activeTab === 'myOrders'
                                            ? 'bg-[#06B6D4] text-[#070A11] shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    My Orders
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Quick Stats Pill */}
                <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                        Available: {menuItems.filter(m => m.isAvailable).length}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20">
                        🔥 Specials: {menuItems.filter(m => m.isSpecial).length}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                        Ready: {orders.filter(o => o.status === 'Ready for Pickup').length}
                    </span>
                </div>

                {/* ══════════════════════════════════════════════════════════════════════
                    TAB 1: TODAY'S DAILY MENU (STUDENTS & STAFF BROWSING)
                ══════════════════════════════════════════════════════════════════════ */}
                {activeTab === 'menu' && (
                    <div className="space-y-6">
                        {/* Search & Category / Dietary Filters */}
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                                <div className="relative flex-1 w-full">
                                    <SearchBar
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(typeof e === 'string' ? e : e.target.value)}
                                        placeholder="Search today's dishes, dosa, thali, biryani, coffee..."
                                    />
                                </div>

                                {/* Dietary Filter Pills */}
                                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
                                    {DIETARY_TYPES.map((diet) => (
                                        <button
                                            key={diet}
                                            onClick={() => setDietaryFilter(diet)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                                                dietaryFilter === diet ? 'bg-[#06B6D4] text-[#070A11] border-[#06B6D4] shadow-[0_0_12px_rgba(6,182,212,0.35)] font-black' : 'bg-[#0A0F1D] text-slate-400 border-[#1E2D4A] hover:text-white hover:border-[#06B6D4]/40'
                                            }`}
                                        >
                                            {diet === 'Veg' ? '🟢 Pure Veg' : diet === 'Non-Veg' ? '🔴 Non-Veg' : diet === 'Vegan' ? '🌿 Vegan' : 'All Dietary'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category Filter Pills */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all whitespace-nowrap ${
                                            categoryFilter === cat ? 'bg-[#F59E0B] text-[#070A11] border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.35)] font-black scale-105' : 'bg-[#0A0F1D] text-slate-400 border-[#1E2D4A] hover:text-white hover:border-[#F59E0B]/40'
                                        }`}
                                    >
                                        {cat === 'Today Specials' ? '🔥 Today Specials' : cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Menu Items Grid */}
                        {loadingMenu ? (
                            <div className={filteredMenu.length === 1 ? 'max-w-md mx-auto w-full' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'}>
                                <SkeletonLoader variant="card" count={6} />
                            </div>
                        ) : filteredMenu.length === 0 ? (
                            <EmptyState
                                icon={UtensilsCrossed}
                                title="No dishes found"
                                description="No dishes match your selected category or search filters."
                                action={
                                    <Button
                                        onClick={() => {
                                            setCategoryFilter('All');
                                            setDietaryFilter('All');
                                            setSearchQuery('');
                                        }}
                                        className="bg-amber-600 text-white text-xs font-bold"
                                    >
                                        Clear Filters
                                    </Button>
                                }
                            />
                        ) : (
                            <div className={filteredMenu.length === 1 ? 'max-w-md mx-auto w-full' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'}>
                                {filteredMenu.map((item) => {
                                    const inCartQty = cart[item.id] || 0;
                                    const unavailable = !item.isAvailable;

                                    return (
                                        <div
                                            key={item.id}
                                            className={`group rounded-2xl overflow-hidden bg-[#0D1527] border transition-all duration-300 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-[#06B6D4]/50 ${
                                                unavailable
                                                    ? 'opacity-60 border-[#1E2D4A] grayscale-[40%]'
                                                    : item.isSpecial
                                                    ? 'border-[#F59E0B]/50 ring-1 ring-[#F59E0B]/30'
                                                    : 'border-[#1E2D4A]'
                                            }`}
                                        >
                                            {/* Item Image Header */}
                                            <div className="relative h-44 overflow-hidden bg-[#070A11]">
                                                <img
                                                    src={item.imageUrl || (item.itemName?.toLowerCase().includes('dosa') ? '/assets/canteen-dosa.png' : item.itemName?.toLowerCase().includes('rice') ? '/assets/canteen-rice.png' : item.itemName?.toLowerCase().includes('juice') ? '/assets/canteen-juice.png' : PRESET_FOOD_IMAGES[0].url)}
                                                    alt={item.itemName}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => {
                                                        e.target.src = PRESET_FOOD_IMAGES[0].url;
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#070A11] via-transparent to-transparent opacity-80" />

                                                {/* Badges on Image */}
                                                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                                                    {item.isSpecial && (
                                                        <span className="px-2.5 py-0.5 rounded-full bg-[#F59E0B] text-[#070A11] text-[10px] font-black tracking-wider uppercase shadow flex items-center gap-1">
                                                            <Flame className="w-3 h-3" />
                                                            <span>Special</span>
                                                        </span>
                                                    )}
                                                    <span className="px-2 py-0.5 rounded-full bg-[#070A11]/80 backdrop-blur-md text-white text-[10px] font-mono border border-[#1E2D4A]">
                                                        {item.mealSlot || 'All Day'}
                                                    </span>
                                                </div>

                                                <div className="absolute top-3 right-3">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold backdrop-blur-md border ${
                                                        item.isAvailable
                                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                                            : 'bg-red-500/20 text-red-400 border-red-500/40'
                                                    }`}>
                                                        {item.isAvailable ? 'In Stock' : 'Sold Out'}
                                                    </span>
                                                </div>

                                                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                                                    <span className="font-mono text-slate-300 flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5 text-[#22D3EE]" />
                                                        <span>{item.prepTimeMinutes || 10} mins</span>
                                                    </span>
                                                    <span className="font-bold text-[#FBBF24]">
                                                        ★ {item.rating || 4.8}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Item Content */}
                                            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                                                <div>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className="font-display font-bold text-base text-white group-hover:text-[#22D3EE] transition-colors">
                                                            {item.itemName}
                                                        </h3>
                                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#06B6D4]/15 text-[#22D3EE] border border-[#06B6D4]/30 whitespace-nowrap">
                                                            {item.category}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                                                        {item.description || 'Prepared fresh in the campus kitchen with premium ingredients.'}
                                                    </p>
                                                </div>

                                                {/* Price & Action Row (Reference Panel 7) */}
                                                <div className="pt-2 border-t border-[#1E2D4A] flex items-center justify-between">
                                                    <div>
                                                        <span className="text-[10px] uppercase font-mono text-slate-500 block">Price</span>
                                                        <span className="font-display text-xl font-bold text-white">
                                                            ₹{parseFloat(item.price).toFixed(0)}
                                                        </span>
                                                    </div>

                                                    {/* Visual Reference Panel 7: Cyan Add + Button */}
                                                    <div>
                                                        {unavailable ? (
                                                            <span className="text-xs text-red-400 font-bold px-3 py-1.5 rounded-lg bg-red-950/30 border border-red-900/40">
                                                                Sold Out
                                                            </span>
                                                        ) : inCartQty === 0 ? (
                                                            <button
                                                                onClick={() => handleAddToCart(item)}
                                                                className="px-4 py-2 rounded-xl bg-[#06B6D4] hover:bg-[#22D3EE] text-[#070A11] font-bold text-xs shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all active:scale-95 flex items-center gap-1.5"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                                <span>Add +</span>
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center gap-2 p-1 bg-[#0A0F1D] border border-[#06B6D4]/40 rounded-xl">
                                                                <button
                                                                    onClick={() => handleDecrement(item.id)}
                                                                    className="w-7 h-7 rounded-lg bg-[#0D1527] text-white flex items-center justify-center font-bold hover:bg-[#111A2E] transition-colors"
                                                                >
                                                                    <Minus className="w-3.5 h-3.5" />
                                                                </button>
                                                                <span className="font-display font-bold text-sm text-[#22D3EE] w-6 text-center">
                                                                    {inCartQty}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleIncrement(item.id)}
                                                                    className="w-7 h-7 rounded-lg bg-[#06B6D4] text-[#070A11] flex items-center justify-center font-bold hover:bg-[#22D3EE] transition-colors"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
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
                    TAB 2: MY FOOD ORDERS & DIGITAL PICKUP TOKENS (STUDENTS & STAFF)
                ══════════════════════════════════════════════════════════════════════ */}
                {!isAdmin && activeTab === 'myOrders' && (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <QrCode className="w-5 h-5 text-amber-600" />
                                    <span>My Canteen Orders & Digital Food Claim Tokens</span>
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Show your unique Token Number at the counter when your food status is marked "Ready for Pickup".
                                </p>
                            </div>
                            <Button
                                onClick={fetchOrdersData}
                                variant="outline"
                                size="sm"
                                className="text-xs flex items-center gap-1.5"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                                <span>Refresh Orders</span>
                            </Button>
                        </div>

                        {loadingOrders ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <SkeletonLoader variant="card" count={2} />
                            </div>
                        ) : orders.length === 0 ? (
                            <EmptyState
                                icon={UtensilsCrossed}
                                title="No Canteen Orders Yet"
                                description="You haven't placed any food orders today. Browse the daily menu to place your first order!"
                                action={
                                    <Button onClick={() => setActiveTab('menu')} className="bg-amber-600 text-white font-bold text-xs">
                                        Browse Today's Menu
                                    </Button>
                                }
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {orders.map((order) => {
                                    const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['Placed'];
                                    const StatusIcon = statusCfg.icon;
                                    const isReady = order.status === 'Ready for Pickup';

                                    return (
                                        <div
                                            key={order.id}
                                            className={`rounded-2xl p-5 bg-[#0D1527] border border-[#1E2D4A] shadow-md flex flex-col justify-between transition-all ${
                                                isReady
                                                    ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-emerald-500/10'
                                                    : 'border-gray-200/80 dark:border-white/10'
                                            }`}
                                        >
                                            {/* Token Card Header */}
                                            <div>
                                                <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-white/10">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 text-white shadow-md">
                                                            <QrCode className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Food Token</span>
                                                            <span className="text-xl font-black text-amber-600 dark:text-amber-400 tracking-wider">
                                                                {order.orderToken || '#CT-0000'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusCfg.bg}`}>
                                                        <StatusIcon className={`w-3.5 h-3.5 ${order.status === 'Preparing' ? 'animate-spin' : ''}`} />
                                                        <span>{statusCfg.label}</span>
                                                    </span>
                                                </div>

                                                {/* Ready alert notification pill */}
                                                {isReady && (
                                                    <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-900 dark:text-emerald-200 space-y-1 mb-3 animate-fade-in">
                                                        <p className="font-extrabold flex items-center gap-2">
                                                            <Bell className="w-4 h-4 text-emerald-600 animate-bounce" />
                                                            <span>Hot Food Ready! Collect at Serving Counter</span>
                                                        </p>
                                                        <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                                                            Station: <strong>{order.pickupStation || 'Counter 1 · Main Serving Desk'}</strong>
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Customer Info */}
                                                <div className="text-xs text-gray-500 mb-3">
                                                    <span>Customer: <strong className="text-slate-200">{order.userName}</strong> ({order.customerUniqueId || 'Student'})</span>
                                                    <span className="float-right">{formatTime(order.orderTime)}</span>
                                                </div>

                                                {/* Ordered Items List */}
                                                <div className="space-y-1.5 bg-[#0A0F1D] p-3 rounded-xl border border-[#1E2D4A] text-xs">
                                                    {(order.items || []).map((it, idx) => (
                                                        <div key={idx} className="flex items-center justify-between">
                                                            <span className="text-slate-300 font-medium">
                                                                {it.itemName} <strong className="text-amber-600 dark:text-amber-400">× {it.qty}</strong>
                                                            </span>
                                                            <span className="font-bold text-white">
                                                                ₹{(it.price * it.qty).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Customer Cooking Instructions */}
                                                {order.specialInstructions && (
                                                    <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/20 p-2.5 rounded-xl mt-2 border border-amber-200/50 dark:border-amber-800/30">
                                                        <strong>Note:</strong> "{order.specialInstructions}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Total and Footer */}
                                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs">
                                                <div>
                                                    <span className="text-gray-400 text-[11px] block">Total Bill</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-black text-white">
                                                            ₹{parseFloat(order.totalAmount || 0).toFixed(2)}
                                                        </span>
                                                        {order.paymentStatus === 'Paid' ? (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/20 flex items-center gap-1">
                                                                <ShieldCheck className="w-3 h-3" />
                                                                <span>Paid via Razorpay</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                                                                Pay at Counter
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1">
                                                    <Tag className="w-3.5 h-3.5" /> Present Token #{order.orderToken}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════════
                    TAB 3: KITCHEN LIVE ORDERS & DISPATCH DESK (ADMIN)
                ══════════════════════════════════════════════════════════════════════ */}
                {isAdmin && activeTab === 'adminOrders' && (
                    <div className="space-y-5">
                        {/* Search & Status Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                            <div className="relative flex-1 w-full">
                                <SearchBar
                                    value={orderSearchQuery}
                                    onChange={(e) => setOrderSearchQuery(typeof e === 'string' ? e : e.target.value)}
                                    placeholder="Search by Food Token (#CT-4821), Student USN, Staff ID, or Customer name..."
                                />
                            </div>

                            {/* Status Filters */}
                            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
                                {['All', 'Placed', 'Preparing', 'Ready for Pickup', 'Completed'].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setOrderFilter(st)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap ${
                                            orderFilter === st
                                                ? 'bg-amber-600 text-white border-amber-600 shadow'
                                                : 'bg-white dark:bg-white/5 text-slate-400 border-gray-200 dark:border-white/10 hover:bg-gray-100'
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loadingOrders ? (
                            <SkeletonLoader variant="card" count={3} />
                        ) : filteredOrders.length === 0 ? (
                            <EmptyState
                                icon={ClipboardList}
                                title="No active kitchen orders"
                                description="No incoming customer orders found matching your search or status filter."
                            />
                        ) : (
                            <div className="space-y-4">
                                {filteredOrders.map((order) => {
                                    const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['Placed'];
                                    const StatusIcon = statusCfg.icon;
                                    const isNewlyPaid = newlyPaidOrderIds.has(order.id) || newlyPaidOrderIds.has(order.orderToken);

                                    return (
                                        <div
                                            key={order.id}
                                            className={`rounded-2xl p-5 sm:p-6 bg-[#0D1527] border border-[#1E2D4A] transition-all space-y-4 ${
                                                isNewlyPaid
                                                    ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-xl shadow-emerald-500/10'
                                                    : 'border-gray-200/80 dark:border-white/10 shadow-sm hover:shadow-xl'
                                            }`}
                                        >
                                            {/* Order Header Strip */}
                                            <div className="flex items-start justify-between flex-wrap gap-3 pb-3 border-b border-gray-100 dark:border-white/10">
                                                <div className="flex items-center gap-3">
                                                    {/* Unique Food Token */}
                                                    <div className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md flex items-center gap-2">
                                                        <QrCode className="w-4 h-4" />
                                                        <span className="font-black text-sm sm:text-base tracking-wider">{order.orderToken || '#CT-0000'}</span>
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center gap-2 font-bold text-white text-sm sm:text-base">
                                                            <span>{order.userName}</span>
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold uppercase">
                                                                {order.userRole || 'Student'}
                                                            </span>
                                                            {isNewlyPaid && (
                                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1 shadow">
                                                                    💰 Just Paid
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-amber-600 dark:text-amber-400 font-mono font-bold">
                                                            ID/USN: {order.customerUniqueId || 'Not provided'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusCfg.bg}`}>
                                                        <StatusIcon className={`w-3.5 h-3.5 ${order.status === 'Preparing' ? 'animate-spin' : ''}`} />
                                                        <span>{statusCfg.label}</span>
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteOrder(order.id, order.orderToken)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                        title="Delete Order"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Dishes Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                                {(order.items || []).map((it, i) => (
                                                    <div key={i} className="p-3 rounded-2xl bg-[#0A0F1D] border border-[#1E2D4A] flex items-center justify-between">
                                                        <div>
                                                            <p className="font-bold text-white text-sm">{it.itemName}</p>
                                                            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">Qty: {it.qty}</span>
                                                        </div>
                                                        <span className="font-black text-slate-200">₹{(it.price * it.qty).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Special Cooking Instructions from Student / Staff */}
                                            {order.specialInstructions && (
                                                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs">
                                                    <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">📌 Customer Cooking Note:</span>
                                                    <p className="text-amber-900 dark:text-amber-200">{order.specialInstructions}</p>
                                                </div>
                                            )}

                                            {/* Footer Row: Station note & Status Action Buttons */}
                                            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                                                <div className="text-xs text-gray-500">
                                                    <span>Serving Station: <strong className="text-slate-200">{order.pickupStation || 'Counter 1 · Main Serving Desk'}</strong></span>
                                                    <span className="ml-3 font-black text-amber-600 dark:text-amber-400 text-sm">Total: ₹{parseFloat(order.totalAmount || 0).toFixed(2)}</span>
                                                    {order.paymentStatus === 'Paid' ? (
                                                        <span className="ml-2 text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/30 inline-flex items-center gap-1 shadow-xs">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                            <span>Paid via {order.paymentMethod || 'Razorpay / UPI'}</span>
                                                            {order.razorpayPaymentId && (
                                                                <span className="font-mono text-[9px] opacity-75">#{order.razorpayPaymentId.slice(0, 10)}</span>
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                                                            Pending Counter Pay
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Kitchen Operator Action Stepper */}
                                                <div className="flex items-center gap-2">
                                                    {order.status === 'Placed' && (
                                                        <button
                                                            onClick={() => handleAdminStatusChange(order.id, 'Preparing', null, order.orderToken)}
                                                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow"
                                                        >
                                                            <ChefHat className="w-4 h-4" />
                                                            <span>Start Preparing 👨‍🍳</span>
                                                        </button>
                                                    )}

                                                    {order.status === 'Preparing' && (
                                                        <button
                                                            onClick={() => setModalOrderToReady(order)}
                                                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow"
                                                        >
                                                            <Bell className="w-4 h-4 animate-bounce" />
                                                            <span>Mark Ready & Notify Customer 🔔</span>
                                                        </button>
                                                    )}

                                                    {order.status === 'Ready for Pickup' && (
                                                        <button
                                                            onClick={() => handleAdminStatusChange(order.id, 'Completed', null, order.orderToken)}
                                                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            <span>Verify Token & Handover Meal ✅</span>
                                                        </button>
                                                    )}

                                                    {order.status === 'Completed' && (
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                                                            <Check className="w-4 h-4" /> Served to Customer
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
                    TAB 4: DAY-TO-DAY MENU MANAGER & AVAILABILITY (ADMIN)
                ══════════════════════════════════════════════════════════════════════ */}
                {isAdmin && activeTab === 'adminMenu' && (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Store className="w-5 h-5 text-amber-600" />
                                    <span>Day-to-Day Menu Management Desk</span>
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Add, edit, toggle in-stock availability, and set today's chef specials for students and teachers.
                                </p>
                            </div>
                            <Button
                                onClick={() => {
                                    setEditingItem(null);
                                    setActiveTab('addMenuItem');
                                }}
                                className="bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add New Dish</span>
                            </Button>
                        </div>

                        {/* Menu Table / Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {menuItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 rounded-3xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-3"
                                >
                                    <div className="flex items-start gap-3">
                                        <img
                                            src={item.imageUrl || PRESET_FOOD_IMAGES[0].url}
                                            alt={item.itemName}
                                            className="w-16 h-16 rounded-2xl object-cover bg-gray-100 flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <h4 className="font-bold text-sm text-white truncate">
                                                    {item.itemName}
                                                </h4>
                                                {item.isSpecial && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 font-bold">
                                                        🔥 Special
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500 block">{item.category} · {item.mealSlot}</span>
                                            <span className="text-sm font-black text-amber-600 dark:text-amber-400">₹{parseFloat(item.price).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2">
                                        <button
                                            onClick={() => handleToggleStock(item)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                                                item.isAvailable
                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20'
                                            }`}
                                        >
                                            {item.isAvailable ? '🟢 In Stock' : '🔴 Sold Out'}
                                        </button>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => {
                                                    setEditingItem(item);
                                                    setItemForm({
                                                        itemName: item.itemName,
                                                        category: item.category || 'Breakfast',
                                                        price: item.price.toString(),
                                                        prepTimeMinutes: (item.prepTimeMinutes || 5).toString(),
                                                        dietaryType: item.dietaryType || 'Veg',
                                                        mealSlot: item.mealSlot || 'Morning Breakfast',
                                                        description: item.description || '',
                                                        imageUrl: item.imageUrl || PRESET_FOOD_IMAGES[0].url,
                                                        isAvailable: item.isAvailable !== false,
                                                        isSpecial: !!item.isSpecial
                                                    });
                                                    setActiveTab('addMenuItem');
                                                }}
                                                className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                                                title="Edit Dish"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>

                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="p-2 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-100"
                                                title="Delete Dish"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════════
                    TAB 5: ADD / EDIT DAILY MENU ITEM (ADMIN)
                ══════════════════════════════════════════════════════════════════════ */}
                {isAdmin && activeTab === 'addMenuItem' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Form Column */}
                        <div className="lg:col-span-3">
                            <Card className="glass-card rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-lg p-6">
                                <CardHeader className="p-0 pb-4 mb-4 border-b border-gray-100 dark:border-white/10">
                                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                        <Plus className="w-5 h-5 text-amber-600" />
                                        <span>{editingItem ? `Edit Menu Item: "${editingItem.itemName}"` : 'Add New Daily Menu Item'}</span>
                                    </CardTitle>
                                    <p className="text-xs text-slate-400">
                                        Enter food specifications, daily price, prep duration, and availability for the campus canteen.
                                    </p>
                                </CardHeader>

                                <form onSubmit={handleSaveMenuItem} className="space-y-4 text-xs">
                                    {/* Item Name */}
                                    <div>
                                        <label className="block font-semibold text-slate-300 mb-1">
                                            Dish / Item Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={itemForm.itemName}
                                            onChange={(e) => setItemForm({ ...itemForm, itemName: e.target.value })}
                                            placeholder="e.g. Crispy Masala Dosa, Paneer Butter Masala, Veg Hakka Noodles"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#0A0F1D] border border-[#1E2D4A] text-white focus:ring-2 focus:ring-amber-500 outline-none text-xs"
                                        />
                                    </div>

                                    {/* Category & Meal Slot */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-semibold text-slate-300 mb-1">Category</label>
                                            <select
                                                value={itemForm.category}
                                                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                                                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#0A0F1D] border border-[#1E2D4A] text-white"
                                            >
                                                {CATEGORIES.filter(c => c !== 'All').map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block font-semibold text-slate-300 mb-1">Meal Slot</label>
                                            <select
                                                value={itemForm.mealSlot}
                                                onChange={(e) => setItemForm({ ...itemForm, mealSlot: e.target.value })}
                                                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#0A0F1D] border border-[#1E2D4A] text-white"
                                            >
                                                {MEAL_SLOTS.map(slot => (
                                                    <option key={slot} value={slot}>{slot}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Price & Prep Time */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-semibold text-slate-300 mb-1">
                                                Price (₹) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="1"
                                                min="1"
                                                required
                                                value={itemForm.price}
                                                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                                                placeholder="e.g. 50"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#0A0F1D] border border-[#1E2D4A] text-white font-bold text-xs"
                                            />
                                        </div>

                                        <div>
                                            <label className="block font-semibold text-slate-300 mb-1">
                                                Prep Duration (Minutes)
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={itemForm.prepTimeMinutes}
                                                onChange={(e) => setItemForm({ ...itemForm, prepTimeMinutes: e.target.value })}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#0A0F1D] border border-[#1E2D4A] text-white text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Dietary Type & Toggles */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-semibold text-slate-300 mb-1">Dietary Type</label>
                                            <select
                                                value={itemForm.dietaryType}
                                                onChange={(e) => setItemForm({ ...itemForm, dietaryType: e.target.value })}
                                                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#0A0F1D] border border-[#1E2D4A] text-white"
                                            >
                                                <option value="Veg">🟢 Pure Veg</option>
                                                <option value="Non-Veg">🔴 Non-Veg</option>
                                                <option value="Vegan">🌿 Vegan</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-4 pt-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={itemForm.isSpecial}
                                                    onChange={(e) => setItemForm({ ...itemForm, isSpecial: e.target.checked })}
                                                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                                                />
                                                <span className="font-bold text-slate-200">🔥 Today's Special</span>
                                            </label>

                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={itemForm.isAvailable}
                                                    onChange={(e) => setItemForm({ ...itemForm, isAvailable: e.target.checked })}
                                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <span className="font-bold text-slate-200">🟢 In Stock</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block font-semibold text-slate-300 mb-1">
                                            Dish Description / Ingredients
                                        </label>
                                        <textarea
                                            rows="2"
                                            value={itemForm.description}
                                            onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                                            placeholder="e.g. Golden roasted crepe layered with spicy potato filling and served with coconut chutney & sambar."
                                            className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#0A0F1D] border border-[#1E2D4A] text-white outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                                        />
                                    </div>

                                    {/* Quick Preset Image Chooser */}
                                    <div>
                                        <label className="block font-semibold text-slate-300 mb-1.5">
                                            Select Photo Thumbnail or Custom URL
                                        </label>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                                            {PRESET_FOOD_IMAGES.map((img) => (
                                                <button
                                                    key={img.label}
                                                    type="button"
                                                    onClick={() => setItemForm({ ...itemForm, imageUrl: img.url })}
                                                    className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 text-[10px] text-center transition-all ${
                                                        itemForm.imageUrl === img.url
                                                            ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold'
                                                            : 'border-gray-200 dark:border-white/10 text-gray-500'
                                                    }`}
                                                >
                                                    <img src={img.url} alt={img.label} className="w-12 h-10 rounded-lg object-cover" />
                                                    <span className="truncate w-full">{img.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="url"
                                            value={itemForm.imageUrl}
                                            onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                                            placeholder="https://..."
                                            className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#0A0F1D] border border-[#1E2D4A] text-white text-xs"
                                        />
                                    </div>

                                    <div className="pt-2 flex items-center gap-3">
                                        <Button
                                            type="submit"
                                            disabled={savingItem}
                                            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-sm shadow-lg hover:shadow-xl"
                                        >
                                            {savingItem ? (
                                                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving Item...</span>
                                            ) : (
                                                <span className="flex items-center gap-2"><Check className="w-4 h-4" /> {editingItem ? 'Save Updates' : 'Publish Dish to Daily Menu'}</span>
                                            )}
                                        </Button>

                                        {editingItem && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setEditingItem(null);
                                                    setActiveTab('adminMenu');
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            </Card>
                        </div>

                        {/* Live Preview Card */}
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="font-bold text-sm text-slate-300">Live Customer Card Preview:</h3>
                            <div className="rounded-3xl overflow-hidden bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-700/60 shadow-xl p-0">
                                <div className="relative h-44 bg-gray-100 dark:bg-gray-800">
                                    <img
                                        src={itemForm.imageUrl || PRESET_FOOD_IMAGES[0].url}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = PRESET_FOOD_IMAGES[0].url; }}
                                    />
                                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                        {itemForm.isSpecial && (
                                            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase">
                                                🔥 Special
                                            </span>
                                        )}
                                        <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
                                            {itemForm.mealSlot}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${itemForm.isAvailable ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                                            {itemForm.isAvailable ? 'In Stock' : 'Sold Out'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-base text-white">
                                            {itemForm.itemName || 'Dish Name Preview'}
                                        </h4>
                                        <span className="text-lg font-black text-amber-600">₹{parseFloat(itemForm.price || 0).toFixed(2)}</span>
                                    </div>
                                    <p className="text-slate-400">
                                        {itemForm.description || 'Description of the daily menu dish.'}
                                    </p>
                                    <div className="pt-2 flex items-center justify-between text-gray-400 text-[11px]">
                                        <span>⏱️ {itemForm.prepTimeMinutes || 5} min prep</span>
                                        <span>🥗 {itemForm.dietaryType}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════════════════
                CART DRAWER (DESKTOP & MOBILE)
            ══════════════════════════════════════════════════════════════════════ */}
            {cartOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-slide-left">
                        {/* Cart Header */}
                        <div>
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                                        <ShoppingCart className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-base text-white">Your Canteen Tray</h2>
                                        <span className="text-xs text-gray-400">{cartCount} items selected</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setCartOpen(false)}
                                    className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Cart Items List */}
                            {cartEntries.length === 0 ? (
                                <div className="py-12 text-center text-gray-400 space-y-2">
                                    <UtensilsCrossed className="w-12 h-12 mx-auto opacity-40 text-amber-500" />
                                    <p className="font-bold text-sm">Your canteen tray is empty.</p>
                                    <p className="text-xs">Add freshly prepared dishes from today's menu!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cartEntries.map(([id, qty]) => {
                                        const item = menuItems.find(m => m.id === id);
                                        if (!item) return null;

                                        return (
                                            <div
                                                key={id}
                                                className="p-3 rounded-2xl bg-[#0A0F1D] border border-[#1E2D4A] flex items-center justify-between gap-3 text-xs"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <img
                                                        src={item.imageUrl || PRESET_FOOD_IMAGES[0].url}
                                                        alt={item.itemName}
                                                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-white truncate">
                                                            {item.itemName}
                                                        </h4>
                                                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                                                            ₹{item.price} each
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleDecrement(id)}
                                                        className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center font-bold"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-5 text-center font-black text-sm text-white">
                                                        {qty}
                                                    </span>
                                                    <button
                                                        onClick={() => handleIncrement(id)}
                                                        className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Cooking / Serving Instructions */}
                                    <div className="pt-2">
                                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                            Special Instructions for the Kitchen Chef:
                                        </label>
                                        <input
                                            type="text"
                                            value={specialInstructions}
                                            onChange={(e) => setSpecialInstructions(e.target.value)}
                                            placeholder="e.g. Extra chutney, less spice, pack for takeaway..."
                                            className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#0A0F1D] border border-[#1E2D4A] text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cart Footer */}
                        {cartEntries.length > 0 && (
                            <div className="pt-4 border-t border-gray-100 dark:border-white/10 space-y-3.5">
                                {/* Payment Mode Selection */}
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Select Payment Method
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMode('razorpay')}
                                            className={`p-2.5 rounded-2xl border text-left font-bold text-xs flex flex-col gap-1 transition-all ${
                                                paymentMode === 'razorpay'
                                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-sm scale-[1.02]'
                                                    : 'border-gray-200 dark:border-white/10 text-slate-400 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-1 font-extrabold text-blue-600 dark:text-blue-400">
                                                    <Smartphone className="w-3.5 h-3.5" />
                                                    <span>Razorpay</span>
                                                </span>
                                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 font-black">
                                                    UPI/CARDS
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-normal text-gray-500">Instant Food Token</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setPaymentMode('counter')}
                                            className={`p-2.5 rounded-2xl border text-left font-bold text-xs flex flex-col gap-1 transition-all ${
                                                paymentMode === 'counter'
                                                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shadow-sm scale-[1.02]'
                                                    : 'border-gray-200 dark:border-white/10 text-slate-400 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-1 font-extrabold text-amber-600 dark:text-amber-400">
                                                    <Store className="w-3.5 h-3.5" />
                                                    <span>Counter Pay</span>
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-normal text-gray-500">Cash / Physical POS</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm pt-1">
                                    <span className="text-gray-500">Total Payable Amount</span>
                                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                                        ₹{cartTotal.toFixed(2)}
                                    </span>
                                </div>

                                <Button
                                    onClick={handlePlaceOrder}
                                    disabled={placingOrder}
                                    className={`w-full py-3.5 rounded-2xl text-white font-black text-sm shadow-xl hover:shadow-2xl transition-all ${
                                        paymentMode === 'razorpay'
                                            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-500/20'
                                            : 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500'
                                    }`}
                                >
                                    {placingOrder ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Processing Payment & Order...
                                        </span>
                                    ) : paymentMode === 'razorpay' ? (
                                        <span className="flex items-center gap-2">
                                            <Lock className="w-4 h-4" /> Pay with Razorpay (₹{cartTotal.toFixed(2)})
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Send className="w-4 h-4" /> Place Order & Pay at Counter (₹{cartTotal.toFixed(2)})
                                        </span>
                                    )}
                                </Button>

                                <button
                                    onClick={handleClearCart}
                                    className="w-full py-1.5 text-center text-xs text-red-500 hover:text-red-600 font-medium"
                                >
                                    Clear Tray
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════
                MODAL: ADMIN NOTIFY CUSTOMER & SPECIFY SERVING STATION NOTE
            ══════════════════════════════════════════════════════════════════════ */}
            {modalOrderToReady && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0D1527] border border-[#1E2D4A] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-2">
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <Bell className="w-4 h-4 text-emerald-500" />
                                <span>Notify Customer: Food Ready</span>
                            </h2>
                            <button onClick={() => setModalOrderToReady(null)} className="text-gray-400 hover:text-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-xs space-y-1 text-gray-600 dark:text-gray-300">
                            <p><strong>Token Number:</strong> {modalOrderToReady.orderToken}</p>
                            <p><strong>Customer:</strong> {modalOrderToReady.userName} ({modalOrderToReady.customerUniqueId})</p>
                            <p><strong>Items:</strong> {modalOrderToReady.items?.map(i => `${i.itemName} × ${i.qty}`).join(', ')}</p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Pickup Counter / Serving Station Note *
                            </label>
                            <input
                                type="text"
                                value={pickupStationNote}
                                onChange={(e) => setPickupStationNote(e.target.value)}
                                placeholder="e.g. Counter 1 · Hot Dosa Station or Juice Desk 3"
                                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-[#0A0F1D] border border-[#1E2D4A] text-white font-medium text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                            <span className="text-[11px] text-gray-400 mt-1 block">
                                An instant pickup alert will be dispatched to the student / teacher with this counter note.
                            </span>
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setModalOrderToReady(null)}>
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => handleAdminStatusChange(modalOrderToReady.id, 'Ready for Pickup', pickupStationNote, modalOrderToReady.orderToken)}
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
                    serviceName={successPaymentData.serviceName || 'Campus Smart Canteen'}
                />
            )}
        </div>
    );
}
