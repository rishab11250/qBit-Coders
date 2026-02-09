import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import InputHub from './components/InputHub';
import DashboardLayout from './components/DashboardLayout';
import { generateStudyContent } from './services/aiService';
import './App.css';

const App = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [studyData, setStudyData] = useState(null);

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
