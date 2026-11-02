import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Badge({ className, variant = 'default', children, ...props }) {
    const variants = {
        default: 'bg-[#EEF1FC] text-[#59627E] border border-[#CCD3E5] dark:bg-[#111A2E] dark:text-[#94A3B8] dark:border-[#1E2D4A]',
        primary: 'bg-[#06B6D4]/15 text-[#22D3EE] border border-[#06B6D4]/30',
        cyan: 'bg-[#06B6D4]/15 text-[#22D3EE] border border-[#06B6D4]/30',
        terracotta: 'bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/30',
        amber: 'bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/30',
        success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        danger: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    };

    return (
        <span
            className={twMerge(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold font-mono tracking-wide',
                variants[variant] || variants.default,
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
