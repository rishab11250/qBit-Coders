import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Zap,
  ListChecks,
  HelpCircle,
  Loader2,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import './App.css';

const App = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const generatePlan = () => {
    setIsLoading(true);
    // Simulate AI generation
    setTimeout(() => {
      setIsLoading(false);
      setShowDashboard(true);
    }, 2500);
  };

  const dummyData = {
    summary: "This document covers the fundamental principles of React.js, focusing on state management, component lifecycle, and the virtual DOM. It explains how React efficiently updates the UI and handles user interactions through a declarative approach.",
    topics: [
      "Declarative UI & Components",
      "Virtual DOM & Reconciliation",
      "State & Props Management",
      "Effect Hook (useEffect)",
      "Keys in Lists"
    ],
    quiz: [
      { q: "What is the primary benefit of the Virtual DOM?", a: "It minimizes direct manipulation of the actual DOM, leading to better performance." },
      { q: "Difference between props and state?", a: "Props are read-only and passed from parents, whereas state is local and managed within the component." }
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
          <motion.div
            className="upload-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>Knowledge to Mastery, <span className="highlight">Instantly.</span></h1>
            <p className="subtitle">Upload your PDF materials and let AI structure your learning journey.</p>

            <div className={`dropzone card ${file ? 'has-file' : ''}`}>
              <input type="file" accept=".pdf" onChange={handleFileChange} id="pdf-upload" />
              <label htmlFor="pdf-upload">
                {file ? (
                  <div className="file-info">
                    <CheckCircle2 size={48} className="success-icon" />
                    <p>{file.name}</p>
                    <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <>
                    <Upload size={48} className="upload-icon" />
                    <p>Click or drag your PDF here</p>
                    <span>Support for textbooks, notes, and research papers</span>
                  </>
                )}
              </label>
            </div>

            <button
              className={`btn btn-primary btn-generate ${isLoading ? 'loading' : ''}`}
              onClick={generatePlan}
              disabled={!file || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="spin" />
                  Analyzing Content...
                </>
              ) : (
                <>
                  Generate Study Plan
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <div className="dashboard-view">
            <header className="dashboard-header animate-fade-in">
              <button className="btn-back" onClick={() => setShowDashboard(false)}>
                ← New Upload
              </button>
              <h2>Generated Study Plan</h2>
            </header>

            <div className="dashboard-grid">
              <motion.section
                className="summary-section card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="section-title">
                  <FileText size={20} />
                  <h3>Executive Summary</h3>
                </div>
                <p>{dummyData.summary}</p>
              </motion.section>

              <motion.section
                className="topics-section card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="section-title">
                  <ListChecks size={20} />
                  <h3>Key Topics</h3>
                </div>
                <ul className="topic-list">
                  {dummyData.topics.map((topic, i) => (
                    <li key={i}>{topic}</li>
                  ))}
                </ul>
              </motion.section>

              <motion.section
                className="quiz-section card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="section-title">
                  <HelpCircle size={20} />
                  <h3>Quick Assessment</h3>
                </div>
                <div className="quiz-list">
                  {dummyData.quiz.map((item, i) => (
                    <div key={i} className="quiz-item">
                      <p className="question"><strong>Q:</strong> {item.q}</p>
                      <p className="answer"><strong>A:</strong> {item.a}</p>
                    </div>
                  ))}
                </div>
              </motion.section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
