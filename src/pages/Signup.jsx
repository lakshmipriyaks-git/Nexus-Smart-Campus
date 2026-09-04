import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ROLES, DEPARTMENTS } from '../utils/constants';
import FormInput from '../components/ui/FormInput';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { validators, validate } from '../utils/validation';

export default function Signup({ onSwitchToLogin }) {
    const { signup } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: ROLES.STUDENT,
        departmentId: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        const newErrors = {};
        const nameError = validate(formData.name, [validators.required]);
        const emailError = validate(formData.email, [validators.required, validators.email]);
        const passwordError = validate(formData.password, [validators.required, validators.password]);
        const confirmError = validate(formData.confirmPassword, [
            validators.required,
            validators.confirmPassword(formData.password)
        ]);

        if (nameError) newErrors.name = nameError;
        if (emailError) newErrors.email = emailError;
        if (passwordError) newErrors.password = passwordError;
        if (confirmError) newErrors.confirmPassword = confirmError;

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error('Please fix the errors in the form');
            return;
        }

        // Require department for teacher and HOD roles
        if ((formData.role === ROLES.TEACHER || formData.role === ROLES.HOD) && !formData.departmentId) {
            toast.error('Please select a department');
            return;
        }

        setLoading(true);

        try {
            const result = await signup(formData);

            if (result.success) {
                toast.success(result.message);
                // Clear form
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: ROLES.STUDENT,
                    departmentId: ''
                });
                setErrors({});
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-900">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-[40%] -left-[10%] w-[60%] h-[60%] rounded-full bg-purple-500/20 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
                <div className="absolute -bottom-[20%] right-[20%] w-[50%] h-[50%] rounded-full bg-pink-500/20 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/60 border border-white/20 dark:border-gray-700/50 shadow-2xl rounded-3xl overflow-hidden">
                    <div className="p-8 md:p-10">
                        <div className="text-center mb-8">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/30"
                            >
                                <UserPlus className="h-8 w-8 text-white" />
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-3xl font-bold text-white mb-2 tracking-tight"
                            >
                                Create Account
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-gray-400"
                            >
                                Join EduHub today and start learning
                            </motion.p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-4">
                                <FormInput
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Full Name"
                                    error={errors.name}
                                    disabled={loading}
                                    required
                                />

                                <FormInput
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Email address"
                                    error={errors.email}
                                    disabled={loading}
                                    required
                                />

                                <FormInput
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Password"
                                    error={errors.password}
                                    helperText="Minimum 6 characters"
                                    disabled={loading}
                                    required
                                />

                                <FormInput
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder="Confirm Password"
                                    error={errors.confirmPassword}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300">I am a:</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: ROLES.STUDENT })}
                                        className={`p-4 rounded-xl border-2 transition-all ${formData.role === ROLES.STUDENT
                                            ? 'border-purple-500 bg-purple-500/10 text-white'
                                            : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                                            }`}
                                        disabled={loading}
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl mb-1">🎓</div>
                                            <div className="font-semibold">Student</div>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: ROLES.TEACHER })}
                                        className={`p-4 rounded-xl border-2 transition-all ${formData.role === ROLES.TEACHER
                                            ? 'border-purple-500 bg-purple-500/10 text-white'
                                            : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                                            }`}
                                        disabled={loading}
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl mb-1">👨‍🏫</div>
                                            <div className="font-semibold">Teacher</div>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: ROLES.HOD })}
                                        className={`p-4 rounded-xl border-2 transition-all ${formData.role === ROLES.HOD
                                            ? 'border-purple-500 bg-purple-500/10 text-white'
                                            : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                                            }`}
                                        disabled={loading}
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl mb-1">👑</div>
                                            <div className="font-semibold">HOD</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Department Selection — shown for Teacher and HOD only */}
                            {(formData.role === ROLES.TEACHER || formData.role === ROLES.HOD) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-2 overflow-hidden"
                                >
                                    <label className="text-sm font-medium text-gray-300">
                                        {formData.role === ROLES.HOD ? 'Department you manage:' : 'Department to join:'}
                                    </label>
                                    <select
                                        value={formData.departmentId}
                                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                        disabled={loading}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-800/60 border-2 border-gray-700 text-white focus:border-purple-500 focus:outline-none transition-colors"
                                    >
                                        <option value="">— Select Department —</option>
                                        {DEPARTMENTS.map((dept) => (
                                            <option key={dept.id} value={dept.id}>{dept.label}</option>
                                        ))}
                                    </select>
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        <span>Creating account...</span>
                                    </>
                                ) : (
                                    <span>Create Account</span>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="p-6 bg-gray-900/40 border-t border-white/5 text-center">
                        <p className="text-gray-400 text-sm">
                            Already have an account?{' '}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-white font-medium hover:text-purple-300 transition-colors inline-flex items-center gap-1"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Sign In
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
