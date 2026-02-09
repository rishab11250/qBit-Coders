import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import Upload from './components/Upload';
import Dashboard from './components/Dashboard';
import './App.css';

const App = () => {
  const [showDashboard, setShowDashboard] = useState(false);

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
          <div className="upload-container">
            <Upload onGenerate={() => setShowDashboard(true)} />
            <div style={{ marginTop: '20px', padding: '10px', border: '1px dashed red' }}>
              <h3>Dev Test Area</h3>
              <button onClick={async () => {
                const { generateStudyContent } = await import('./services/aiService');
                console.log("Testing AI Service...");
                try {
                  const result = await generateStudyContent("Solar energy is radiant light and heat from the Sun that is harnessed using a range of ever-evolving technologies such as solar heating, photovoltaics, solar thermal energy, solar architecture, molten salt power plants and artificial photosynthesis.");
                  console.log("AI Service Result:", result);
                  alert("Check console for result!");
                } catch (e) {
                  console.error(e);
                  alert("Error: " + e.message);
                }
              }}>
                Test AI Service
              </button>
            </div>
          </div>
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
};

export default App;
