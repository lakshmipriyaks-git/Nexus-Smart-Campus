import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items }) {
    return (
        <nav className="flex items-center space-x-2 text-sm mb-6 px-1">
            <Link
                to="/dashboard"
                className="flex items-center gap-1 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
            >
                <Home className="w-4 h-4" />
                <span>Home</span>
            </Link>

            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600" />

                    {item.href && index !== items.length - 1 ? (
                        <Link
                            to={item.href}
                            className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className={`${index === items.length - 1
                                ? 'text-gray-900 dark:text-white font-medium'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                            {item.label}
                        </span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
}
