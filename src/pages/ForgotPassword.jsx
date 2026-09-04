import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import FormInput from '../components/ui/FormInput';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { validators, validate } from '../utils/validation';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate email
        const emailError = validate(email, [validators.required, validators.email]);
        setError(emailError || '');

        if (emailError) {
            toast.error('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            const result = await resetPassword(email);

            if (result.success) {
                toast.success(result.message);
                setEmail('');
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
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-pink-500/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-500/20 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
                <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
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
                                className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-500/30"
                            >
                                <KeyRound className="h-8 w-8 text-white" />
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-3xl font-bold text-white mb-2 tracking-tight"
                            >
                                Reset Password
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-gray-400"
                            >
                                Enter your email to receive a password reset link
                            </motion.p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <FormInput
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                error={error}
                                disabled={loading}
                                required
                            />

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <span>Send Reset Link</span>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="p-6 bg-gray-900/40 border-t border-white/5 text-center">
                        <Link
                            to="/login"
                            className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2 text-sm font-medium"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
