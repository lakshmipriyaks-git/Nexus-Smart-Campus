import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = "Search...", className = "" }) {
    const [localValue, setLocalValue] = useState(value || '');

    // Debounce the search input
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onChange(localValue);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [localValue, onChange]);

    // Sync with external value changes
    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    const handleClear = () => {
        setLocalValue('');
        onChange('');
    };

    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-10 py-2.5 bg-[#0A0F1D] border border-[#1E2D4A] rounded-xl focus:ring-2 focus:ring-[#06B6D4]/30 focus:border-[#06B6D4] outline-none transition-all text-xs sm:text-sm text-white placeholder:text-slate-500"
            />
            {localValue && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    aria-label="Clear search"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
