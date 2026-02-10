import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, Lightbulb, Key, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const StudyMaterial = ({ material }) => {
    const [expandedIndex, setExpandedIndex] = useState(0); // Default open first one

    if (!material || material.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <BookOpen size={18} className="text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-primary">Deep Dive Learning</h3>
                    <p className="text-xs text-secondary mt-0.5">Comprehensive notes & key concepts</p>
                </div>
            </div>

            <div className="grid gap-4">
                {material.map((item, index) => {
                    const isExpanded = expandedIndex === index;
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded
                                    ? 'bg-indigo-500/[0.03] border-indigo-500/30 shadow-lg shadow-indigo-500/5'
                                    : 'bg-[var(--bg-secondary)] border-white/5 hover:border-white/10'
                                }`}
                        >
                            <button
                                onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                                className="w-full flex items-center justify-between p-5 text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${isExpanded ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/5 text-secondary group-hover:bg-white/10'
                                        }`}>
                                        {index + 1}
                                    </span>
                                    <h4 className={`text-lg font-semibold transition-colors ${isExpanded ? 'text-indigo-300' : 'text-primary group-hover:text-indigo-200'
                                        }`}>
                                        {item.topic}
                                    </h4>
                                </div>
                                <div className={`p-2 rounded-full transition-all ${isExpanded ? 'bg-indigo-500/20 text-indigo-400 rotate-180' : 'text-secondary group-hover:text-primary'
                                    }`}>
                                    <ChevronDown size={20} />
                                </div>
                            </button>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    >
                                        <div className="px-5 pb-6 border-t border-white/5">
                                            {/* Markdown Content */}
                                            <div className="prose prose-invert prose-sm max-w-none pt-4 text-secondary/90 leading-relaxed">
                                                <ReactMarkdown
                                                    components={{
                                                        h1: ({ node, ...props }) => <h3 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                                                        h2: ({ node, ...props }) => <h4 className="text-base font-bold text-indigo-200 mt-3 mb-2" {...props} />,
                                                        h3: ({ node, ...props }) => <h5 className="text-sm font-bold text-indigo-200/80 mt-2 mb-1" {...props} />,
                                                        strong: ({ node, ...props }) => <span className="font-bold text-indigo-300" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-2" {...props} />,
                                                        li: ({ node, ...props }) => <li className="pl-1 marker:text-indigo-500/50" {...props} />,
                                                        code: ({ node, inline, ...props }) =>
                                                            inline
                                                                ? <code className="bg-white/10 px-1.5 py-0.5 rounded text-indigo-200 text-xs font-mono" {...props} />
                                                                : <div className="bg-black/30 rounded-lg p-3 my-2 border border-white/5 overflow-x-auto"><code className="text-xs font-mono text-gray-300" {...props} /></div>
                                                    }}
                                                >
                                                    {item.content}
                                                </ReactMarkdown>
                                            </div>

                                            <div className="flex flex-col md:flex-row gap-4 mt-6">
                                                {/* Key Points */}
                                                {item.key_points && item.key_points.length > 0 && (
                                                    <div className="flex-1 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Key size={16} className="text-emerald-400" />
                                                            <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Key Takeaways</h5>
                                                        </div>
                                                        <ul className="space-y-2">
                                                            {item.key_points.map((point, i) => (
                                                                <li key={i} className="flex items-start gap-2 text-sm text-emerald-100/80">
                                                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                                                    <span>{point}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Real World Example */}
                                                {item.real_world_example && (
                                                    <div className="flex-1 bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Globe size={16} className="text-amber-400" />
                                                            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Real-World Application</h5>
                                                        </div>
                                                        <p className="text-sm text-amber-100/80 leading-relaxed italic">
                                                            "{item.real_world_example}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default StudyMaterial;
