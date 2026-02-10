import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    FileText,
    Share2,
    Target,
    HelpCircle,
    Calendar,
    BarChart3,
    ArrowRight
} from 'lucide-react';

const SidebarNav = ({ activeSection, scrollToSection }) => {
    const navItems = [
        { id: 'summary', label: 'Summary', icon: FileText, color: 'text-violet-400' },
        { id: 'knowledge', label: 'Knowledge Map', icon: Share2, color: 'text-cyan-400' },
        { id: 'focus', label: 'Focus Areas', icon: Target, color: 'text-rose-400' },
        { id: 'quiz', label: 'Quiz', icon: HelpCircle, color: 'text-amber-400' },
        { id: 'timeline', label: 'Timeline', icon: Calendar, color: 'text-emerald-400' },
        { id: 'progress', label: 'Progress', icon: BarChart3, color: 'text-blue-400' },
    ];

    return (
        <aside className="fixed left-0 top-20 bottom-0 w-20 hover:w-64 transition-all duration-300 z-40 hidden md:flex flex-col bg-[var(--bg-secondary)]/50 backdrop-blur-xl border-r border-white/5 group overflow-hidden">
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-8 px-4 space-y-2">
                <div className="mb-6 px-2">
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Navigation</p>
                </div>

                {navItems.map((item) => {
                    const isActive = activeSection === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => scrollToSection(item.id)}
                            className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${isActive
                                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-lg shadow-[var(--accent-primary)]/5'
                                : 'text-secondary hover:text-primary hover:bg-white/5'
                                }`}
                        >
                            {/* Active Indicator Bar (Left Border) */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-[var(--accent-primary)]" />
                            )}

                            {/* Icon Box */}
                            <div className="relative z-10 flex-shrink-0">
                                <Icon size={22} className={`transition-colors duration-300 ${isActive ? '' : item.color}`} strokeWidth={1.5} />
                            </div>

                            {/* Label (Reveals on Hover) */}
                            <span className={`text-sm font-medium whitespace-nowrap opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 delay-75`}>
                                {item.label}
                            </span>

                            {/* Hover Arrow */}
                            <ArrowRight size={14} className={`ml-auto opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0 transition-all duration-300 ${isActive ? 'text-[var(--accent-primary)]' : ''}`} />
                        </button>
                    );
                })}
            </div>
        </aside>
    );
};

export default SidebarNav;
