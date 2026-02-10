import React, { useState } from 'react';
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

const QuizInteractive = ({ quizData = [], onWeakTopicDetected }) => {
    const [revealedAnswers, setRevealedAnswers] = useState({});
    const [grades, setGrades] = useState({});

    const toggleReveal = (index) => {
        setRevealedAnswers(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleGrade = (index, isCorrect, topic) => {
        setGrades(prev => ({
            ...prev,
            [index]: isCorrect ? 'correct' : 'incorrect'
        }));

        if (!isCorrect && topic) {
            onWeakTopicDetected(topic);
        }
    };

    if (!quizData || quizData.length === 0) {
        return <p className="text-secondary italic text-center py-8">No quiz questions available.</p>;
    }

    return (
        <div className="space-y-6">
            {quizData.map((item, index) => (
                <div key={index} className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-primary/5 hover:border-[var(--accent-primary)] transition-colors">
                    <div className="flex justify-between items-start gap-4 mb-4">
                        <h4 className="font-medium text-primary text-lg leading-snug break-words">{item.question}</h4>
                        <span className="text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap px-2 py-1 bg-primary/10 rounded">
                            {item.topic}
                        </span>
                    </div>

                    {!revealedAnswers[index] ? (
                        <button
                            onClick={() => toggleReveal(index)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-primary/5 border border-primary/10 rounded-lg text-secondary hover:border-violet-500/50 hover:text-violet-500 transition-colors font-medium text-sm"
                        >
                            <Eye size={16} /> Show Answer
                        </button>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="p-4 bg-[var(--accent-primary)]/10 backdrop-blur-sm rounded-lg border border-[var(--accent-primary)]/20 mb-4">
                                <p className="text-[var(--accent-primary)] font-medium">{item.answer}</p>
                            </div>

                            {!grades[index] ? (
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-sm text-secondary font-medium">Did you get it right?</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleGrade(index, true, item.topic)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 text-sm font-semibold transition-colors"
                                        >
                                            <CheckCircle size={16} /> Yes
                                        </button>
                                        <button
                                            onClick={() => handleGrade(index, false, item.topic)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 text-sm font-semibold transition-colors"
                                        >
                                            <XCircle size={16} /> No
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={`flex items-center gap-2 text-sm font-bold ${grades[index] === 'correct' ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {grades[index] === 'correct' ? (
                                        <><CheckCircle size={18} /> Correct</>
                                    ) : (
                                        <><XCircle size={18} /> Incorrect (Topic flagged)</>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default QuizInteractive;
