import React, { useState, useRef } from 'react';
import { Calendar, Clock, ArrowRight, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import useStudyStore from '../../store/useStudyStore';
import { generateSchedule } from '../../services/aiService';
import Button from '../ui/Button';

const StudySchedule = () => {
    const { summary, studySchedule, setSchedule, setPomodoroTopic } = useStudyStore();

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
            {/* Input Form - Only shown if no schedule exists */}
            {!studySchedule && (
                <div className="max-w-xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-primary mb-2">Create Your Timeline</h2>
                        <p className="text-secondary">Select your target date to generate a day-by-day plan.</p>
                    </div>

                    <form onSubmit={handleGenerate} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Deadline</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-3 text-[var(--accent-primary)]" />
                                <input
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="pl-12 pr-4 py-3 rounded-xl bg-primary/5 border border-primary/10 text-primary w-full focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="w-full md:w-32">
                            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Hrs/Day</label>
                            <div className="relative">
                                <Clock size={18} className="absolute left-4 top-3 text-[var(--accent-primary)]" />
                                <input
                                    type="number"
                                    min="1" max="12"
                                    value={hoursPerDay}
                                    onChange={(e) => setHoursPerDay(e.target.value)}
                                    className="pl-12 pr-4 py-3 rounded-xl bg-primary/5 border border-primary/10 text-primary w-full focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                            disabled={!deadline || isLoading}
                            className="w-full md:w-auto py-3 px-8 rounded-xl"
                        >
                            Generate Plan
                        </Button>
                    </form>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center justify-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {isLoading && (
                <div className="glass-panel p-8 rounded-2xl text-center">
                    <div className="inline-block w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-secondary">Crafting your perfect schedule...</p>
                </div>
            )}

            {/* Schedule Display - Only Render if Data Exists */}
            {studySchedule && studySchedule.schedule && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-primary">Your Timeline</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSchedule(null)}
                            className="text-secondary hover:text-primary text-xs"
                        >
                            Reset Plan
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {studySchedule.schedule.map((dayPlan, index) => (
                            <div
                                key={index}
                                className="gsap-card group relative overflow-hidden rounded-2xl bg-[var(--bg-secondary)] border border-primary/5 hover:border-[var(--accent-primary)] transition-all duration-300 hover:-translate-y-1 p-6 h-full"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="text-4xl font-bold text-primary">{dayPlan.day}</span>
                                </div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <p className="text-xs font-medium text-[var(--accent-primary)] uppercase tracking-wider mb-1">{getFutureDate(index)}</p>
                                    <h4 className="text-lg font-bold text-primary mb-4 pr-8 line-clamp-2">{dayPlan.focus}</h4>

                                    <div className="space-y-3 flex-grow">
                                        {dayPlan.tasks.map((task, tIndex) => (
                                            <div key={tIndex} className="flex items-start gap-3 group/task">
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-[var(--accent-teal)] transition-colors flex-shrink-0"></div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-secondary group-hover:text-primary transition-colors">{task.activity}</p>
                                                    <p className="text-[10px] font-mono text-secondary/60 mt-0.5">{task.time}</p>
                                                </div>
                                                <button
                                                    onClick={() => setPomodoroTopic(task.activity)}
                                                    title="Start Pomodoro Timer"
                                                    className="mt-0.5 p-1.5 rounded-lg opacity-0 group-hover/task:opacity-100 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-all border border-violet-500/20 flex-shrink-0"
                                                >
                                                    <Play size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudySchedule;
