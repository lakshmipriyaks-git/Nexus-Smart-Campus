import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundaryWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundaryWrapper caught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Custom fallback UI or use prop
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback
            return (
                <div className="glass-card p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {this.props.errorTitle || 'Something went wrong'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {this.props.errorMessage || 'This section encountered an error. Please try refreshing the page.'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundaryWrapper;
