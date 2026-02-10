import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, X, Timer, Coffee, Minimize2, Settings, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStudyStore from '../../store/useStudyStore';

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60;  // 5 minutes in seconds

const PomodoroTimer = () => {
    const { pomodoroTopic, setPomodoroTopic } = useStudyStore();
    const [phase, setPhase] = useState('work'); // 'work' | 'break'
    const [workDuration, setWorkDuration] = useState(WORK_DURATION);
    const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
    const [isRunning, setIsRunning] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [sessions, setSessions] = useState(0);
    const intervalRef = useRef(null);
    const audioCtxRef = useRef(null);

    const totalDuration = phase === 'work' ? workDuration : BREAK_DURATION;

    // Timer logic
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRunning) {
            // Phase complete
            playNotification();
            if (phase === 'work') {
                setSessions(s => s + 1);
                setPhase('break');
                setTimeLeft(BREAK_DURATION);
            } else {
                setPhase('work');
                setTimeLeft(workDuration);
            }
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning, timeLeft, phase]);

    const [isVisible, setIsVisible] = useState(true);

    // Auto-start and show when topic is set
    useEffect(() => {
        if (pomodoroTopic) {
            setPhase('work');
            setTimeLeft(workDuration);
            setIsRunning(true);
            setIsMinimized(false);
            setIsVisible(true); // Show widget
        }
    }, [pomodoroTopic, workDuration]); // Update when topic or duration changes? No, only topic trigger.
    // Actually, if workDuration changes, we shouldn't auto-reset unless idle.

    const handleDurationChange = (minutes) => {
        const newSeconds = minutes * 60;
        setWorkDuration(newSeconds);
        setPhase('work');
        setTimeLeft(newSeconds);
        setIsRunning(false);
        setShowSettings(false);
    };

    const toggleSettings = () => setShowSettings(!showSettings);

    const playNotification = useCallback(() => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioCtxRef.current;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.frequency.value = phase === 'work' ? 800 : 600;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.8);
            // Second beep
            setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.frequency.value = phase === 'work' ? 1000 : 700;
                osc2.type = 'sine';
                gain2.gain.setValueAtTime(0.3, ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
                osc2.start(ctx.currentTime);
                osc2.stop(ctx.currentTime + 0.8);
            }, 300);
        } catch (e) {
            // Audio not supported
        }
    }, [phase]);

    const toggleTimer = () => setIsRunning(!isRunning);

    const resetTimer = () => {
        setIsRunning(false);
        setPhase('work');
        setTimeLeft(workDuration);
    };

    const closeTimer = () => {
        setIsRunning(false);
        setPomodoroTopic(null);
        setIsVisible(false);
    };

    // Format time
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // SVG circle calculations
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const progress = (timeLeft / totalDuration);
    const strokeDashoffset = circumference * (1 - progress);
    const strokeColor = phase === 'work' ? '#8b5cf6' : '#14b8a6';

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-8 left-8 z-50"
            >
                {isMinimized ? (
                    /* Minimized pill */
                    <motion.button
                        onClick={() => setIsMinimized(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-full bg-[var(--bg-secondary)] border border-white/10 shadow-2xl hover:border-violet-500/50 transition-all group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="relative w-8 h-8">
                            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                                <circle
                                    cx="18" cy="18" r="15" fill="none"
                                    stroke={strokeColor} strokeWidth="2" strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 15}
                                    strokeDashoffset={2 * Math.PI * 15 * (1 - progress)}
                                />
                            </svg>
                            {phase === 'work'
                                ? <Timer size={12} className="absolute inset-0 m-auto text-violet-400" />
                                : <Coffee size={12} className="absolute inset-0 m-auto text-teal-400" />
                            }
                        </div>
                        <span className="text-sm font-mono font-bold text-primary">{timeStr}</span>
                    </motion.button>
                ) : (
                    /* Full Timer Widget */
                    <div className="w-72 rounded-2xl bg-[var(--bg-secondary)] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                {phase === 'work'
                                    ? <Timer size={14} className="text-violet-400" />
                                    : <Coffee size={14} className="text-teal-400" />
                                }
                                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                                    {phase === 'work' ? 'Focus Time' : 'Break Time'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setIsMinimized(true)} className="p-1.5 rounded-lg hover:bg-white/5 text-secondary hover:text-primary transition-colors">
                                    <Minimize2 size={14} />
                                </button>
                                <button onClick={toggleSettings} className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-violet-500/20 text-violet-300' : 'hover:bg-white/5 text-secondary hover:text-primary'}`}>
                                    <Settings size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Timer Circle */}
                        <div className="flex flex-col items-center py-6 px-4">
                            <div className="relative w-36 h-36 mb-4">
                                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                                    <circle
                                        cx="60" cy="60" r={radius} fill="none"
                                        stroke={strokeColor}
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span
                                        onClick={toggleSettings}
                                        className="text-3xl font-mono font-black text-primary tracking-wider cursor-pointer hover:text-violet-400 transition-colors"
                                        title="Click to change duration"
                                    >
                                        {timeStr}
                                    </span>
                                    <span className="text-[10px] text-secondary uppercase tracking-widest mt-1">
                                        {phase === 'work' ? `Session ${sessions + 1}` : 'Relax'}
                                    </span>
                                </div>
                            </div>

                            {/* Topic */}
                            <p className="text-xs text-secondary text-center mb-5 px-4 line-clamp-1 max-w-full">
                                📖 {pomodoroTopic || 'General Study'}
                            </p>

                            {/* Controls */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={resetTimer}
                                    className="p-2.5 rounded-xl bg-white/5 text-secondary hover:text-primary hover:bg-white/10 transition-all border border-white/5"
                                >
                                    <RotateCcw size={16} />
                                </button>
                                <button
                                    onClick={toggleTimer}
                                    className={`p-4 rounded-xl font-semibold transition-all border shadow-lg ${isRunning
                                        ? 'bg-white/10 text-primary border-white/10 hover:bg-white/15'
                                        : phase === 'work'
                                            ? 'bg-violet-600 text-white border-violet-500/50 hover:bg-violet-500 shadow-violet-500/20'
                                            : 'bg-teal-600 text-white border-teal-500/50 hover:bg-teal-500 shadow-teal-500/20'
                                        }`}
                                >
                                    {isRunning ? <Pause size={20} /> : <Play size={20} />}
                                </button>
                                <button
                                    onClick={toggleSettings}
                                    className="p-2.5 rounded-xl bg-white/5 text-secondary hover:text-primary hover:bg-white/10 transition-all border border-white/5"
                                >
                                    <Settings size={16} />
                                </button>
                            </div>
                            {/* Settings Overlay */}
                            {showSettings && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4">
                                    <p className="text-secondary text-xs uppercase font-bold mb-3 tracking-wider">Set Duration</p>
                                    <div className="grid grid-cols-2 gap-2 w-full">
                                        {[15, 25, 45, 60].map(m => (
                                            <button
                                                key={m}
                                                onClick={() => handleDurationChange(m)}
                                                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${workDuration === m * 60
                                                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25'
                                                    : 'bg-white/5 border-white/10 text-secondary hover:bg-white/10 hover:text-primary'
                                                    }`}
                                            >
                                                {m} min
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setShowSettings(false)}
                                        className="mt-4 text-xs text-secondary hover:text-primary underline"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default PomodoroTimer;
