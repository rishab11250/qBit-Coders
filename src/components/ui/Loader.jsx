import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ size = 'md', text = '', className = '' }) => {
    const sizes = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12"
    };

    return (
        <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
            <Loader2 className={`${sizes[size]} text-indigo-600 animate-spin`} />
            {text && <p className="mt-3 text-sm font-medium text-gray-500 animate-pulse">{text}</p>}
        </div>
    );
};

export default Loader;
