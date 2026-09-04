const isDevelopment = import.meta.env.MODE === 'development';

/**
 * Development-only logger
 * In production builds, log/warn are no-ops
 * Errors are always logged for debugging
 */
export const logger = {
    log: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },

    warn: (...args) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },

    error: (...args) => {
        // Always log errors, even in production
        console.error(...args);
    },

    info: (...args) => {
        if (isDevelopment) {
            console.info(...args);
        }
    }
};
