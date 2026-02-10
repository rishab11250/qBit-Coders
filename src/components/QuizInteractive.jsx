import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CheckCircle, XCircle, Eye, Clock, Trophy, ArrowRight, RotateCcw, Zap, Target, Filter, ChevronDown, RefreshCw, Flame, ChevronRight, Award, BarChart } from 'lucide-react';
import { generateStudyContent } from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import useStudyStore from '../store/useStudyStore';

const TIMER_DURATION = 30;

const QuizInteractive = ({ quizData = [], onWeakTopicDetected }) => {
    const { addQuizResult, weakAreas, quizHistory, processedContent, setQuiz } = useStudyStore();

    // Mode: 'start' | 'active' | 'results'
    const [mode, setMode] = useState('start');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0); // New: Streak Counter
    const [answers, setAnswers] = useState({});
    const [showAnswer, setShowAnswer] = useState(false);
    const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [filterMode, setFilterMode] = useState('all'); // 'all' | 'weak'
    const [selectedCount, setSelectedCount] = useState(5);
    const [quizTotal, setQuizTotal] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);

    // Feedback State
    const [feedbackState, setFeedbackState] = useState(null); // 'correct' | 'incorrect' | null

    const timerRef = useRef(null);
    const answeredRef = useRef({});

    // Derive weak topics from quiz history
    const historicalWeakTopics = useMemo(() => {
        const topicMap = {};
        quizHistory.forEach(q => {
            if (q.topicScores) {
                Object.entries(q.topicScores).forEach(([topic, data]) => {
                    if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
                    topicMap[topic].correct += data.correct;
                    topicMap[topic].total += data.total;
                });
            }
        });
        return Object.entries(topicMap)
            .filter(([_, d]) => d.total > 0 && (d.correct / d.total) < 0.7)
            .map(([topic]) => topic);
    }, [quizHistory]);

    // Combine store weakAreas + historical weak topics
    const allWeakTopics = useMemo(() => {
        const unique = new Set([...(weakAreas || []), ...historicalWeakTopics]);
        return Array.from(unique);
    }, [weakAreas, historicalWeakTopics]);

    // Intersect global weak topics with CURRENT quiz topics
    const relevantWeakTopics = useMemo(() => {
        if (!quizData || quizData.length === 0) return [];
        const currentTopics = new Set(quizData.map(q => q.topic?.toLowerCase()).filter(Boolean));
        return allWeakTopics.filter(wt =>
            currentTopics.has(wt.toLowerCase()) ||
            quizData.some(q => q.topic?.toLowerCase().includes(wt.toLowerCase()))
        );
    }, [allWeakTopics, quizData]);

    // Filter questions based on mode
    const activeQuizData = useMemo(() => {
        if (filterMode === 'weak' && relevantWeakTopics.length > 0) {
            const filtered = quizData.filter(q =>
                q.topic && relevantWeakTopics.some(wt =>
                    wt.toLowerCase().includes(q.topic.toLowerCase()) ||
                    q.topic.toLowerCase().includes(wt.toLowerCase())
                )
            );
            return filtered.length > 0 ? filtered : quizData;
        }
        return quizData;
    }, [quizData, filterMode, relevantWeakTopics]);

    // Slice based on selected count
    const finalQuizData = useMemo(() => {
        const limit = mode === 'start' ? selectedCount : quizTotal;
        return activeQuizData.slice(0, limit);
    }, [activeQuizData, selectedCount, quizTotal, mode]);

    const total = finalQuizData.length;
    const currentQ = finalQuizData[currentIndex];

    // Timer Logic
    useEffect(() => {
        if (isTimerActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timeLeft === 0 && isTimerActive) {
            setIsTimerActive(false);
            if (!answeredRef.current[currentIndex]) {
                handleTimeout();
            }
        }
        return () => clearInterval(timerRef.current);
    }, [isTimerActive, timeLeft, currentIndex]);

    const handleTimeout = () => {
        setShowAnswer(true);
        if (!answeredRef.current[currentIndex]) {
            answeredRef.current[currentIndex] = true;
            setAnswers(prev => ({
                ...prev,
                [currentIndex]: { isCorrect: false, topic: currentQ?.topic }
            }));
            setStreak(0); // Reset streak
            setFeedbackState('incorrect');
            if (currentQ?.topic) onWeakTopicDetected?.(currentQ.topic);
        }
    };

    const startQuiz = (selectedMode = 'all') => {
        setQuizTotal(selectedCount);
        setFilterMode(selectedMode);
        setMode('active');
        setCurrentIndex(0);
        setScore(0);
        setStreak(0);
        setAnswers({});
        setShowAnswer(false);
        setFeedbackState(null);
        setTimeLeft(TIMER_DURATION);
        setIsTimerActive(true);
        answeredRef.current = {};
    };

    const handleRegenerate = async () => {
        if (!processedContent?.text) return;
        try {
            setIsGenerating(true);
            const result = await generateStudyContent('text', processedContent.text);
            if (result && result.quiz && result.quiz.length > 0) {
                setQuiz(result.quiz);
                setSelectedCount(Math.min(20, result.quiz.length));
            }
        } catch (error) {
            console.error("Failed to regenerate quiz:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReveal = () => {
        setIsTimerActive(false);
        setShowAnswer(true);
    };

    const handleGrade = useCallback((isCorrect) => {
        if (answeredRef.current[currentIndex]) return;
        answeredRef.current[currentIndex] = true;

        setIsTimerActive(false);
        setAnswers(prev => ({
            ...prev,
            [currentIndex]: { isCorrect, topic: currentQ?.topic }
        }));

        if (isCorrect) {
            setScore(s => s + 1);
            setStreak(s => s + 1);
            setFeedbackState('correct');
        } else {
            setStreak(0);
            setFeedbackState('incorrect');
            if (currentQ?.topic) onWeakTopicDetected?.(currentQ.topic);
        }
    }, [currentIndex, currentQ, onWeakTopicDetected]);

    const nextQuestion = () => {
        if (currentIndex + 1 >= total) {
            finishQuiz();
        } else {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setShowAnswer(false);
            setFeedbackState(null);
            setTimeLeft(TIMER_DURATION);
            setIsTimerActive(true);
        }
    };

    const finishQuiz = () => {
        setMode('results');
        setIsTimerActive(false);

        const finalAnswers = { ...answers };
        const weakTopics = [...new Set(
            Object.values(finalAnswers)
                .filter(a => !a.isCorrect && a.topic)
                .map(a => a.topic)
        )];

        const topicScores = {};
        Object.values(finalAnswers).forEach(a => {
            if (a.topic) {
                if (!topicScores[a.topic]) topicScores[a.topic] = { correct: 0, total: 0 };
                topicScores[a.topic].total++;
                if (a.isCorrect) topicScores[a.topic].correct++;
            }
        });

        const finalScore = Object.values(finalAnswers).filter(a => a.isCorrect).length;

        addQuizResult({
            score: finalScore,
            total: quizTotal,
            weakTopics,
            topicScores
        });
    };

    if (!quizData || quizData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Zap className="text-secondary/50" />
                </div>
                <p className="text-secondary italic">No quiz questions available yet.</p>
            </div>
        );
    }

    // Timer ring visual
    const circumference = 2 * Math.PI * 22; // Slightly larger
    const progress = timeLeft / TIMER_DURATION;
    const strokeDashoffset = circumference - (progress * circumference);
    const timerColor = timeLeft <= 5 ? '#f43f5e' : timeLeft <= 10 ? '#f59e0b' : '#a78bfa';

    return (
        <div className="relative overflow-hidden rounded-3xl bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -z-10 animate-pulse-slow pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse-slow pointer-events-none" />

            <div className="p-6 md:p-10 min-h-[500px] flex flex-col items-center justify-center relative z-10">
                <AnimatePresence mode="wait">
                    {/* START SCREEN */}
                    {mode === 'start' && (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: "backOut" }}
                            className="text-center max-w-lg mx-auto"
                        >
                            <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-500/10 backdrop-blur-md">
                                <Trophy size={42} className="text-violet-400 drop-shadow-lg" />
                            </div>

                            <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-violet-200 mb-3 tracking-tight">
                                Knowledge Check
                            </h3>
                            <p className="text-secondary/80 text-lg mb-8 leading-relaxed">
                                Put your skills to the test! You have <strong>{quizData.length}</strong> questions ready.
                            </p>

                            {/* Settings Card */}
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 mb-8 backdrop-blur-sm">
                                <div className="flex items-center justify-between gap-6 mb-2">
                                    <span className="text-sm text-secondary font-medium uppercase tracking-wider">Number of Questions</span>
                                    <div className="relative group">
                                        <select
                                            value={selectedCount}
                                            onChange={(e) => setSelectedCount(Number(e.target.value))}
                                            className="appearance-none bg-black/40 hover:bg-black/60 text-white font-bold py-2.5 pl-5 pr-10 rounded-xl border border-white/10 focus:outline-none focus:border-violet-500 transition-all cursor-pointer min-w-[100px]"
                                        >
                                            {[5, 10, 15, 20].map(n => (
                                                <option key={n} value={n} className="bg-gray-900">{n}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none group-hover:text-violet-400 transition-colors" />
                                    </div>
                                </div>

                                {(quizData.length < selectedCount || quizData.length < 20) && (processedContent?.text || useStudyStore.getState().extractedText) && (
                                    <button
                                        onClick={handleRegenerate}
                                        disabled={isGenerating}
                                        className="w-full mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 py-3 rounded-xl border border-violet-500/20 transition-all disabled:opacity-50"
                                    >
                                        <RefreshCw size={14} className={`transition-transform duration-700 ${isGenerating ? 'animate-spin' : ''}`} />
                                        {isGenerating ? 'Generating...' : 'Load More Questions'}
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => startQuiz('all')}
                                    className="group w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg shadow-xl shadow-violet-900/20 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-white/10 flex items-center justify-center gap-3"
                                >
                                    Start Quiz <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>

                                {relevantWeakTopics.length > 0 && (
                                    <button
                                        onClick={() => startQuiz('weak')}
                                        className="w-full py-4 rounded-xl bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 hover:bg-rose-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        <Target size={18} /> Focus on Weak Areas
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ACTIVE QUIZ */}
                    {mode === 'active' && currentQ && (
                        <motion.div
                            key="active"
                            className="w-full max-w-2xl mx-auto"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* HUD */}
                            <div className="flex items-center justify-between mb-8 bg-white/5 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Progress</span>
                                        <span className="text-xl font-black text-white">{currentIndex + 1}<span className="text-base font-medium text-white/30">/{total}</span></span>
                                    </div>
                                    <div className="h-10 w-[1px] bg-white/10" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Score</span>
                                        <div className="flex items-center gap-1.5">
                                            <Award size={16} className="text-yellow-400" />
                                            <span className="text-xl font-black text-white">{score}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Streak Badge */}
                                <AnimatePresence>
                                    {streak > 1 && (
                                        <motion.div
                                            initial={{ scale: 0, rotate: -10 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            exit={{ scale: 0 }}
                                            className="px-3 py-1 bg-orange-500/20 border border-orange-500/40 rounded-full flex items-center gap-1.5"
                                        >
                                            <Flame size={14} className="text-orange-500 fill-orange-500 animate-pulse" />
                                            <span className="text-sm font-bold text-orange-400">{streak} Streak!</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Timer */}
                                <div className="relative w-14 h-14 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 50 50">
                                        <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                        <circle
                                            cx="25" cy="25" r="22" fill="none"
                                            stroke={timerColor}
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={strokeDashoffset}
                                            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
                                        />
                                    </svg>
                                    <span className={`absolute text-sm font-black ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                                        {timeLeft}
                                    </span>
                                </div>
                            </div>

                            {/* Question Card */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentIndex}
                                    initial={{ x: 50, opacity: 0 }}
                                    animate={{
                                        x: feedbackState === 'incorrect' ? [0, -10, 10, -10, 10, 0] : 0, // Shake animation
                                        opacity: 1
                                    }}
                                    exit={{ x: -50, opacity: 0 }}
                                    transition={{ duration: 0.3, type: "spring", damping: 25 }}
                                    className={`relative bg-white/5 border backdrop-blur-md rounded-3xl p-8 mb-6 shadow-2xl overflow-hidden
                                        ${feedbackState === 'correct' ? 'border-emerald-500/50 bg-emerald-500/5 shadow-emerald-500/20' :
                                            feedbackState === 'incorrect' ? 'border-rose-500/50 bg-rose-500/5 shadow-rose-500/20' : 'border-white/10'}
                                    `}
                                >
                                    {/* Topic Badge */}
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/20 uppercase tracking-wider">
                                            <Target size={12} /> {currentQ.topic || 'General Knowledge'}
                                        </span>
                                        {currentQ.type && (
                                            <span className="text-[10px] text-secondary font-medium bg-white/5 px-2 py-1 rounded">
                                                {currentQ.type}
                                            </span>
                                        )}
                                    </div>

                                    <h4 className="text-2xl font-semibold text-white leading-relaxed mb-4">
                                        {currentQ.question}
                                    </h4>

                                    {/* Answer Section */}
                                    <AnimatePresence>
                                        {showAnswer && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                animate={{ height: "auto", opacity: 1, marginTop: 24 }}
                                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-5 bg-black/30 rounded-2xl border border-white/5 relative">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-indigo-500 rounded-l-2xl" />
                                                    <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">Correct Answer</p>
                                                    <p className="text-white text-lg leading-relaxed">{currentQ.answer}</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </AnimatePresence>

                            {/* Controls */}
                            <div className="space-y-4">
                                {!showAnswer ? (
                                    <button
                                        onClick={handleReveal}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                                    >
                                        <Eye size={20} /> Reveal Answer
                                    </button>
                                ) : (
                                    <div className="space-y-4">
                                        {!answeredRef.current[currentIndex] ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    onClick={() => handleGrade(false)}
                                                    className="py-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-400 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                                >
                                                    <XCircle size={20} /> I Missed It
                                                </button>
                                                <button
                                                    onClick={() => handleGrade(true)}
                                                    className="py-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-400 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle size={20} /> I Knew It
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={nextQuestion}
                                                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl text-white font-bold shadow-lg shadow-violet-900/40 hover:shadow-violet-500/60 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                            >
                                                {currentIndex + 1 >= total ? 'Finish Quiz' : 'Next Question'} <ArrowRight size={20} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* RESULTS SCREEN */}
                    {mode === 'results' && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="text-center w-full max-w-lg mx-auto"
                        >
                            <div className="relative w-40 h-40 mx-auto mb-8">
                                <svg className="w-full h-full -rotate-90 drop-shadow-2xl" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                    <motion.circle
                                        cx="50" cy="50" r="44" fill="none"
                                        stroke={score / quizTotal >= 0.7 ? '#10b981' : score / quizTotal >= 0.4 ? '#f59e0b' : '#f43f5e'}
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 44}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                                        animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - score / quizTotal) }}
                                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-white tracking-tighter">{Math.round((score / quizTotal) * 100)}%</span>
                                    <span className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">Accuracy</span>
                                </div>
                            </div>

                            <h3 className="text-3xl font-bold text-white mb-2">
                                {score / quizTotal >= 0.9 ? 'Masterful! 🌟' :
                                    score / quizTotal >= 0.7 ? 'Great Job! 🚀' :
                                        score / quizTotal >= 0.5 ? 'Good Effort 👍' : 'Keep Practicing 💪'}
                            </h3>
                            <p className="text-secondary/80 mb-10">
                                You correctly answered <strong>{score}</strong> out of <strong>{quizTotal}</strong> questions.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => startQuiz('all')}
                                    className="py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                >
                                    <RotateCcw size={18} /> Retake Quiz
                                </button>

                                {filterMode !== 'weak' && relevantWeakTopics.length > 0 && (
                                    <button
                                        onClick={() => startQuiz('weak')}
                                        className="py-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-rose-400 font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                    >
                                        <Target size={18} /> Review Weak Areas
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default QuizInteractive;
