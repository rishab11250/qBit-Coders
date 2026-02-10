import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronLeft, ChevronRight, X, Trash2, FileText, Youtube, Image as ImageIcon, Upload } from 'lucide-react';
import useStudyStore from '../../store/useStudyStore';

const HistorySidebar = ({ isOpen, onToggle }) => {
    const { planHistory, loadPlanFromHistory, deletePlanFromHistory } = useStudyStore();

    const sidebarVariants = {
        open: { x: 0, width: '320px', transition: { type: 'spring', stiffness: 300, damping: 30 } },
        closed: { x: -280, width: '40px', transition: { type: 'spring', stiffness: 300, damping: 30 } }
    };

    return (
        <>
            {/* Toggle Button (Visible when closed) */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        onClick={() => onToggle(true)}
                        className="fixed left-4 top-24 z-40 p-2 bg-primary/10 hover:bg-primary/20 backdrop-blur-md border border-primary/10 rounded-lg text-primary shadow-lg transition-colors"
                    >
                        <History size={20} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                initial="open"
                animate={isOpen ? "open" : "closed"}
                variants={sidebarVariants}
                className="fixed left-0 top-20 bottom-0 z-40 glass-panel border-r border-white/10 bg-slate-950/95 backdrop-blur-xl flex flex-col shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 mt-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <History size={20} className="text-violet-500 shrink-0" />
                        <h3 className="font-semibold text-primary whitespace-nowrap">History</h3>
                    </div>
                    <button
                        onClick={() => onToggle(!isOpen)}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-secondary hover:text-primary transition-colors"
                    >
                        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2 custom-scrollbar">
                    <AnimatePresence mode='popLayout'>
                        {planHistory.map((plan) => (
                            <motion.div
                                key={plan.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                onClick={() => loadPlanFromHistory(plan.id)}
                                className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-violet-500/30 transition-all cursor-pointer"
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deletePlanFromHistory(plan.id);
                                    }}
                                    className="absolute right-2 top-2 p-1.5 text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>

                                <div className="flex items-start gap-3 pr-6">
                                    <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${plan.inputType === 'multiple-pdf' || plan.inputType === 'pdf' ? 'bg-emerald-500/10 text-emerald-500' :
                                        plan.inputType === 'images' ? 'bg-cyan-500/10 text-cyan-500' :
                                            plan.inputType === 'video' || plan.inputType === 'video-search' ? 'bg-red-500/10 text-red-500' :
                                                'bg-violet-500/10 text-violet-500'
                                        }`}>
                                        {plan.inputType === 'multiple-pdf' || plan.inputType === 'pdf' ? <Upload size={16} /> :
                                            plan.inputType === 'images' ? <ImageIcon size={16} /> :
                                                plan.inputType === 'video' || plan.inputType === 'video-search' ? <Youtube size={16} /> :
                                                    <FileText size={16} />}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-medium text-primary truncate leading-tight mb-1" title={plan.title}>
                                            {plan.title.replace(/^"/, '').replace(/"$/, '')}
                                        </h4>
                                        <p className="text-[10px] text-secondary">
                                            {new Date(plan.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {plan.topics?.length || 0} Topics
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {planHistory.length === 0 && (
                        <div className="text-center py-8 px-4 opacity-50">
                            <p className="text-sm text-secondary">No history yet</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );
};

export default HistorySidebar;
