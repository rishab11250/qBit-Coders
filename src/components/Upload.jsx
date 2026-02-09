import React, { useState } from 'react';
import { Upload as UploadIcon, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';

const Upload = ({ onGenerate }) => {
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleGenerate = () => {
        if (!file) return;
        setIsLoading(true);
        // Simulate loading state of 2 seconds
        setTimeout(() => {
            setIsLoading(false);
            onGenerate();
        }, 2000);
    };

    return (
        <div className="upload-container animate-fade-in">
            <h1 className="main-title">Multimodal Study Coach</h1>

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
                            <UploadIcon size={48} className="upload-icon" />
                            <p>Upload PDF</p>
                            <span className="file-hint">Drag & drop or click to browse</span>
                        </>
                    )}
                </label>
            </div>

            <button
                className="btn btn-primary btn-generate"
                onClick={handleGenerate}
                disabled={!file || isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 size={20} className="spin" />
                        Generating Study Plan...
                    </>
                ) : (
                    <>
                        Generate Study Plan
                        <ChevronRight size={20} />
                    </>
                )}
            </button>
        </div>
    );
};

export default Upload;
