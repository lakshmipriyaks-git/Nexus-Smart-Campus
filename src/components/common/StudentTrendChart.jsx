import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { calculateTrend, formatTrendData, getTrendColor, getTrendMessage } from '../../utils/trendCalculator';
import TrendIndicator from './TrendIndicator';
import EmptyState from '../ui/EmptyState';
import { TrendingUp } from 'lucide-react';

export default function StudentTrendChart({ grades, assessments, studentName = 'Student' }) {
    // Format data for the chart
    const chartData = formatTrendData(grades, assessments);

    // Calculate trend
    const trend = calculateTrend(chartData);
    const colors = getTrendColor(trend.direction);
    const message = getTrendMessage(trend.direction, trend.percentageChange);

    // Show empty state if not enough data
    if (!trend.hasEnoughData) {
        return (
            <div className="glass-card p-6">
                <EmptyState
                    icon={TrendingUp}
                    title="Not Enough Data"
                    description="Complete at least 2 assessments to see performance trends."
                    className="py-8"
                />
            </div>
        );
    }

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{data.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Score: {data.score}/{data.total} ({data.percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass-card p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Performance Trend
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {studentName}'s grade progression
                    </p>
                </div>
                <TrendIndicator
                    direction={trend.direction}
                    percentageChange={trend.percentageChange}
                    size="lg"
                />
            </div>

            {/* Motivational Message */}
            <div className={`p-3 rounded-lg border ${trend.direction === 'improving'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : trend.direction === 'declining'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {message}
                </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Overall Average</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {trend.averageScore}%
                    </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Recent Average</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {trend.recentAverage}%
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                        <defs>
                            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={colors.line} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={colors.line} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            className="text-gray-600 dark:text-gray-400"
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 12 }}
                            className="text-gray-600 dark:text-gray-400"
                            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="percentage"
                            fill="url(#trendGradient)"
                            stroke="none"
                        />
                        <Line
                            type="monotone"
                            dataKey="percentage"
                            stroke={colors.line}
                            strokeWidth={3}
                            dot={{ fill: colors.line, r: 5 }}
                            activeDot={{ r: 7 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Data points summary */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Based on {chartData.length} assessment{chartData.length !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
    );
}
