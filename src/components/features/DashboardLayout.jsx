import React from 'react';
import { FileText, Share2, AlertTriangle, HelpCircle } from 'lucide-react';
import useStudyStore from '../../store/useStudyStore';
import QuizInteractive from '../QuizInteractive';
import Button from '../ui/Button';

const DashboardLayout = () => {
    const { summary, concepts, quiz, weakAreas, addWeakArea, reset } = useStudyStore();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">

            {/* Header Actions */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Study Plan Results</h2>
                    <p className="text-slate-500 mt-1">AI-generated insights based on your material.</p>
                </div>
                <Button variant="secondary" onClick={reset}>
                    Analyze New Content
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Summary & Concepts */}
                <div className="lg:col-span-7 space-y-8">

                    {/* Summary Section */}
                    <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-4 text-indigo-600">
                            <FileText size={24} />
                            <h3 className="text-xl font-bold text-slate-900">Executive Summary</h3>
                        </div>
                        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed">
                            <p>{summary}</p>
                        </div>
                    </section>

                    {/* Concepts Section */}
                    <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-6 text-indigo-600">
                            <Share2 size={24} />
                            <h3 className="text-xl font-bold text-slate-900">Key Concepts</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {concepts.map((concept, i) => (
                                <div key={i} className="p-5 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all">
                                    <h4 className="font-semibold text-slate-900 mb-2">{concept.name}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {concept.related.map((tag, j) => (
                                            <span key={j} className="text-xs font-medium px-2 py-1 bg-white text-slate-600 border border-slate-200 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Weak Areas Section */}
                    {weakAreas.length > 0 && (
                        <section className="bg-red-50 rounded-2xl p-8 border border-red-100">
                            <div className="flex items-center gap-2 mb-4 text-red-600">
                                <AlertTriangle size={24} />
                                <h3 className="text-xl font-bold text-red-900">Focus Areas</h3>
                            </div>
                            <p className="text-red-700 mb-4">You struggled with these topics in the quiz. We recommend reviewing them:</p>
                            <div className="flex flex-wrap gap-3">
                                {weakAreas.map((area, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-white text-red-700 font-medium rounded-lg border border-red-200 shadow-sm">
                                        {area}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                </div>

                {/* Right Column: Quiz */}
                <div className="lg:col-span-5 space-y-8">
                    <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 sticky top-24">
                        <div className="flex items-center gap-2 mb-6 text-indigo-600">
                            <HelpCircle size={24} />
                            <h3 className="text-xl font-bold text-slate-900">Knowledge Check</h3>
                        </div>
                        <QuizInteractive quizData={quiz} onWeakTopicDetected={addWeakArea} />
                    </section>
                </div>

            </div>
        </div>
    );
};

export default DashboardLayout;
