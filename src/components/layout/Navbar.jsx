import React from 'react';
import { Zap, Github } from 'lucide-react';
import Settings from '../features/Settings';

const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <Zap size={20} className="text-white fill-current" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                            StudyFlow AI
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <a
                            href="https://github.com/rishab11250/qBit-Coders"
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
                            title="View Source"
                        >
                            <Github size={20} />
                        </a>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <Settings />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
