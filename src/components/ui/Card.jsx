import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Card({ className, interactive = false, children, ...props }) {
    return (
        <div
            className={twMerge(
                'surface-card overflow-hidden transition-all duration-200 bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] text-[#202442] dark:text-[#F8FAFC]',
                interactive && 'card-interactive hover:border-[#6558E8]/70 dark:hover:border-[#06B6D4]/70 hover:shadow-card-hover',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }) {
    return (
        <div
            className={twMerge(
                'px-5 py-4 border-b border-[#E2E6F2] dark:border-[#1E2D4A] flex items-center justify-between gap-4 bg-[#F8F9FE] dark:bg-[#0A0F1D]/50',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }) {
    return (
        <h3
            className={twMerge(
                'font-display text-sm md:text-base font-bold text-[#202442] dark:text-[#F8FAFC] tracking-tight',
                className
            )}
            {...props}
        >
            {children}
        </h3>
    );
}

export function CardDescription({ className, children, ...props }) {
    return (
        <p
            className={twMerge(
                'text-xs text-[#59627E] dark:text-[#94A3B8]',
                className
            )}
            {...props}
        >
            {children}
        </p>
    );
}

export function CardContent({ className, children, ...props }) {
    return (
        <div className={twMerge('p-5', className)} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({ className, children, ...props }) {
    return (
        <div
            className={twMerge(
                'px-5 py-3 border-t border-[#E2E6F2] bg-[#F8F9FE] flex items-center justify-between text-xs text-[#59627E] dark:border-[#1E2D4A] dark:bg-[#0A0F1D]/80 dark:text-[#94A3B8]',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
