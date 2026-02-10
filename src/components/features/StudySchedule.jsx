import React, { useState, useRef } from 'react';
import { Calendar, Clock, ArrowRight, CheckCircle2, AlertCircle, Sparkles, RotateCcw, Zap, Target, BookOpen } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import useStudyStore from '../../store/useStudyStore';
import { generateSchedule } from '../../services/aiService';
import Button from '../ui/Button';

const StudySchedule = () => {
    const { summary, studySchedule, setSchedule } = useStudyStore();

    const [deadline, setDeadline] = useState('');
    const [hoursPerDay, setHoursPerDay] = useState(2);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedDay, setExpandedDay] = useState(null);
    const containerRef = useRef(null);

    useGSAP(() => {
        if (studySchedule) {
            // Animate the timeline line drawing
            gsap.from('.timeline-line', {
                scaleY: 0,
                transformOrigin: 'top',
                duration: 1,
                ease: "power3.inOut"
            });

            // Stagger timeline nodes
            gsap.from('.timeline-node', {
                scale: 0,
                opacity: 0,
                duration: 0.5,
                stagger: 0.12,
                ease: "back.out(2)",
                delay: 0.3,
            });

            // Stagger timeline cards
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
        e.preventDefault();
        if (!deadline || !summary) return;

        setIsLoading(true);
        setError(null);

        try {
            const today = new Date();
            const targetDate = new Date(deadline);
            const diffTime = Math.abs(targetDate - today);
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

    const getFutureDate = (dayIndex) => {
        const date = new Date();
        date.setDate(date.getDate() + dayIndex);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

    return (
        <div ref={containerRef} className="space-y-8">
            {/* ─────── Form: Create Custom Timeline ─────── */}
            {!studySchedule && (
                <div className="max-w-2xl mx-auto">
                    {/* Header with sparkle animation */}
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
                    <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
                        {/* Decorative gradient blob */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-violet-500/10 to-cyan-500/10 blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-gradient-to-br from-amber-500/10 to-rose-500/10 blur-3xl pointer-events-none" />

                        <form onSubmit={handleGenerate} className="relative z-10 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Deadline Input */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider">
                                        <Calendar size={14} className="text-[var(--accent-primary)]" />
                                        Target Deadline
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="date"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            value={deadline}
                                            onChange={(e) => setDeadline(e.target.value)}
                                            className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-primary)] border-2 border-primary/10 text-primary focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 outline-none transition-all duration-300 text-sm font-medium"
                                        />
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                </div>

                                {/* Hours per Day Input */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider">
                                        <Clock size={14} className="text-[var(--accent-primary)]" />
                                        Hours Per Day
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            min="1" max="12"
                                            value={hoursPerDay}
                                            onChange={(e) => setHoursPerDay(e.target.value)}
                                            className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-primary)] border-2 border-primary/10 text-primary focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 outline-none transition-all duration-300 text-sm font-medium"
                                        />
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Create Timeline Divider */}
                            <div className="flex items-center gap-3 pt-2">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
                                <span className="text-xs font-semibold text-secondary uppercase tracking-widest flex items-center gap-2">
                                    <Zap size={12} className="text-[var(--accent-primary)]" />
                                    Create Timeline
                                </span>
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={isLoading}
                                disabled={!deadline || isLoading}
                                style={{color:"black"}}
                                className="w-full py-4 px-8 rounded-2xl text-base font-semibold flex items-center justify-center gap-2 group"
                            >
                                <Sparkles size={18} className="group-hover:animate-spin" />
                                Generate My Timeline
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {/* ─────── Error State ─────── */}
            {error && (
                <div className="max-w-2xl mx-auto p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3 backdrop-blur-sm">
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
                <div className="max-w-2xl mx-auto glass-panel p-10 rounded-3xl text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5" />
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
                <div className="space-y-8">
                    {/* Timeline Header */}
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
                            className="flex items-center gap-2 text-secondary hover:text-primary text-xs border border-primary/10 rounded-xl px-4 py-2 hover:border-primary/20 transition-all"
                        >
                            <RotateCcw size={14} />
                            Create New
                        </Button>
                    </div>

                    {/* Vertical Timeline */}
                    <div className="relative">
                        {/* The vertical timeline line */}
                        <div className="timeline-line absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500/50 via-cyan-500/30 to-emerald-500/50" />

                        <div className="space-y-6">
                            {studySchedule.schedule.map((dayPlan, index) => {
                                const color = accentColors[index % accentColors.length];
                                const DayIcon = getDayIcon(index);
                                const isExpanded = expandedDay === index;

                                return (
                                    <div key={index} className="timeline-card relative flex gap-4 md:gap-6">
                                        {/* Timeline Node */}
                                        <div className="timeline-node relative z-20 flex-shrink-0 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
                                            <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${color.gradient} flex items-center justify-center shadow-lg ${color.glow} group cursor-pointer transition-transform duration-300 hover:scale-110`}>
                                                <span className="text-white font-bold text-sm md:text-base">{dayPlan.day || index + 1}</span>
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div
                                            className={`flex-1 group relative overflow-hidden rounded-2xl bg-[var(--bg-secondary)] border ${color.border} hover:border-opacity-60 transition-all duration-500 cursor-pointer ${isExpanded ? 'ring-1 ring-opacity-30' : ''}`}
                                            onClick={() => setExpandedDay(isExpanded ? null : index)}
                                            style={{
                                                boxShadow: isExpanded
                                                    ? `0 8px 32px rgba(0,0,0,0.15)`
                                                    : '0 1px 4px rgba(0,0,0,0.08)'
                                            }}
                                        >
                                            {/* Card Header */}
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

                                                {/* Task Preview / Expanded List */}
                                                <div className={`mt-4 space-y-2.5 transition-all duration-500 ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-24 overflow-hidden'}`}>
                                                    {dayPlan.tasks.map((task, tIndex) => (
                                                        <div
                                                            key={tIndex}
                                                            className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${isExpanded ? `${color.bg} border ${color.border}` : ''}`}
                                                        >
                                                            <div className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${isExpanded ? `bg-gradient-to-br ${color.gradient}` : 'bg-primary/10'} transition-all`}>
                                                                {isExpanded ? (
                                                                    <CheckCircle2 size={12} className="text-white" />
                                                                ) : (
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${color.text === 'text-violet-400' ? 'bg-violet-400' : color.text === 'text-cyan-400' ? 'bg-cyan-400' : color.text === 'text-amber-400' ? 'bg-amber-400' : color.text === 'text-rose-400' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm text-primary/90 leading-relaxed">{task.activity}</p>
                                                                <p className={`text-[11px] font-mono mt-1 ${color.text} opacity-70`}>{task.time}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Expand indicator */}
                                                {!isExpanded && dayPlan.tasks.length > 2 && (
                                                    <div className={`mt-3 text-xs font-medium ${color.text} flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity`}>
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

                        {/* Timeline End Node */}
                        <div className="timeline-node relative z-20 flex items-center gap-4 md:gap-6 mt-6">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
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
