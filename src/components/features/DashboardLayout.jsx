import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Share2, AlertTriangle, HelpCircle, ArrowLeft } from 'lucide-react';
import useStudyStore from '../../store/useStudyStore';
import QuizInteractive from '../QuizInteractive';
import Button from '../ui/Button';
import ConceptGraph from '../ConceptGraph';

const DashboardLayout = () => {
    const { summary, concepts, quiz, weakAreas, addWeakArea, reset } = useStudyStore();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <div className="relative z-10 min-h-screen pb-12">
            <motion.div
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >

                <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
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
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Summary & Concepts */}
                    <div className="lg:col-span-7 space-y-8">

                        {/* Summary Section */}
                        <motion.section variants={itemVariants} className="glass-panel rounded-3xl p-8 border-violet-500/20">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-violet-500/20 text-violet-500 border border-violet-500/30">
                                    <FileText size={24} />
                                </div>
                                <h3 className="text-2xl font-bold text-primary">Executive Summary</h3>
                            </div>
                            <div className="prose prose-invert max-w-none text-secondary leading-relaxed text-lg">
                                <p>{summary}</p>
                            </div>
                        </motion.section>

                        {/* Concepts Section */}
                        <motion.section variants={itemVariants} className="glass-panel rounded-3xl p-8 border-fuchsia-500/20">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-500 border border-fuchsia-500/30">
                                    <Share2 size={24} />
                                </div>
                                <h3 className="text-2xl font-bold text-primary">Knowledge Graph</h3>
                            </div>

                            <div className="h-[450px] w-full relative overflow-hidden rounded-2xl border border-white/5 bg-black/5">
                                <ConceptGraph concepts={concepts} />
                            </div>
                        </motion.section>

                        {/* Weak Areas Section */}
                        {weakAreas.length > 0 && (
                            <motion.section
                                variants={itemVariants}
                                className="rounded-3xl p-8 border border-red-500/30 bg-red-500/10 backdrop-blur-md"
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
                            </motion.section>
                        )}

                    </div>

                    {/* Right Column: Quiz */}
                    <div className="lg:col-span-5 space-y-8">
                        <motion.section variants={itemVariants} className="glass-panel rounded-3xl p-8 border-cyan-500/20 sticky top-24">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-500 border border-cyan-500/30">
                                    <HelpCircle size={24} />
                                </div>
                                <h3 className="text-2xl font-bold text-primary">Interactive Quiz</h3>
                            </div>
                            <QuizInteractive quizData={quiz} onWeakTopicDetected={addWeakArea} />
                        </motion.section>
                    </div>

                </div>
            </motion.div>
        </div>
    );
};

export default DashboardLayout;
