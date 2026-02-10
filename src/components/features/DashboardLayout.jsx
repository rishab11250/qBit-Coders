import React, { useState, useRef } from 'react';
import { FileText, Share2, AlertTriangle, HelpCircle, ArrowLeft, MessageSquare, Calendar } from 'lucide-react';
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

                    {/* Summary Section */}
                    <section className="gsap-stagger">
                        <div className="mb-6 flex items-center gap-3">
                            <h3 className="text-2xl font-bold text-primary">Executive Summary</h3>
                            <div className="h-px flex-1 bg-primary/10"></div>
                        </div>

                        <div className="glass-panel rounded-2xl p-8 md:p-10 relative overflow-hidden group">
                            {/* Decorative ambient glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                            <div className="relative z-10 prose max-w-none text-secondary text-lg leading-relaxed">
                                {typeof summary === 'object' && summary !== null ? (
                                    <div className="space-y-8">
                                        {summary.simple_explanation && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-3">In Simple Terms</h4>
                                                <p className="text-primary text-xl font-light leading-relaxed">{summary.simple_explanation}</p>
                                            </div>
                                        )}
                                        {summary.executive_brief && (
                                            <div className="pt-6 border-t border-primary/5">
                                                <h4 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-4">Key Takeaways</h4>
                                                {Array.isArray(summary.executive_brief) ? (
                                                    <ul className="grid md:grid-cols-2 gap-4 list-none pl-0">
                                                        {summary.executive_brief.map((item, i) => (
                                                            <li key={i} className="flex gap-3 items-start">
                                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-teal)] flex-shrink-0"></span>
                                                                <span className="text-primary/90">{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p>{summary.executive_brief}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-primary text-xl font-light">{summary}</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Knowledge Graph Section */}
                    <section className="gsap-stagger">
                        <div className="mb-6 flex items-center gap-3">
                            <h3 className="text-2xl font-bold text-primary">Knowledge Map</h3>
                            <div className="h-px flex-1 bg-primary/10"></div>
                        </div>

                        <div className="h-[500px] w-full rounded-2xl border border-primary/5 bg-[var(--bg-secondary)] overflow-hidden relative">
                            <div className="absolute top-4 left-4 z-10 bg-[var(--bg-secondary)]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/5 text-xs text-secondary shadow-sm">
                                Interactive Tree Graph
                            </div>
                            <ConceptGraph concepts={concepts} />
                        </div>
                    </section>

                    {/* Weak Areas Section */}
                    {weakAreas.length > 0 && (
                        <section className="gsap-stagger">
                            <div className="mb-6 flex items-center gap-3">
                                <h3 className="text-2xl font-bold text-primary">Focus Areas</h3>
                                <div className="h-px flex-1 bg-primary/10"></div>
                            </div>

                            <div className="glass-panel p-8 rounded-2xl border-l-4 border-l-[var(--accent-rose)]">
                                <p className="text-secondary mb-6">Based on your input, we've identified these key topics that may require extra attention:</p>
                                <div className="flex flex-wrap gap-3">
                                    {weakAreas.map((area, i) => (
                                        <div key={i} className="px-5 py-2.5 bg-[var(--bg-primary)] text-primary border border-primary/10 rounded-lg text-sm font-medium">
                                            {area}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

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
                    className="group p-4 bg-[var(--bg-secondary)] text-primary hover:text-[var(--accent-primary)] rounded-full shadow-2xl transition-all duration-300 border border-white/10 hover:border-[var(--accent-primary)] hover:scale-110"
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
