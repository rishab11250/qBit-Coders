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
        <div ref={containerRef} className="relative z-10 min-h-screen pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="gsap-stagger flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-4xl font-extrabold text-primary tracking-tight">Your Study Plan</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-secondary">AI Analysis Complete</p>
                        </div>
                    </div>
                    <Button variant="secondary" onClick={reset} className="glass-panel hover:bg-white/10 text-primary border-white/20">
                        <ArrowLeft size={16} className="mr-2" />
                        Analyze New Content
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Summary, Schedule & Concepts */}
                    <div className="lg:col-span-12 xl:col-span-8 space-y-8">

                        {/* Summary Section */}
                        <section className="gsap-stagger relative overflow-hidden rounded-3xl p-8 bg-white/5 border border-white/10 hover:border-white/20 transition-colors group">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 rounded-xl bg-white/10 text-primary border border-white/5 shadow-sm">
                                        <FileText size={20} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-primary tracking-tight">Executive Summary</h3>
                                </div>
                                <div className="prose prose-invert max-w-none text-secondary leading-relaxed text-lg">
                                    <p>{summary}</p>
                                </div>
                            </div>
                        </section>

                        {/* Study Schedule Section */}
                        <section className="gsap-stagger rounded-3xl p-8 bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 rounded-xl bg-white/10 text-primary border border-white/5 shadow-sm">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-primary tracking-tight">Smart Schedule</h3>
                                    <p className="text-sm text-secondary">Your personalized timeline</p>
                                </div>
                            </div>
                            <StudySchedule />
                        </section>

                        {/* Concepts Section */}
                        <section className="gsap-stagger rounded-3xl p-8 bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-white/10 text-primary border border-white/5 shadow-sm">
                                    <Share2 size={20} />
                                </div>
                                <h3 className="text-2xl font-bold text-primary tracking-tight">Knowledge Graph</h3>
                            </div>

                            <div className="h-[450px] w-full relative overflow-hidden rounded-2xl border border-white/5 bg-black/20">
                                <ConceptGraph concepts={concepts} />
                            </div>
                        </section>

                        {/* Weak Areas Section */}
                        {weakAreas.length > 0 && (
                            <section
                                className="gsap-stagger rounded-3xl p-8 border border-red-500/30 bg-red-500/10 backdrop-blur-md"
                            >
                                <div className="flex items-center gap-3 mb-4 text-red-400">
                                    <AlertTriangle size={24} />
                                    <h3 className="text-xl font-bold">Focus Areas</h3>
                                </div>
                                <p className="text-red-200/80 mb-4">You struggled with these topics. We recommend reviewing them:</p>
                                <div className="flex flex-wrap gap-3">
                                    {weakAreas.map((area, i) => (
                                        <span key={i} className="px-4 py-2 bg-red-500/20 text-red-200 font-medium rounded-xl border border-red-500/30">
                                            {area}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                    </div>

                    {/* Right Column: Quiz */}
                    <div className="lg:col-span-12 xl:col-span-4 space-y-8">
                        <section className="gsap-stagger rounded-3xl p-8 bg-white/5 border border-white/10 hover:border-white/20 transition-colors sticky top-24">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-xl bg-white/10 text-primary border border-white/5 shadow-sm">
                                    <HelpCircle size={20} />
                                </div>
                                <h3 className="text-2xl font-bold text-primary tracking-tight">Interactive Quiz</h3>
                            </div>
                            <QuizInteractive quizData={quiz} onWeakTopicDetected={addWeakArea} />
                        </section>
                    </div>

                </div>
            </div>

            {/* Chat Floating Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="gsap-float-btn p-4 bg-[var(--accent-primary)] hover:opacity-90 text-white rounded-full shadow-2xl transition-all duration-300 border-2 border-white/20"
                >
                    <MessageSquare size={24} />
                </button>
            </div>

            {/* Chat Panel */}
            <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
    );
};

export default DashboardLayout;
