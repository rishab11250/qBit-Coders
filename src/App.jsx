import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useStudyStore from './store/useStudyStore';
import Navbar from './components/layout/Navbar';
import InputHub from './components/InputHub';
import DashboardLayout from './components/features/DashboardLayout';
import Background3D from './components/ui/Background3D';
import PomodoroTimer from './components/features/PomodoroTimer';
import { generateStudyContent, generateStudyContentWithSearch, fileToBase64, runHealthCheck } from './services/aiService';
import HistorySidebar from './components/features/HistorySidebar';

const App = () => {
  const { currentStep, setStudyData, setLoading, pdfFile, extractedText, notes, videoUrl, setError, settings, incrementPlansGenerated, isChatOpen } = useStudyStore();
  const [isSharedPlan, setIsSharedPlan] = useState(false);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // [NEW] Lifted state

  // Apply theme
  useEffect(() => {
    document.body.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // [NEW] Background Health Check: Pre-test all models and API keys
  // This runs once on app load to identify rate-limited models early
  useEffect(() => {
    console.log('🚀 App loaded. Starting background health check...');
    runHealthCheck(); // Fire and forget - runs in background
  }, []);

  // Decode shared plan from URL hash on mount
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash.startsWith('#shared=')) {
        const encoded = hash.substring(8);
        const jsonStr = decodeURIComponent(escape(atob(encoded)));
        const planData = JSON.parse(jsonStr);
        if (planData && (planData.summary || planData.topics)) {
          setStudyData({
            summary: planData.summary || '',
            topics: planData.topics || [],
            concepts: planData.concepts || [],
            quiz: planData.quiz || []
          });
          setIsSharedPlan(true);
          // Clean the URL hash
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    } catch (err) {
      console.error('Failed to decode shared plan:', err);
    }
  }, []);

  // Persist Scroll Position
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('scrollPosition', window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem('scrollPosition');
    if (savedScroll) {
      window.scrollTo(0, parseInt(savedScroll));
    }
  }, [currentStep]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      let result;

      const { processedContent } = useStudyStore.getState();

      // Google Search Grounding Fallback for blocked YouTube videos
      if (processedContent && processedContent.sourceType === 'video-search') {
        console.log("🔍 Transcript unavailable. Using Google Search Grounding...");
        result = await generateStudyContentWithSearch(processedContent.rawText);
      }
      // Image content path
      else if (processedContent && processedContent.sourceType === 'images' && processedContent.imageData) {
        console.log("🖼️ Generating from uploaded images...");
        result = await generateStudyContent('images', processedContent.imageData);
      }
      // [NEW] Multi-PDF Support
      else if (processedContent && processedContent.sourceType === 'multiple-pdf') {
        console.log("📚 Generating from Multiple PDFs...");
        result = await generateStudyContent('multiple-pdf', processedContent.fileData);
      }
      else if (processedContent && processedContent.text) {
        console.log("Generating from Processed Content...");
        result = await generateStudyContent('text', processedContent.text);
      }
      // Fallback: PDF File (Legacy)
      else if (pdfFile) {
        console.log("Generating from PDF File...");
        const base64 = await fileToBase64(pdfFile);
        result = await generateStudyContent('pdf', base64, pdfFile.type);
      }
      // Fallback: Extracted Text
      else if (extractedText && extractedText.length > 0) {
        console.log("Generating from Extracted Text...");
        result = await generateStudyContent('text', extractedText);
      }
      // Fallback: Raw Notes
      else if (notes && notes.length > 0) {
        console.log("Generating from Notes...");
        result = await generateStudyContent('text', notes);
      }
      // Fallback: Video URL
      else if (videoUrl) {
        console.log("Generating from Video URL...");
        const prompt = `Analyze the educational content of this video: ${videoUrl}. Generate a study plan, summary, and quiz.`;
        result = await generateStudyContent('text', prompt);
      }

      if (result) {
        const safeResult = {
          summary: result.summary || "No summary available.",
          topics: result.topics || [],
          concepts: result.concepts || [],
          detailed_notes: result.detailed_notes || [],
          quiz: [], // Quiz is generated on-demand now
        };

        setStudyData(safeResult);
        incrementPlansGenerated();
        useStudyStore.getState().savePlanToHistory(safeResult);

      } else {
        throw new Error("AI returned empty result.");
      }

    } catch (e) {
      console.error("Generated Failed:", e);
      setError("Failed to generate content. Please try again or check your API key.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-primary overflow-x-hidden">

      {/* 3D Background Layer */}
      <Background3D />

      {/* Main Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {!isChatOpen && <Navbar />}

        <main className={`flex-1 ${currentStep !== 'input' && !isChatOpen ? 'pt-20' : ''}`}>
          {currentStep === 'input' ? (
            <>
              <HistorySidebar isOpen={isHistoryOpen} onToggle={setIsHistoryOpen} />
              <div className="w-full">
                <InputHub onGenerate={handleGenerate} />
              </div>
            </>
          ) : (
            <DashboardLayout />
          )}
        </main>

        <footer className="py-8 text-center text-slate-500 text-sm">
          <p>&copy; 2026 StudyFlow AI. Built by qBit-Coders.</p>
        </footer>
      </div>

      {/* Pomodoro Timer (floating, global) */}
      {currentStep === 'dashboard' && <PomodoroTimer />}
    </div>
  );
};

export default App;
