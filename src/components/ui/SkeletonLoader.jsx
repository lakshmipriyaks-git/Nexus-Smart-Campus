import React from 'react';

export default function SkeletonLoader({ variant = 'card', count = 1, className = '' }) {
    const variants = {
        card: (
            <div className="glass-card p-6 space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-pulse" />
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
                </div>
            </div>
        ),
        list: (
            <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                    </div>
                </div>
            </div>
        ),
        table: (
            <div className="space-y-2">
                <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                </div>
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="grid grid-cols-4 gap-4 p-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        ),
        text: (
            <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6 animate-pulse" />
            </div>
        )
    };

    const skeletonElement = variants[variant] || variants.card;

    return (
        <div className={className}>
            {[...Array(count)].map((_, index) => (
                <div key={index} className={index > 0 ? 'mt-4' : ''}>
                    {skeletonElement}
                </div>
            ))}
        </div>
    );
}
