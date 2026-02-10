import React, { useState, useRef } from 'react';
import { Calendar, Clock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
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
    const containerRef = useRef(null);

    useGSAP(() => {
        if (studySchedule) {
            gsap.from('.gsap-card', {
                y: 50,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: "back.out(1.2)"
            });
        }
    }, { scope: containerRef, dependencies: [studySchedule] });

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!deadline || !summary) return;

        setIsLoading(true);
        setError(null);

        try {
            // Calculate days remaining
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

    // Calculate dates for display
    const getFutureDate = (dayIndex) => {
        const date = new Date();
        date.setDate(date.getDate() + dayIndex);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <div ref={containerRef} className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-primary mb-2">Personalized Study Plan</h2>
                    <p className="text-secondary">AI-generated schedule based on your material and deadline.</p>
                </div>

                {/* Input Form */}
                {!studySchedule && (
                    <form onSubmit={handleGenerate} className="glass-panel p-4 rounded-xl flex flex-wrap gap-4 items-end w-full md:w-auto">
                        <div>
                            <label className="block text-xs font-medium text-secondary mb-1">Target Deadline</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-2.5 text-[var(--accent-primary)]" />
                                <input
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="pl-9 pr-4 py-2 rounded-lg glass-input bg-white/5 text-sm w-full"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-secondary mb-1">Hours / Day</label>
                            <div className="relative">
                                <Clock size={16} className="absolute left-3 top-2.5 text-[var(--accent-primary)]" />
                                <input
                                    type="number"
                                    min="1" max="12"
                                    value={hoursPerDay}
                                    onChange={(e) => setHoursPerDay(e.target.value)}
                                    className="pl-9 pr-4 py-2 rounded-lg glass-input bg-white/5 text-sm w-24"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                            disabled={!deadline || isLoading}
                        >
                            Generate
                        </Button>
                    </form>
                )}
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {/* Schedule Display */}
            {studySchedule ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {studySchedule.schedule.map((dayPlan, index) => (
                        <div
                            key={index}
                            className="gsap-card group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-black/20"
                        >
                            {/* Subtle Background Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            {/* Header */}
                            <div className="relative p-5 border-b border-white/5 flex justify-between items-start bg-white/5 backdrop-blur-sm">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold tracking-wider text-secondary uppercase">
                                            Day {dayPlan.day}
                                        </div>
                                        <span className="text-secondary/50 text-xs">•</span>
                                        <p className="text-xs font-medium text-secondary/80">{getFutureDate(index)}</p>
                                    </div>
                                    <h3 className="text-lg font-semibold text-primary/90 leading-tight">
                                        {dayPlan.focus}
                                    </h3>
                                </div>
                                <div className="p-2 rounded-xl bg-white/5 text-secondary group-hover:text-primary transition-colors">
                                    <Calendar size={18} />
                                </div>
                            </div>

                            {/* Tasks List */}
                            <div className="relative p-5 space-y-4">
                                {dayPlan.tasks.map((task, tIndex) => (
                                    <div key={tIndex} className="relative pl-4 border-l border-white/10 hover:border-emerald-400/50 transition-colors">
                                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white/10 border-2 border-[#0f172a] group-hover:bg-emerald-400/80 transition-colors"></div>

                                        <p className="text-[13px] font-medium text-primary/80 group-hover:text-primary transition-colors leading-snug">
                                            {task.activity}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Clock size={10} className="text-secondary/60" />
                                            <p className="text-[11px] text-secondary/60 font-medium tracking-wide">
                                                {task.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div
                        className="gsap-card border border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 hover:bg-white/5 transition-all cursor-pointer group"
                        onClick={() => setSchedule(null)}
                    >
                        <div className="p-3 rounded-full bg-white/5 text-secondary group-hover:text-primary mb-3 transition-colors">
                            <Clock size={20} />
                        </div>
                        <p className="text-primary/80 font-medium text-sm mb-1">Adjust Plan</p>
                        <p className="text-xs text-secondary/70 mb-4 max-w-[200px]">Regenerate with new deadline or hours.</p>
                        <Button variant="ghost" size="sm" className="text-xs h-8">Reset</Button>
                    </div>
                </div>
            ) : (
                !isLoading && (
                    <div className="text-center py-20 opacity-50">
                        <Calendar size={48} className="mx-auto mb-4 text-secondary" />
                        <h3 className="text-xl font-medium text-primary">No Schedule Yet</h3>
                        <p className="text-secondary max-w-md mx-auto mt-2">
                            Select a deadline above to generate a personalized day-by-day study plan covering all your material.
                        </p>
                    </div>
                )
            )}

            {isLoading && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass-panel p-5 rounded-xl h-48 animate-pulse flex flex-col gap-3">
                            <div className="h-6 bg-white/10 rounded w-1/3"></div>
                            <div className="h-4 bg-white/5 rounded w-full mt-4"></div>
                            <div className="h-4 bg-white/5 rounded w-2/3"></div>
                            <div className="h-4 bg-white/5 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudySchedule;
