import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, MessageSquare, Loader2 } from 'lucide-react';
import useStudyStore from '../../store/useStudyStore';
import { sendChatMessage } from '../../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const ChatPanel = ({ isOpen, onClose }) => {
    const {
        chatHistory,
        addChatMessage,
        isChatLoading,
        setChatLoading,
        extractedText,
        notes,
        processedContent,
        settings
    } = useStudyStore();

    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const panelRef = useRef(null);

    // GSAP Stagger on Open
    useGSAP(() => {
        if (isOpen) {
            gsap.from('.gsap-chat-item', {
                y: 20,
                opacity: 0,
                duration: 0.5,
                stagger: 0.1,
                delay: 0.3, // Wait for panel slide-in
                ease: "power2.out"
            });
        }
    }, { scope: panelRef, dependencies: [isOpen] });

    // Auto-scroll to bottom directly
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isChatLoading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isChatLoading) return;

        const userMessage = input.trim();
        setInput('');

        // 1. Add User Message to Store
        addChatMessage({ role: 'user', content: userMessage });
        setChatLoading(true);

        try {
            // 2. Call AI Service
            // Context: prefer extracted text, fallback to notes
            // 2. Call AI Service
            // Context: prefer processedContent (images/pdf), fallback to extractedText/notes
            const context = { extractedText, notes, processedContent };

            // Note: sendChatMessage expects (history, newMessage, context)
            const reply = await sendChatMessage(chatHistory, userMessage, context);

            // 3. Add AI Response to Store
            addChatMessage({ role: 'ai', content: reply });
        } catch (error) {
            console.error("Chat failed:", error);
            addChatMessage({ role: 'ai', content: "Sorry, I encountered an error. Please try again." });
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop - Click to close */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] cursor-pointer"
                    />

                    {/* Chat Panel */}
                    <motion.div
                        ref={panelRef}
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full md:w-[400px] z-[100] glass-panel border-l border-white/10 shadow-2xl flex flex-col pointer-events-auto"
                    >
                        {/* Header with Flexbox Layout */}
                        <div className="p-4 border-b border-primary/5 flex items-center justify-between bg-[var(--bg-secondary)]/90 backdrop-blur-md relative z-10 pt-5 pb-5 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--accent-primary)]/20 rounded-lg text-[var(--accent-primary)]">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-primary">AI Tutor</h3>
                                    <p className="text-xs text-secondary flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                        {settings.model}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                            {chatHistory.length === 0 ? (
                                <div className="gsap-chat-item h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                                    <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                                        <MessageSquare size={32} className="text-[var(--accent-primary)]" />
                                    </div>
                                    <p className="text-primary font-medium mb-1">No messages yet</p>
                                    <p className="text-sm text-secondary">Ask questions about your study material!</p>
                                </div>
                            ) : (
                                chatHistory.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                    >
                                        <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center shrink-0
                                        ${msg.role === 'user' ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'}
                                    `}>
                                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                        </div>
                                        <div className={`
                                        max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed
                                        ${msg.role === 'user'
                                                ? 'bg-[var(--accent-primary)] text-[var(--text-primary)] rounded-tr-sm'
                                                : 'glass-card text-primary rounded-tl-sm border-primary/5'}
                                    `}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Typing Indicator */}
                            {isChatLoading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center shrink-0 text-[var(--accent-primary)]">
                                        <Bot size={14} />
                                    </div>
                                    <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-sm border-primary/5 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-violet-400/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-violet-400/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-violet-400/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="gsap-chat-item p-4 border-t border-primary/5 bg-[var(--bg-secondary)]/90 backdrop-blur-md">
                            <form onSubmit={handleSend} className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask a question..."
                                    className="w-full pl-4 pr-12 py-3 rounded-xl glass-input bg-primary/5 text-primary text-sm focus:ring-2 focus:ring-violet-500/50 transition-all border-primary/10 placeholder:text-secondary/50"
                                    disabled={isChatLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isChatLoading}
                                    className="absolute right-2 p-2 bg-[var(--accent-primary)] hover:opacity-90 text-[var(--text-primary)] rounded-lg transition-all disabled:opacity-50"
                                >
                                    {isChatLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ChatPanel;
