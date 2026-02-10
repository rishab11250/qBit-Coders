import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Star, Brain, ChevronDown, Check, Clock, AlertCircle } from 'lucide-react';
import useStudyStore from '../../store/useStudyStore';

const ModelSelector = () => {
    const { settings, updateSettings, modelStatus } = useStudyStore();
    const [isOpen, setIsOpen] = useState(false);
    const [timers, setTimers] = useState({});
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update countdown timers every second
    useEffect(() => {
        const interval = setInterval(() => {
            const newTimers = {};
            let hasActiveTimers = false;

            Object.entries(modelStatus).forEach(([modelId, status]) => {
                if (status.status === 'limited' && status.availableAt) {
                    const remaining = Math.max(0, Math.ceil((status.availableAt - Date.now()) / 1000));
                    if (remaining > 0) {
                        newTimers[modelId] = remaining;
                        hasActiveTimers = true;
                    }
                }
            });

            setTimers(newTimers);
        }, 1000);

        return () => clearInterval(interval);
    }, [modelStatus]);

    const models = [
        {
            id: 'gemini-2.0-flash-lite-preview-02-05',
            name: 'Gemini 2.0 Flash Lite',
            desc: 'Fastest & Efficient',
            icon: Zap,
            color: 'text-emerald-400'
        },
        {
            id: 'gemini-1.5-flash',
            name: 'Gemini 1.5 Flash',
            desc: 'Balanced & Reliable',
            icon: Star,
            color: 'text-violet-400'
        },
        {
            id: 'gemini-1.5-pro',
            name: 'Gemini 1.5 Pro',
            desc: 'Smartest (Complex Tasks)',
            icon: Brain,
            color: 'text-fuchsia-400'
        },
        {
            id: 'gemini-2.0-flash-exp',
            name: 'Gemini 2.0 Flash (Exp)',
            desc: 'Next Gen Preview',
            icon: Zap,
            color: 'text-yellow-400'
        }
    ];

    const currentModel = models.find(m => m.id === settings.model) || models[0];

    const handleSelect = (modelId) => {
        updateSettings({ model: modelId });
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left z-50" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
                <currentModel.icon size={14} className={currentModel.color} />
                <span className="text-secondary">{currentModel.name}</span>
                <ChevronDown size={14} className={`text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl glass-panel border border-white/10 shadow-xl overflow-hidden backdrop-blur-xl bg-black/90"
                    >
                        <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {models.map((model) => {
                                const isSelected = settings.model === model.id;
                                const isLimited = modelStatus[model.id]?.status === 'limited' && timers[model.id] > 0;

                                return (
                                    <button
                                        key={model.id}
                                        onClick={() => !isLimited && handleSelect(model.id)}
                                        disabled={isLimited}
                                        className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-all group relative
                                            ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}
                                            ${isLimited ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                        `}
                                    >
                                        <div className={`mt-0.5 p-2 rounded-lg bg-white/5 ${isSelected ? 'bg-white/10' : ''}`}>
                                            {isLimited ? <AlertCircle size={16} className="text-red-400" /> : <model.icon size={16} className={model.color} />}
                                        </div>

                                        <div className="text-left flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-secondary group-hover:text-white'}`}>
                                                    {model.name}
                                                </p>
                                                {isLimited && (
                                                    <span className="text-red-400 text-xs font-mono flex items-center gap-1">
                                                        <Clock size={10} /> {timers[model.id]}s
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-secondary/60 mt-0.5">
                                                {model.desc}
                                            </p>
                                            {isLimited && (
                                                <p className="text-[10px] text-red-500/80 mt-1">
                                                    Rate limit hit. Auto-recovering.
                                                </p>
                                            )}
                                        </div>
                                        {isSelected && !isLimited && (
                                            <div className="mt-1">
                                                <Check size={16} className="text-emerald-400" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="p-2 bg-white/5 border-t border-white/5 text-[10px] text-center text-secondary/40">
                            Auto-switches if model is busy
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ModelSelector;
