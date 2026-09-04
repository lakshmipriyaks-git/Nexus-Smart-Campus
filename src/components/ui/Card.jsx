import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

export function Card({ className, children, ...props }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={twMerge(
                'glass-card rounded-2xl overflow-hidden',
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function CardHeader({ className, children, ...props }) {
    return (
        <div className={twMerge('px-6 py-4 border-b border-gray-100/50 dark:border-gray-700', className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }) {
    return (
        <h3 className={twMerge('text-lg font-semibold text-gray-900 dark:text-gray-100', className)} {...props}>
            {children}
        </h3>
    );
}

export function CardContent({ className, children, ...props }) {
    return (
        <div className={twMerge('p-6', className)} {...props}>
            {children}
        </div>
    );
}
