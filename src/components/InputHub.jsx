import React, { useState } from 'react';
import {
    Upload as UploadIcon,
    FileText,
    Youtube,
    CheckCircle2,
    ChevronRight
} from 'lucide-react';
import useStudyStore from '../store/useStudyStore';
import { extractTextFromPDF } from '../services/pdfService';
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
            if (file.type !== 'application/pdf') {
                setError("Only PDF files are supported.");
                return;
            }

            setLocalFile(file);
            setPdfFile(file);
            setLoading(true);
            setError(null);

            try {
                const { text, pages } = await extractTextFromPDF(file);
                setExtractedText(text);
                console.log(`Extracted ${text.length} characters from ${pages} pages.`);
            } catch (err) {
                setError(err.message);
                setLocalFile(null);
            } finally {
                setLoading(false);
            }
        }
    };

    const isReady = () => {
        if (activeTab === 'pdf') return !!localFile;
        if (activeTab === 'notes') return notes.length > 20;
        if (activeTab === 'video') return videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
        return false;
    };

    return (
        <div className="input-hub animate-fade-in">
            <h1 className="main-title">Multimodal Study Coach</h1>
            <p className="main-subtitle">Turn any content into a structured study plan.</p>

            <div className="hub-card card">
                <div className="hub-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'pdf' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pdf')}
                    >
                        <UploadIcon size={18} /> Upload PDF
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notes')}
                    >
                        <FileText size={18} /> Paste Notes
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`}
                        onClick={() => setActiveTab('video')}
                    >
                        <Youtube size={18} /> YouTube Video
                    </button>
                </div>

                <div className="hub-content relative min-h-[300px]">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm rounded-lg">
                            <Loader text="Processing Content..." />
                        </div>
                    )}

                    {error && (
                        <ErrorMessage
                            message={error}
                            onDismiss={() => setError(null)}
                            className="mb-4"
                        />
                    )}

                    {activeTab === 'pdf' && (
                        <div className={`dropzone ${localFile ? 'has-file' : ''}`}>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                id="pdf-upload"
                                disabled={isLoading}
                            />
                            <label htmlFor="pdf-upload" className="w-full h-full flex flex-col items-center justify-center">
                                {localFile ? (
                                    <div className="file-info">
                                        <CheckCircle2 size={40} className="success-icon" />
                                        <p>{localFile.name}</p>
                                        <span className="file-size">{(localFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                ) : (
                                    <>
                                        <UploadIcon size={40} className="upload-icon" />
                                        <p>Drag PDF here or click to browse</p>
                                    </>
                                )}
                            </label>
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <textarea
                            className="notes-input"
                            placeholder="Paste your study notes, lecture transcript, or raw text here..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    )}

                    {activeTab === 'video' && (
                        <div className="video-input-wrapper">
                            <Youtube size={32} className="youtube-icon" />
                            <input
                                type="text"
                                className="video-input"
                                placeholder="Paste YouTube URL (e.g., https://youtube.com/watch?v=...)"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="hub-footer">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={onGenerate}
                        disabled={!isReady() || isLoading}
                        isLoading={isLoading}
                    >
                        Generate Study Plan <ChevronRight size={20} className="ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default InputHub;
