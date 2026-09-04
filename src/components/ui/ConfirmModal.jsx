import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger' // 'danger', 'warning', 'info', 'success'
}) {
    if (!isOpen) return null;

    const variants = {
        danger: {
            icon: AlertTriangle,
            iconColor: 'text-red-600 dark:text-red-400',
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
        },
        warning: {
            icon: AlertTriangle,
            iconColor: 'text-yellow-600 dark:text-yellow-400',
            iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
            confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        },
        info: {
            icon: Info,
            iconColor: 'text-blue-600 dark:text-blue-400',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white'
        },
        success: {
            icon: CheckCircle,
            iconColor: 'text-green-600 dark:text-green-400',
            iconBg: 'bg-green-100 dark:bg-green-900/30',
            confirmButton: 'bg-green-600 hover:bg-green-700 text-white'
        }
    };

    const config = variants[variant] || variants.danger;
    const Icon = config.icon;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${config.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${config.confirmButton}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
