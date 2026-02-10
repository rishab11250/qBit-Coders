import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ArrowRight, Sparkles, ChevronLeft, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import useStudyStore from '../../store/useStudyStore';

const INPUT_STEPS = [
    {
        title: 'Upload Your Material',
        description: 'Start by uploading PDFs, images, or pasting your lecture notes. The AI will analyze everything.',
        position: 'bottom',
        selector: '[data-tour="upload-area"]'
    },
    {
        title: 'Choose Input Method',
        description: 'Switch between PDFs, images, notes, and YouTube videos using these tabs.',
        position: 'top',
        selector: '[data-tour="input-tabs"]'
    },
    {
        title: 'Generate Study Plan',
        description: 'Click this button to let Gemini AI create a personalized study plan with summaries, quizzes, and more.',
        position: 'top',
        selector: '[data-tour="generate-btn"]'
    },
    {
        title: 'Powered by Gemini',
        description: 'Choose your preferred AI model. The app automatically falls back to available models if one is busy.',
        position: 'bottom',
        selector: '[data-tour="model-selector"]'
    }
];

const DASHBOARD_STEPS = [
    {
        title: 'Executive Summary',
        description: 'Get a quick AI-generated overview of your material, broken down into key takeaways and simple explanations.',
        position: 'bottom',
        selector: '[data-tour="summary-section"]'
    },
    {
        title: 'Knowledge Map',
        description: 'Explore concepts visually. Click nodes to expand related ideas and uncover hidden connections.',
        position: 'top',
        selector: '[data-tour="knowledge-map"]'
    },
    {
        title: 'Smart Quiz',
        description: 'Test your knowledge with AI-generated questions. Identifying weak areas here helps refine your study plan.',
        position: 'top',
        selector: '[data-tour="quiz-section"]'
    },
    {
        title: 'Study Schedule',
        description: 'A personalized timeline to help you cover all topics effectively before your exam.',
        position: 'top',
        selector: '[data-tour="schedule-section"]'
    },
    {
        title: 'Progress Tracking',
        description: 'Monitor your quiz scores and topic mastery over time to see where you need to focus.',
        position: 'top',
        selector: '[data-tour="progress-section"]'
    }
];

const STORAGE_KEY = 'studyflow-tour-seen-v4';

