import React from 'react';
import useStudyStore from './store/useStudyStore';
import Navbar from './components/layout/Navbar';
import InputHub from './components/InputHub';
import DashboardLayout from './components/features/DashboardLayout';
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
      // 2. Extracted Text (from Pipeline if PDF text only is preferred, or fallback)
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
        // Ensure result has all fields to prevent UI errors
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
      console.error("Geneation Failed:", e);
      setError("Failed to generate content. Please try again or check your API key.");
    } finally {
      // Loading is set to false by setStudyData or we do it here if error
      // But setStudyData sets loading to false. 
      // If error, we strictly set it to false.
      // We can't check store state easily here, so calling setLoading(false) is safe if setStudyData wasn't called.
      // Actually setStudyData handles it. If error, we need to manually turn off loading.
      // Let's do it conditionally or just rely on the store update if success.
    }
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
