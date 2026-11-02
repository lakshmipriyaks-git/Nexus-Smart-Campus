import React, { useState } from 'react';
import {
    X,
    ShieldCheck,
    QrCode,
    CreditCard,
    Smartphone,
    Building2,
    CheckCircle2,
    Lock,
    Loader2,
    ArrowRight,
    Sparkles,
    AlertCircle,
    Copy,
    Check,
    Maximize2,
    ExternalLink
} from 'lucide-react';
import { generatePaymentId, recordPayment, RAZORPAY_KEY, cleanupRazorpayOverlays } from '../../services/razorpayService';
import paymentScannerImg from '../../assets/payment-qr-scanner.png';

export default function RazorpayCheckoutModal({
    isOpen,
    onClose,
    amount,
    currency = 'INR',
    title = 'Nexus Smart Campus',
    description = 'Campus Service Payment',
    module = 'campus',
    token = '',
    customer = {},
    onPaymentSuccess
}) {
    if (!isOpen) return null;

    React.useEffect(() => {
        cleanupRazorpayOverlays();
        return () => {
            cleanupRazorpayOverlays();
        };
    }, []);

    const MERCHANT_UPI_ID = '7349725121@slc';
    const MERCHANT_NAME = 'V Pradin Jose';

    const UPI_APPS = [
        {
            id: 'slice',
            name: 'slice',
            color: 'from-purple-600 to-indigo-600',
            icon: 'S',
            schemePrefix: 'slice://upi/pay',
            intentPackage: 'com.slice.app'
        },
        {
            id: 'gpay',
            name: 'Google Pay',
            color: 'from-blue-500 to-emerald-500',
            icon: 'G',
            schemePrefix: 'tez://upi/pay',
            intentPackage: 'com.google.android.apps.nbu.paisa.user'
        },
        {
            id: 'phonepe',
            name: 'PhonePe',
            color: 'from-indigo-600 to-purple-700',
            icon: 'P',
            schemePrefix: 'phonepe://pay',
            intentPackage: 'com.phonepe.app'
        },
        {
            id: 'paytm',
            name: 'Paytm',
            color: 'from-sky-500 to-blue-600',
            icon: 'P',
            schemePrefix: 'paytmmp://pay',
            intentPackage: 'net.one97.paytm'
        }
    ];

    const [activeMethod, setActiveMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking'
    const [upiId, setUpiId] = useState('');
    const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
    const [selectedBank, setSelectedBank] = useState('HDFC');
    const [processing, setProcessing] = useState(false);
    const [copiedUpi, setCopiedUpi] = useState(false);
    const [qrZoomed, setQrZoomed] = useState(false);
    const [selectedUpiApp, setSelectedUpiApp] = useState(null);

    const numericAmount = parseFloat(amount) || 0;

    const getAppUrls = (app) => {
        const payeeVpa = MERCHANT_UPI_ID;
        const payeeName = encodeURIComponent(MERCHANT_NAME);
        const amt = numericAmount.toFixed(2);
        const note = encodeURIComponent(`Campus Pay ${token ? '#' + token : ''}`.trim());

        const baseParams = `pa=${payeeVpa}&pn=${payeeName}&am=${amt}&cu=INR&tn=${note}`;
        const standardUpiUrl = `upi://pay?${baseParams}`;
        const appSpecificUrl = `${app.schemePrefix}?${baseParams}`;
        const androidIntentUrl = `intent://pay?${baseParams}#Intent;scheme=upi;package=${app.intentPackage};end`;

        return { standardUpiUrl, appSpecificUrl, androidIntentUrl };
    };

    const handleLaunchUpiApp = (app, e) => {
        const { standardUpiUrl, appSpecificUrl, androidIntentUrl } = getAppUrls(app);
        const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
        const targetUrl = isAndroid ? androidIntentUrl : appSpecificUrl;

        setSelectedUpiApp({
            ...app,
            targetUrl,
            appSpecificUrl,
            androidIntentUrl,
            standardUpiUrl
        });

        // Trigger deep link redirect to open that particular app
        try {
            const link = document.createElement('a');
            link.href = targetUrl;
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            window.location.href = targetUrl;
        }
    };

    const handleCopyUpiId = () => {
        navigator.clipboard.writeText(MERCHANT_UPI_ID);
        setCopiedUpi(true);
        setTimeout(() => setCopiedUpi(false), 2000);
    };

    const handleModalClose = () => {
        cleanupRazorpayOverlays();
        onClose();
    };

    const handleCompletePayment = async (methodName = 'UPI') => {
        setProcessing(true);
        try {
            // Simulate 800ms gateway latency
            await new Promise(res => setTimeout(res, 800));

            const paymentId = generatePaymentId();
            const paymentRecord = await recordPayment({
                paymentId,
                amount: numericAmount,
                currency,
                module,
                token,
                customerUniqueId: customer.uniqueId || customer.usn || '',
                customerName: customer.name || 'Campus Member',
                customerEmail: customer.email || 'member@nexus.edu',
                method: `Razorpay (${methodName})`,
                status: 'Success',
                timestamp: new Date().toISOString()
            });

            if (onPaymentSuccess) {
                onPaymentSuccess(paymentRecord);
            }
            cleanupRazorpayOverlays();
            onClose();
        } catch (e) {
            console.error('Payment processing failed:', e);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#0D1527] border border-[#1E2D4A] rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Razorpay Brand Header */}
                <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-900 text-white p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-white text-blue-900 font-black flex items-center justify-center text-sm shadow-md">
                                R
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-sm tracking-wide">Razorpay</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 font-mono">
                                        Test Mode
                                    </span>
                                </div>
                                <p className="text-[11px] text-blue-200/80 font-medium">{title}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleModalClose}
                            disabled={processing}
                            className="p-1 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Amount Highlight */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-baseline justify-between relative z-10">
                        <div>
                            <span className="text-[11px] text-blue-200/70 block uppercase tracking-wider font-semibold">Total Amount Due</span>
                            <span className="text-2xl font-black tracking-tight">₹{numericAmount.toFixed(2)}</span>
                        </div>
                        {token && (
                            <div className="text-right">
                                <span className="text-[10px] text-blue-200/70 block uppercase">Reference Token</span>
                                <span className="font-mono font-bold text-xs bg-white/10 px-2 py-0.5 rounded-md">
                                    #{token}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
                    {/* Simulated Exhibition Test Banner */}
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center gap-2 text-[11px]">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span><strong>DEMO PAYMENT GATEWAY:</strong> Simulated checkout for campus exhibition. Real accounts are not charged.</span>
                    </div>

                    {/* Method Selector Tabs */}
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
                        <button
                            type="button"
                            onClick={() => setActiveMethod('upi')}
                            className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                                activeMethod === 'upi'
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>UPI / QR</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveMethod('card')}
                            className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                                activeMethod === 'card'
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Card</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveMethod('netbanking')}
                            className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                                activeMethod === 'netbanking'
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>NetBanking</span>
                        </button>
                    </div>

                    {/* Method 1: UPI & QR */}
                    {activeMethod === 'upi' && (
                        <div className="space-y-3.5 animate-in fade-in duration-150">
                            {/* Fast 1-Click Apps */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        Instant UPI Apps (Click to Open)
                                    </label>
                                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                                        Auto-redirects
                                    </span>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {UPI_APPS.map(app => {
                                        const urls = getAppUrls(app);
                                        const isSelected = selectedUpiApp?.id === app.id;
                                        return (
                                            <a
                                                key={app.id}
                                                href={urls.appSpecificUrl}
                                                onClick={(e) => {
                                                    handleLaunchUpiApp(app, e);
                                                }}
                                                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 group shadow-xs cursor-pointer ${
                                                    isSelected
                                                        ? 'border-purple-500 bg-purple-500/10 dark:bg-purple-950/40 ring-2 ring-purple-500/40 shadow-sm scale-[1.02]'
                                                        : 'border-gray-200 dark:border-white/10 hover:border-purple-500 dark:hover:border-purple-500 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-purple-50/40 dark:hover:bg-purple-950/20'
                                                }`}
                                            >
                                                <div className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${app.color} text-white flex items-center justify-center text-[10px] font-black shadow-sm group-hover:scale-110 transition-transform`}>
                                                    {app.icon}
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 truncate w-full">{app.name}</span>
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Active App Launching Status & 1-Click Complete */}
                            {selectedUpiApp && (
                                <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-blue-900/40 border border-purple-500/40 text-left space-y-2 animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                            <span className="font-extrabold text-[11px] text-white">
                                                Redirecting to {selectedUpiApp.name}...
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedUpiApp(null)}
                                            className="text-gray-300 hover:text-white text-[10px] underline"
                                        >
                                            Change app
                                        </button>
                                    </div>

                                    <p className="text-[10px] text-purple-200">
                                        Authorizing ₹{numericAmount.toFixed(2)} to <strong>{MERCHANT_NAME}</strong> ({MERCHANT_UPI_ID}) in your {selectedUpiApp.name} app.
                                    </p>

                                    <div className="flex gap-1.5">
                                        <a
                                            href={selectedUpiApp.targetUrl}
                                            className="flex-1 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-center text-[10px] flex items-center justify-center gap-1 border border-white/20 transition-colors"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            <span>Re-launch {selectedUpiApp.name}</span>
                                        </a>
                                        <a
                                            href={selectedUpiApp.standardUpiUrl}
                                            className="py-1.5 px-2.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-center text-[10px] flex items-center justify-center border border-white/20 transition-colors"
                                            title="Open system UPI app picker"
                                        >
                                            <span>Any UPI App</span>
                                        </a>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={() => handleCompletePayment(`UPI - ${selectedUpiApp.name}`)}
                                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                <span>Verifying {selectedUpiApp.name} Payment...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                <span>✓ I've Completed Payment in {selectedUpiApp.name}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Slice UPI QR Scanner Card */}
                            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-purple-50/60 via-indigo-50/30 to-blue-50/20 dark:from-purple-950/20 dark:via-indigo-950/20 dark:to-blue-950/10 border border-purple-200/80 dark:border-purple-900/40 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="font-extrabold text-[11px] text-gray-900 dark:text-white uppercase tracking-wider">
                                            Scan QR to Pay
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                        UPI Verified
                                    </span>
                                </div>

                                {/* QR Scanner Image Container */}
                                <div className="relative mx-auto max-w-[200px] bg-white p-2 rounded-2xl shadow-md border border-purple-100 dark:border-purple-900/40 group overflow-hidden">
                                    <img
                                        src={paymentScannerImg}
                                        alt="UPI QR Scanner - V Pradin Jose"
                                        className="w-full h-auto object-contain rounded-xl transition-transform group-hover:scale-[1.02]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setQrZoomed(true)}
                                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-[10px] backdrop-blur-sm transition-opacity opacity-80 group-hover:opacity-100 flex items-center gap-1 shadow"
                                        title="Click to expand QR"
                                    >
                                        <Maximize2 className="w-3 h-3" />
                                    </button>
                                </div>

                                {/* Verified Merchant Details */}
                                <div className="p-2.5 rounded-xl bg-white/90 dark:bg-gray-800/90 border border-purple-100 dark:border-white/10 space-y-1.5 text-left shadow-xs">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-gray-500">Account Holder:</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{MERCHANT_NAME}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-gray-100 dark:border-white/5">
                                        <span className="text-gray-500">UPI ID:</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{MERCHANT_UPI_ID}</span>
                                            <button
                                                type="button"
                                                onClick={handleCopyUpiId}
                                                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-purple-600 transition-colors"
                                                title="Copy UPI ID"
                                            >
                                                {copiedUpi ? (
                                                    <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold">
                                                        <Check className="w-3 h-3" /> Copied
                                                    </span>
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Confirm Payment Button */}
                                <button
                                    type="button"
                                    disabled={processing}
                                    onClick={() => handleCompletePayment('Slice UPI QR')}
                                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Verifying Payment...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            <span>I Have Paid ₹{numericAmount.toFixed(2)} (Confirm Payment)</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Manual UPI ID */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                        Or enter UPI ID / VPA
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setUpiId(MERCHANT_UPI_ID)}
                                        className="text-[10px] text-purple-600 dark:text-purple-400 font-bold hover:underline"
                                    >
                                        Use merchant UPI
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        placeholder={MERCHANT_UPI_ID}
                                        className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                                    />
                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={() => handleCompletePayment(`UPI - ${upiId || MERCHANT_UPI_ID}`)}
                                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                                    >
                                        Verify & Pay
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Method 2: Credit / Debit Card */}
                    {activeMethod === 'card' && (
                        <div className="space-y-3 animate-in fade-in duration-150">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Card Number
                                </label>
                                <input
                                    type="text"
                                    maxLength="19"
                                    value={cardDetails.number}
                                    onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                                    placeholder="4532 •••• •••• 8892"
                                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        Valid Thru (MM/YY)
                                    </label>
                                    <input
                                        type="text"
                                        maxLength="5"
                                        value={cardDetails.expiry}
                                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                        placeholder="08/28"
                                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        CVV / CVC
                                    </label>
                                    <input
                                        type="password"
                                        maxLength="4"
                                        value={cardDetails.cvv}
                                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                                        placeholder="•••"
                                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Cardholder Name
                                </label>
                                <input
                                    type="text"
                                    value={cardDetails.name}
                                    onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                                    placeholder="Name as printed on card"
                                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => handleCompletePayment('Card')}
                                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
                            >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Pay Securely ₹{numericAmount.toFixed(2)}</span>
                            </button>
                        </div>
                    )}

                    {/* Method 3: NetBanking */}
                    {activeMethod === 'netbanking' && (
                        <div className="space-y-3 animate-in fade-in duration-150">
                            <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                Select Your Bank
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Punjab National Bank'].map(bank => (
                                    <button
                                        key={bank}
                                        type="button"
                                        onClick={() => setSelectedBank(bank)}
                                        className={`p-2.5 rounded-xl border text-left font-bold text-xs transition-all ${
                                            selectedBank === bank
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-sm'
                                                : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        {bank}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => handleCompletePayment(`NetBanking - ${selectedBank}`)}
                                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md mt-2"
                            >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Proceed with {selectedBank} (₹{numericAmount.toFixed(2)})</span>
                            </button>
                        </div>
                    )}

                    {/* Developer 1-Click Test Payment */}
                    <div className="pt-2">
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => handleCompletePayment('Razorpay Test Mode')}
                            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Authorizing with Razorpay Gateway...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    <span>Simulate 1-Click Razorpay Success (₹{numericAmount.toFixed(2)})</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer Security Badges */}
                <div className="p-3 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                    <div className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>256-bit SSL Encrypted</span>
                    </div>
                    <span className="font-mono text-gray-400">Key: {RAZORPAY_KEY.slice(0, 8)}•••</span>
                </div>
            </div>

            {/* QR Code Lightbox Modal */}
            {qrZoomed && (
                <div
                    onClick={() => setQrZoomed(false)}
                    className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-pointer"
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl max-w-xs w-full p-4 shadow-2xl space-y-3 text-center"
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-white/10">
                            <span className="font-extrabold text-xs text-gray-900 dark:text-white">Scan with UPI App</span>
                            <button
                                onClick={() => setQrZoomed(false)}
                                className="p-1 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-2 bg-white rounded-2xl shadow-inner border border-gray-100">
                            <img
                                src={paymentScannerImg}
                                alt="UPI Scanner Full"
                                className="w-full h-auto rounded-xl"
                            />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
                                {MERCHANT_UPI_ID}
                            </p>
                            <p className="text-[10px] text-gray-500">
                                Account: {MERCHANT_NAME}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
