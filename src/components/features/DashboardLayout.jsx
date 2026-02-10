import React, { useState, useRef, useEffect } from 'react';
import { FileText, Share2, AlertTriangle, HelpCircle, ArrowLeft, MessageSquare, Calendar, BarChart3, Check, Link2, Target, Flame, Crosshair, Lightbulb, BookMarked, BrainCircuit, Atom, Puzzle, Eye, Sparkles, ArrowUp, Bot } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import useStudyStore from '../../store/useStudyStore';
import QuizInteractive from '../QuizInteractive';
import Button from '../ui/Button';
import ConceptGraph from '../ConceptGraph';
import ChatPanel from './ChatPanel';
import StudySchedule from './StudySchedule';
import ProgressDashboard from './ProgressDashboard';
import StudyMaterial from './StudyMaterial'; // [NEW] Import StudyMaterial
import SidebarNav from '../layout/SidebarNav';

const DashboardLayout = () => {
    const { summary, concepts, studyMaterial, quiz, weakAreas, addWeakArea, reset, isChatOpen, setIsChatOpen } = useStudyStore();
    const [shareToast, setShareToast] = useState(false);
    const containerRef = useRef(null);
    const [activeSection, setActiveSection] = useState('summary');
    const [showBackToTop, setShowBackToTop] = useState(false);

    // Back to Top Logic
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Scroll Logic
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSection(id);
        }
    };

    // Reliable Scroll Spy with Resize Handling
    useEffect(() => {
        const handleScroll = () => {
            const sections = ['summary', 'knowledge', 'material', 'focus', 'quiz', 'timeline', 'progress'];

            // Find the section that is currently most active in viewport
            for (const id of sections) {
                const element = document.getElementById(id);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    // Check if top of section is within upper viewport area (adjust 150 for navbar/padding)
                    if (rect.top <= 150 && rect.bottom >= 150) {
                        setActiveSection(id);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        // Also listen for resize changes (like accordion opening)
        window.addEventListener('resize', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [studyMaterial]); // Re-run when content changes

    useGSAP(() => {
        gsap.from('.gsap-stagger', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out"
        });
    }, { scope: containerRef });

    const handleShare = () => {
        try {
            const { summary, topics, concepts, quiz } = useStudyStore.getState();
            const planData = { summary, topics, concepts, quiz };
            const jsonStr = JSON.stringify(planData);
            // Compress with btoa
            const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
            const shareUrl = `${window.location.origin}${window.location.pathname}#shared=${encoded}`;

            navigator.clipboard.writeText(shareUrl).then(() => {
                setShareToast(true);
                setTimeout(() => setShareToast(false), 3000);
            }).catch(() => {
                // Fallback: prompt user
                prompt('Copy this link to share your study plan:', shareUrl);
            });
        } catch (err) {
            console.error('Share failed:', err);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left Sidebar Navigation */}
            <div className="hidden md:block w-20 border-r border-white/5 relative z-40">
                <div className="fixed top-20 bottom-0 w-20">
                    <SidebarNav activeSection={activeSection} scrollToSection={scrollToSection} />
                </div>
            </div>

            {/* Mobile Navigation (Bottom or Top - simplified for now) */}
            {/* Consider a bottom bar for mobile later */}

            {/* Main Content Area */}
            <div ref={containerRef} className="flex-1 min-w-0 relative z-10 pb-20">
                <div className="max-w-5xl mx-auto px-6 py-12">

                    {/* Header Area */}
                    <div className="gsap-stagger mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <p className="text-secondary text-xs font-bold tracking-widest uppercase">Analysis Complete</p>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-primary tracking-tight leading-[1.1]">
                                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-purple-400">Study Plan</span>
                            </h2>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={handleShare} className="glass-panel text-primary text-sm px-4 py-2.5 rounded-xl hover:border-violet-500/50 transition-colors">
                                <Share2 size={16} className="mr-2" />
                                Share
                            </Button>
                            <Button variant="secondary" onClick={reset} className="glass-panel text-primary text-sm px-5 py-2.5 rounded-xl hover:border-[var(--accent-primary)] transition-colors">
                                <ArrowLeft size={16} className="mr-2" />
                                New Analysis
                            </Button>
                        </div>
                    </div>



                    <div className="space-y-16">

                        {/* Summary Section — Premium */}
                        <section id="summary" className="gsap-stagger scroll-mt-24">
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
                                    <div data-tour="summary-section">
                                        {/* Section Header */}
                                        <div className="mb-6 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center border border-violet-500/20">
                                                <FileText size={18} className="text-violet-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-primary">Executive Summary</h3>
                                                <p className="text-xs text-secondary mt-0.5">AI-generated overview of your content</p>
                                            </div>
                                        </div>

                                        <div className="glass-panel rounded-3xl p-8 md:p-10 relative overflow-hidden transition-all hover:border-[var(--accent-primary)]/30 duration-500">
                                            {/* Ambient glows */}
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/[0.07] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                                            <div className="relative z-10">
                                                {typeof summary === 'object' && summary !== null ? (
                                                    <div className="space-y-10">
                                                        {/* Simple Explanation */}
                                                        {summary.simple_explanation && (
                                                            <div className="relative">
                                                                <div className="flex items-center gap-2 mb-4">
                                                                    <Lightbulb size={14} className="text-amber-400" />
                                                                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">In Simple Terms</span>
                                                                </div>
                                                                <div className="relative pl-6 border-l-2 border-violet-500/30">
                                                                    <p className="text-primary text-lg md:text-xl font-light leading-relaxed tracking-tight">
                                                                        {summary.simple_explanation}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Key Takeaways */}
                                                        {summary.executive_brief && (
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-5">
                                                                    <Sparkles size={14} className="text-cyan-400" />
                                                                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Key Takeaways</span>
                                                                </div>
                                                                {Array.isArray(summary.executive_brief) ? (
                                                                    <div className="grid md:grid-cols-2 gap-4">
                                                                        {summary.executive_brief.map((item, i) => {
                                                                            const color = takeawayColors[i % takeawayColors.length];
                                                                            return (
                                                                                <div
                                                                                    key={i}
                                                                                    className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
                                                                                    style={{
                                                                                        background: color.bg,
                                                                                        border: `1px solid ${color.border}`,
                                                                                    }}
                                                                                >
                                                                                    <div className="flex items-start gap-3">
                                                                                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${color.gradient} flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5`}>
                                                                                            <span className="text-white text-[10px] font-bold">{i + 1}</span>
                                                                                        </div>
                                                                                        <p className="text-primary/90 text-sm leading-relaxed">{item}</p>
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
                                                        <p className="text-primary text-xl font-light leading-relaxed">{summary}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </section>

                        {/* Knowledge Graph Section */}
                        <section id="knowledge" className="gsap-stagger scroll-mt-24" data-tour="knowledge-map">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                    <Share2 size={18} className="text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-primary">Knowledge Map</h3>
                                    <p className="text-xs text-secondary mt-0.5">Interactive concept tree</p>
                                </div>
                            </div>

                            <div className="relative rounded-3xl overflow-hidden border border-cyan-500/10 shadow-lg shadow-cyan-500/5 transition-all hover:border-cyan-500/30">
                                <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                                    <div className="flex items-center gap-2 bg-[var(--bg-secondary)]/80 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-primary/5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-medium text-secondary uppercase tracking-wider">Live Graph</span>
                                    </div>
                                </div>

                                <div className="h-[500px] w-full bg-[var(--bg-secondary)] relative z-10">
                                    <ConceptGraph concepts={concepts} />
                                </div>
                            </div>
                        </section>

                        {/* Study Material Section [NEW] */}
                        {studyMaterial && studyMaterial.length > 0 && (
                            <section id="material" className="gsap-stagger scroll-mt-24" data-tour="material-section">
                                <StudyMaterial material={studyMaterial} />
                            </section>
                        )}

                        {/* Focus Areas Section */}
                        {weakAreas.length > 0 && (
                            <section id="focus" className="gsap-stagger scroll-mt-24" data-tour="summary-section">
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                        <Target size={18} className="text-rose-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-primary">Focus Areas</h3>
                                        <p className="text-xs text-secondary mt-0.5">{weakAreas.length} topics identified</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {weakAreas.map((area, i) => (
                                        <div
                                            key={i}
                                            className="group relative overflow-hidden rounded-2xl bg-[var(--bg-secondary)] border border-rose-500/20 p-5 hover:border-rose-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-500/10"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                                                    <Target size={14} className="text-rose-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Topic {i + 1}</p>
                                                    <p className="text-primary font-medium text-sm leading-snug">{area}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Quiz Section */}
                        <section id="quiz" className="gsap-stagger scroll-mt-24" data-tour="quiz-section">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                    <HelpCircle size={18} className="text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-primary">Interactive Quiz</h3>
                                    <p className="text-xs text-secondary mt-0.5">Test your understanding</p>
                                </div>
                            </div>

                            <QuizInteractive quizData={quiz} onWeakTopicDetected={addWeakArea} />
                        </section>

                        {/* Timeline Section */}
                        <section id="timeline" className="gsap-stagger scroll-mt-24" data-tour="schedule-section">
                            <StudySchedule />
                        </section>

                        {/* Progress Section */}
                        <section id="progress" className="gsap-stagger scroll-mt-24" data-tour="progress-section">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <BarChart3 size={18} className="text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-primary">Your Progress</h3>
                                    <p className="text-xs text-secondary mt-0.5">Track your learning journey</p>
                                </div>
                            </div>
                            <div className="glass-panel rounded-2xl p-6 md:p-8 transition-all hover:border-blue-500/30">
                                <ProgressDashboard />
                            </div>
                        </section>

                    </div>
                </div>

                {/* Back to Top Button */}
                <button
                    onClick={scrollToTop}
                    className={`fixed bottom-28 right-8 z-40 p-3 bg-[var(--bg-secondary)] text-secondary hover:text-primary rounded-full shadow-lg border border-white/10 transition-all duration-300 hover:scale-110 ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
                >
                    <ArrowUp size={20} />
                </button>

                {/* Chat Floating Button - Redesigned (3D Glossy) */}
                <div className="fixed bottom-8 right-8 z-50">
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="group relative flex items-center justify-center p-4 rounded-full transition-all duration-300 hover:scale-110 hover:-translate-y-1"
                        style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                            boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.5), 0 8px 10px -6px rgba(124, 58, 237, 0.1), inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.2)'
                        }}
                    >
                        {/* Shine Effect */}
                        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-full blur-[2px] pointer-events-none" />

                        {/* Active Status Dot */}
                        <span className="absolute top-0 right-0 flex h-3.5 w-3.5 z-20">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[var(--bg-primary)]"></span>
                        </span>

                        {/* Icon */}
                        <Bot size={28} className="relative z-10 text-white drop-shadow-md" strokeWidth={1.5} />

                        {/* Label on Hover */}
                        <div className="absolute right-full mr-4 px-4 py-2 rounded-xl bg-slate-900/90 text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 pointer-events-none backdrop-blur-md border border-white/10 shadow-xl">
                            Ask AI Assistant
                        </div>
                    </button>
                    {/* Ripple/Pulse Effect (Subtle) */}
                    <div className="absolute inset-0 -z-10 rounded-full border border-violet-500/20 scale-100 animate-ping" style={{ animationDuration: '3s' }} />
                </div>

                {/* Chat Panel */}
                <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
            </div>
            {/* Share Toast - Moved to root to avoid z-index stacking issues */}
            <AnimatePresence>
                {shareToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: 20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -20, x: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed top-24 right-6 z-[100] flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium shadow-2xl backdrop-blur-md"
                    >
                        <Check size={16} />
                        Link copied to clipboard!
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardLayout;
