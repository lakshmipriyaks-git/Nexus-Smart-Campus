import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Check, Sparkles } from 'lucide-react';

export default function Settings() {
    const { user } = useAuth();
    const { darkMode, setDarkMode } = useTheme();
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(true);

    return (
        <div className="p-6 max-w-2xl mx-auto animate-scaleIn text-slate-100">
            <h1 className="text-2xl font-black text-white mb-8 tracking-tight">System Preferences</h1>

            <div className="space-y-6">
                {/* Profile Section */}
                <div className="glass-card p-6 rounded-2xl bg-[#0D1527] border border-[#1E2D4A]">
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                        <span>Profile Credentials</span>
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={user?.name || ''}
                                disabled
                                className="w-full px-4 py-2.5 bg-[#0A0F1D] border border-[#1E2D4A] rounded-xl text-slate-200 text-xs sm:text-sm cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Campus Email Address</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-4 py-2.5 bg-[#0A0F1D] border border-[#1E2D4A] rounded-xl text-slate-200 text-xs sm:text-sm cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Institutional Role</label>
                            <input
                                type="text"
                                value={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
                                disabled
                                className="w-full px-4 py-2.5 bg-[#0A0F1D] border border-[#1E2D4A] rounded-xl text-slate-200 text-xs sm:text-sm cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="glass-card p-6 rounded-2xl bg-[#0D1527] border border-[#1E2D4A]">
                    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                        <span>Notification Dispatch</span>
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-white text-sm">Email Broadcasts</p>
                                <p className="text-xs text-slate-400">Receive timetable & exam notifications via institutional email</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={emailNotifs}
                                    onChange={(e) => setEmailNotifs(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-[#1E2D4A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06B6D4]"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-white text-sm">Push Alerts</p>
                                <p className="text-xs text-slate-400">Live pop-up alerts on real-time transit & canteen orders</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={pushNotifs}
                                    onChange={(e) => setPushNotifs(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-[#1E2D4A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#06B6D4]"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Appearance / Theme Choice Section */}
                <div className="glass-card p-6 rounded-2xl bg-[#0D1527] border border-[#1E2D4A]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#6558E8] dark:text-[#06B6D4]" />
                            <span>Display Theme</span>
                        </h2>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#6558E8]/10 text-[#6558E8] dark:bg-[#06B6D4]/15 dark:text-[#22D3EE] font-bold border border-[#6558E8]/30 dark:border-[#06B6D4]/30">
                            {darkMode ? 'MIDNIGHT DARK' : 'VIBRANT LIGHT'}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-5">
                        Select your preferred operating palette. Switch instantly without page reload.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Option 1: Vibrant Light Mode */}
                        <button
                            type="button"
                            onClick={() => setDarkMode(false)}
                            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group ${
                                !darkMode
                                    ? 'bg-[#FFFFFF] border-[#6558E8] shadow-[0_4px_20px_rgba(101,88,232,0.18)] ring-2 ring-[#6558E8]/20'
                                    : 'bg-[#0A0F1D] border-[#1E2D4A] hover:border-slate-500 opacity-80 hover:opacity-100'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-8 h-8 rounded-lg bg-violet-100 text-[#6558E8] flex items-center justify-center font-bold">
                                    <Sun className="w-4 h-4" />
                                </div>
                                {!darkMode && (
                                    <div className="w-5 h-5 rounded-full bg-[#6558E8] text-white flex items-center justify-center shadow-sm">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-[#202442] dark:text-white">
                                    Vibrant Modern Campus
                                </p>
                                <p className="text-[11px] text-[#59627E] dark:text-slate-400 mt-0.5">
                                    Energetic, welcoming light canvas with violet & cyan highlights
                                </p>
                            </div>
                        </button>

                        {/* Option 2: Midnight Dark Mode */}
                        <button
                            type="button"
                            onClick={() => setDarkMode(true)}
                            className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group ${
                                darkMode
                                    ? 'bg-[#070A11] border-[#06B6D4] shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-2 ring-[#06B6D4]/30'
                                    : 'bg-[#F5F6FF] border-[#E2E6F2] hover:border-slate-400 opacity-80 hover:opacity-100'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/15 text-[#22D3EE] border border-[#06B6D4]/30 flex items-center justify-center font-bold">
                                    <Moon className="w-4 h-4" />
                                </div>
                                {darkMode && (
                                    <div className="w-5 h-5 rounded-full bg-[#06B6D4] text-[#070A11] flex items-center justify-center shadow-sm">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-white dark:text-white">
                                    Midnight Command Centre
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Deep blue-black command palette with electric cyan accents
                                </p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
