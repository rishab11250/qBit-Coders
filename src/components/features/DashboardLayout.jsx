import React, { useState, useRef } from 'react';
import { FileText, Share2, AlertTriangle, HelpCircle, ArrowLeft, MessageSquare, Calendar, Target, Flame, Crosshair, Lightbulb, BookMarked, BrainCircuit, Atom, Puzzle, Eye, Sparkles } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import useStudyStore from '../../store/useStudyStore';
import QuizInteractive from '../QuizInteractive';
import Button from '../ui/Button';
import ConceptGraph from '../ConceptGraph';
import ChatPanel from './ChatPanel';
import StudySchedule from './StudySchedule';

const DashboardLayout = () => {
    const { summary, concepts, quiz, weakAreas, addWeakArea, reset } = useStudyStore();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const containerRef = useRef(null);

    useGSAP(() => {
        gsap.from('.gsap-stagger', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out"
        });
    }, { scope: containerRef });

    return (
        <div ref={containerRef} className="relative z-10 min-h-screen pb-20">
            <div className="max-w-6xl mx-auto px-6 py-12">

                {/* Header Area */}
                <div className="gsap-stagger mb-16">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <p className="text-secondary text-sm font-medium tracking-wide uppercase">Analysis Complete</p>
                            </div>
                            <h2 className="text-5xl font-bold text-primary tracking-tight leading-[1.1]">Your <span className="text-[var(--accent-primary)]">Study Plan</span></h2>
                        </div>
                        <Button variant="secondary" onClick={reset} className="glass-panel text-primary text-sm px-6 py-3 rounded-xl hover:border-[var(--accent-primary)] transition-colors">
                            <ArrowLeft size={16} className="mr-2" />
                            New Analysis
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-12">

                    {/* Summary Section — Premium */}
                    {(() => {
                        const takeawayColors = [
                            { gradient: 'from-violet-500 to-purple-600', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.15)', text: '#a78bfa' },
                            { gradient: 'from-cyan-500 to-teal-500', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.15)', text: '#22d3ee' },
                            { gradient: 'from-amber-500 to-orange-500', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
                            { gradient: 'from-emerald-500 to-green-500', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)', text: '#34d399' },
                            { gradient: 'from-rose-500 to-pink-600', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.15)', text: '#fb7185' },
                            { gradient: 'from-sky-500 to-blue-600', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.15)', text: '#38bdf8' },
                        ];

                        return (
                            <section className="gsap-stagger">
                                {/* Section Header */}
                                <div className="mb-8 flex items-center gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                            <FileText size={18} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-primary">Executive Summary</h3>
                                            <p className="text-xs text-secondary mt-0.5">AI-generated overview of your content</p>
                                        </div>
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-violet-500/20 via-primary/10 to-transparent"></div>
                                </div>

                                <div className="glass-panel rounded-3xl p-8 md:p-10 relative overflow-hidden">
                                    {/* Multiple decorative ambient glows */}
                                    <div className="absolute top-0 right-0 w-72 h-72 bg-violet-500/[0.07] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                                    <div className="absolute bottom-0 left-0 w-56 h-56 bg-cyan-500/[0.05] rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
                                    <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-amber-500/[0.03] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                                    <div className="relative z-10">
                                        {typeof summary === 'object' && summary !== null ? (
                                            <div className="space-y-10">
                                                {/* Simple Explanation — Quote Style */}
                                                {summary.simple_explanation && (
                                                    <div className="relative">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <Lightbulb size={14} className="text-amber-400" />
                                                            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">In Simple Terms</span>
                                                        </div>
                                                        <div className="relative pl-6 border-l-2 border-violet-500/30">
                                                            {/* Decorative quote mark */}
                                                            <div className="absolute -left-1 -top-1 w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20">
                                                                <span className="text-white text-xs font-bold">"</span>
                                                            </div>
                                                            <p className="text-primary text-xl md:text-2xl font-light leading-relaxed tracking-tight" style={{ lineHeight: '1.7' }}>
                                                                {summary.simple_explanation}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Key Takeaways — Interactive Cards */}
                                                {summary.executive_brief && (
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-5">
                                                            <Sparkles size={14} className="text-cyan-400" />
                                                            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Key Takeaways</span>
                                                            {Array.isArray(summary.executive_brief) && (
                                                                <span className="ml-2 text-[10px] text-secondary bg-primary/5 px-2 py-0.5 rounded-full">{summary.executive_brief.length} insights</span>
                                                            )}
                                                        </div>
                                                        {Array.isArray(summary.executive_brief) ? (
                                                            <div className="grid md:grid-cols-2 gap-4">
                                                                {summary.executive_brief.map((item, i) => {
                                                                    const color = takeawayColors[i % takeawayColors.length];
                                                                    return (
                                                                        <div
                                                                            key={i}
                                                                            className="group relative overflow-hidden rounded-2xl p-4 transition-all duration-500"
                                                                            style={{
                                                                                background: color.bg,
                                                                                border: `1px solid ${color.border}`,
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                                                e.currentTarget.style.boxShadow = `0 8px 24px ${color.bg}`;
                                                                                e.currentTarget.style.borderColor = color.text;
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                                e.currentTarget.style.boxShadow = 'none';
                                                                                e.currentTarget.style.borderColor = color.border;
                                                                            }}
                                                                        >
                                                                            <div className="flex items-start gap-3">
                                                                                {/* Number Badge */}
                                                                                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color.gradient} flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                                                                                    <span className="text-white text-xs font-bold">{i + 1}</span>
                                                                                </div>
                                                                                <p className="text-primary/90 text-sm leading-relaxed flex-1">{item}</p>
                                                                            </div>
                                                                            {/* Animated bottom bar */}
                                                                            <div className="mt-3 h-0.5 rounded-full overflow-hidden bg-primary/5">
                                                                                <div className={`h-full rounded-full bg-gradient-to-r ${color.gradient} w-0 group-hover:w-full transition-all duration-700 ease-out`} />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <p className="text-primary/90 text-base leading-relaxed">{summary.executive_brief}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="relative pl-6 border-l-2 border-violet-500/30">
                                                <div className="absolute -left-1 -top-1 w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20">
                                                    <span className="text-white text-xs font-bold">"</span>
                                                </div>
                                                <p className="text-primary text-xl font-light leading-relaxed">{summary}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        );
                    })()}

                    {/* Knowledge Graph Section — Premium */}
                    <section className="gsap-stagger">
                        {/* Section Header */}
                        <div className="mb-8 flex items-center gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                    <Share2 size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-primary">Knowledge Map</h3>
                                    <p className="text-xs text-secondary mt-0.5">Interactive concept tree — click nodes to expand, drag to pan</p>
                                </div>
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/20 via-primary/10 to-transparent"></div>
                        </div>

                        <div className="relative rounded-3xl overflow-hidden border border-cyan-500/10 shadow-lg shadow-cyan-500/5">
                            {/* Ambient glows */}
                            <div className="absolute top-0 left-0 w-60 h-60 bg-violet-500/[0.06] rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 pointer-events-none z-0" />
                            <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-500/[0.06] rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none z-0" />
                            <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-amber-500/[0.03] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />

                            {/* Top info bar */}
                            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                                <div className="flex items-center gap-2 bg-[var(--bg-secondary)]/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-primary/5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-medium text-secondary">Live Graph</span>
                                    {concepts && (
                                        <span className="text-[10px] text-secondary/60 bg-primary/5 px-2 py-0.5 rounded-full">{concepts.length} concepts</span>
                                    )}
                                </div>
                                <div className="hidden sm:flex items-center gap-3 bg-[var(--bg-secondary)]/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-primary/5">
                                    <span className="text-[10px] text-secondary/60">🖱️ Drag to pan</span>
                                    <span className="text-[10px] text-secondary/40">•</span>
                                    <span className="text-[10px] text-secondary/60">🔍 Scroll to zoom</span>
                                    <span className="text-[10px] text-secondary/40">•</span>
                                    <span className="text-[10px] text-secondary/60">👆 Click to collapse</span>
                                </div>
                            </div>

                            <div className="h-[550px] w-full bg-[var(--bg-secondary)] relative z-10">
                                <ConceptGraph concepts={concepts} />
                            </div>
                        </div>
                    </section>

                    {/* Focus Areas Section — Premium Interactive */}
                    {weakAreas.length > 0 && (() => {
                        const focusIcons = [Target, Flame, Crosshair, Lightbulb, BookMarked, BrainCircuit, Atom, Puzzle, Eye];
                        const focusColors = [
                            { gradient: 'from-rose-500 to-pink-600', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)', glow: '0 0 30px rgba(244,63,94,0.12)', text: '#fb7185' },
                            { gradient: 'from-amber-500 to-orange-500', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', glow: '0 0 30px rgba(245,158,11,0.12)', text: '#fbbf24' },
                            { gradient: 'from-violet-500 to-purple-600', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', glow: '0 0 30px rgba(139,92,246,0.12)', text: '#a78bfa' },
                            { gradient: 'from-cyan-500 to-teal-500', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)', glow: '0 0 30px rgba(6,182,212,0.12)', text: '#22d3ee' },
                            { gradient: 'from-emerald-500 to-green-500', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', glow: '0 0 30px rgba(16,185,129,0.12)', text: '#34d399' },
                            { gradient: 'from-sky-500 to-blue-600', bg: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.2)', glow: '0 0 30px rgba(14,165,233,0.12)', text: '#38bdf8' },
                            { gradient: 'from-fuchsia-500 to-pink-500', bg: 'rgba(217,70,239,0.08)', border: 'rgba(217,70,239,0.2)', glow: '0 0 30px rgba(217,70,239,0.12)', text: '#e879f9' },
                            { gradient: 'from-lime-500 to-green-400', bg: 'rgba(132,204,22,0.08)', border: 'rgba(132,204,22,0.2)', glow: '0 0 30px rgba(132,204,22,0.12)', text: '#a3e635' },
                            { gradient: 'from-indigo-500 to-violet-500', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', glow: '0 0 30px rgba(99,102,241,0.12)', text: '#818cf8' },
                        ];

                        return (
                            <section className="gsap-stagger">
                                {/* Section Header */}
                                <div className="mb-8 flex items-center gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                                            <Target size={18} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-primary">Focus Areas</h3>
                                            <p className="text-xs text-secondary mt-0.5">{weakAreas.length} topics identified for extra attention</p>
                                        </div>
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-rose-500/20 via-primary/10 to-transparent"></div>
                                </div>

                                {/* Focus Cards Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {weakAreas.map((area, i) => {
                                        const color = focusColors[i % focusColors.length];
                                        const Icon = focusIcons[i % focusIcons.length];

                                        return (
                                            <div
                                                key={i}
                                                className="group relative overflow-hidden rounded-2xl transition-all duration-500 cursor-default"
                                                style={{
                                                    background: 'var(--bg-secondary)',
                                                    border: `1px solid ${color.border}`,
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.boxShadow = color.glow;
                                                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                                                    e.currentTarget.style.borderColor = color.text;
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.boxShadow = 'none';
                                                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                    e.currentTarget.style.borderColor = color.border;
                                                }}
                                            >
                                                {/* Gradient background glow on hover */}
                                                <div
                                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                                    style={{ background: `radial-gradient(circle at 30% 30%, ${color.bg}, transparent 70%)` }}
                                                />

                                                {/* Large faded number in background */}
                                                <div className="absolute -bottom-4 -right-2 text-[5rem] font-bold leading-none opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none select-none"
                                                    style={{ color: color.text }}>
                                                    {String(i + 1).padStart(2, '0')}
                                                </div>

                                                <div className="relative z-10 p-5 flex items-start gap-4">
                                                    {/* Icon Badge */}
                                                    <div
                                                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color.gradient} flex items-center justify-center flex-shrink-0 shadow-md transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110`}
                                                    >
                                                        <Icon size={18} className="text-white" />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: color.text }}>Topic {i + 1}</span>
                                                            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color.text, opacity: 0.5 }} />
                                                            <span className="text-[10px] text-secondary">Needs Review</span>
                                                        </div>
                                                        <p className="text-primary font-semibold text-sm leading-snug">
                                                            {area}
                                                        </p>

                                                        {/* Animated underline on hover */}
                                                        <div className="mt-3 h-0.5 rounded-full overflow-hidden bg-primary/5">
                                                            <div
                                                                className={`h-full rounded-full bg-gradient-to-r ${color.gradient} w-0 group-hover:w-full transition-all duration-700 ease-out`}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Summary Footer */}
                                <div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                                    <AlertTriangle size={16} className="text-rose-400 flex-shrink-0" />
                                    <p className="text-secondary text-xs">
                                        These topics were detected as potential weak spots. Revisit them using the quiz and chat to strengthen your understanding.
                                    </p>
                                </div>
                            </section>
                        );
                    })()}

                    {/* Interactive Quiz Section */}
                    <section className="gsap-stagger">
                        <div className="mb-6 flex items-center gap-3">
                            <h3 className="text-2xl font-bold text-primary">Quiz</h3>
                            <div className="h-px flex-1 bg-primary/10"></div>
                        </div>
                        <div className="glass-panel rounded-2xl p-1">
                            <QuizInteractive quizData={quiz} onWeakTopicDetected={addWeakArea} />
                        </div>
                    </section>

                    {/* Smart Schedule Section */}
                    <div className="gsap-stagger">
                        <StudySchedule />
                    </div>

                </div>
            </div>

            {/* Chat Floating Button - Minimalist */}
            <div className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="group p-4 bg-[var(--bg-secondary)] text-primary hover:text-[var(--accent-primary)] rounded-full shadow-2xl transition-all duration-300 border border-primary/10 hover:border-[var(--accent-primary)] hover:scale-110"
                >
                    <MessageSquare size={24} strokeWidth={1.5} />
                </button>
            </div>

            {/* Chat Panel */}
            <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
    );
};

export default DashboardLayout;
