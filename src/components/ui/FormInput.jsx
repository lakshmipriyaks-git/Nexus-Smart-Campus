import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

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
    inputTextClassName = 'text-[#202442] dark:text-[#F8FAFC]',
    ...props
}) {
    const [isFocused, setIsFocused] = useState(false);
    const [isTouched, setIsTouched] = useState(false);

    const handleBlur = (e) => {
        setIsFocused(false);
        setIsTouched(true);
        if (onBlur) onBlur(e);
    };

    const showError = Boolean(error && isTouched);
    const showSuccess = Boolean(success && isTouched && !error);

    return (
        <div className={twMerge('space-y-1.5', className)}>
            {label && (
                <label
                    htmlFor={id}
                    className="block text-xs font-semibold uppercase tracking-wider text-[#59627E] dark:text-[#94A3B8] font-mono"
                >
                    {label}
                    {required && <span className="text-rose-400 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    className={twMerge(
                        'w-full px-3.5 py-2.5 text-sm rounded-lg border bg-[#0A0F1D] shadow-sm transition-all duration-150 outline-none',
                        'placeholder:text-[#64748B] dark:placeholder:text-[#94A3B8]',
                        'disabled:opacity-40 disabled:cursor-not-allowed',
                        inputTextClassName,
                        showError
                            ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-400'
                            : showSuccess
                            ? 'border-emerald-500 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
                            : 'border-[#1E2D4A] focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4] focus:bg-[#0D1527]'
                    )}
                    {...props}
                />

                {showError && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-600 dark:text-rose-400 pointer-events-none">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                )}
                {showSuccess && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none">
                        <CheckCircle className="w-4 h-4" />
                    </div>
                )}
            </div>

            {showError && error && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1 font-mono">
                    {error}
                </p>
            )}

            {helperText && !showError && (
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-mono">
                    {helperText}
                </p>
            )}
        </div>
    );
}
