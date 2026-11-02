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

        setDirection(newIndex > oldIndex ? 1 : -1);
        previousTabIndex.current = newIndex;
        setActiveTab(tabId);
    };

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 15 : -15,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction) => ({
            x: direction > 0 ? -15 : 15,
            opacity: 0,
        })
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex space-x-1.5 bg-[#EEF1FC] dark:bg-[#0A0F1D] p-1.5 rounded-xl border border-[#E2E6F2] dark:border-[#1E2D4A] overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={clsx(
                                'relative px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap font-display',
                                isActive
                                    ? 'text-white dark:text-[#070A11]'
                                    : 'text-[#59627E] hover:text-[#202442] hover:bg-[#6558E8]/10 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] dark:hover:bg-[#111A2E]'
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-tab"
                                    className="absolute inset-0 bg-[#6558E8] dark:bg-[#06B6D4] rounded-lg shadow-sm shadow-[#6558E8]/30 dark:shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                                    transition={{
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 32,
                                    }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                {tab.icon && <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />}
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
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
                            x: { type: 'spring', stiffness: 320, damping: 30 },
                            opacity: { duration: 0.15 }
                        }}
                    >
                        {typeof children === 'function' ? children(activeTab) : children}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

export function TabPanel({ id, activeTab, children }) {
    if (id !== activeTab) return null;
    return <div>{children}</div>;
}
