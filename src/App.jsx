import React, { useEffect } from 'react';
import useStudyStore from './store/useStudyStore';
import Navbar from './components/layout/Navbar';
import InputHub from './components/InputHub';
import DashboardLayout from './components/features/DashboardLayout';
import Background3D from './components/ui/Background3D';
import { generateStudyContent, fileToBase64 } from './services/aiService';

const App = () => {
  const { currentStep, setStudyData, setLoading, pdfFile, extractedText, notes, videoUrl, setError } = useStudyStore();

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      let result;

      // 1. PDF File (Multimodal)
      if (pdfFile) {
        console.log("Generating from PDF File...");
        const base64 = await fileToBase64(pdfFile);
        result = await generateStudyContent('pdf', base64, pdfFile.type);
      }
      // 2. Extracted Text
      else if (extractedText && extractedText.length > 0) {
        console.log("Generating from Extracted Text...");
        result = await generateStudyContent('text', extractedText);
      }
      // 3. Raw Notes
      else if (notes && notes.length > 0) {
        console.log("Generating from Notes...");
        result = await generateStudyContent('text', notes);
      }
      // 4. Video URL
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
          quiz: result.quiz || []
        };
        setStudyData(safeResult);
      } else {
        throw new Error("AI returned empty result.");
      }

    } catch (e) {
      console.error("Generated Failed:", e);
      setError("Failed to generate content. Please try again or check your API key.");
      setLoading(false); // Ensure loading stops on error
    }
  };

  return (
    <div className="relative min-h-screen text-white overflow-hidden">

      {/* 3D Background Layer */}
      <Background3D />

      {/* Main Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 pt-24">
          {currentStep === 'input' ? (
            <InputHub onGenerate={handleGenerate} />
          ) : (
            <DashboardLayout />
          )}
        </main>

        <footer className="py-8 text-center text-slate-500 text-sm">
          <p>© 2024 StudyFlow AI. Built for qBit-Coders.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
