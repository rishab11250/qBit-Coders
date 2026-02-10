import useStudyStore from '../../store/useStudyStore';
import { Zap, Sun, Moon } from 'lucide-react';

const Navbar = () => {
    const { settings, toggleTheme } = useStudyStore();
    const isDark = settings.theme === 'dark';

    return (
        <nav className="fixed top-4 left-0 right-0 z-50 flex justify-center">
            <div className="glass-panel rounded-full px-6 py-3 flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-1.5 rounded-lg shadow-lg shadow-violet-500/20">
                        <Zap size={20} className="text-white fill-current" />
                    </div>
                    <span className="text-xl font-bold text-primary tracking-tight">
                        StudyFlow <span className="text-violet-500">AI</span>
                    </span>
                </div>

                <div className="h-6 w-px bg-white/20"></div>

                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors text-secondary hover:text-primary"
                    title="Toggle Theme"
                >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
