import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function FormInput({
    id,
    label,
    type = 'text',
    value,
    onChange,
    onBlur,
    error,
    success,
    helperText,
    required = false,
    disabled = false,
    placeholder,
    className = '',
    ...props
}) {
    const [isFocused, setIsFocused] = useState(false);
    const [isTouched, setIsTouched] = useState(false);

    const handleBlur = (e) => {
        setIsFocused(false);
        setIsTouched(true);
        if (onBlur) onBlur(e);
    };

    const showError = error && isTouched;
    const showSuccess = success && isTouched && !error;

    const inputClasses = `
        w-full px-4 py-2.5 rounded-xl
        bg-white/50 dark:bg-gray-800/50
        border-2 transition-all
        text-gray-900 dark:text-gray-100
        placeholder:text-gray-400
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2
        ${showError
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            : showSuccess
                ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                : 'border-gray-200 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500/20'
        }
    `;

    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange} // Kept original onChange prop
                    onFocus={() => setIsFocused(true)} // Kept original onFocus
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    className={`
                        w-full px-4 py-3 
                        bg-white/10 dark:bg-gray-800/30
                        border-2 rounded-xl
                        text-gray-900 dark:text-gray-100
                        placeholder-gray-500 dark:placeholder-gray-400
                        backdrop-blur-sm
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${showError // Using showError from component state
                            ? 'border-red-500 focus:ring-red-500'
                            : showSuccess // Using showSuccess from component state
                                ? 'border-green-500 focus:ring-green-500'
                                : 'border-gray-300 dark:border-gray-600'
                        }
                    `}
                    {...props}
                />

                {showError && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                )}

                {showSuccess && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                )}
            </div>

            {showError && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-1">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </p>
            )}

            {helperText && !showError && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {helperText}
                </p>
            )}
        </div>
    );
}
