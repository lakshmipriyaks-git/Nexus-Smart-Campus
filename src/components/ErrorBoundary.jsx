import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });

        // Log error details
        console.error('ErrorBoundary caught an error:', error);
        console.error('Component stack:', errorInfo.componentStack);

        // In production, you might want to send this to an error tracking service
        // Example: logErrorToService(error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleResetAndHome = () => {
        try {
            localStorage.removeItem('nexus_domain_auth_sessions');
            localStorage.removeItem('nexus_demo_auth_user');
        } catch (e) {}
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            const isDev = import.meta.env.DEV;

            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-red-900/20">
                    <div className="max-w-2xl w-full glass-card p-8">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                            </div>

                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Oops! Something went wrong
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    We encountered an unexpected error. Don't worry, your data is safe.
                                    Please try refreshing the page or click below to return to the campus home.
                                </p>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={this.handleRetry}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <RefreshCcw className="w-4 h-4" />
                                        Try Again
                                    </button>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="btn-secondary"
                                    >
                                        Reload Page
                                    </button>
                                    <button
                                        onClick={this.handleResetAndHome}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                                    >
                                        Go to Campus Home
                                    </button>
                                </div>

                                {isDev && this.state.error && (
                                    <details className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                                        <summary className="cursor-pointer font-semibold text-red-900 dark:text-red-200 mb-2">
                                            Error Details (Development Only)
                                        </summary>
                                        <div className="text-sm space-y-2">
                                            <div>
                                                <strong className="text-red-800 dark:text-red-300">Error:</strong>
                                                <pre className="mt-1 p-2 bg-white dark:bg-gray-800 rounded text-red-700 dark:text-red-300 whitespace-pre-wrap overflow-x-auto">
                                                    {this.state.error.toString()}
                                                </pre>
                                            </div>
                                            {this.state.errorInfo && (
                                                <div>
                                                    <strong className="text-red-800 dark:text-red-300">Component Stack:</strong>
                                                    <pre className="mt-1 p-2 bg-white dark:bg-gray-800 rounded text-red-700 dark:text-red-300 text-xs whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                                                        {this.state.errorInfo.componentStack}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
