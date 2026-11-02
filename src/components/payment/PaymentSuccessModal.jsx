import React, { useState } from 'react';
import {
    CheckCircle2,
    Copy,
    Check,
    Printer,
    Download,
    X,
    QrCode,
    Sparkles,
    ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentSuccessModal({
    isOpen,
    onClose,
    paymentRecord,
    orderToken,
    title = 'Payment Received',
    serviceName = 'Campus Service'
}) {
    if (!isOpen || !paymentRecord) return null;

    const [copied, setCopied] = useState(false);

    const handleCopyId = () => {
        if (paymentRecord.paymentId) {
            navigator.clipboard.writeText(paymentRecord.paymentId);
            setCopied(true);
            toast.success('Payment ID copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden p-6 text-center space-y-4">
                {/* Success Animation Ring */}
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-500 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-9 h-9 animate-bounce" />
                </div>

                <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-block mb-1">
                        Verified via Razorpay
                    </span>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">
                        {title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Your transaction has been processed and confirmed.
                    </p>
                </div>

                {/* Receipt Card */}
                <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 text-left text-xs space-y-2.5 font-medium">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-white/10">
                        <span className="text-gray-400">Total Paid:</span>
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                            ₹{Number(paymentRecord.amount || 0).toFixed(2)}
                        </span>
                    </div>

                    {(orderToken || paymentRecord.token) && (
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Claim Token:</span>
                            <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-sm bg-purple-500/10 px-2 py-0.5 rounded-md">
                                #{orderToken || paymentRecord.token}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">Payment ID:</span>
                        <button
                            onClick={handleCopyId}
                            className="font-mono font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 hover:text-purple-600 transition-colors"
                            title="Click to copy ID"
                        >
                            <span>{paymentRecord.paymentId ? paymentRecord.paymentId.slice(0, 14) + '...' : 'pay_confirmed'}</span>
                            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">Service:</span>
                        <span className="text-gray-800 dark:text-gray-200 font-bold">{serviceName}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">Gateway:</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                            {paymentRecord.method || 'Razorpay Gateway'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
                        <span>Time:</span>
                        <span>{new Date(paymentRecord.timestamp || Date.now()).toLocaleTimeString()}</span>
                    </div>
                </div>

                {/* Modal Actions */}
                <div className="space-y-2 pt-1">
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg transition-transform active:scale-[0.98]"
                    >
                        Done & Continue
                    </button>

                    <button
                        onClick={handlePrint}
                        className="w-full py-2 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Receipt</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
