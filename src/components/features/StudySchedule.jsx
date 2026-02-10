import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, ArrowRight, CheckCircle2, AlertCircle, Sparkles, RotateCcw, Zap, Target, BookOpen, Play, Minus, Plus } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import useStudyStore from '../../store/useStudyStore';
import { generateSchedule } from '../../services/aiService';
import Button from '../ui/Button';
import 'react-day-picker/dist/style.css';

const StudySchedule = () => {
    const { summary, studySchedule, setSchedule, setPomodoroTopic } = useStudyStore();

    // State
    const [deadline, setDeadline] = useState(null);
    const [hoursPerDay, setHoursPerDay] = useState(2);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedDay, setExpandedDay] = useState(null);

    // Calendar Portal State
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 });

    const containerRef = useRef(null);
    const triggerRef = useRef(null);
    const calendarPortalRef = useRef(null); // Ref for portal container

    // Close calendar when clicking outside (handled via window click for portal)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isCalendarOpen) {
                // Check if click is on trigger
                if (triggerRef.current && triggerRef.current.contains(event.target)) {
                    return;
                }

                // Check if click is inside the portal 
                const portalEl = document.getElementById('calendar-portal-root');
                if (portalEl && portalEl.contains(event.target)) {
                    return;
                }

                setIsCalendarOpen(false);
            }
        };

        if (isCalendarOpen) {
            window.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('resize', () => setIsCalendarOpen(false));
            // Also close on scroll to prevent floating weirdness
            window.addEventListener('scroll', () => setIsCalendarOpen(false), true);
        }
        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', () => setIsCalendarOpen(false));
            window.removeEventListener('scroll', () => setIsCalendarOpen(false), true);
        };
    }, [isCalendarOpen]);

    // Animations
    useGSAP(() => {
        if (studySchedule) {
            gsap.from('.timeline-line', {
                scaleY: 0,
                transformOrigin: 'top',
                duration: 1,
                ease: "power3.inOut"
            });

            gsap.from('.timeline-node', {
                scale: 0,
                opacity: 0,
                duration: 0.5,
                stagger: 0.12,
                ease: "back.out(2)",
                delay: 0.3,
            });

            gsap.from('.timeline-card', {
                x: -40,
                opacity: 0,
                duration: 0.6,
                stagger: 0.12,
                ease: "power3.out",
                delay: 0.4,
            });
        }
    }, { scope: containerRef, dependencies: [studySchedule] });

    const handleGenerate = async (e) => {
        if (e) e.preventDefault();
        if (!deadline || !summary) return;

        setIsLoading(true);
        setError(null);

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const targetDate = new Date(deadline);
            targetDate.setHours(0, 0, 0, 0);

            const diffTime = targetDate - today;
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (days <= 0) {
                throw new Error("Deadline must be in the future.");
            }

            console.log(`Generating schedule for ${days} days...`);
            const result = await generateSchedule(summary, days, hoursPerDay);

            if (result && result.schedule) {
                setSchedule(result);
            } else {
                throw new Error("Failed to generate schedule structure.");
            }

        } catch (err) {
            console.error("Schedule generation error:", err);
            setError(err.message || "Failed to generate schedule.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleIncrementHours = () => {
        setHoursPerDay(prev => Math.min(prev + 1, 12));
    };

    const handleDecrementHours = () => {
        setHoursPerDay(prev => Math.max(prev - 1, 1));
    };

    const toggleCalendar = (e) => {
        e.stopPropagation(); // Stop propagation to prevent immediate close
        if (!isCalendarOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Calculate position ensuring it fits in viewport
            let top = rect.bottom + 8;
            let left = rect.left;

            // Simple viewport check (can be expanded)
            if (window.innerHeight - top < 350) { // approximate calendar height
                top = rect.top - 360; // flip up
            }

            setCalendarPos({
                top: top,
                left: left
            });
            setIsCalendarOpen(true);
        } else {
            setIsCalendarOpen(false);
        }
    };

    const getFutureDate = (dayIndex) => {
        const date = new Date();
        date.setDate(date.getDate() + dayIndex);
        return format(date, 'EEE, MMM d');
    };

    const getDayIcon = (index) => {
        const icons = [Target, Zap, BookOpen, Sparkles];
        const Icon = icons[index % icons.length];
        return Icon;
    };

    const accentColors = [
        { gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', glow: 'shadow-violet-500/20' },
        { gradient: 'from-cyan-500 to-teal-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
        { gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
        { gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', glow: 'shadow-rose-500/20' },
        { gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
    ];

    // Premium Calendar Styles
    const css = `
        .rdp {
            --rdp-cell-size: 40px;
            --rdp-accent-color: #7c3aed; /* Violet-600 */
            --rdp-background-color: rgba(124, 58, 237, 0.2);
            margin: 0;
        }
        .rdp-months {
            justify-content: center;
        }
        .rdp-month {
            background-color: transparent;
        }
        .rdp-caption {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 8px;
            margin-bottom: 16px;
        }
        .rdp-caption_label {
            font-size: 1rem;
            font-weight: 700;
            color: #f8fafc; /* Slate-50 */
        }
        .rdp-nav {
            display: flex;
            gap: 8px;
        }
        .rdp-nav_button {
            background-color: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #cbd5e1; /* Slate-300 */
        }
        .rdp-nav_button:hover {
            background-color: rgba(255, 255, 255, 0.15);
            color: white;
        }
        .rdp-head_cell {
            color: #94a3b8; /* Slate-400 */
            font-size: 0.75rem;
            text-transform: uppercase;
            font-weight: 600;
            padding-bottom: 8px;
        }
        .rdp-day {
            color: #e2e8f0; /* Slate-200 */
            font-size: 0.9rem;
            font-weight: 500;
            border-radius: 8px;
            transition: all 0.2s ease;
        }
        .rdp-day_today {
            font-weight: bold;
            color: #a78bfa; /* Violet-400 */
            background-color: rgba(167, 139, 250, 0.1);
            border: 1px solid rgba(167, 139, 250, 0.3);
        }
        .rdp-day_selected:not([disabled]) { 
            background-color: var(--rdp-accent-color);
            color: white;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }
        .rdp-day_selected:hover:not([disabled]) { 
            background-color: #6d28d9; /* Violet-700 */
        }
        .rdp-day:hover:not(.rdp-day_selected):not([disabled]) {
            background-color: rgba(255, 255, 255, 0.1);
            transform: scale(1.05);
        }
        .rdp-day_disabled {
            opacity: 0.25;
            cursor: not-allowed;
        }
    `;

    return (
        <div ref={containerRef} className="space-y-8">
            <style>{css}</style>

            {/* ─────── Form: Create Custom Timeline ─────── */}
            {!studySchedule && (
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/5 mb-4">
                            <Sparkles size={14} className="text-[var(--accent-primary)] animate-pulse" />
                            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-primary)]">AI-Powered</span>
                        </div>
                        <h2 className="text-4xl font-bold text-primary mb-3" style={{ letterSpacing: '-0.02em' }}>
                            Create Custom Timeline
                        </h2>
                        <p className="text-secondary text-base max-w-md mx-auto">
                            Set your target deadline and daily hours — we'll craft a personalized, day-by-day study roadmap.
                        </p>
                    </div>

                    {/* Elegant Form Card */}
                    <div className="glass-panel p-8 rounded-3xl relative overflow-visible backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl z-10">
                        {/* Decorative blobs */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-violet-500/10 to-cyan-500/10 blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-gradient-to-br from-amber-500/10 to-rose-500/10 blur-3xl pointer-events-none" />

                        <div className="relative z-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* 1. Deadline Input (Custom Trigger) */}
                                <div className="space-y-3 relative">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider">
                                        <Calendar size={14} className="text-[var(--accent-primary)]" />
                                        Target Deadline
                                    </label>

                                    <div
                                        ref={triggerRef}
                                        onClick={toggleCalendar}
                                        className={`group w-full h-14 bg-white/5 border ${isCalendarOpen ? 'border-violet-500/50 bg-white/10' : 'border-white/10'} rounded-2xl flex items-center px-4 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-md shadow-lg`}
                                    >
                                        <span className={`text-sm font-medium ${deadline ? 'text-white' : 'text-slate-400'}`}>
                                            {deadline ? format(deadline, 'EEEE, MMMM do, yyyy') : "Select Target Date"}
                                        </span>

                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                        {/* Status Indicator */}
                                        <div className={`absolute right-4 w-2 h-2 rounded-full ${deadline ? 'bg-violet-500' : 'bg-slate-600'} transition-colors`} />
                                    </div>
                                </div>

                                {/* 2. Hours Per Day (Custom Counter UI) */}
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider">
                                        <Clock size={14} className="text-[var(--accent-primary)]" />
                                        Hours Per Day
                                    </label>

                                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-1.5 backdrop-blur-md shadow-lg h-14">
                                        <button
                                            type="button"
                                            onClick={handleDecrementHours}
                                            className="w-10 h-full rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-200"
                                        >
                                            <Minus size={18} />
                                        </button>

                                        <div className="flex-1 flex items-center justify-center">
                                            <span className="text-xl font-bold text-white font-mono tracking-wider">
                                                {hoursPerDay}
                                            </span>
                                            <span className="text-xs text-slate-400 ml-1 mt-1">hrs</span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleIncrementHours}
                                            className="w-10 h-full rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-200"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Divider and Action */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pt-2 opacity-30">
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Zap size={10} className="text-[var(--accent-primary)]" />
                                        Create Timeline
                                    </span>
                                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
                                </div>

                                <Button
                                    onClick={handleGenerate}
                                    variant="primary"
                                    isLoading={isLoading}
                                    disabled={!deadline || isLoading}
                                    style={{ color: "black" }}
                                    className="w-full py-4 px-8 rounded-2xl text-base font-bold flex items-center justify-center gap-3 group shadow-xl hover:shadow-2xl hover:shadow-[var(--accent-primary)]/20 transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    <Sparkles size={18} className="group-hover:animate-spin" />
                                    Generate My Timeline
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Calendar Portal - NO FULL SCREEN WRAPPER */}
            {isCalendarOpen && createPortal(
                <div
                    id="calendar-portal-root"
                    style={{
                        position: 'fixed',
                        top: calendarPos.top,
                        left: calendarPos.left,
                        zIndex: 9999,
                        // DO NOT ADD inset-0 or full width/height
                    }}
                    className="p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top-left"
                >
                    <DayPicker
                        mode="single"
                        selected={deadline}
                        onSelect={(date) => {
                            setDeadline(date);
                            setIsCalendarOpen(false);
                        }}
                        disabled={{ before: new Date() }}
                        showOutsideDays
                        modifiersClassNames={{
                            selected: 'rdp-day_selected',
                            today: 'rdp-day_today'
                        }}
                    />
                </div>,
                document.body
            )}

            {/* ─────── Error State ─────── */}
            {error && (
                <div className="max-w-2xl mx-auto p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <p className="font-semibold text-red-400">Generation Failed</p>
                        <p className="text-red-400/80 text-xs mt-0.5">{error}</p>
                    </div>
                </div>
            )}

            {/* ─────── Loading State ─────── */}
            {isLoading && (
                <div className="max-w-2xl mx-auto glass-panel p-10 rounded-3xl text-center relative overflow-hidden backdrop-blur-xl border border-white/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 animate-pulse" />
                    <div className="relative z-10">
                        <div className="relative inline-flex items-center justify-center mb-6">
                            <div className="w-16 h-16 border-3 border-[var(--accent-primary)]/20 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                            <Sparkles size={20} className="absolute text-[var(--accent-primary)] animate-pulse" />
                        </div>
                        <p className="text-primary font-semibold text-lg">Crafting Your Custom Timeline</p>
                        <p className="text-secondary text-sm mt-2">Analyzing your content and building the perfect study plan...</p>
                    </div>
                </div>
            )}

            {/* ─────── Timeline Display ─────── */}
            {studySchedule && studySchedule.schedule && (
                <div className="space-y-8 animate-in fade-in duration-700">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 mb-3">
                                <CheckCircle2 size={12} className="text-emerald-400" />
                                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">{studySchedule.schedule.length} Days Planned</span>
                            </div>
                            <h3 className="text-2xl font-bold text-primary" style={{ letterSpacing: '-0.02em' }}>
                                Your Custom Timeline
                            </h3>
                            <p className="text-secondary text-sm mt-1">Follow this roadmap to reach your goals on time.</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSchedule(null)}
                            className="flex items-center gap-2 text-secondary hover:text-primary text-xs border border-primary/10 rounded-xl px-4 py-2 hover:border-primary/20 transition-all hover:bg-white/5"
                        >
                            <RotateCcw size={14} />
                            Create New
                        </Button>
                    </div>

                    <div className="relative pl-2">
                        <div className="timeline-line absolute left-8 md:left-10 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500/50 via-cyan-500/30 to-emerald-500/50" />

                        <div className="space-y-6">
                            {studySchedule.schedule.map((dayPlan, index) => {
                                const color = accentColors[index % accentColors.length];
                                const DayIcon = getDayIcon(index);
                                const isExpanded = expandedDay === index;

                                return (
                                    <div key={index} className="timeline-card relative flex gap-4 md:gap-8 group">
                                        <div className="timeline-node relative z-20 flex-shrink-0 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110">
                                            <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${color.gradient} flex items-center justify-center shadow-lg ${color.glow} cursor-pointer`}>
                                                <span className="text-white font-bold text-sm md:text-base">{dayPlan.day || index + 1}</span>
                                            </div>
                                        </div>

                                        <div
                                            className={`flex-1 relative overflow-hidden rounded-2xl bg-[var(--bg-secondary)] border ${color.border} hover:border-opacity-60 transition-all duration-500 cursor-pointer ${isExpanded ? 'ring-1 ring-opacity-30 ring-[var(--accent-primary)]' : ''} backdrop-blur-sm`}
                                            onClick={() => setExpandedDay(isExpanded ? null : index)}
                                            style={{
                                                boxShadow: isExpanded
                                                    ? `0 8px 32px rgba(0,0,0,0.15)`
                                                    : '0 1px 4px rgba(0,0,0,0.08)'
                                            }}
                                        >
                                            <div className="p-5 md:p-6">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`text-xs font-medium ${color.text} uppercase tracking-wider`}>
                                                                {getFutureDate(index)}
                                                            </span>
                                                            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${color.gradient}`} />
                                                        </div>
                                                        <h4 className="text-lg font-bold text-primary leading-snug pr-4">
                                                            {dayPlan.focus}
                                                        </h4>
                                                    </div>
                                                    <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-12' : 'group-hover:rotate-6'}`}>
                                                        <DayIcon size={18} className={color.text} />
                                                    </div>
                                                </div>

                                                <div className={`mt-4 space-y-2.5 transition-all duration-500 ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-24 overflow-hidden'}`}>
                                                    {dayPlan.tasks.map((task, tIndex) => (
                                                        <div
                                                            key={tIndex}
                                                            className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${isExpanded ? `${color.bg} border ${color.border}` : ''} group/task hover:bg-white/5`}
                                                        >
                                                            <div className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${isExpanded ? `bg-gradient-to-br ${color.gradient}` : 'bg-primary/10'} transition-all`}>
                                                                {isExpanded ? (
                                                                    <CheckCircle2 size={12} className="text-white" />
                                                                ) : (
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${color.text === 'text-violet-400' ? 'bg-violet-400' : color.text === 'text-cyan-400' ? 'bg-cyan-400' : color.text === 'text-amber-400' ? 'bg-amber-400' : color.text === 'text-rose-400' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm text-primary/90 leading-relaxed font-medium">{task.activity}</p>
                                                                <p className={`text-[11px] font-mono mt-1 ${color.text} opacity-70`}>{task.time}</p>
                                                            </div>

                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPomodoroTopic(task.activity);
                                                                }}
                                                                title="Start Start Pomodoro"
                                                                className="mt-0.5 p-1.5 rounded-lg opacity-0 group-hover/task:opacity-100 bg-white/10 text-primary hover:bg-white/20 transition-all border border-white/10 flex-shrink-0 active:scale-95"
                                                            >
                                                                <Play size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>

                                                {!isExpanded && dayPlan.tasks.length > 2 && (
                                                    <div className={`mt-3 text-xs font-medium ${color.text} flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity pl-1`}>
                                                        <span>+{dayPlan.tasks.length - 2} more tasks</span>
                                                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="timeline-node relative z-20 flex items-center gap-4 md:gap-8 mt-8 pl-1">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 transform hover:scale-110 transition-transform duration-300">
                                <CheckCircle2 size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="text-base font-bold text-primary">Goal Reached! 🎉</p>
                                <p className="text-secondary text-sm">Complete all days to master your subject.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudySchedule;
