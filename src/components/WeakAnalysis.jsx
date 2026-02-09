import React from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';

const WeakAnalysis = ({ weakTopics }) => {
    if (!weakTopics || weakTopics.length === 0) {
        return (
            <div className="weak-analysis-empty card">
                <TrendingUp size={32} className="success-icon" />
                <h3>All Clear!</h3>
                <p>You haven't marked any weak areas yet. Keep answering quizzes to identify gaps.</p>
            </div>
        );
    }

    // Deduplicate topics
    const uniqueTopics = [...new Set(weakTopics)];

    return (
        <div className="weak-analysis-container">
            <h2 className="section-header">Targeted Revision</h2>
            <div className="weak-alert-card card">
                <div className="alert-header">
                    <AlertTriangle size={24} className="alert-icon" />
                    <div>
                        <h3>Focus Areas Detected</h3>
                        <p>Based on your quiz responses, we recommend reviewing these topics:</p>
                    </div>
                </div>

                <ul className="weak-topic-list">
                    {uniqueTopics.map((topic, index) => (
                        <li key={index} className="weak-topic-item animate-fade-in">
                            <span className="bullet">•</span> {topic}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default WeakAnalysis;
