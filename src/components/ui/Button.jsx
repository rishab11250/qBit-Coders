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
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

    const variants = {
        primary: "bg-[var(--accent-primary)] text-white hover:opacity-90 shadow-md hover:shadow-lg active:scale-95 hover:scale-105 transition-all duration-300",
        secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:scale-95 transition-all duration-200",
        danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 active:scale-95 transition-all duration-200",
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all duration-200"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm rounded-lg",
        md: "px-5 py-2.5 text-sm rounded-xl font-semibold",
        lg: "px-8 py-4 text-base rounded-2xl font-bold"
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
