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
                <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2 rounded-xl shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all duration-300">
                    <Zap size={24} className="text-white fill-current" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-primary">
                    StudyFlow <span className="text-violet-500">AI</span>
                </span>
            </button>

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 backdrop-blur-md transition-all duration-300 text-secondary hover:text-primary cursor-pointer pointer-events-auto shadow-sm hover:shadow-md"
                title="Toggle Theme"
            >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </nav>
    );
};

export default Navbar;
