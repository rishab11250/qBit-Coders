import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CheckCircle, XCircle, Eye, Clock, Trophy, ArrowRight, RotateCcw, Zap, Target, Filter, ChevronDown, RefreshCw } from 'lucide-react';
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
    const [answers, setAnswers] = useState({});
    const [showAnswer, setShowAnswer] = useState(false);
    const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [filterMode, setFilterMode] = useState('all'); // 'all' | 'weak'
    const [selectedCount, setSelectedCount] = useState(5); // Default to 5 questions
    const [quizTotal, setQuizTotal] = useState(5); // Track the total for the CURRENT active/finished quiz
    const [isGenerating, setIsGenerating] = useState(false);
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
        // Topics with < 70% accuracy
        return Object.entries(topicMap)
            .filter(([_, d]) => d.total > 0 && (d.correct / d.total) < 0.7)
            .map(([topic]) => topic);
    }, [quizHistory]);

    // Combine store weakAreas + historical weak topics
    const allWeakTopics = useMemo(() => {
        const unique = new Set([...(weakAreas || []), ...historicalWeakTopics]);
        return Array.from(unique);
    }, [weakAreas, historicalWeakTopics]);

    // Filter questions based on mode
    const activeQuizData = useMemo(() => {
        if (filterMode === 'weak' && allWeakTopics.length > 0) {
            const filtered = quizData.filter(q =>
                q.topic && allWeakTopics.some(wt =>
                    wt.toLowerCase().includes(q.topic.toLowerCase()) ||
                    q.topic.toLowerCase().includes(wt.toLowerCase())
                )
            );
            return filtered.length > 0 ? filtered : quizData;
        }
        return quizData;
    }, [quizData, filterMode, allWeakTopics]);

    // Slice based on selected count
    const finalQuizData = useMemo(() => {
        // Use quizTotal when active/results to Lock the set, selectedCount for start screen
        const limit = mode === 'start' ? selectedCount : quizTotal;
        return activeQuizData.slice(0, limit);
    }, [activeQuizData, selectedCount, quizTotal, mode]);

    const total = finalQuizData.length;
    const currentQ = finalQuizData[currentIndex];

    // Timer Logic using setInterval for better reliability
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
            // Time ran out
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
            if (currentQ?.topic) onWeakTopicDetected?.(currentQ.topic);
        }
    };

    const startQuiz = (selectedMode = 'all') => {
        setQuizTotal(selectedCount); // LOCK the total for this session
        setFilterMode(selectedMode);
        setMode('active');
        setCurrentIndex(0);
        setScore(0);
        setAnswers({});
        setShowAnswer(false);
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
        } else if (currentQ?.topic) {
            onWeakTopicDetected?.(currentQ.topic);
        }
    }, [currentIndex, currentQ, onWeakTopicDetected]);

    const nextQuestion = () => {
        if (currentIndex + 1 >= total) {
            finishQuiz();
        } else {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setShowAnswer(false);
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
            total: quizTotal, // Use quizTotal for consistent history
            weakTopics,
            topicScores
        });
    };

    if (!quizData || quizData.length === 0) {
        return <p className="text-secondary italic text-center py-8">No quiz questions available.</p>;
    }

    // Timer ring visual
    const circumference = 2 * Math.PI * 18;
    const progress = timeLeft / TIMER_DURATION;
    const strokeDashoffset = circumference - (progress * circumference);
    const timerColor = timeLeft <= 5 ? '#f43f5e' : timeLeft <= 10 ? '#f59e0b' : '#14b8a6';

    return (
        <div className="p-6 md:p-8">
            <AnimatePresence mode="wait">
                {/* START SCREEN */}
                {mode === 'start' && (
                    <motion.div
                        key="start"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center py-12 relative"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                            <Zap size={36} className="text-violet-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-primary mb-2">Ready to Test Yourself?</h3>
                        <p className="text-secondary mb-6">{quizData.length} questions available • {TIMER_DURATION}s per question</p>

                        {/* Question Count Selector */}
                        <div className="flex items-center justify-center gap-3 mb-8">
                            <span className="text-sm text-secondary font-medium">Questions:</span>
                            <div className="relative">
                                <select
                                    value={selectedCount}
                                    onChange={(e) => setSelectedCount(Number(e.target.value))}
                                    className="appearance-none bg-primary/10 hover:bg-primary/20 text-primary font-bold py-2 pl-4 pr-8 rounded-lg border border-primary/20 focus:outline-none focus:border-violet-500 cursor-pointer transition-colors"
                                >
                                    {[5, 10, 15, 20].map(n => (
                                        <option key={n} value={n} className="bg-gray-900 text-white">{n}</option>
                                    ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-violet-400">
                                    <ChevronDown size={14} />
                                </div>
                            </div>
                        </div>

                        {(quizData.length < selectedCount || quizData.length < 20) && (processedContent?.text || useStudyStore.getState().extractedText) && (
                            <button
                                onClick={handleRegenerate}
                                disabled={isGenerating}
                                className="group flex items-center justify-center gap-2 mx-auto text-xs font-medium text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 px-4 py-2 rounded-full border border-violet-500/20 transition-all -mt-6 mb-8 disabled:opacity-50"
                            >
                                <RefreshCw size={12} className={`transition-transform duration-700 ${isGenerating ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                                {isGenerating ? 'Generating Questions...' : `Generate ${selectedCount > quizData.length ? 'More' : 'Full'} Questions`}
                            </button>
                        )}

                        <p className="text-secondary/60 text-sm mb-8">Answer before the timer runs out!</p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => startQuiz('all')}
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-lg shadow-lg hover:shadow-violet-500/30 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 border border-white/10"
                            >
                                Start Quiz <ArrowRight size={18} className="inline ml-2" />
                            </button>

                            {allWeakTopics.length > 0 && (
                                <button
                                    onClick={() => startQuiz('weak')}
                                    className="px-6 py-3 rounded-xl bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20 hover:bg-rose-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 flex items-center gap-2"
                                >
                                    <Filter size={16} /> Weak Areas ({allWeakTopics.length})
                                </button>
                            )}
                        </div>

                        {allWeakTopics.length > 0 && (
                            <div className="mt-6 max-w-md mx-auto">
                                <p className="text-xs text-secondary/60 mb-2">Focus Logic: Questions matching your weak topics</p>
                                <div className="flex flex-wrap justify-center gap-1.5">
                                    {allWeakTopics.slice(0, 5).map((t, i) => (
                                        <span key={i} className="px-2 py-0.5 text-[10px] font-medium bg-rose-500/10 text-rose-400/80 rounded border border-rose-500/10">
                                            {t}
                                        </span>
                                    ))}
                                    {allWeakTopics.length > 5 && (
                                        <span className="px-2 py-0.5 text-[10px] text-secondary/50">+{allWeakTopics.length - 5} more</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ACTIVE QUIZ */}
                {mode === 'active' && currentQ && (
                    <motion.div
                        key={`q-${currentIndex}`}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                    >
                        {filterMode === 'weak' && (
                            <div className="mb-4 flex items-center gap-2 text-xs text-rose-400">
                                <Filter size={12} />
                                <span className="font-semibold uppercase tracking-wider">Weak Areas Mode</span>
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex-1 mr-4">
                                <div className="flex justify-between text-xs text-secondary mb-1.5">
                                    <span>Question {currentIndex + 1}/{total}</span>
                                    <span className="font-semibold text-primary">{score} correct</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-primary/10 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                                        initial={{ width: `${((currentIndex) / total) * 100}%` }}
                                        animate={{ width: `${((currentIndex + 1) / total) * 100}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </div>

                            <div className="relative w-12 h-12 flex-shrink-0">
                                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
                                    <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
                                    <circle
                                        cx="20" cy="20" r="18" fill="none"
                                        stroke={timerColor}
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
                                    />
                                </svg>
                                <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${timeLeft <= 5 ? 'text-rose-500' : 'text-primary'}`}>
                                    {timeLeft}
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-start gap-3 mb-1">
                                <span className="text-xs font-semibold text-secondary uppercase tracking-wider px-2 py-1 bg-primary/10 rounded whitespace-nowrap mt-0.5">
                                    {currentQ.topic || 'General'}
                                </span>
                                {currentQ.type && (
                                    <span className="text-xs font-medium text-violet-400 uppercase tracking-wider px-2 py-1 bg-violet-500/10 rounded whitespace-nowrap mt-0.5">
                                        {currentQ.type}
                                    </span>
                                )}
                            </div>
                            <h4 className="text-xl font-semibold text-primary leading-relaxed mt-3">{currentQ.question}</h4>
                        </div>

                        {!showAnswer ? (
                            <div className="space-y-3">
                                <button
                                    onClick={handleReveal}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-primary/5 border border-primary/10 rounded-xl text-secondary hover:border-violet-500/50 hover:text-violet-400 hover:bg-violet-500/5 transition-all font-medium"
                                >
                                    <Eye size={18} /> Reveal Answer
                                </button>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <div className="p-5 bg-violet-500/10 backdrop-blur-sm rounded-xl border border-violet-500/20">
                                    <p className="text-sm text-violet-300/70 font-semibold uppercase tracking-wider mb-2">Answer</p>
                                    <p className="text-primary font-medium leading-relaxed">{currentQ.answer}</p>
                                </div>

                                {!answeredRef.current[currentIndex] ? (
                                    <div className="flex items-center justify-between gap-4 pt-2">
                                        <p className="text-sm text-secondary font-medium">Did you know the answer?</p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleGrade(true)}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 font-semibold transition-colors border border-emerald-500/20"
                                            >
                                                <CheckCircle size={18} /> Yes
                                            </button>
                                            <button
                                                onClick={() => handleGrade(false)}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 font-semibold transition-colors border border-rose-500/20"
                                            >
                                                <XCircle size={18} /> No
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between pt-2">
                                        <div className={`flex items-center gap-2 text-sm font-bold ${answers[currentIndex]?.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {answers[currentIndex]?.isCorrect ? (
                                                <><CheckCircle size={18} /> Correct!</>
                                            ) : (
                                                <><XCircle size={18} /> {timeLeft === 0 && !answers[currentIndex]?.isCorrect ? "Time's up!" : 'Incorrect'}</>
                                            )}
                                        </div>
                                        <button
                                            onClick={nextQuestion}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-violet-500/10 text-violet-400 rounded-xl hover:bg-violet-500/20 font-semibold transition-colors border border-violet-500/20"
                                        >
                                            {currentIndex + 1 >= total ? 'See Results' : 'Next'} <ArrowRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* RESULTS SCREEN */}
                {mode === 'results' && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center py-8"
                    >
                        {/* Score Circle */}
                        <div className="relative w-32 h-32 mx-auto mb-6">
                            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                                <motion.circle
                                    cx="50" cy="50" r="44" fill="none"
                                    stroke={score / quizTotal >= 0.7 ? '#14b8a6' : score / quizTotal >= 0.4 ? '#f59e0b' : '#f43f5e'}
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 44}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - score / quizTotal) }}
                                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-primary">{score}</span>
                                <span className="text-xs text-secondary">/ {quizTotal}</span>
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-primary mb-1">
                            {score / quizTotal >= 0.8 ? '🎉 Excellent!' : score / quizTotal >= 0.5 ? '👍 Good Effort!' : '💪 Keep Studying!'}
                        </h3>
                        <p className="text-secondary mb-6">
                            You scored {score} out of {quizTotal} ({Math.round((score / quizTotal) * 100)}%)
                            {filterMode === 'weak' && <span className="text-rose-400 ml-1">(Weak Areas)</span>}
                        </p>

                        {/* Question Count Selector (Results Screen) */}
                        <div className="flex items-center justify-center gap-3 mb-8">
                            <span className="text-sm text-secondary font-medium">Next Quiz Questions:</span>
                            <div className="relative">
                                <select
                                    value={selectedCount}
                                    onChange={(e) => setSelectedCount(Number(e.target.value))}
                                    className="appearance-none bg-primary/10 hover:bg-primary/20 text-primary font-bold py-2 pl-4 pr-8 rounded-lg border border-primary/20 focus:outline-none focus:border-violet-500 cursor-pointer transition-colors"
                                >
                                    {[5, 10, 15, 20].map(n => (
                                        <option key={n} value={n} className="bg-gray-900 text-white">{n}</option>
                                    ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-violet-400">
                                    <ChevronDown size={14} />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                                onClick={() => startQuiz('all')}
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-violet-500/30 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 border border-white/10"
                            >
                                <RotateCcw size={16} className="inline mr-2" /> Retake Full Quiz
                            </button>
                        </div>
                    </motion.div >
                )}
            </AnimatePresence >
        </div >
    );
};

export default QuizInteractive;
