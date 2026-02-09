import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import InputHub from './components/InputHub';
import DashboardLayout from './components/DashboardLayout';
import { generateStudyContent } from './services/aiService';
import './App.css';

const App = () => {
  // FORCE DASHBOARD OPEN FOR TESTING
  const [showDashboard, setShowDashboard] = useState(true);

  // HARDCODED TEST DATA
  const [studyData, setStudyData] = useState({
    summary: "Photosynthesis is the process used by plants, algae and certain bacteria to harness energy from sunlight and turn it into chemical energy. The process takes place in the chloroplasts, specifically using chlorophyll. The general equation is: 6CO2 + 6H2O + Light Energy → C6H12O6 + 6O2.",
    topics: [
      "Photosynthesis",
      "Calvin Cycle",
      "Chloroplasts",
      "ATP Production"
    ],
    concepts: [
      { name: "Photosynthesis", related: ["Light-dependent", "Calvin Cycle", "Chloroplasts"] },
      { name: "Light-dependent", related: ["Thylakoid", "ATP", "NADPH", "Sunlight"] },
      { name: "Calvin Cycle", related: ["Stroma", "Glucose", "Carbon Fixation"] },
      { name: "Chloroplasts", related: ["Chlorophyll", "Plant Cells"] }
    ],
    quiz: [
      {
        question: "Where does the Calvin Cycle take place?",
        answer: "In the stroma of the chloroplast.",
        topic: "Calvin Cycle"
      },
      {
        question: "What are the primary products of the light-dependent reactions?",
        answer: "ATP and NADPH (and Oxygen as a byproduct).",
        topic: "Light-dependent"
      },
      {
        question: "Which pigment is primarily responsible for absorbing sunlight?",
        answer: "Chlorophyll.",
        topic: "Chloroplasts"
      }
    ]
  });

  const handleGenerateStudyPlan = async (payload) => {
    // Note: InputHub handles the loading state
    const result = await generateStudyContent(
      payload.type,
      payload.content,
      payload.mimeType
    );

    if (result) {
      setStudyData(result);
      setShowDashboard(true);
    }
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
          <InputHub onGenerate={handleGenerateStudyPlan} />
        ) : (
          <DashboardLayout
            data={studyData}
            onRetry={() => setShowDashboard(false)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
