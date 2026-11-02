import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable Empty State Component — NEXUS SMART CAMPUS Standard
 */
const EmptyState = ({ icon: Icon, title, description, action, className = '' }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-2xl border border-dashed border-[#E2E6F2] dark:border-[#1E2D4A] bg-white dark:bg-[#0D1527] shadow-sm dark:shadow-lg transition-colors ${className}`}
        >
            <div className="w-16 h-16 mb-4 rounded-2xl bg-[#6558E8]/10 dark:bg-[#06B6D4]/10 border border-[#6558E8]/20 dark:border-[#06B6D4]/20 flex items-center justify-center text-[#6558E8] dark:text-[#06B6D4] shadow-sm dark:shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                {Icon && <Icon className="w-8 h-8" />}
            </div>

            <h3 className="text-lg font-bold text-[#202442] dark:text-white mb-2 font-display">
                {title}
            </h3>

            <p className="text-[#59627E] dark:text-slate-400 text-xs sm:text-sm max-w-sm mb-6 leading-relaxed">
                {description}
            </p>

            {action && (
                <div className="mt-1">
                    {action}
                </div>
            )}
        </motion.div>
    );
};

export default EmptyState;
