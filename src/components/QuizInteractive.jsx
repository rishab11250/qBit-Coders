import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, XCircle, Eye, ChevronRight, ChevronLeft,
    Trophy, Target, RotateCcw, Sparkles, Brain
} from 'lucide-react';

const QuizInteractive = ({ quizData = [], onWeakTopicDetected }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [revealedAnswers, setRevealedAnswers] = useState({});
    const [grades, setGrades] = useState({});
    const [showResults, setShowResults] = useState(false);

    const totalQuestions = quizData.length;
    const answeredCount = Object.keys(grades).length;
    const correctCount = Object.values(grades).filter(g => g === 'correct').length;
    const incorrectCount = answeredCount - correctCount;
    const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    const toggleReveal = useCallback((index) => {
        setRevealedAnswers(prev => ({ ...prev, [index]: !prev[index] }));
    }, []);

    const handleGrade = useCallback((index, isCorrect, topic) => {
        setGrades(prev => ({ ...prev, [index]: isCorrect ? 'correct' : 'incorrect' }));
        if (!isCorrect && topic) onWeakTopicDetected(topic);
    }, [onWeakTopicDetected]);

    const goNext = () => {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setShowResults(true);
        }
    };

    const goPrev = () => {
        if (showResults) { setShowResults(false); return; }
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const resetQuiz = () => {
        setCurrentIndex(0);
        setRevealedAnswers({});
        setGrades({});
        setShowResults(false);
    };

    if (!quizData || totalQuestions === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-secondary">
                <Brain size={48} className="mb-4 opacity-30" />
                <p className="italic text-lg">No quiz questions available.</p>
            </div>
        );
    }

    const item = quizData[currentIndex];
    const isRevealed = revealedAnswers[currentIndex];
    const grade = grades[currentIndex];
    const scorePercent = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

    const cardVariants = {
        enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0, scale: 0.9 }),
        center: { x: 0, opacity: 1, scale: 1 },
        exit: (direction) => ({ x: direction > 0 ? -300 : 300, opacity: 0, scale: 0.9 })
    };

    return (
        <div className="p-6 md:p-8">
            {/* ── Header: Progress + Score ── */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                        <Target size={20} className="text-violet-500" />
                    </div>
                    <div>
                        <p className="text-xs text-secondary font-medium uppercase tracking-wider">Progress</p>
                        <p className="text-sm font-bold text-primary">
                            {answeredCount} / {totalQuestions} answered
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {answeredCount > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-emerald-500 font-bold">{correctCount}✓</span>
                            <span className="text-secondary">·</span>
                            <span className="text-red-400 font-bold">{incorrectCount}✗</span>
                        </div>
                    )}
                    <button onClick={resetQuiz} className="p-2 rounded-lg hover:bg-primary/10 text-secondary hover:text-primary transition-colors cursor-pointer" title="Reset Quiz">
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* ── Progress Bar ── */}
            <div className="w-full h-1.5 bg-primary/10 rounded-full mb-8 overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>

            {/* ── Card Area ── */}
            <div className="relative min-h-[320px]">
                <AnimatePresence mode="wait" custom={1}>
                    {showResults ? (
                        /* ── Results Summary ── */
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.4 }}
                            className="text-center py-8"
                        >
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 mb-6">
                                <Trophy size={40} className={scorePercent >= 70 ? 'text-amber-400' : 'text-secondary'} />
                            </div>

                            <h3 className="text-3xl font-bold text-primary mb-2">Quiz Complete!</h3>
                            <p className="text-secondary mb-8">Here's how you did:</p>

                            {/* Score Ring */}
                            <div className="relative inline-flex items-center justify-center mb-8">
                                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="52" stroke="currentColor" className="text-primary/10" strokeWidth="8" fill="none" />
                                    <motion.circle
                                        cx="60" cy="60" r="52"
                                        stroke="url(#scoreGradient)"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 52}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - scorePercent / 100) }}
                                        transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                                    />
                                    <defs>
                                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#8B5CF6" />
                                            <stop offset="100%" stopColor="#6366F1" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black text-primary">{scorePercent}%</span>
                                    <span className="text-xs text-secondary">Score</span>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex justify-center gap-6 mb-8">
                                <div className="flex flex-col items-center gap-1 px-6 py-3 rounded-xl bg-emerald-500/10">
                                    <CheckCircle2 size={20} className="text-emerald-500" />
                                    <span className="text-2xl font-bold text-emerald-500">{correctCount}</span>
                                    <span className="text-xs text-secondary">Correct</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 px-6 py-3 rounded-xl bg-red-500/10">
                                    <XCircle size={20} className="text-red-400" />
                                    <span className="text-2xl font-bold text-red-400">{incorrectCount}</span>
                                    <span className="text-xs text-secondary">Incorrect</span>
                                </div>
                            </div>

                            <button
                                onClick={resetQuiz}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-violet-500/25 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                            >
                                <RotateCcw size={16} /> Retake Quiz
                            </button>
                        </motion.div>
                    ) : (
                        /* ── Question Card ── */
                        <motion.div
                            key={currentIndex}
                            custom={1}
                            variants={cardVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                        >
                            {/* Question Number + Topic */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-sm font-bold">
                                        {currentIndex + 1}
                                    </span>
                                    <span className="text-xs text-secondary font-medium">of {totalQuestions}</span>
                                </div>
                                {item.topic && (
                                    <span className="text-xs font-semibold text-violet-500 bg-violet-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
                                        {item.topic}
                                    </span>
                                )}
                            </div>

                            {/* Question Text */}
                            <h4 className="text-xl md:text-2xl font-semibold text-primary leading-relaxed mb-8">
                                {item.question}
                            </h4>

                            {/* Answer Section */}
                            {!isRevealed ? (
                                <motion.button
                                    onClick={() => toggleReveal(currentIndex)}
                                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-dashed border-primary/15 text-secondary hover:text-violet-500 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all duration-300 font-medium cursor-pointer"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    <Eye size={20} />
                                    <span>Reveal Answer</span>
                                </motion.button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Answer Display */}
                                    <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 mb-5">
                                        <div className="flex items-start gap-3">
                                            <Sparkles size={18} className="text-violet-500 mt-1 flex-shrink-0" />
                                            <p className="text-primary font-medium leading-relaxed">{item.answer}</p>
                                        </div>
                                    </div>

                                    {/* Self-Grade */}
                                    {!grade ? (
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5">
                                            <p className="text-sm text-secondary font-medium">Did you know the answer?</p>
                                            <div className="flex gap-2">
                                                <motion.button
                                                    onClick={() => handleGrade(currentIndex, true, item.topic)}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500/20 font-semibold text-sm transition-colors cursor-pointer"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <CheckCircle2 size={16} /> I knew it
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => handleGrade(currentIndex, false, item.topic)}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 font-semibold text-sm transition-colors cursor-pointer"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <XCircle size={16} /> Not quite
                                                </motion.button>
                                            </div>
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={`flex items-center gap-2 p-4 rounded-xl font-bold text-sm ${grade === 'correct'
                                                    ? 'bg-emerald-500/10 text-emerald-500'
                                                    : 'bg-red-500/10 text-red-400'
                                                }`}
                                        >
                                            {grade === 'correct' ? (
                                                <><CheckCircle2 size={18} /> Great job! You got it right.</>
                                            ) : (
                                                <><XCircle size={18} /> No worries — this topic has been flagged for review.</>
                                            )}
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Navigation ── */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-primary/10">
                <button
                    onClick={goPrev}
                    disabled={currentIndex === 0 && !showResults}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-secondary hover:text-primary hover:bg-primary/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                    <ChevronLeft size={16} /> Previous
                </button>

                {/* Dot Indicators */}
                <div className="flex gap-1.5">
                    {quizData.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => { setShowResults(false); setCurrentIndex(i); }}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${i === currentIndex && !showResults
                                    ? 'bg-violet-500 scale-125'
                                    : grades[i] === 'correct'
                                        ? 'bg-emerald-500/60'
                                        : grades[i] === 'incorrect'
                                            ? 'bg-red-400/60'
                                            : 'bg-primary/15 hover:bg-primary/30'
                                }`}
                        />
                    ))}
                </div>

                <button
                    onClick={goNext}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
                >
                    {currentIndex === totalQuestions - 1 && !showResults ? 'See Results' : 'Next'} <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default QuizInteractive;
