import React, { useState } from 'react';
import {
    Upload, FileText, Youtube, CheckCircle2, ArrowRight, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion'; // Using Framer Motion for animations
import useStudyStore from '../store/useStudyStore';
import { processInput } from '../services/processingService'; // [NEW] Import Service
import Button from './ui/Button';
import Loader from './ui/Loader';
import ErrorMessage from './ui/ErrorMessage';

const InputHub = ({ onGenerate }) => {
    const {
        setPdfFile, setExtractedText,
        notes, setNotes,
        videoUrl, setVideoUrl,
        isLoading, setLoading,
        error, setError,
        setProcessedContent // [NEW] Store Action
    } = useStudyStore();

    const [activeTab, setActiveTab] = useState('pdf');
    const [localFile, setLocalFile] = useState(null);
    const [processingStatus, setProcessingStatus] = useState(''); // "extracting", "transcribing", etc.

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setLocalFile(file);
            setPdfFile(file);
            // We defer processing to the "Generate" button click to unify flow
            // or we could peek at it here if needed, but user asked for "When user provides input"
            // Let's keep file selection simple and process on Generate for consistency 
            // OR per instructions "When user provides input (file or text): Replace existing raw text handling"
            // The instructions say: "When user provides input... Replace existing raw text handling with: const result = await processInput(input)"
            // I will implement this inside handleMainGenerate to ensure we capture the latest state (file or notes)
            // But wait, the user instructions implies replacing the IMMEDIATE handling. 
            // Actually, step 3 says "Send processedText to the existing AI generation function".
            // So it's best to do it in handleMainGenerate.
        }
    };

    // Wrapper for the main "Generate" button
    const handleMainGenerate = async () => {
        setError(null);
        setLoading(true);
        setProcessingStatus('Processing input...');

        try {
            console.log("📄 Processing input...");
            let result = null;

            // 1. Process based on Tab
            if (activeTab === 'pdf' && localFile) {
                result = await processInput(localFile);
            } else if (activeTab === 'notes' && notes) {
                result = await processInput(notes);
            } else if (activeTab === 'video' && videoUrl) {
                // User said "Do NOT add YouTube or Gemini yet" in the previous step?
                // But this current step says "One wire the processing step".
                // And the previous step instructions for processingService.js said "ONLY support PDF, text".
                // So for video, we might skip or just pass as text if supported.
                // However, the existing code handles video specifically. 
                // I will focus on PDF/Text as per strict instructions "ONLY support PDF files, plain text files, raw text strings".
                // I will leave video logic as is or simple pass-through if needed, but the prompt implies focusing on the new service.
                // Re-reading: "Do NOT add YouTube or Gemini yet" refers to the processingService file creation.
                // Now in InputHub, I should use processInput. 
                // I will add a check for video to use the OLD logic or just skip for now if not supported by processInput.
                // actually processInput only supports PDF/Text. 
                // So I will only apply this to PDF/Notes tabs.
            }

            if (result) {
                console.log(`✂️ Chunks created: ${result.chunks.length}`);

                // Update Store
                setProcessedContent(result);
                setExtractedText(result.rawText); // result.rawText from service

                console.log("🧠 Sending to AI...");
                // 3. Send processedText to the existing AI generation function
                // The onGenerate prop function likely reads from the store (extractedText), 
                // so updating the store above should be sufficient.

                await onGenerate();
            } else if (activeTab === 'video') {
                // Fallback for video if not handled by new service yet
                await onGenerate();
            }

        } catch (err) {
            console.error("Processing Error:", err);
            setError("Failed to process input.");
        } finally {
            setLoading(false);
            setProcessingStatus('');
        }
    };

    const isReady = () => {
        if (activeTab === 'pdf') return !!localFile && !isLoading && !error;
        if (activeTab === 'notes') return notes.length > 20;
        if (activeTab === 'video') return videoUrl.includes('youtube');
        return false;
    };

    const tabVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <div className="relative overflow-hidden w-full h-full min-h-[80vh] flex items-center justify-center p-4">
            {/* Main Container */}
            <div className="relative max-w-5xl mx-auto w-full z-10">

                {/* Hero Text */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-violet-500/30 text-violet-200 text-sm font-medium mb-6"
                    >
                        <Sparkles size={14} className="text-violet-400" />
                        <span>Powered by Gemini 1.5 Pro</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6"
                    >
                        Master any subject <br />
                        <span className="text-gradient">
                            in minutes.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto"
                    >
                        Upload your course materials, lecture notes, or YouTube videos.
                        Our AI creates personalized study plans instantly.
                    </motion.p>
                </div>

                {/* Glass Input Card */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="glass-panel rounded-3xl overflow-hidden shadow-2xl shadow-violet-900/20"
                >
                    {/* Tabs */}
                    <div className="flex border-b border-white/10 bg-black/20">
                        {[
                            { id: 'pdf', icon: Upload, label: 'Upload PDF' },
                            { id: 'notes', icon: FileText, label: 'Paste Notes' },
                            { id: 'video', icon: Youtube, label: 'YouTube Video' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-5 text-sm font-medium transition-all relative overflow-hidden
                                    ${activeTab === tab.id
                                        ? 'text-white bg-white/10'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <tab.icon size={18} className={activeTab === tab.id ? 'text-violet-400' : ''} />
                                <span className={activeTab === tab.id ? 'text-violet-100' : ''}>{tab.label}</span>
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="p-8 md:p-12 min-h-[350px] relative">
                        {isLoading && (
                            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-md flex items-center justify-center rounded-b-3xl">
                                <Loader text={processingStatus || "Analyzing content..."} size="lg" />
                            </div>
                        )}

                        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} className="mb-6" />}

                        {/* PDF TAB */}
                        {activeTab === 'pdf' && (
                            <motion.div
                                variants={tabVariants}
                                initial="hidden"
                                animate="visible"
                                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all h-full flex flex-col items-center justify-center group
                                    ${localFile
                                        ? 'border-emerald-500/50 bg-emerald-500/10'
                                        : 'border-white/10 hover:border-violet-500/50 hover:bg-white/5'
                                    }`}
                            >
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="pdf-upload"
                                    disabled={isLoading}
                                />
                                <label htmlFor="pdf-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                                    {localFile ? (
                                        <>
                                            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 neon-shadow">
                                                <CheckCircle2 size={40} />
                                            </div>
                                            <p className="text-xl font-medium text-white">{localFile.name}</p>
                                            <p className="text-sm text-emerald-400 mt-2">{(localFile.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-20 h-20 bg-white/5 text-violet-400 rounded-full flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 group-hover:bg-violet-500/20 group-hover:text-white transition-all duration-300">
                                                <Upload size={36} />
                                            </div>
                                            <p className="text-xl font-medium text-white mb-2">Drop your PDF here</p>
                                            <p className="text-sm text-gray-400">or click to browse functionality</p>
                                        </>
                                    )}
                                </label>
                            </motion.div>
                        )}

                        {/* NOTES TAB */}
                        {activeTab === 'notes' && (
                            <motion.div
                                variants={tabVariants}
                                initial="hidden"
                                animate="visible"
                                className="h-full"
                            >
                                <textarea
                                    className="w-full h-72 p-6 rounded-2xl glass-input text-lg leading-relaxed resize-none"
                                    placeholder="Paste your lecture notes, snippets, or raw text here..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </motion.div>
                        )}

                        {/* VIDEO TAB */}
                        {activeTab === 'video' && (
                            <motion.div
                                variants={tabVariants}
                                initial="hidden"
                                animate="visible"
                                className="flex flex-col items-center justify-center h-full py-12"
                            >
                                <div className="w-full max-w-lg">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                            <Youtube className="text-gray-500 group-focus-within:text-red-500 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full pl-14 pr-6 py-5 rounded-2xl glass-input text-lg"
                                            placeholder="Paste YouTube URL here..."
                                            value={videoUrl}
                                            onChange={(e) => setVideoUrl(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-center text-gray-400 text-sm mt-6">
                                        Supports public YouTube videos with captions.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer Action */}
                    <div className="p-6 md:p-8 border-t border-white/10 bg-white/5 flex justify-end">
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full sm:w-auto min-w-[200px] btn-primary text-lg shadow-indigo-200 shadow-xl"
                            onClick={handleMainGenerate}
                            disabled={!isReady() || isLoading}
                            isLoading={isLoading}
                        >
                            Generate Study Plan <ArrowRight size={20} className="ml-2" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default InputHub;
