import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ArrowRight, Sparkles, ChevronLeft, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TOUR_STEPS = [
    {
        title: 'Upload Your Material',
        description: 'Start by uploading PDFs, images, or pasting your lecture notes. The AI will analyze everything.',
        position: 'bottom',
        selector: '[data-tour="upload-area"]'
    },
    {
        title: 'Choose Input Method',
        description: 'Switch between PDFs, images, notes, and YouTube videos using these tabs.',
        position: 'top', // Changed to top as tabs are inside the area
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

const STORAGE_KEY = 'studyflow-tour-seen-v4';

const OnboardingTour = () => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const hasSeen = localStorage.getItem(STORAGE_KEY);
        if (!hasSeen) {
            const timer = setTimeout(() => setIsActive(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const updatePosition = useCallback(() => {
        if (!isActive) return;

        const step = TOUR_STEPS[currentStep];
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
            // Fallback: Center screen
            setTargetRect(null);
            setTooltipPos({
                top: window.innerHeight / 2 + window.scrollY - 100,
                left: window.innerWidth / 2 - 160
            });
        }
    }, [currentStep, isActive]);

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
        localStorage.setItem(STORAGE_KEY, 'true');
    };

    const nextStep = () => {
        if (currentStep + 1 >= TOUR_STEPS.length) {
            completeTour();
        } else {
            setCurrentStep(s => s + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(s => s - 1);
    };

    useEffect(() => {
        const handleManualStart = () => {
            setCurrentStep(0);
            setIsActive(true);
        };
        window.addEventListener('start-onboarding', handleManualStart);
        return () => window.removeEventListener('start-onboarding', handleManualStart);
    }, []);

    if (!isActive) return null;
    const step = TOUR_STEPS[currentStep];

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
                    key={currentStep}
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
                                    Step {currentStep + 1} of {TOUR_STEPS.length}
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
