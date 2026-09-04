import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getTrendColor } from '../../utils/trendCalculator';

export default function TrendIndicator({ direction, percentageChange, size = 'md', showLabel = true }) {
    const colors = getTrendColor(direction);

    const sizes = {
        sm: { icon: 'w-3 h-3', text: 'text-xs', padding: 'px-1.5 py-0.5' },
        md: { icon: 'w-4 h-4', text: 'text-sm', padding: 'px-2 py-1' },
        lg: { icon: 'w-5 h-5', text: 'text-base', padding: 'px-3 py-1.5' }
    };

    const config = sizes[size] || sizes.md;

    const getIcon = () => {
        switch (direction) {
            case 'improving':
                return <TrendingUp className={config.icon} />;
            case 'declining':
                return <TrendingDown className={config.icon} />;
            case 'stable':
                return <Minus className={config.icon} />;
            default:
                return <Minus className={config.icon} />;
        }
    };

    const getLabel = () => {
        if (!showLabel) return null;

        if (direction === 'insufficient-data') {
            return 'Not enough data';
        }

        if (direction === 'stable') {
            return 'Stable';
        }

        const sign = percentageChange > 0 ? '+' : '';
        return `${sign}${percentageChange}%`;
    };

    if (direction === 'insufficient-data' && !showLabel) {
        return null;
    }

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full font-medium ${config.padding} ${config.text} ${colors.badge}`}
            title={`Performance is ${direction}${percentageChange ? ` by ${Math.abs(percentageChange)}%` : ''}`}
        >
            {getIcon()}
            {showLabel && <span>{getLabel()}</span>}
        </span>
    );
}
