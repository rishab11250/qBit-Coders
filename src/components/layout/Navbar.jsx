import useStudyStore from '../../store/useStudyStore';
import { Zap, Sun, Moon } from 'lucide-react';

const Navbar = () => {
    const { settings, toggleTheme, reset, currentStep } = useStudyStore();
    const isDark = settings.theme === 'dark';
    const isStudyPlan = currentStep !== 'input';

    return (
        <nav
            className={`flex justify-between items-center px-6 py-4 ${isStudyPlan
                    ? 'fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/5'
                    : 'relative z-50'
                }`}
            style={isStudyPlan ? { background: 'rgba(15,23,42,0.4)' } : {}}
        >
            {/* Logo Section */}
            <button
                onClick={reset}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group"
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
                className="p-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 backdrop-blur-md transition-all duration-300 text-secondary hover:text-primary cursor-pointer shadow-sm hover:shadow-md"
                title="Toggle Theme"
            >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </nav>
    );
};

export default Navbar;
