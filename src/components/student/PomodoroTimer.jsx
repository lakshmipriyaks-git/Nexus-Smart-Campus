import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';

export default function PomodoroTimer() {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus'); // 'focus' | 'break'

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft => timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Play sound or notify
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = ((mode === 'focus' ? 25 * 60 : 5 * 60) - timeLeft) / (mode === 'focus' ? 25 * 60 : 5 * 60) * 100;

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Focus Timer
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
                <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                    {/* Circular Progress Background */}
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle
                            cx="96"
                            cy="96"
                            r="88"
                            className="stroke-gray-200 dark:stroke-gray-700"
                            strokeWidth="12"
                            fill="none"
                        />
                        <circle
                            cx="96"
                            cy="96"
                            r="88"
                            className={`transition-all duration-1000 ease-linear ${mode === 'focus' ? 'stroke-blue-600 dark:stroke-blue-500' : 'stroke-green-500 dark:stroke-green-400'}`}
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={2 * Math.PI * 88}
                            strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="text-5xl font-bold font-mono text-gray-800 dark:text-gray-100 z-10">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="flex gap-2 mb-6">
                    <Button
                        variant={mode === 'focus' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => switchMode('focus')}
                        className={mode === 'focus' ? 'btn-primary bg-blue-600 hover:bg-blue-700' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
                    >
                        Focus
                    </Button>
                    <Button
                        variant={mode === 'break' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => switchMode('break')}
                        className={mode === 'break' ? 'btn-primary bg-green-600 hover:bg-green-700' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
                    >
                        Break
                    </Button>
                </div>

                <div className="flex gap-4">
                    <Button
                        onClick={toggleTimer}
                        className={`w-32 btn-primary ${isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {isActive ? (
                            <>
                                <Pause className="mr-2 h-4 w-4" /> Pause
                            </>
                        ) : (
                            <>
                                <Play className="mr-2 h-4 w-4" /> Start
                            </>
                        )}
                    </Button>
                    <Button variant="ghost" onClick={resetTimer} title="Reset" className="btn-secondary">
                        <RotateCcw className="h-5 w-5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
