import React from 'react';

import { Zap } from 'lucide-react';

const Navbar = () => {
    return (
        <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center">
            <div className="glass-panel rounded-full px-6 py-3 flex items-center gap-3">
                <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-1.5 rounded-lg shadow-lg shadow-violet-500/20">
                    <Zap size={20} className="text-white fill-current" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">
                    StudyFlow <span className="text-violet-400">AI</span>
                </span>
            </div>
        </nav>
    );
};

export default Navbar;
