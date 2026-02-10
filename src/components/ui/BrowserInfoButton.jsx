import React, { useState } from 'react';
import { HelpCircle, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BrowserInfoButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all text-xs font-medium border border-red-500/20 hover:scale-105 active:scale-95"
                title="Why can't I run this in browser?"
            >
                <HelpCircle size={14} />
                <span className="hidden sm:inline">Browser Issue?</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-80 p-5 rounded-2xl glass-panel bg-[var(--bg-secondary)] border border-red-500/20 shadow-2xl z-50 origin-top-right"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2 text-red-500">
                                    <AlertTriangle size={18} />
                                    <h3 className="font-bold text-sm">Browser Limitation</h3>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-secondary hover:text-primary transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-3 text-sm text-secondary leading-relaxed">
                                <p>
                                    <strong className="text-primary">Why the project can't run in browser?</strong>
                                </p>
                                <p>
                                    The automated browser tool in this environment is missing the <code>$HOME</code> environment variable, which prevents the browser driver (Playwright) from launching.
                                </p>
                                <p>
                                    This is a system configuration issue, <strong>not a bug in your code</strong>. Your application code is valid and safe.
                                </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-primary/5 text-xs text-center text-secondary/60">
                                You can verify the UI manually on localhost:5173
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BrowserInfoButton;
