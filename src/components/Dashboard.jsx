import React from 'react';

const Dashboard = () => {
    const dummyData = {
        summary: "Artificial Intelligence is the simulation of human intelligence by machines.",
        topics: ["Artificial Intelligence", "Machine Learning", "Neural Networks"],
        quiz: [
            { question: "What is AI?", answer: "Simulation of human intelligence by machines." },
            { question: "What is ML?", answer: "Subset of AI focused on learning from data." }
        ]
    };

    return (
        <div className="dashboard-container animate-fade-in">
            <section className="section">
                <h2 className="section-header">Summary</h2>
                <div className="card">
                    <p className="summary-text">{dummyData.summary}</p>
                </div>
            </section>

            <section className="section">
                <h2 className="section-header">Topics</h2>
                <div className="card">
                    <ul className="topic-list-simple">
                        {dummyData.topics.map((topic, i) => (
                            <li key={i}>{topic}</li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="section">
                <h2 className="section-header">Quiz</h2>
                <div className="card">
                    <div className="quiz-list-simple">
                        {dummyData.quiz.map((item, i) => (
                            <div key={i} className="quiz-item-simple">
                                <p className="question"><strong>Q{i + 1}:</strong> {item.question}</p>
                                <p className="answer"><strong>A:</strong> {item.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <button className="btn btn-secondary mt-4" onClick={() => window.location.reload()}>
                Start Over
            </button>
        </div>
    );
};

export default Dashboard;
