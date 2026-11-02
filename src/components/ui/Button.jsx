import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Button({
    className,
    variant = 'primary',
    size = 'md',
    disabled = false,
    children,
    ...props
}) {
    const variants = {
        primary:
            'bg-[#06B6D4] hover:bg-[#22D3EE] active:bg-[#0891B2] text-[#070A11] font-bold border border-[#06B6D4] shadow-sm hover:shadow-[0_0_16px_rgba(6,182,212,0.35)]',
        secondary:
            'bg-[#EEF1FC] text-[#202442] border border-[#E2E6F2] hover:bg-[#E2E6F2] hover:border-[#CCD3E5] active:bg-[#CCD3E5] shadow-sm dark:bg-[#111A2E] dark:text-[#F8FAFC] dark:border-[#1E2D4A] dark:hover:bg-[#162238] dark:hover:border-[#3D5584] dark:active:bg-[#0D1527]',
        terracotta:
            'bg-[#F59E0B] hover:bg-[#FBBF24] active:bg-[#D97706] text-[#070A11] font-bold border border-[#F59E0B] shadow-sm hover:shadow-[0_0_16px_rgba(245,158,11,0.35)]',
        amber:
            'bg-[#F59E0B] hover:bg-[#FBBF24] active:bg-[#D97706] text-[#070A11] font-bold border border-[#F59E0B] shadow-sm hover:shadow-[0_0_16px_rgba(245,158,11,0.35)]',
        subtle:
            'bg-[#EEF1FC] text-[#59627E] hover:text-[#202442] hover:bg-[#E2E6F2] border border-transparent dark:bg-[#111A2E] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] dark:hover:bg-[#162238]',
        outline:
            'border border-[#CCD3E5] text-[#202442] hover:bg-[#EEF1FC] hover:border-[#94A3B8] active:bg-[#E2E6F2] dark:border-[#1E2D4A] dark:text-[#E2E8F0] dark:hover:bg-[#111A2E] dark:hover:border-[#06B6D4]/50 dark:active:bg-[#0D1527]',
        ghost:
            'bg-transparent text-[#59627E] hover:bg-[#EEF1FC] hover:text-[#202442] dark:text-[#94A3B8] dark:hover:bg-[#111A2E] dark:hover:text-[#F8FAFC]',
        danger:
            'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white border border-rose-600 shadow-sm',
    };

    const sizes = {
        xs: 'px-2.5 py-1 text-xs rounded-md gap-1.5',
        sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
        md: 'px-4 py-2 text-sm font-semibold rounded-lg gap-2',
        lg: 'px-5 py-2.5 text-base font-bold rounded-lg gap-2.5',
    };

    return (
        <button
            disabled={disabled}
            className={twMerge(
                'inline-flex items-center justify-center transition-all duration-150 outline-none select-none active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 font-display',
                variants[variant] || variants.primary,
                sizes[size] || sizes.md,
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
