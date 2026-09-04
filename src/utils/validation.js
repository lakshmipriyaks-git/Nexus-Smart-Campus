export const validators = {
    // Required field validation
    required: (value) => {
        if (!value || (typeof value === 'string' && !value.trim())) {
            return 'This field is required';
        }
        return null;
    },

    // Email validation
    email: (value) => {
        if (!value) return null; // Allow empty (use required separately)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? null : 'Please enter a valid email address';
    },

    // Minimum length validation
    minLength: (min) => (value) => {
        if (!value) return null; // Allow empty (use required separately)
        return value.length >= min ? null : `Minimum ${min} characters required`;
    },

    // Maximum length validation
    maxLength: (max) => (value) => {
        if (!value) return null;
        return value.length <= max ? null : `Maximum ${max} characters allowed`;
    },

    // URL validation
    url: (value) => {
        if (!value) return null; // Allow empty (use required separately)
        try {
            new URL(value);
            return null;
        } catch {
            return 'Please enter a valid URL (e.g., https://example.com)';
        }
    },

    // Password strength
    password: (value) => {
        if (!value) return null;
        if (value.length < 6) {
            return 'Password must be at least 6 characters';
        }
        return null;
    },

    // Confirm password match
    confirmPassword: (password) => (value) => {
        if (!value) return null;
        return value === password ? null : 'Passwords do not match';
    },

    // Number validation
    number: (value) => {
        if (!value) return null;
        return !isNaN(value) ? null : 'Please enter a valid number';
    },

    // Positive number
    positiveNumber: (value) => {
        if (!value) return null;
        const num = Number(value);
        return !isNaN(num) && num > 0 ? null : 'Please enter a positive number';
    },

    // File size validation (in MB)
    maxFileSize: (maxSizeMB) => (file) => {
        if (!file) return null;
        const fileSizeMB = file.size / (1024 * 1024);
        return fileSizeMB <= maxSizeMB ? null : `File size must not exceed ${maxSizeMB}MB`;
    },

    // File type validation
    fileType: (allowedTypes) => (file) => {
        if (!file) return null;
        const fileType = file.type;
        const allowed = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
        return allowed.includes(fileType) ? null : `Invalid file type. Allowed: ${allowed.join(', ')}`;
    }
};

// Combine multiple validators
export const validate = (value, validatorArray) => {
    for (const validator of validatorArray) {
        const error = validator(value);
        if (error) return error;
    }
    return null;
};

// Validate entire form object
export const validateForm = (formData, validationRules) => {
    const errors = {};
    let hasErrors = false;

    for (const [field, validators] of Object.entries(validationRules)) {
        const error = validate(formData[field], validators);
        if (error) {
            errors[field] = error;
            hasErrors = true;
        }
    }

    return { errors, isValid: !hasErrors };
};
