import React from 'react';
import useStudyStore from './store/useStudyStore';
import Navbar from './components/layout/Navbar';
import InputHub from './components/InputHub';
import DashboardLayout from './components/features/DashboardLayout';

const App = () => {
  const { currentStep, setStudyData, setLoading } = useStudyStore();

  const handleGenerate = () => {
    setLoading(true);
    // Simulate API Call
    setTimeout(() => {
      setStudyData({
        summary: "Artificial Intelligence (AI) is the simulation of human intelligence processes by machines...",
        topics: ["Intro to AI", "Machine Learning", "Neural Nets", "NLP", "Computer Vision"],
        concepts: [
          { name: "AI", related: ["ML", "Robotics"] },
          { name: "ML", related: ["Supervised", "Unsupervised"] }
        ],
        quiz: [
          { question: "Goal of AI?", answer: "Simulate human intelligence.", topic: "Intro" },
          { question: "Learning from data?", answer: "Machine Learning", topic: "ML" }
        ],
        weakAreas: []
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />

      <main className="flex-1 pt-16">
        {currentStep === 'input' ? (
          <InputHub onGenerate={handleGenerate} />
        ) : (
          <DashboardLayout />
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-400 text-sm">
          <p>© 2024 StudyFlow AI. Built for qBit-Coders.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
