import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Flame, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export default function PomodoroTimer() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState('focus'); // 'focus' or 'break'
    const [sessionsCompleted, setSessionsCompleted] = useState(0);

    useEffect(() => {
        let interval = null;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            clearInterval(interval);
            setIsRunning(false);
            if (mode === 'focus') {
                setSessionsCompleted(prev => prev + 1);
                setMode('break');
                setTimeLeft(5 * 60);
            } else {
                setMode('focus');
                setTimeLeft(25 * 60);
            }
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, mode]);

    const toggleTimer = () => {
        setIsRunning(!isRunning);
    };

    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setIsRunning(false);
        setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = mode === 'focus'
        ? ((25 * 60 - timeLeft) / (25 * 60)) * 100
        : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

    const getTimerStatus = () => {
        if (isRunning) return 'Running';
        const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;
        if (timeLeft === totalTime) return 'Ready';
        return 'Paused';
    };
    const timerStatus = getTimerStatus();

    return (
        <Card className="h-full bg-white dark:bg-[#0D1527] border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E2E6F2] dark:border-[#1E2D4A]/60 bg-[#F8F9FE] dark:bg-[#0A0F1D]/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#202442] dark:text-white font-display">
                    <Flame className="h-4 w-4 text-[#6558E8] dark:text-[#06B6D4]" />
                    <span>Focus Timer</span>
                </CardTitle>
                <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border transition-colors ${
                        timerStatus === 'Running'
                            ? 'bg-[#22A875]/10 text-[#22A875] dark:bg-emerald-500/15 dark:text-emerald-400 border-[#22A875]/30 dark:border-emerald-500/30'
                            : timerStatus === 'Paused'
                            ? 'bg-[#ECA23B]/10 text-[#C87910] dark:bg-amber-500/15 dark:text-amber-400 border-[#ECA23B]/30 dark:border-amber-500/30'
                            : 'bg-[#6558E8]/10 text-[#6558E8] dark:bg-[#06B6D4]/15 dark:text-[#22D3EE] border-[#6558E8]/30 dark:border-[#06B6D4]/30'
                    }`}>
                        {timerStatus}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-5 pb-5">
                {/* Integrated Circular Progress Gauge */}
                <div className="relative w-48 h-48 flex items-center justify-center my-2">
                    <svg className="absolute inset-0 w-full h-full -rotate-90 transform origin-center" viewBox="0 0 192 192">
                        {/* Background Track Circle */}
                        <circle
                            cx="96"
                            cy="96"
                            r="82"
                            className="stroke-[#E2E6F2] dark:stroke-[#1E2D4A]"
                            strokeWidth="10"
                            fill="none"
                        />
                        {/* Dynamic Progress Arc */}
                        <circle
                            cx="96"
                            cy="96"
                            r="82"
                            className={`transition-all duration-1000 ease-linear ${
                                mode === 'focus'
                                    ? 'stroke-[#6558E8] dark:stroke-[#06B6D4] filter drop-shadow-[0_0_8px_rgba(101,88,232,0.4)] dark:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                                    : 'stroke-[#22A875] dark:stroke-[#10B981] filter drop-shadow-[0_0_8px_rgba(34,168,117,0.4)] dark:drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                            }`}
                            strokeWidth="10"
                            fill="none"
                            strokeDasharray={2 * Math.PI * 82}
                            strokeDashoffset={2 * Math.PI * 82 * (1 - progress / 100)}
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Perfectly Centered Timer Text & Status */}
                    <div className="relative z-10 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                        <span className="text-4xl font-extrabold font-mono text-[#202442] dark:text-white tracking-tight tabular-nums">
                            {formatTime(timeLeft)}
                        </span>
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#59627E] dark:text-slate-400 mt-1">
                            {mode === 'focus' ? 'Focus Session' : 'Rest Cycle'}
                        </span>
                    </div>
                </div>

                {/* Mode Selector */}
                <div className="flex gap-1.5 p-1 bg-[#EEF1FC] dark:bg-[#0A0F1D] rounded-full border border-[#E2E6F2] dark:border-[#1E2D4A] mb-5 mt-2">
                    <button
                        onClick={() => switchMode('focus')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                            mode === 'focus'
                                ? 'bg-[#6558E8] dark:bg-[#06B6D4] text-white dark:text-[#070A11] shadow-xs'
                                : 'text-[#59627E] dark:text-slate-400 hover:text-[#202442] dark:hover:text-white'
                        }`}
                    >
                        Focus (25m)
                    </button>
                    <button
                        onClick={() => switchMode('break')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                            mode === 'break'
                                ? 'bg-[#22A875] dark:bg-[#10B981] text-white dark:text-[#070A11] shadow-xs'
                                : 'text-[#59627E] dark:text-slate-400 hover:text-[#202442] dark:hover:text-white'
                        }`}
                    >
                        Break (5m)
                    </button>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 w-full max-w-xs">
                    <button
                        onClick={toggleTimer}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
                            isRunning
                                ? 'bg-[#ECA23B] dark:bg-[#F59E0B] hover:brightness-105 text-white dark:text-[#070A11] shadow-md shadow-[#ECA23B]/25'
                                : 'bg-[#6558E8] dark:bg-[#06B6D4] hover:brightness-105 text-white dark:text-[#070A11] shadow-md shadow-[#6558E8]/25 dark:shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                        }`}
                    >
                        {isRunning ? (
                            <>
                                <Pause className="w-4 h-4 fill-current" />
                                <span>Pause Session</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 fill-current" />
                                <span>Start Focus</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={resetTimer}
                        className="p-2.5 rounded-xl bg-[#EEF1FC] dark:bg-[#0A0F1D] hover:bg-[#E2E6F2] dark:hover:bg-[#111A2E] text-[#59627E] dark:text-slate-400 hover:text-[#202442] dark:hover:text-white border border-[#E2E6F2] dark:border-[#1E2D4A] transition-colors"
                        title="Reset Timer"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
