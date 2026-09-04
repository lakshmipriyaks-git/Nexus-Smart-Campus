import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useFirestoreUser } from '../hooks/useFirestoreUser';
import { ROLES, STATUS } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Use the custom hook for profile data
    const { userData, loading: profileLoading } = useFirestoreUser(firebaseUser?.uid);

    // Listen to auth state changes
    useEffect(() => {
        console.log('AuthProvider: Setting up auth listener');
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log('AuthProvider: Auth state changed', user ? 'User logged in' : 'User logged out');
            setFirebaseUser(user);
            setAuthLoading(false);
        });

        return unsubscribe;
    }, []);

    // Derived state: merge auth user and firestore profile
    const user = useMemo(() => {
        if (!firebaseUser) return null;
        return {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            ...(userData || {}),
            name: (userData?.name) || (firebaseUser.displayName) || 'User',
            departmentId: userData?.departmentId || 'CSE' // Fallback for testing/old accounts
        };
    }, [firebaseUser, userData]);

    const loading = authLoading || (firebaseUser && profileLoading);

    const signup = async (userData) => {
        try {
            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userData.email,
                userData.password
            );

            // Update display name
            await firebaseUpdateProfile(userCredential.user, {
                displayName: userData.name
            });

            // Send email verification
            await sendEmailVerification(userCredential.user);

            // Create user profile in Firestore
            // Teachers start as 'pending' until approved by HOD; others are immediately 'active'
            const initialStatus = userData.role === ROLES.TEACHER ? STATUS.PENDING : STATUS.ACTIVE;
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name: userData.name,
                role: userData.role,
                email: userData.email,
                status: initialStatus,
                ...(userData.departmentId ? { departmentId: userData.departmentId } : {}),
                createdAt: new Date().toISOString()
            });

            return { success: true, message: 'Account created! Please check your email to verify your account.' };
        } catch (error) {
            console.error('Signup error:', error);
            let message = 'An error occurred during signup.';

            if (error.code === 'auth/email-already-in-use') {
                message = 'This email is already registered.';
            } else if (error.code === 'auth/weak-password') {
                message = 'Password should be at least 6 characters.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Invalid email address.';
            }

            return { success: false, message };
        }
    };

    const login = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            let message = 'Invalid email or password.';

            if (error.code === 'auth/user-not-found') {
                message = 'No account found with this email.';
            } else if (error.code === 'auth/wrong-password') {
                message = 'Incorrect password.';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Too many failed attempts. Please try again later.';
            }

            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, message: 'Error logging out.' };
        }
    };

    const resetPassword = async (email) => {
        try {
            console.log("Attempting to send password reset email to:", email);
            await sendPasswordResetEmail(auth, email);
            console.log("Password reset email sent successfully.");
            return { success: true, message: 'Password reset email sent! Check your inbox.' };
        } catch (error) {
            console.error('Password reset error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            let message = 'Error sending password reset email.';

            if (error.code === 'auth/user-not-found') {
                message = 'No account found with this email.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Invalid email address.';
            } else if (error.code === 'auth/missing-email') {
                message = 'Please provide an email address.';
            }

            return { success: false, message };
        }
    };

    const updateProfile = async (updatedData) => {
        if (!user) return { success: false, message: 'No user logged in.' };

        try {
            // Update Firestore profile
            await updateDoc(doc(db, 'users', user.id), updatedData);

            // Update display name in Firebase Auth if name changed
            if (updatedData.name) {
                await firebaseUpdateProfile(auth.currentUser, {
                    displayName: updatedData.name
                });
            }

            // No need to manually setUser here, the useFirestoreUser hook will pick up the change!
            return { success: true, message: 'Profile updated successfully!' };
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, message: 'Error updating profile.' };
        }
    };

    const value = {
        user,
        loading,
        login,
        signup,
        logout,
        resetPassword,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
