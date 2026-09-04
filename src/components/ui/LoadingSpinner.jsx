import React from 'react';

export default function LoadingSpinner({ size = 'medium', text = '', className = '' }) {
    const sizeClasses = {
        small: 'w-4 h-4 border-2',
        medium: 'w-8 h-8 border-3',
        large: 'w-12 h-12 border-4'
    };

    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <div
                className={`${sizeClasses[size]} border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin`}
                role="status"
                aria-label="Loading"
            />
            {text && (
                <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
}
