import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronLeft, ChevronRight, X, Trash2, FileText, Youtube, Image as ImageIcon, Upload } from 'lucide-react';
import useStudyStore from '../../store/useStudyStore';

const groupPlansByDate = (plans) => {
    const groups = {
        'Today': [],
        'Yesterday': [],
        'Previous 7 Days': [],
        'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Sort by date desc first
    const sortedPlans = [...plans].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedPlans.forEach(plan => {
        const planDate = new Date(plan.date);
        const compareDate = new Date(planDate.getFullYear(), planDate.getMonth(), planDate.getDate());

        if (compareDate.getTime() === today.getTime()) {
            groups['Today'].push(plan);
        } else if (compareDate.getTime() === yesterday.getTime()) {
            groups['Yesterday'].push(plan);
        } else if (compareDate > lastWeek) {
            groups['Previous 7 Days'].push(plan);
        } else {
            groups['Older'].push(plan);
        }
    });

    return groups;
};

const HistorySidebar = ({ isOpen, onToggle }) => {
    const { planHistory, loadPlanFromHistory, deletePlanFromHistory } = useStudyStore();
    const [searchTerm, setSearchTerm] = useState('');
    const sidebarRef = React.useRef(null);

    // Filter Logic
    const filteredPlans = React.useMemo(() => {
        if (!searchTerm) return planHistory;
        const lowerTerm = searchTerm.toLowerCase();
        return planHistory.filter(plan =>
            (plan.title || "").toLowerCase().includes(lowerTerm) ||
            (plan.topics || []).some(t => t.toLowerCase().includes(lowerTerm))
        );
    }, [planHistory, searchTerm]);

    // Click Outside Logic
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                // Ignore if clicking the toggle button itself (handled by its own onClick usually, 
                // but to be safe we can just check if it's not the sidebar)
                onToggle(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onToggle]);

    const sidebarVariants = {
        open: {
            x: 0,
            width: '340px', // Slightly wider for better readability
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 30,
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        },
        closed: {
            x: -340,
            width: '40px', // Collapsed width logic handled by parent layout usually, but here fixed
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 30,
                staggerChildren: 0.05,
                staggerDirection: -1
            }
        }
    };

    const itemVariants = {
        open: { opacity: 1, y: 0, scale: 1 },
        closed: { opacity: 0, y: 20, scale: 0.95 }
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
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent immediate close
                            onToggle(true);
                        }}
                        className="fixed left-4 top-24 z-40 p-3 dark:bg-white/5 bg-gray-100 dark:hover:bg-white/10 hover:bg-gray-200 dark:backdrop-blur-md border dark:border-white/10 border-gray-300 rounded-xl text-primary shadow-lg transition-all hover:scale-105 active:scale-95 group"
                    >
                        <History size={22} className="group-hover:text-violet-400 transition-colors" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                ref={sidebarRef}
                initial="closed"
                animate={isOpen ? "open" : "closed"}
                variants={sidebarVariants}
                className="fixed left-0 top-20 bottom-0 z-40 dark:bg-[#0B1220] bg-white border-r dark:border-white/10 border-gray-200 flex flex-col shadow-xl"
            >
                {/* Header */}
                <div className="px-4 py-3 border-b dark:border-white/10 border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-violet-500/10 rounded-lg">
                                <History size={18} className="text-violet-400" />
                            </div>
                            <h3 className="text-sm font-semibold dark:text-white/80 text-gray-700 uppercase tracking-wide">History</h3>
                        </div>
                        <button
                            onClick={() => onToggle(false)}
                            className="p-2 dark:hover:bg-white/5 hover:bg-gray-200 rounded-lg dark:text-white/60 text-gray-600 dark:hover:text-white hover:text-gray-900 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full dark:bg-white/10 bg-gray-100 border dark:border-white/10 border-gray-300 rounded-lg px-3 py-2 text-sm dark:text-white text-gray-900 dark:placeholder:text-white/40 placeholder:text-gray-400 dark:focus:bg-white/15 focus:bg-gray-50 focus:outline-none transition-all"
                        />
                        {searchTerm ? (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400 dark:hover:text-white hover:text-gray-700 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        ) : (
                            <History size={14} className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/20 text-gray-400 pointer-events-none" />
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-6 custom-scrollbar">
                    {Object.entries(groupPlansByDate(filteredPlans)).map(([label, plans]) => (
                        plans.length > 0 && (
                            <motion.div key={label} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <h4 className="text-[10px] font-bold dark:text-white/50 text-gray-500 uppercase tracking-widest mb-2 pl-1 sticky top-0 dark:bg-[#0B1220] bg-gray-50 py-1 z-10">{label}</h4>
                                <div className="space-y-2">
                                    <AnimatePresence mode='popLayout'>
                                        {plans.map((plan) => (
                                            <motion.div
                                                key={plan.id}
                                                layout
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                onClick={() => loadPlanFromHistory(plan.id)}
                                                className="group relative dark:bg-white/[0.05] bg-white border dark:border-white/10 border-gray-200 rounded-xl p-3 transition-all duration-200 dark:hover:bg-white/[0.09] hover:bg-gray-100 hover:-translate-y-0.5 cursor-pointer shadow-sm"
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm("Delete this study plan?")) {
                                                            deletePlanFromHistory(plan.id);
                                                        }
                                                    }}
                                                    className="absolute right-3 top-3 p-1.5 dark:text-white/60 text-gray-600 hover:text-rose-500 dark:hover:bg-rose-500/10 hover:bg-rose-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>

                                                <div className="flex items-start gap-4">
                                                    <div className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border dark:border-white/5 border-black/10 shadow-inner ${plan.inputType === 'multiple-pdf' || plan.inputType === 'pdf' ? 'dark:bg-emerald-500/10 bg-emerald-100 dark:text-emerald-400 text-emerald-700' :
                                                        plan.inputType === 'images' ? 'dark:bg-cyan-500/10 bg-cyan-100 dark:text-cyan-400 text-cyan-700' :
                                                            plan.inputType === 'video' || plan.inputType === 'video-search' ? 'dark:bg-rose-500/10 bg-rose-100 dark:text-rose-400 text-rose-700' :
                                                                'dark:bg-violet-500/10 bg-violet-100 dark:text-violet-400 text-violet-700'
                                                        }`}>
                                                        {plan.inputType === 'multiple-pdf' || plan.inputType === 'pdf' ? <Upload size={18} /> :
                                                            plan.inputType === 'images' ? <ImageIcon size={18} /> :
                                                                plan.inputType === 'video' || plan.inputType === 'video-search' ? <Youtube size={18} /> :
                                                                    <FileText size={18} />}
                                                    </div>
                                                    <div className="min-w-0 flex-1 pr-6">
                                                        <h4 className="text-sm font-medium dark:text-white text-gray-900 truncate leading-snug mb-1.5" title={plan.title}>
                                                            {plan.title.replace(/^"/, '').replace(/"$/, '') || "Untitled Plan"}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-xs dark:text-white/60 text-gray-600 font-medium">
                                                            <span className="dark:bg-white/5 bg-gray-200 px-2 py-0.5 rounded-md border dark:border-white/5 border-black/10">
                                                                {new Date(plan.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            <span className="w-1 h-1 rounded-full dark:bg-white/20 bg-gray-400"></span>
                                                            <span>{plan.topics?.length || 0} Topics</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )
                    ))}

                    {planHistory.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <History size={48} className="mb-4 dark:text-white/30 text-gray-400 stroke-1" />
                            <p className="text-sm font-medium dark:text-white/60 text-gray-600">No history yet</p>
                            <p className="text-xs dark:text-white/40 text-gray-500 mt-1">Generate a plan to get started</p>
                        </div>
                    )}

                    {planHistory.length > 0 && filteredPlans.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <p className="text-sm font-medium dark:text-white/60 text-gray-600">No matches found</p>
                            <p className="text-xs dark:text-white/40 text-gray-500 mt-1">Try a different search term</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );
};

export default HistorySidebar;
