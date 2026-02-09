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
          <Upload onGenerate={() => setShowDashboard(true)} />
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
};

export default App;
