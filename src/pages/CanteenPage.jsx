import React, { useState, useEffect, useCallback } from 'react';
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
    Database,
    RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import SearchBar from '../components/ui/SearchBar';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import {
    getMenu,
    placeOrder,
    getUserOrders,
    seedCampusData,
} from '../services/campusUtilitiesService';
import { useAuth } from '../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAIN_TABS = ['Menu', 'My Orders'];
const CATEGORY_TABS = ['All', 'Meals', 'Snacks', 'Beverages'];

const STATUS_CONFIG = {
    'Received': {
        label: 'Received',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        icon: ClipboardList,
    },
    'Preparing': {
        label: 'Preparing',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        icon: ChefHat,
    },
    'Ready for Pickup': {
        label: 'Ready for Pickup',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 animate-pulse',
        icon: PackageCheck,
    },
    'Delivered': {
        label: 'Delivered',
        className: 'bg-gray-100 text-gray-500 dark:bg-gray-700/40 dark:text-gray-400',
        icon: CheckCircle2,
    },
};

const CATEGORY_COLORS = {
    Meals: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    Snacks: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    Beverages: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
};

// ─── Helper ───────────────────────────────────────────────────────────────────
const formatOrderTime = (orderTime) => {
    if (!orderTime) return '—';
    const date = orderTime?.toDate ? orderTime.toDate() : new Date(orderTime);
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryTab({ label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50'
                    : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-200 dark:border-gray-700'
            }`}
        >
            {label}
        </button>
    );
}

function MenuItemCard({ item, qty, onAdd, onIncrement, onDecrement }) {
    const unavailable = !item.isAvailable;

    return (
        <div
            className={`glass-card rounded-2xl overflow-hidden flex flex-col transition-all duration-200 ${
                unavailable ? 'opacity-50 grayscale' : 'hover:-translate-y-1'
            }`}
        >
            {/* Header strip */}
            <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-base leading-tight">
                        {item.itemName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                CATEGORY_COLORS[item.category] ||
                                'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                        >
                            {item.category}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            {item.prepTimeMinutes} min
                        </span>
                    </div>
                </div>
                {/* Availability dot */}
                <span
                    className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        item.isAvailable ? 'bg-green-500' : 'bg-red-400'
                    }`}
                    title={item.isAvailable ? 'Available' : 'Unavailable'}
                />
            </div>

            {/* Price row */}
            <div className="px-4 pb-3 flex items-center justify-between">
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    ₹{item.price}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
            </div>

            {/* Cart controls */}
            <div className="px-4 pb-4 mt-auto">
                {qty === 0 ? (
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        disabled={unavailable}
                        onClick={() => onAdd(item)}
                    >
                        <Plus className="w-4 h-4" />
                        Add to Cart
                    </Button>
                ) : (
                    <div className="flex items-center justify-between gap-2">
                        <button
                            onClick={() => onDecrement(item.id)}
                            className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-indigo-900/70 transition-colors"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-gray-900 dark:text-gray-100 w-6 text-center">
                            {qty}
                        </span>
                        <button
                            onClick={() => onIncrement(item.id)}
                            className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function CartDrawer({ cart, menuItems, onIncrement, onDecrement, onClear, onPlaceOrder, placing }) {
    const cartEntries = Object.entries(cart).filter(([, qty]) => qty > 0);
    const total = cartEntries.reduce((sum, [id, qty]) => {
        const item = menuItems.find((m) => m.id === id);
        return sum + (item ? item.price * qty : 0);
    }, 0);

    if (cartEntries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
                <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-400 dark:text-gray-500">Your cart is empty</p>
                <p className="text-xs text-gray-300 dark:text-gray-600">Add items from the menu to get started</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
                {cartEntries.map(([id, qty]) => {
                    const item = menuItems.find((m) => m.id === id);
                    if (!item) return null;
                    return (
                        <div key={id} className="flex items-center gap-3 py-3 px-1">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {item.itemName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    ₹{item.price} × {qty} ={' '}
                                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                        ₹{item.price * qty}
                                    </span>
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                    onClick={() => onDecrement(id)}
                                    className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-5 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {qty}
                                </span>
                                <button
                                    onClick={() => onIncrement(id)}
                                    className="w-7 h-7 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-2 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">₹{total}</span>
                </div>
                <Button
                    className="w-full"
                    onClick={onPlaceOrder}
                    disabled={placing}
                >
                    {placing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Placing…
                        </>
                    ) : (
                        <>
                            <ShoppingCart className="w-4 h-4" />
                            Place Order
                        </>
                    )}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={onClear}
                >
                    <Trash2 className="w-4 h-4" />
                    Clear Cart
                </Button>
            </div>
        </div>
    );
}

function OrderCard({ order }) {
    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['Received'];
    const Icon = cfg.icon;

    return (
        <Card className="w-full">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                            #{order.id?.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {formatOrderTime(order.orderTime)}
                        </p>
                    </div>
                    <span
                        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${cfg.className}`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                    </span>
                </div>

                {/* Items list */}
                <ul className="space-y-1 mb-3">
                    {(order.items || []).map((it, i) => (
                        <li key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 dark:text-gray-300">
                                {it.name}{' '}
                                <span className="text-gray-400 dark:text-gray-500">×{it.qty}</span>
                            </span>
                            <span className="text-gray-600 dark:text-gray-400 font-medium">
                                ₹{it.price * it.qty}
                            </span>
                        </li>
                    ))}
                </ul>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-base">
                        ₹{order.totalAmount}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CanteenPage() {
    const { user } = useAuth();

    // Main tab
    const [activeTab, setActiveTab] = useState('Menu');

    // Menu state
    const [menuItems, setMenuItems] = useState([]);
    const [menuLoading, setMenuLoading] = useState(true);
    const [menuError, setMenuError] = useState(null);
    const [categoryTab, setCategoryTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Cart state: { [itemId]: qty }
    const [cart, setCart] = useState({});
    const [cartOpen, setCartOpen] = useState(false);
    const [placing, setPlacing] = useState(false);

    // Orders state
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState(null);

    // Seed state
    const [seeding, setSeeding] = useState(false);

    // ── Fetch Menu ────────────────────────────────────────────────────────────
    const fetchMenu = useCallback(async () => {
        setMenuLoading(true);
        setMenuError(null);
        try {
            const data = await getMenu();
            setMenuItems(data);
        } catch (err) {
            console.error(err);
            setMenuError('Failed to load menu. Please try again.');
            toast.error('Could not load menu.');
        } finally {
            setMenuLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);

    // ── Fetch Orders (when My Orders tab is active) ───────────────────────────
    const fetchOrders = useCallback(async () => {
        if (!user?.id) return;
        setOrdersLoading(true);
        setOrdersError(null);
        try {
            const data = await getUserOrders(user.id);
            // Sort newest first
            const sorted = [...data].sort((a, b) => {
                const ta = a.orderTime?.toDate ? a.orderTime.toDate() : new Date(a.orderTime || 0);
                const tb = b.orderTime?.toDate ? b.orderTime.toDate() : new Date(b.orderTime || 0);
                return tb - ta;
            });
            setOrders(sorted);
        } catch (err) {
            console.error(err);
            setOrdersError('Failed to load orders. Please try again.');
            toast.error('Could not load your orders.');
        } finally {
            setOrdersLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (activeTab === 'My Orders') {
            fetchOrders();
        }
    }, [activeTab, fetchOrders]);

    // ── Cart helpers ──────────────────────────────────────────────────────────
    const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);

    const handleAddToCart = (item) => {
        setCart((prev) => ({ ...prev, [item.id]: 1 }));
    };

    const handleIncrement = (id) => {
        setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    };

    const handleDecrement = (id) => {
        setCart((prev) => {
            const newQty = (prev[id] || 0) - 1;
            if (newQty <= 0) {
                const next = { ...prev };
                delete next[id];
                return next;
            }
            return { ...prev, [id]: newQty };
        });
    };

    const handleClearCart = () => {
        setCart({});
    };

    // ── Place Order ───────────────────────────────────────────────────────────
    const handlePlaceOrder = async () => {
        const cartEntries = Object.entries(cart).filter(([, qty]) => qty > 0);
        if (cartEntries.length === 0) return;

        const items = cartEntries.map(([id, qty]) => {
            const item = menuItems.find((m) => m.id === id);
            return {
                itemId: id,
                name: item?.itemName || '',
                qty,
                price: item?.price || 0,
            };
        });

        const totalAmount = items.reduce((s, it) => s + it.price * it.qty, 0);

        setPlacing(true);
        try {
            await placeOrder({
                userId: user?.id || '',
                userName: user?.name || 'Student',
                items,
                totalAmount,
            });
            toast.success('Order placed! Track it in My Orders 🎉');
            setCart({});
            setCartOpen(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to place order. Please try again.');
        } finally {
            setPlacing(false);
        }
    };

    // ── Seed ──────────────────────────────────────────────────────────────────
    const handleSeed = async () => {
        setSeeding(true);
        try {
            await seedCampusData();
            toast.success('Demo data seeded!');
            await fetchMenu();
        } catch {
            toast.error('Seeding failed.');
        } finally {
            setSeeding(false);
        }
    };

    // ── Filtered menu ─────────────────────────────────────────────────────────
    const filteredMenu = menuItems.filter((item) => {
        const matchesCategory = categoryTab === 'All' || item.category === categoryTab;
        const matchesSearch =
            !searchQuery ||
            item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-gray-950 dark:via-indigo-950/20 dark:to-gray-900">
            {/* Page Header */}
            <div className="sticky top-0 z-30 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
                            <UtensilsCrossed className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Campus Canteen</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pre-order your meals hassle-free</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSeed}
                            disabled={seeding}
                            className="text-xs"
                        >
                            {seeding ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Database className="w-3.5 h-3.5" />
                            )}
                            Seed Demo Data
                        </Button>

                        {/* Cart button */}
                        <button
                            onClick={() => setCartOpen((o) => !o)}
                            className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-md shadow-indigo-200 dark:shadow-indigo-900/50 hover:bg-indigo-700 transition-colors"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            <span className="hidden sm:inline">Cart</span>
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-0 border-t border-gray-100 dark:border-gray-800">
                    {MAIN_TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${
                                activeTab === tab
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                        >
                            {tab}
                            {tab === 'My Orders' && orders.length > 0 && (
                                <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">
                                    {orders.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* ── MENU TAB ─────────────────────────────────────────────────── */}
                {activeTab === 'Menu' && (
                    <div className="flex gap-6">
                        {/* Left: Menu grid */}
                        <div className="flex-1 min-w-0">
                            {/* Toolbar */}
                            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                                <SearchBar
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="Search menu items…"
                                    className="flex-1"
                                />
                                <div className="flex gap-2 flex-wrap">
                                    {CATEGORY_TABS.map((cat) => (
                                        <CategoryTab
                                            key={cat}
                                            label={cat}
                                            active={categoryTab === cat}
                                            onClick={() => setCategoryTab(cat)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Menu loading */}
                            {menuLoading && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <SkeletonLoader variant="card" count={6} />
                                </div>
                            )}

                            {/* Menu error */}
                            {!menuLoading && menuError && (
                                <div className="flex flex-col items-center gap-3 py-12">
                                    <p className="text-red-500 text-sm">{menuError}</p>
                                    <Button variant="outline" size="sm" onClick={fetchMenu}>
                                        <RefreshCw className="w-4 h-4" />
                                        Retry
                                    </Button>
                                </div>
                            )}

                            {/* Empty state — no menu items at all */}
                            {!menuLoading && !menuError && menuItems.length === 0 && (
                                <EmptyState
                                    icon={UtensilsCrossed}
                                    title="Menu is empty"
                                    description="No menu items have been added yet. Seed demo data to populate the canteen menu."
                                    action={
                                        <Button onClick={handleSeed} disabled={seeding}>
                                            {seeding ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Database className="w-4 h-4" />
                                            )}
                                            Seed Demo Data
                                        </Button>
                                    }
                                />
                            )}

                            {/* No filtered results */}
                            {!menuLoading && !menuError && menuItems.length > 0 && filteredMenu.length === 0 && (
                                <EmptyState
                                    icon={UtensilsCrossed}
                                    title="No items found"
                                    description={`No items match "${searchQuery}" in ${categoryTab === 'All' ? 'the menu' : categoryTab}.`}
                                    action={
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setCategoryTab('All');
                                            }}
                                        >
                                            Clear Filters
                                        </Button>
                                    }
                                />
                            )}

                            {/* Menu grid */}
                            {!menuLoading && !menuError && filteredMenu.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredMenu.map((item) => (
                                        <MenuItemCard
                                            key={item.id}
                                            item={item}
                                            qty={cart[item.id] || 0}
                                            onAdd={handleAddToCart}
                                            onIncrement={() => handleIncrement(item.id)}
                                            onDecrement={() => handleDecrement(item.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Floating Cart Drawer (desktop) */}
                        <div
                            className={`hidden lg:flex flex-col w-80 flex-shrink-0 transition-all duration-300 ${
                                cartOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0 pointer-events-none'
                            }`}
                        >
                            <div className="sticky top-28 glass-card rounded-2xl p-5 flex flex-col max-h-[calc(100vh-8rem)] overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <ShoppingCart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        Your Cart
                                        {cartCount > 0 && (
                                            <span className="text-xs bg-indigo-600 text-white rounded-full px-2 py-0.5">
                                                {cartCount}
                                            </span>
                                        )}
                                    </h2>
                                    <button
                                        onClick={() => setCartOpen(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <CartDrawer
                                    cart={cart}
                                    menuItems={menuItems}
                                    onIncrement={handleIncrement}
                                    onDecrement={handleDecrement}
                                    onClear={handleClearCart}
                                    onPlaceOrder={handlePlaceOrder}
                                    placing={placing}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── MY ORDERS TAB ────────────────────────────────────────────── */}
                {activeTab === 'My Orders' && (
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your Orders</h2>
                            <Button variant="ghost" size="sm" onClick={fetchOrders} disabled={ordersLoading}>
                                <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>

                        {ordersLoading && (
                            <div className="space-y-4">
                                <SkeletonLoader variant="card" count={3} />
                            </div>
                        )}

                        {!ordersLoading && ordersError && (
                            <div className="flex flex-col items-center gap-3 py-12">
                                <p className="text-red-500 text-sm">{ordersError}</p>
                                <Button variant="outline" size="sm" onClick={fetchOrders}>
                                    <RefreshCw className="w-4 h-4" />
                                    Retry
                                </Button>
                            </div>
                        )}

                        {!ordersLoading && !ordersError && orders.length === 0 && (
                            <EmptyState
                                icon={ClipboardList}
                                title="No orders yet"
                                description="You haven't placed any orders. Browse the menu and place your first order!"
                                action={
                                    <Button onClick={() => setActiveTab('Menu')}>
                                        <UtensilsCrossed className="w-4 h-4" />
                                        Browse Menu
                                    </Button>
                                }
                            />
                        )}

                        {!ordersLoading && !ordersError && orders.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {orders.map((order) => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Mobile Cart Bottom Sheet ──────────────────────────────────── */}
            <>
                {/* Overlay */}
                {cartOpen && (
                    <div
                        className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                        onClick={() => setCartOpen(false)}
                    />
                )}

                {/* Sheet */}
                <div
                    className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
                        cartOpen ? 'translate-y-0' : 'translate-y-full'
                    }`}
                >
                    <div className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl px-5 pt-5 pb-8 max-h-[80vh] flex flex-col">
                        {/* Drag handle */}
                        <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4" />
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                Your Cart
                                {cartCount > 0 && (
                                    <span className="text-xs bg-indigo-600 text-white rounded-full px-2 py-0.5">
                                        {cartCount}
                                    </span>
                                )}
                            </h2>
                            <button
                                onClick={() => setCartOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <CartDrawer
                                cart={cart}
                                menuItems={menuItems}
                                onIncrement={handleIncrement}
                                onDecrement={handleDecrement}
                                onClear={handleClearCart}
                                onPlaceOrder={handlePlaceOrder}
                                placing={placing}
                            />
                        </div>
                    </div>
                </div>
            </>
        </div>
    );
}
