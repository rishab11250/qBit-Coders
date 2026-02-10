import React, { useState } from 'react';
import {
    Upload, FileText, Youtube, CheckCircle2, ArrowRight, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion'; // Using Framer Motion for animations
import useStudyStore from '../store/useStudyStore';
import { processInput } from '../services/processingService'; // [NEW] Import Service
import ModelSelector from './ui/ModelSelector'; // [NEW] Model Selector
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
    const [localFiles, setLocalFiles] = useState([]); // [CHANGED] Array
    const [processingStatus, setProcessingStatus] = useState('');

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setLocalFiles(files);
            // Legacy support: set the first file to store if needed, mostly for single-file assumptions elsewhere
            setPdfFile(files[0]);
        }
    };

    // Wrapper for the main "Generate" button
    const handleMainGenerate = async () => {
        setError(null);
        setLoading(true);
        setProcessingStatus('Processing input...');

        // [FIX] Clear previous content to prevent stale results
        setProcessedContent(null);
        setExtractedText('');

        try {
            console.log("📄 Processing input...");
            let result = null;

            // 1. Process based on Tab
            if (activeTab === 'pdf' && localFiles.length > 0) {
                console.log(`📂 Processing ${localFiles.length} files...`);
                let allChunks = [];
                let combinedRawText = "";

                // Process each file sequentially
                for (let i = 0; i < localFiles.length; i++) {
                    const file = localFiles[i];
                    setProcessingStatus(`Processing ${i + 1}/${localFiles.length}: ${file.name}...`);

                    try {
                        const fileResult = await processInput(file);
                        if (fileResult) {
                            allChunks.push(...fileResult.chunks);
                            combinedRawText += fileResult.rawText + "\n\n";
                        }
                    } catch (err) {
                        console.error(`Error processing file ${file.name}:`, err);
                        // We continue with other files even if one fails
                    }
                }

                if (allChunks.length > 0) {
                    result = {
                        sourceType: 'multiple-pdf',
                        rawText: combinedRawText,
                        chunks: allChunks
                    };
                }

            } else if (activeTab === 'notes' && notes) {
                result = await processInput(notes); // Treat notes as string input
            } else if (activeTab === 'video' && videoUrl) {
                // Video processing (assuming processInput handles string URL)
                result = await processInput(videoUrl);
            }

            if (result) {
                console.log(`✂️ Total chunks: ${result.chunks.length}`);

                // Update Store
                setProcessedContent(result);
                setExtractedText(result.rawText);

                console.log("🧠 Sending combined content to AI...");
                await onGenerate();
            } else if (activeTab === 'video' && !result) {
                // Fallback if video isn't handled by processInput for some reason
                await onGenerate();
            } else {
                // Should not happen if processInput works, but safety net
                setError("No content could be processed.");
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
        if (activeTab === 'pdf') return localFiles.length > 0 && !isLoading && !error;
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
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight text-primary mb-6"
                    >
                        Master any subject <br />
                        in <span className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_20px_rgba(56,189,248,0.3)]">Minutes</span>, not in Hours.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg md:text-xl text-secondary max-w-2xl mx-auto mb-10"
                    >
                        Upload your course materials, lecture notes, or YouTube videos.
                        Our AI creates personalized study plans instantly.
                    </motion.p>

                    <div className="flex justify-center gap-4 mb-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-violet-500/30 text-violet-500 text-sm font-medium"
                        >
                            <Sparkles size={14} className="text-violet-500" />
                            <span>Powered by Gemini AI</span>
                        </motion.div>

                        {/* [NEW] Model Selector */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <ModelSelector />
                        </motion.div>
                    </div>
                </div>

                {/* Glass Input Card */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="glass-panel rounded-3xl overflow-hidden shadow-2xl shadow-violet-900/10 backdrop-blur-xl"
                >
                    {/* Tabs */}
                    <div className="flex border-b border-primary/10 bg-primary/5">
                        {[
                            { id: 'pdf', icon: Upload, label: 'Upload PDF' },
                            { id: 'notes', icon: FileText, label: 'Paste Notes' },
                            { id: 'video', icon: Youtube, label: 'YouTube Video' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-5 text-sm font-medium transition-all relative overflow-hidden cursor-pointer
                                    ${activeTab === tab.id
                                        ? 'text-primary bg-primary/10 border-b-2 border-violet-500'
                                        : 'text-secondary hover:text-primary hover:bg-primary/5 border-b-2 border-transparent'
                                    }`}
                            >
                                <tab.icon size={18} className={activeTab === tab.id ? 'text-primary' : ''} />
                                <span className={activeTab === tab.id ? 'text-primary' : ''}>{tab.label}</span>
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="p-8 md:p-12 min-h-[350px] relative">
                        {isLoading && (
                            <div className="absolute inset-0 z-20 bg-primary/40 backdrop-blur-md flex items-center justify-center rounded-b-3xl">
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
                                    ${localFiles.length > 0
                                        ? 'border-emerald-500/50 bg-emerald-500/10'
                                        : 'border-primary/10 hover:border-violet-500/50 hover:bg-primary/5'
                                    }`}
                            >
                                <input
                                    type="file"
                                    accept=".pdf"
                                    multiple // [CHANGED] Allow multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="pdf-upload"
                                    disabled={isLoading}
                                />
                                <label htmlFor="pdf-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                                    {localFiles.length > 0 ? (
                                        <>
                                            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4 neon-shadow">
                                                <CheckCircle2 size={40} />
                                            </div>
                                            <p className="text-xl font-medium text-primary">
                                                {localFiles.length === 1 ? localFiles[0].name : `${localFiles.length} files selected`}
                                            </p>
                                            <p className="text-sm text-emerald-500 mt-2">
                                                {(localFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB Total • Ready to analyze
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-20 h-20 bg-primary/5 text-primary rounded-full flex items-center justify-center mb-6 border border-primary/10 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                                                <Upload size={36} />
                                            </div>
                                            <p className="text-xl font-medium text-primary mb-2">Drop your PDFs here</p>
                                            <p className="text-sm text-secondary">or click to browse functionality</p>
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
                                            <Youtube className="text-secondary group-focus-within:text-red-500 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full pl-14 pr-6 py-5 rounded-2xl glass-input text-lg"
                                            placeholder="Paste YouTube URL here..."
                                            value={videoUrl}
                                            onChange={(e) => setVideoUrl(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-center text-secondary text-sm mt-4">
                                        Supports public YouTube videos with captions.
                                    </p>

                                    {/* Pro Tip Alert */}
                                    <div className="mt-6 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-left">
                                        <div className="flex items-start gap-3">
                                            <div className="p-1 mt-0.5 bg-violet-500/20 rounded-md">
                                                <Sparkles size={14} className="text-violet-400" />
                                            </div>
                                            <div>
                                                <p className="text-violet-600 dark:text-violet-200 text-sm font-medium mb-1">For Full Courses & Long Videos:</p>
                                                <p className="text-violet-500/80 dark:text-violet-300/80 text-xs leading-relaxed">
                                                    AI browsing has limits. For 100% accuracy on long content (like CS50), we recommend copying the <strong>Transcript</strong> and pasting it in the <button onClick={() => setActiveTab('notes')} className="text-primary hover:underline underline-offset-2">Paste Notes</button> tab.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer Action */}
                    <div className="p-6 md:p-8 border-t border-primary/10 bg-primary/5 flex justify-end">
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full sm:w-auto min-w-[200px] text-lg shadow-xl hover:shadow-2xl hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 bg-gradient-to-r from-violet-600 to-indigo-600 border border-white/20"
                            onClick={handleMainGenerate}
                            disabled={!isReady() || isLoading}
                            isLoading={isLoading}
                        >
                            Generate Study Plan <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default InputHub;
