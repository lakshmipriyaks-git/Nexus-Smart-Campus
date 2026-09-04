import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable Empty State Component
 * 
 * @param {Object} props
 * @param {LucideIcon} props.icon - The Lucide icon component to display
 * @param {string} props.title - The main heading text
 * @param {string} props.description - The subtext description
 * @param {React.ReactNode} [props.action] - Optional action button or link
 * @param {string} [props.className] - Optional additional classes
 */
const EmptyState = ({ icon: Icon, title, description, action, className = '' }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 ${className}`}
        >
            <div className="w-16 h-16 mb-4 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                {Icon && <Icon className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
            </h3>

            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                {description}
            </p>

            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </motion.div>
    );
};

export default EmptyState;
