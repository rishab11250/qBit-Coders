import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, Database, FileText, CheckCircle2 } from 'lucide-react';

const PremiumLoadingState = ({ isVisible }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        { text: "Analyzing raw data...", icon: Database },
        { text: "Extracting key concepts...", icon: FileText },
        { text: "Structuring knowledge graph...", icon: BrainCircuit },
        { text: "Generating personalized quiz...", icon: Sparkles },
        { text: "Finalizing study plan...", icon: CheckCircle2 },
    ];

    useEffect(() => {
        if (!isVisible) {
            setCurrentStep(0);
            return;
        }

        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 1500); // Change step every 1.5 seconds

        return () => clearInterval(interval);
    }, [isVisible]);

    if (!isVisible) return null;

    const CurrentIcon = steps[currentStep].icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl rounded-3xl"
        >
            {/* Pulsing Core Animation */}
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-violet-500/30 rounded-full blur-3xl animate-pulse" />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative w-24 h-24 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-violet-500/40 border border-white/20"
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CurrentIcon size={48} className="text-white" />
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                {/* Orbiting Particles */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-20px] rounded-full border border-dashed border-white/10"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-40px] rounded-full border border-dashed border-white/5"
                />
            </div>

            {/* Steps Text */}
            <div className="h-16 flex flex-col items-center justify-center relative w-full overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={currentStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-200 to-white text-center"
                    >
                        {steps[currentStep].text}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Progress Bar */}
            <div className="w-64 h-1.5 bg-white/10 rounded-full mt-6 overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
        </motion.div>
    );
};

export default PremiumLoadingState;
