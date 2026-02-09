import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import InputHub from './components/InputHub';
import DashboardLayout from './components/DashboardLayout';
import './App.css';

const App = () => {
  const [showDashboard, setShowDashboard] = useState(false);

  const dummyData = {
    summary: "Artificial Intelligence (AI) is the simulation of human intelligence processes by machines, especially computer systems. These processes include learning (the acquisition of information and rules for using the information), reasoning (using rules to reach approximate or definite conclusions), and self-correction.",
    topics: [
      "Introduction to AI & History",
      "Machine Learning Basics",
      "Neural Networks & Deep Learning",
      "Natural Language Processing",
      "Computer Vision"
    ],
    concepts: [
      { name: "Artificial Intelligence", related: ["Machine Learning", "Robotics", "Expert Systems"] },
      { name: "Machine Learning", related: ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning"] },
      { name: "Neural Networks", related: ["Neurons", "Layers", "Backpropagation"] }
    ],
    quiz: [
      {
        question: "What is the primary goal of Artificial Intelligence?",
        answer: "To create systems that can perform tasks that typically require human intelligence.",
        topic: "Introduction to AI"
      },
      {
        question: "Which subset of AI specifically focuses on learning from data?",
        answer: "Machine Learning",
        topic: "Machine Learning Basics"
      },
      {
        question: "What resembles the structure of the human brain in AI?",
        answer: "Neural Networks",
        topic: "Neural Networks"
      }
    ]
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <Zap size={24} className="logo-icon" />
          <span>StudyFlow AI</span>
        </div>
      </header>

      <main className="content">
        {!showDashboard ? (
          <InputHub onGenerate={() => setShowDashboard(true)} />
        ) : (
          <DashboardLayout
            data={dummyData}
            onRetry={() => setShowDashboard(false)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
