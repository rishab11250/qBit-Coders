import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Star, Brain, ChevronDown, Check } from 'lucide-react';
import useStudyStore from '../../store/useStudyStore';

const ModelSelector = () => {
    const { settings, updateSettings } = useStudyStore();
    const [isOpen, setIsOpen] = useState(false);
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

    const models = [
        {
            id: 'gemini-2.5-flash-lite',
            name: 'Flash Lite',
            desc: 'Fast & Efficient',
            icon: Zap,
            color: 'text-emerald-400'
        },
        {
            id: 'gemini-2.5-flash',
            name: 'Flash 2.5',
            desc: 'Balanced',
            icon: Star,
            color: 'text-violet-400'
        },
        {
            id: 'gemini-3-flash',
            name: 'Flash 3.0',
            desc: 'Most Capable',
            icon: Brain,
            color: 'text-fuchsia-400'
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
                        className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl glass-panel border border-white/10 shadow-xl overflow-hidden backdrop-blur-xl bg-black/80"
                    >
                        <div className="p-2 space-y-1">
                            {models.map((model) => {
                                const isSelected = settings.model === model.id;
                                return (
                                    <button
                                        key={model.id}
                                        onClick={() => handleSelect(model.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                    >
                                        <div className={`p-2 rounded-lg bg-white/5 ${isSelected ? 'bg-white/10' : ''}`}>
                                            <model.icon size={16} className={model.color} />
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-secondary group-hover:text-white'}`}>
                                                {model.name}
                                            </p>
                                            <p className="text-xs text-secondary/60">
                                                {model.desc}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <Check size={16} className="text-emerald-400" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ModelSelector;
