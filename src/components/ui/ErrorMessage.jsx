import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';

const ErrorMessage = ({ title = "Error", message, onDismiss, className = '' }) => {
    if (!message) return null;

    return (
        <div className={`bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md flex items-start justify-between ${className}`}>
            <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                    <h4 className="text-sm font-semibold text-red-800">{title}</h4>
                    <p className="text-sm text-red-700 mt-1">{message}</p>
                </div>
            </div>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="text-red-400 hover:text-red-600 transition-colors"
                >
                    <XCircle size={18} />
                </button>
            )}
        </div>
    );
};

export default ErrorMessage;
