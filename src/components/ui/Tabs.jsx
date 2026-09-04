import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export function Tabs({ tabs, defaultTab, children }) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].id);
    const [direction, setDirection] = useState(0);
    const previousTabIndex = useRef(tabs.findIndex(t => t.id === activeTab));

    const handleTabChange = (tabId) => {
        const newIndex = tabs.findIndex(t => t.id === tabId);
        const oldIndex = previousTabIndex.current;

        // Determine direction: 1 for forward (right), -1 for backward (left)
        setDirection(newIndex > oldIndex ? 1 : -1);
        previousTabIndex.current = newIndex;
        setActiveTab(tabId);
    };

    // Variants for direction-aware animations
    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 20 : -20,
            opacity: 0,
            scale: 0.98
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction) => ({
            x: direction > 0 ? -20 : 20,
            opacity: 0,
            scale: 0.98
        })
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={clsx(
                            'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
                            activeTab === tab.id
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        )}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="active-tab"
                                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
                                transition={{
                                    type: 'spring',
                                    stiffness: 380,
                                    damping: 30,
                                    mass: 0.8
                                }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            {tab.icon && <tab.icon className="w-4 h-4" />}
                            {tab.label}
                        </span>
                    </button>
                ))}
            </div>

            <div className="relative">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={activeTab}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.3 },
                            scale: { duration: 0.3 }
                        }}
                    >
                        {children(activeTab)}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
