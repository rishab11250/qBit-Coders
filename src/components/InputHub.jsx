import React, { useState } from 'react';
import { fileToBase64 } from '../services/aiService';
import {
    Upload as UploadIcon,
    FileText,
    Youtube,
    Loader2,
    CheckCircle2,
    ChevronRight
} from 'lucide-react';

const InputHub = ({ onGenerate }) => {
    const [activeTab, setActiveTab] = useState('pdf'); // 'pdf', 'notes', 'video'
    const [file, setFile] = useState(null);
    const [notes, setNotes] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files[0]) setFile(e.target.files[0]);
    };

    const handleGenerate = async () => {
        setIsLoading(true);

        try {
            let payload = {};

            // CASE 1: PDF Upload
            if (activeTab === 'pdf' && file) {
                const base64 = await fileToBase64(file);
                payload = { type: 'pdf', content: base64, mimeType: file.type };
            }
            // CASE 2: Raw Notes
            else if (activeTab === 'notes' && notes) {
                payload = { type: 'text', content: notes };
            }
            // CASE 3: YouTube Video
            else if (activeTab === 'video' && videoUrl) {
                // Pass the URL as text context for the AI
                payload = {
                    type: 'text',
                    content: `Analyze the educational content of the video at this URL: ${videoUrl}. Generate a study plan, summary, and quiz for the likely topic of this video.`
                };
            }

            // Send data back to App parent
            if (payload.content) {
                // We await a bit to ensure UI updates, then pass payload
                await onGenerate(payload);
            }

        } catch (error) {
            console.error("Input processing error:", error);
            alert("Error processing file. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const isReady = () => {
        if (activeTab === 'pdf') return !!file;
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

                <div className="hub-content">
                    {activeTab === 'pdf' && (
                        <div className={`dropzone ${file ? 'has-file' : ''}`}>
                            <input type="file" accept=".pdf" onChange={handleFileChange} id="pdf-upload" />
                            <label htmlFor="pdf-upload">
                                {file ? (
                                    <div className="file-info">
                                        <CheckCircle2 size={40} className="success-icon" />
                                        <p>{file.name}</p>
                                        <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
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
                    <button
                        className="btn btn-primary btn-lg btn-full"
                        onClick={handleGenerate}
                        disabled={!isReady() || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="spin" />
                                Analyzing Content with AI...
                            </>
                        ) : (
                            <>
                                Generate Study Plan <ChevronRight size={20} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InputHub;
