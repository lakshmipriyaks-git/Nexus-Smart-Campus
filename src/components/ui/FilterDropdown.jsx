import React from 'react';
import { Filter, X } from 'lucide-react';

export default function FilterDropdown({
    value,
    onChange,
    options = [],
    label = "Filter",
    className = ""
}) {
    const handleReset = () => {
        onChange('all');
    };

    const activeFilter = options.find(opt => opt.value === value);
    const hasActiveFilter = value && value !== 'all';

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <select
                    value={value || 'all'}
                    onChange={(e) => onChange(e.target.value)}
                    className="pl-10 pr-8 py-2 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all text-sm text-gray-900 dark:text-gray-100 appearance-none cursor-pointer"
                >
                    <option value="all">All {label}</option>
                    {options.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {hasActiveFilter && (
                <button
                    onClick={handleReset}
                    className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                    title="Clear filter"
                >
                    <X className="h-3 w-3" />
                    Clear
                </button>
            )}
        </div>
    );
}