const OnboardingTour = () => {
    const { currentStep: appStep } = useStudyStore(); // Get current step from store
    const [isActive, setIsActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

    // Determine which steps to show based on app state
    const steps = appStep === 'input' ? INPUT_STEPS : DASHBOARD_STEPS;

    useEffect(() => {
        // Check local storage for the specific tour version AND context
        // We can use a composite key like 'studyflow-tour-seen-v4-input' and '...-dashboard'
        // Or just one key. For now, let's keep it simple: one key for the whole app tour?
        // Actually, if they generate a plan, they enter 'dashboard', so we might want to show the dashboard tour THEN.
        // Let's use separate keys for input and dashboard to ensure they see both relevant parts.

        const contextKey = `${STORAGE_KEY}-${appStep}`;
        const hasSeen = localStorage.getItem(contextKey);

        if (!hasSeen) {
            // Delay start to allow animations to finish
            const timer = setTimeout(() => {
                setCurrentStepIndex(0);
                setIsActive(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [appStep]);

    const updatePosition = useCallback(() => {
        if (!isActive || !steps[currentStepIndex]) return;

        const step = steps[currentStepIndex];
        const el = document.querySelector(step.selector);

        if (el && el.offsetParent !== null) {
            const rect = el.getBoundingClientRect();
            const scrollY = window.scrollY;

            setTargetRect({
                top: rect.top + scrollY,
                left: rect.left,
                width: rect.width,
                height: rect.height
            });

            const padding = 20;
            const tooltipWidth = 320;
            const tooltipHeight = 180;

            let top, left;

            if (step.position === 'bottom') {
                if (rect.bottom + tooltipHeight > window.innerHeight) {
                    top = rect.top + scrollY - tooltipHeight - padding;
                } else {
                    top = rect.top + scrollY + rect.height + padding;
                }
            } else {
                if (rect.top - tooltipHeight < 0) {
                    top = rect.top + scrollY + rect.height + padding;
                } else {
                    top = rect.top + scrollY - tooltipHeight - padding;
                }
            }

            left = Math.max(16, Math.min(
                rect.left + rect.width / 2 - tooltipWidth / 2,
                window.innerWidth - tooltipWidth - 16
            ));

            setTooltipPos({ top, left });

            // Only scroll if element is out of view
            const needsScroll = rect.top < 0 || rect.bottom > window.innerHeight;
            if (needsScroll) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            // Fallback: Center screen or hide if element not found (e.g. slight delay in rendering)
            setTargetRect(null);
            setTooltipPos({
                top: window.innerHeight / 2 + window.scrollY - 100,
                left: window.innerWidth / 2 - 160
            });
        }
    }, [currentStepIndex, isActive, steps]);

    useEffect(() => {
        if (isActive) {
            updatePosition();
            const timer = setInterval(updatePosition, 500);
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition);
            return () => {
                clearInterval(timer);
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition);
            };
        }
    }, [isActive, updatePosition]);

    const completeTour = () => {
        setIsActive(false);
        const contextKey = `${STORAGE_KEY}-${appStep}`;
        localStorage.setItem(contextKey, 'true');
    };

    const nextStep = () => {
        if (currentStepIndex + 1 >= steps.length) {
            completeTour();
        } else {
            setCurrentStepIndex(s => s + 1);
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) setCurrentStepIndex(s => s - 1);
    };

    useEffect(() => {
        const handleManualStart = () => {
            setCurrentStepIndex(0);
            setIsActive(true);
        };
        window.addEventListener('start-onboarding', handleManualStart);
        return () => window.removeEventListener('start-onboarding', handleManualStart);
    }, []);

    if (!isActive) return null;
    const step = steps[currentStepIndex];
    if (!step) return null; // Safety check

    return (
        <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'auto' }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={completeTour} />

            {/* Spotlight */}
            {targetRect && (
                <div
                    className="absolute rounded-xl border-2 border-violet-500/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] transition-all duration-300 ease-out pointer-events-none"
                    style={{
                        top: targetRect.top - 8,
                        left: targetRect.left - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                    }}
                >
                    <div className="absolute inset-0 rounded-xl border-2 border-violet-500/30 animate-pulse" />
                </div>
            )}

            {/* Tooltip */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStepIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-10"
                    style={{ top: tooltipPos.top, left: tooltipPos.left, width: 320 }}
                >
                    <div className="bg-[#1a1a1a] border border-violet-500/30 rounded-2xl p-5 shadow-2xl shadow-violet-500/20">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-violet-400" />
                                <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest">
                                    Step {currentStepIndex + 1} of {steps.length}
                                </span>
                            </div>
                            <button onClick={completeTour} className="text-secondary hover:text-primary p-1 rounded-lg hover:bg-white/5 transition-colors">
                                <X size={14} />
                            </button>
                        </div>

                        <h4 className="text-lg font-bold text-primary mb-2 overflow-hidden text-ellipsis">{step.title}</h4>
                        <p className="text-sm text-secondary leading-relaxed mb-5">{step.description}</p>

                        <div className="flex items-center justify-between">
                            <div className="flex gap-1.5">
                                {TOUR_STEPS.map((_, i) => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'bg-violet-500 w-6' : 'w-2 bg-white/10'}`} />
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                {currentStep > 0 && <button onClick={prevStep} className="px-3 py-1.5 rounded-lg text-xs font-medium text-secondary hover:text-primary hover:bg-white/5 transition-colors">Back</button>}
                                <button onClick={completeTour} className="px-3 py-1.5 rounded-lg text-xs font-medium text-secondary hover:text-primary hover:bg-white/5 transition-colors">Skip</button>
                                <button onClick={nextStep} className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 transition-colors flex items-center gap-1">{currentStep + 1 >= TOUR_STEPS.length ? 'Finish' : 'Next'} <ArrowRight size={12} /></button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default OnboardingTour;
