import React, { useState } from 'react';
import {
    FileText,
    Share2,
    HelpCircle,
    AlertTriangle
} from 'lucide-react';
import QuizInteractive from './QuizInteractive';
import WeakAnalysis from './WeakAnalysis';
import ConceptGraph from './ConceptGraph';

const DashboardLayout = ({ data, onRetry }) => {
    const [activeView, setActiveView] = useState('summary');
    const [weakTopics, setWeakTopics] = useState([]);

    const handleWeakTopic = (topic) => {
        setWeakTopics(prev => [...prev, topic]);
    };

    const renderContent = () => {
        switch (activeView) {
            case 'summary':
                return (
                    <div className="card animate-fade-in">
                        <h2 className="section-header">Executive Summary</h2>
                        <p className="summary-text">{data.summary}</p>
                    </div>
                );
            case 'concepts':
                return (
                    <div className="card animate-fade-in" style={{ height: '450px', padding: 0, overflow: 'hidden', position: 'relative' }}>
                        <h2 className="section-header" style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, pointerEvents: 'none' }}>Concept Map</h2>
                        <ConceptGraph concepts={data.concepts} />
                    </div>
                );
            case 'quiz':
                return (
                    <QuizInteractive
                        quizData={data.quiz}
                        onWeakTopicDetected={handleWeakTopic}
                    />
                );
            case 'weak-areas':
                return <WeakAnalysis weakTopics={weakTopics} />;
            default:
                return null;
        }
    };

    return (
        <div className="dashboard-layout animate-fade-in">
            <aside className="sidebar">
                <button
                    className={`sidebar-btn ${activeView === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveView('summary')}
                >
                    <FileText size={20} /> Summary
                </button>
                <button
                    className={`sidebar-btn ${activeView === 'concepts' ? 'active' : ''}`}
                    onClick={() => setActiveView('concepts')}
                >
                    <Share2 size={20} /> Concepts
                </button>
                <button
                    className={`sidebar-btn ${activeView === 'quiz' ? 'active' : ''}`}
                    onClick={() => setActiveView('quiz')}
                >
                    <HelpCircle size={20} /> Quiz
                </button>
                <button
                    className={`sidebar-btn ${activeView === 'weak-areas' ? 'active' : ''}`}
                    onClick={() => setActiveView('weak-areas')}
                >
                    <AlertTriangle size={20} /> Weak Areas
                    {weakTopics.length > 0 && <span className="badge-count">{weakTopics.length}</span>}
                </button>

                <button className="btn btn-secondary mt-auto" onClick={onRetry}>
                    New Upload
                </button>
            </aside>

            <main className="dashboard-content">
                {renderContent()}
            </main>
        </div>
    );
};

export default DashboardLayout;
