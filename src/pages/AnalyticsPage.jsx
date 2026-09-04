import React from 'react';
import { useAuth } from '../context/AuthContext';
import AnalyticsDashboard from '../components/teacher/AnalyticsDashboard';
import AtRiskAnalysis from '../components/teacher/AtRiskAnalysis';

export default function AnalyticsPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">View performance analytics and insights</p>
            </div>

            {/* Analytics Dashboard */}
            <AnalyticsDashboard />

            {/* At-Risk Analysis */}
            <AtRiskAnalysis />
        </div>
    );
}
