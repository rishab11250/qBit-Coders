import React, { useState } from 'react';
import { Eye, CheckCircle, XCircle } from 'lucide-react';

const QuizInteractive = ({ quizData, onWeakTopicDetected }) => {
    const [revealed, setRevealed] = useState({});
    const [answered, setAnswered] = useState({});

    const toggleReveal = (index) => {
        setRevealed(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const handleResponse = (index, isCorrect, topic) => {
        if (answered[index]) return; // Prevent changing answer
        setAnswered(prev => ({ ...prev, [index]: isCorrect ? 'correct' : 'incorrect' }));

        if (!isCorrect) {
            onWeakTopicDetected(topic);
        }
    };

    return (
        <div className="quiz-container">
            <h2 className="section-header">Knowledge Check</h2>
            <div className="quiz-list-interactive">
                {quizData.map((item, index) => (
                    <div key={index} className="quiz-card card">
                        <div className="quiz-question">
                            <span className="q-number">Q{index + 1}</span>
                            <p>{item.question}</p>
                        </div>

                        <div className="quiz-actions">
                            {!revealed[index] ? (
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => toggleReveal(index)}
                                >
                                    <Eye size={16} /> Show Answer
                                </button>
                            ) : (
                                <div className="answer-reveal animate-fade-in">
                                    <p className="answer-text"><strong>Answer:</strong> {item.answer}</p>

                                    {!answered[index] && (
                                        <div className="self-grade">
                                            <span className="grade-label">Did you get it right?</span>
                                            <div className="grade-buttons">
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => handleResponse(index, true, item.topic)}
                                                >
                                                    <CheckCircle size={16} /> Yes
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleResponse(index, false, item.topic)}
                                                >
                                                    <XCircle size={16} /> No
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {answered[index] === 'correct' && (
                                        <div className="feedback correct">
                                            <CheckCircle size={16} /> Great job!
                                        </div>
                                    )}

                                    {answered[index] === 'incorrect' && (
                                        <div className="feedback incorrect">
                                            <XCircle size={16} /> Marked for review.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QuizInteractive;
