import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
    children,
    variant = 'primary', // primary, secondary, danger, ghost
    size = 'md', // sm, md, lg
    isLoading = false,
    disabled = false,
    className = '',
    onClick,
    type = 'button',
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg",
        secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
        danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm rounded-md",
        md: "px-4 py-2 text-sm rounded-lg",
        lg: "px-6 py-3 text-base rounded-xl"
    };

    return (
        <button
            type={type}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            onClick={onClick}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {children}
        </button>
    );
};

export default Button;
