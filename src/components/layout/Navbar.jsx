import useStudyStore from '../../store/useStudyStore';
import { Zap, Sun, Moon } from 'lucide-react';

const Navbar = () => {
    const { settings, toggleTheme, reset } = useStudyStore();
    const isDark = settings.theme === 'dark';

    return (
        <nav className="fixed top-6 left-6 right-6 z-50 flex justify-between items-start pointer-events-none">
            {/* Logo Section */}
            <button
                onClick={reset}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer pointer-events-auto group"
            >
                <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2 rounded-xl shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
                    <Zap size={24} className="text-white fill-current" />
                </div>
                <div className="flex flex-col items-start bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
                    <span className="text-2xl font-bold tracking-tight text-primary">
                        StudyFlow <span className="text-violet-500">AI</span>
                    </span>
                </div>
            </button>

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-3 rounded-full bg-primary/5 hover:bg-primary/10 border border-primary/5 backdrop-blur-md transition-all text-secondary hover:text-primary cursor-pointer pointer-events-auto"
                title="Toggle Theme"
            >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </nav>
    );
};

export default Navbar;
