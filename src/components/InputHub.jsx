import React, { useState } from 'react';
import {
    Upload, FileText, Youtube, CheckCircle2, ArrowRight, Sparkles
} from 'lucide-react';
import useStudyStore from '../store/useStudyStore';
import { processStudyFile } from '../utils/filePipeline';
import Button from './ui/Button';
import Loader from './ui/Loader';
import ErrorMessage from './ui/ErrorMessage';

const InputHub = ({ onGenerate }) => {
    const {
        setPdfFile, setExtractedText,
        notes, setNotes,
        videoUrl, setVideoUrl,
        isLoading, setLoading,
        error, setError
    } = useStudyStore();

    const [activeTab, setActiveTab] = useState('pdf');
    const [localFile, setLocalFile] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validation
            // Although processStudyFile handles non-pdfs, the UI says "PDF files"
            // We can keep the UI restriction or relax it. Remote had specific check.
            // We'll trust the pipeline but maybe keep the warning if strict.
            // Let's allow what processStudyFile allows, but for now the UI prompts for PDF.

            setLocalFile(file);
            setPdfFile(file);
            setLoading(true);
            setError(null);

            try {
                // Use the file pipeline to extract and chunk text
                console.log("📄 Processing file via pipeline...");
                const { rawText, chunks } = await processStudyFile(file);

                if (!rawText && !chunks.length) {
                    throw new Error("Failed to extract text from file.");
                }

                console.log(`✂️ Chunks created: ${chunks.length}`);

                // Store the processed text (joined chunks) for the AI
                setExtractedText(chunks.join('\n'));

            } catch (err) {
                console.error("File processing error:", err);
                setError("Failed to process file. Please try again.");
                setLocalFile(null);
            } finally {
                setLoading(false);
            }
        }
    };

    const isReady = () => {
        if (activeTab === 'pdf') return !!localFile && !isLoading && !error; // simplified check
        if (activeTab === 'notes') return notes.length > 20;
        if (activeTab === 'video') return videoUrl.includes('youtube');
        return false;
    };

    return (
        <div className="relative overflow-hidden bg-white">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50 via-white to-purple-50 opacity-80" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50" />
            <div className="absolute top-1/2 -left-24 w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-50" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-6 animate-fade-in">
                        <Sparkles size={14} />
                        <span>Powered by Gemini 1.5 Pro</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 animate-slide-up">
                        Master any subject <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            in minutes, not hours.
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        Upload your course materials, lecture notes, or YouTube videos.
                        Our AI will create a personalized study plan, quizzes, and summaries instantly.
                    </p>
                </div>

                {/* Input Interface */}
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-100 bg-slate-50/50">
                        {[
                            { id: 'pdf', icon: Upload, label: 'Upload PDF' },
                            { id: 'notes', icon: FileText, label: 'Paste Notes' },
                            { id: 'video', icon: Youtube, label: 'YouTube Video' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors border-b-2
                  ${activeTab === tab.id
                                        ? 'border-indigo-600 text-indigo-600 bg-white'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-8 min-h-[320px] bg-white relative">
                        {isLoading && (
                            <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex items-center justify-center">
                                <Loader text="Processing file..." size="lg" />
                            </div>
                        )}

                        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} className="mb-6" />}

                        {activeTab === 'pdf' && (
                            <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-all h-full flex flex-col items-center justify-center
                ${localFile ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
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
                                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                                <CheckCircle2 size={32} />
                                            </div>
                                            <p className="text-lg font-medium text-emerald-900">{localFile.name}</p>
                                            <p className="text-sm text-emerald-600 mt-1">{(localFile.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Upload size={32} />
                                            </div>
                                            <p className="text-lg font-medium text-slate-900">Click to upload or drag and drop</p>
                                            <p className="text-sm text-slate-500 mt-2">PDF files up to 20MB</p>
                                        </>
                                    )}
                                </label>
                            </div>
                        )}

                        {activeTab === 'notes' && (
                            <textarea
                                className="w-full h-64 p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none text-slate-700 placeholder:text-slate-400 text-lg leading-relaxed"
                                placeholder="Paste your lecture notes, snippets, or raw text here..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        )}

                        {activeTab === 'video' && (
                            <div className="flex flex-col items-center justify-center h-full py-10">
                                <div className="w-full max-w-lg">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Youtube className="text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-lg"
                                            placeholder="Paste YouTube URL here..."
                                            value={videoUrl}
                                            onChange={(e) => setVideoUrl(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-center text-slate-500 text-sm mt-4">
                                        Supports public YouTube videos with captions.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Action */}
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full sm:w-auto min-w-[200px] shadow-indigo-200 shadow-xl"
                            onClick={onGenerate}
                            disabled={!isReady() || isLoading}
                            isLoading={isLoading}
                        >
                            Generate Study Plan <ArrowRight size={20} className="ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InputHub;
