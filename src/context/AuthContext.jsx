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
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import { useFirestoreUser } from '../hooks/useFirestoreUser';
import {
    ROLES,
    STATUS,
    canRoleAccessDomain,
    getAllowedDomainsForRole,
    ROLE_DOMAIN_NAMES,
    getDomainKeyForRole,
    getEmailDomainBinding,
    setEmailDomainBinding,
    saveCampusEmail
} from '../utils/constants';
import { sendCampusNotification } from '../services/notificationService';
import { mockStore } from '../mock/mockStore';

const AuthContext = createContext(null);
const UNIFIED_USER_STORAGE_KEY = 'nexus_unified_auth_user';
const DEMO_STORAGE_KEY = 'nexus_demo_auth_user';
const DOMAIN_SESSIONS_STORAGE_KEY = 'nexus_domain_auth_sessions';
const FIREBASE_SETUP_MESSAGE = 'Firebase is not configured. Add your Firebase web app values to .env and restart the development server.';

const getFirebaseAuthErrorMessage = (error, fallback) => {
    const errorDetails = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
    if (errorDetails.includes('configuration-not-found')) {
        return 'Firebase Authentication is not activated yet. In Firebase Console, go to Build -> Authentication, click "Get started", and enable the Email/Password sign-in method.';
    }
    if (errorDetails.includes('api-key-not-valid') || errorDetails.includes('invalid-api-key')) {
        return 'The Firebase API key is invalid. Copy the web app configuration from Firebase Console into .env, check API key restrictions, then restart the development server.';
    }
    return error?.message || fallback;
};

// All 7 Official Nexus Smart Campus Domains
export const ALL_DOMAINS = [
    'eduhub',
    'library',
    'printhub',
    'canteen',
    'bustracking',
    'events',
    'complaints'
];

// Helper to normalize domain keys
export const normalizeDomain = (domain) => {
    if (!domain) return 'eduhub';
    const d = domain.toLowerCase().trim();
    if (d.includes('lib')) return 'library';
    if (d.includes('print') || d.includes('xerox')) return 'printhub';
    if (d.includes('cant')) return 'canteen';
    if (d.includes('bus') || d.includes('driver')) return 'bustracking';
    if (d.includes('event')) return 'events';
    if (d.includes('complain') || d.includes('griev')) return 'complaints';
    if (d.includes('edu') || d.includes('dash')) return 'eduhub';
    return d;
};

// Builder to create domain-tailored user session while maintaining unified role synchronization
export const buildDomainSessionUser = (baseUser, domain) => {
    if (!baseUser) return null;
    const key = normalizeDomain(domain);
    const normalizedRole = (baseUser.role || ROLES.STUDENT).toLowerCase().trim();

    // Check if role is allowed to access this domain
    if (!canRoleAccessDomain(normalizedRole, key)) {
        return null;
    }

    let domainRole = normalizedRole;

    // Student, Staff, and HOD keep their regular user role across all utility domains (Library, Canteen, PrintHub, BusTracking)
    // They are regular users/students/faculty in these domains and do NOT receive admin powers
    if (['student', 'staff', 'teacher', 'hod'].includes(normalizedRole)) {
        if (key === 'eduhub') {
            if (normalizedRole === ROLES.STAFF || normalizedRole === 'staff') {
                domainRole = ROLES.TEACHER;
            }
        }
        return {
            ...baseUser,
            role: domainRole,
            activeDomain: key,
        };
    }

    // Domain-specific Admin role mapping: in their own domain, they receive their admin rights
    if (key === 'library' && (normalizedRole === ROLES.ADMIN_LIBRARY || normalizedRole === 'admin_library')) {
        domainRole = ROLES.ADMIN_LIBRARY;
    }
    if (key === 'printhub' && (normalizedRole === ROLES.ADMIN_XEROX || normalizedRole === 'admin_xerox')) {
        domainRole = ROLES.ADMIN_XEROX;
    }
    if (key === 'canteen' && (normalizedRole === ROLES.ADMIN_CANTEEN || normalizedRole === 'admin_canteen')) {
        domainRole = ROLES.ADMIN_CANTEEN;
    }
    if (key === 'bustracking' && (normalizedRole === ROLES.DRIVER || normalizedRole === 'driver')) {
        domainRole = ROLES.DRIVER;
    }

    return {
        ...baseUser,
        role: domainRole,
        activeDomain: key,
    };
};

// Generate synchronized sessions for all 7 campus domains
export const buildUnifiedDomainSessions = (baseUser) => {
    if (!baseUser) return {};
    const sessions = {};
    ALL_DOMAINS.forEach((domainKey) => {
        sessions[domainKey] = buildDomainSessionUser(baseUser, domainKey);
    });
    return sessions;
};

export const AuthProvider = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Primary Unified User
    const [unifiedUser, setUnifiedUser] = useState(() => {
        try {
            if (typeof localStorage === 'undefined') return null;
            const raw = localStorage.getItem(UNIFIED_USER_STORAGE_KEY) || localStorage.getItem(DEMO_STORAGE_KEY) || localStorage.getItem('nexus_mock_auth_user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    // Multi-Domain Sessions (Synchronized across all domains)
    const [domainSessions, setDomainSessions] = useState(() => {
        try {
            if (typeof localStorage === 'undefined') return {};
            const raw = localStorage.getItem(DOMAIN_SESSIONS_STORAGE_KEY);
            if (raw) return JSON.parse(raw);
            const userRaw = localStorage.getItem(UNIFIED_USER_STORAGE_KEY) || localStorage.getItem(DEMO_STORAGE_KEY) || localStorage.getItem('nexus_mock_auth_user');
            if (userRaw) return buildUnifiedDomainSessions(JSON.parse(userRaw));
            return {};
        } catch {
            return {};
        }
    });

    // Helper to persist synchronized sessions across all domains
    const saveUnifiedSession = (userObj) => {
        if (!userObj) return {};
        const sessions = buildUnifiedDomainSessions(userObj);
        setUnifiedUser(userObj);
        setDomainSessions(sessions);
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(UNIFIED_USER_STORAGE_KEY, JSON.stringify(userObj));
                localStorage.setItem(DOMAIN_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
            }
        } catch (e) {}
        return sessions;
    };

    // Helper to clear all sessions (Unified SSO Logout)
    const clearAllSessions = async () => {
        setUnifiedUser(null);
        setDomainSessions({});
        try {
            localStorage.removeItem(UNIFIED_USER_STORAGE_KEY);
            localStorage.removeItem(DEMO_STORAGE_KEY);
            localStorage.removeItem(DOMAIN_SESSIONS_STORAGE_KEY);
            localStorage.removeItem('nexus_mock_auth_user');
            await signOut(auth);
        } catch (e) {
            // ignore
        }
    };

    // Use the custom hook for profile data when using Firebase
    const { userData, loading: profileLoading } = useFirestoreUser(firebaseUser?.uid);

    // Listen to auth state changes
    useEffect(() => {
        let unsubscribe = () => {};
        try {
            unsubscribe = onAuthStateChanged(auth, (fbUser) => {
                setFirebaseUser(fbUser);
                setAuthLoading(false);
            }, (error) => {
                console.warn('Firebase Auth listener fallback:', error?.message);
                setAuthLoading(false);
            });
        } catch (e) {
            console.warn('Firebase auth listener skipped:', e);
            setAuthLoading(false);
        }

        return unsubscribe;
    }, []);

    // Derived active campus user
    const user = useMemo(() => {
        if (unifiedUser) {
            if (unifiedUser.role === ROLES.STUDENT && !unifiedUser.usn && typeof localStorage !== 'undefined') {
                unifiedUser.usn = localStorage.getItem('nexus_student_usn') || '1KS21CS001';
            }
            return unifiedUser;
        }
        if (domainSessions?.eduhub) {
            return domainSessions.eduhub;
        }
        if (!firebaseUser) return null;
        const fallbackUsn = typeof localStorage !== 'undefined' ? (localStorage.getItem('nexus_student_usn') || '1KS21CS001') : '1KS21CS001';
        return {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            ...(userData || {}),
            name: (userData?.name) || (firebaseUser.displayName) || 'Campus User',
            role: userData?.role || ROLES.STUDENT,
            usn: userData?.usn || (userData?.role === ROLES.STUDENT ? fallbackUsn : undefined),
            departmentId: userData?.departmentId || 'CSE'
        };
    }, [unifiedUser, firebaseUser, userData, domainSessions]);

    const loading = !unifiedUser && Object.keys(domainSessions || {}).length === 0 && (authLoading || (firebaseUser && profileLoading));

    // Get active user for a specific domain (Guaranteed to return synced role for allowed domains)
    const getDomainUser = (domain = 'eduhub') => {
        const key = normalizeDomain(domain);
        const active = unifiedUser || user;
        if (!active) return null;
        if (!canRoleAccessDomain(active.role, key)) {
            return null;
        }
        if (domainSessions && domainSessions[key]) {
            return domainSessions[key];
        }
        return buildDomainSessionUser(active, key);
    };

    // Check if user is logged into a specific domain (Returns true for all domains if signed in)
    const isDomainLoggedIn = (domain = 'eduhub') => {
        const u = getDomainUser(domain);
        return !!(u && typeof u === 'object' && (u.id || u.uid || u.email || u.role));
    };

    // Unified Signup: Creates account and permanently binds email to selected domain
    const signup = async (userData) => {
        const cleanEmail = (userData.email || '').trim().toLowerCase();
        const selectedRole = (userData.role || ROLES.STUDENT).toLowerCase().trim();

        // 1. Pre-auth binding check: One email = One domain
        const existingBinding = getEmailDomainBinding(cleanEmail);
        if (existingBinding && existingBinding.role && existingBinding.role.toLowerCase() !== selectedRole) {
            const boundName = ROLE_DOMAIN_NAMES[existingBinding.role] || existingBinding.role.toUpperCase();
            return {
                success: false,
                message: `This email has already been used in ${boundName} domain`
            };
        }

        if (!isFirebaseConfigured) {
            return { success: false, message: FIREBASE_SETUP_MESSAGE };
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                userData.email,
                userData.password
            );

            await firebaseUpdateProfile(userCredential.user, {
                displayName: userData.name
            });

            await sendEmailVerification(userCredential.user);

            const initialStatus = selectedRole === ROLES.TEACHER || selectedRole === ROLES.STAFF ? STATUS.PENDING : STATUS.ACTIVE;
            const targetDept = userData.departmentId || 'CSE';
            const studentUsn = selectedRole === ROLES.STUDENT ? (userData.usn?.trim()?.toUpperCase() || (typeof localStorage !== 'undefined' ? localStorage.getItem('nexus_student_usn') : '') || '1KS21CS001') : null;
            if (studentUsn && typeof localStorage !== 'undefined') {
                localStorage.setItem('nexus_student_usn', studentUsn);
            }
            
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name: userData.name,
                role: selectedRole,
                email: userData.email,
                status: initialStatus,
                domainKey: getDomainKeyForRole(selectedRole),
                boundDomainName: ROLE_DOMAIN_NAMES[selectedRole] || selectedRole,
                boundAt: new Date().toISOString(),
                departmentId: targetDept,
                createdAt: new Date().toISOString(),
                ...(studentUsn ? { usn: studentUsn } : {})
            });

            // Save binding permanently
            setEmailDomainBinding(cleanEmail, selectedRole);
            saveCampusEmail(cleanEmail);

            const newUser = {
                id: userCredential.user.uid,
                uid: userCredential.user.uid,
                name: userData.name,
                role: selectedRole,
                email: userData.email,
                departmentId: targetDept,
                department: userData.department || 'Computer Science & Engineering',
                status: initialStatus,
                ...(studentUsn ? { usn: studentUsn } : {})
            };

            // Also keep mockStore updated in real-time
            mockStore.add('users', newUser);

            // Notify HOD if staff requires approval
            if (initialStatus === STATUS.PENDING) {
                sendCampusNotification({
                    title: 'New Staff Registration',
                    message: `Staff member ${userData.name} (${cleanEmail}) has registered for the ${targetDept} department and awaits your approval.`,
                    type: 'staff_registered',
                    departmentId: targetDept,
                    targetRole: 'hod',
                    actorName: userData.name,
                    actorRole: selectedRole,
                    metadata: {
                        staffId: userCredential.user.uid,
                        staffName: userData.name,
                        staffEmail: cleanEmail,
                        departmentId: targetDept
                    }
                });
            }

            saveUnifiedSession(newUser);
            return {
                success: true,
                user: newUser,
                message: initialStatus === STATUS.PENDING
                    ? `Account registered! Pending approval by ${targetDept} HOD.`
                    : 'Account created! Bound to ' + (ROLE_DOMAIN_NAMES[selectedRole] || selectedRole)
            };
        } catch (error) {
            return { success: false, message: getFirebaseAuthErrorMessage(error, 'Could not create your account.') };
        }
    };

    // Unified Login: Logs into domain with strict One Mail = One Domain enforcement
    const login = async (email, password, selectedRole, studentUsn = null) => {
        const cleanEmail = (email || '').trim().toLowerCase();
        if (!isFirebaseConfigured) {
            return { success: false, message: FIREBASE_SETUP_MESSAGE };
        }

        const requestedRole = (selectedRole || ROLES.STUDENT).toLowerCase().trim();

        // 1. Fast local check: if this email is already bound to another domain
        const localBinding = getEmailDomainBinding(cleanEmail);
        if (localBinding && localBinding.role && localBinding.role.toLowerCase() !== requestedRole) {
            const boundName = ROLE_DOMAIN_NAMES[localBinding.role] || localBinding.role.toUpperCase();
            return {
                success: false,
                message: `This email has already been used in ${boundName} domain`
            };
        }

        try {
            const res = await signInWithEmailAndPassword(auth, email, password);
            const userDocRef = doc(db, 'users', res.user.uid);
            const profileSnapshot = await getDoc(userDocRef);
            const profile = profileSnapshot.exists() ? profileSnapshot.data() : {};

            // 2. Strict One Mail = One Domain enforcement against Firestore profile:
            const establishedRole = (profile.role || localBinding?.role || '').toLowerCase().trim();

            if (establishedRole && establishedRole !== requestedRole) {
                // Reject unauthorized domain switch & sign out immediately
                await signOut(auth);
                const boundName = ROLE_DOMAIN_NAMES[establishedRole] || establishedRole.toUpperCase();
                return {
                    success: false,
                    message: `This email has already been used in ${boundName} domain`
                };
            }

            const finalRole = establishedRole || requestedRole;
            const resolvedUsn = finalRole === ROLES.STUDENT
                ? (studentUsn?.trim()?.toUpperCase() || profile.usn || (typeof localStorage !== 'undefined' ? localStorage.getItem('nexus_student_usn') : null) || '1KS21CS001')
                : null;

            if (resolvedUsn && typeof localStorage !== 'undefined') {
                localStorage.setItem('nexus_student_usn', resolvedUsn);
            }

            // Bind email permanently in Firestore if not already set, or update student USN
            if (!profile.role || (finalRole === ROLES.STUDENT && !profile.usn && resolvedUsn)) {
                try {
                    await setDoc(userDocRef, {
                        role: finalRole,
                        email: res.user.email,
                        name: profile.name || res.user.displayName || email.split('@')[0],
                        domainKey: getDomainKeyForRole(finalRole),
                        boundDomainName: ROLE_DOMAIN_NAMES[finalRole] || finalRole,
                        boundAt: new Date().toISOString(),
                        ...(resolvedUsn ? { usn: resolvedUsn } : {})
                    }, { merge: true });
                } catch (e) {
                    console.warn('Profile role sync skipped:', e);
                }
            }

            // Sync to local binding registry
            setEmailDomainBinding(cleanEmail, finalRole);
            saveCampusEmail(cleanEmail);

            const loggedUser = {
                id: res.user.uid,
                uid: res.user.uid,
                email: res.user.email,
                ...profile,
                name: profile.name || res.user.displayName || email.split('@')[0],
                role: finalRole,
                ...(resolvedUsn ? { usn: resolvedUsn } : {})
            };
            saveUnifiedSession(loggedUser);
            return { success: true, user: loggedUser };
        } catch (error) {
            return { success: false, message: getFirebaseAuthErrorMessage(error, 'Invalid email or password.') };
        }
    };

    // Logout from all domains (SSO Logout)
    const logout = async () => {
        await clearAllSessions();
        return { success: true };
    };

    // Domain logout redirects to unified logout to keep domains in sync
    const logoutDomain = async () => {
        return logout();
    };

    const resetPassword = async (email) => {
        if (!isFirebaseConfigured) {
            return { success: false, message: FIREBASE_SETUP_MESSAGE };
        }
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true, message: 'Password reset email sent! Check your inbox.' };
        } catch (error) {
            return { success: false, message: getFirebaseAuthErrorMessage(error, 'Could not send the password reset email.') };
        }
    };

    const updateProfile = async (updatedData) => {
        const activeU = user || unifiedUser;
        if (!activeU) return { success: false, message: 'No user logged in.' };

        if (updatedData.usn && typeof localStorage !== 'undefined') {
            localStorage.setItem('nexus_student_usn', updatedData.usn.toUpperCase());
        }

        const updated = { ...activeU, ...updatedData };
        saveUnifiedSession(updated);

        try {
            await updateDoc(doc(db, 'users', activeU.id), updatedData);
            if (updatedData.name) {
                await firebaseUpdateProfile(auth.currentUser, {
                    displayName: updatedData.name
                });
            }
        } catch (e) {
            console.warn('Firebase profile update skipped:', e);
        }
        return { success: true, message: 'Profile updated successfully!' };
    };

    const value = {
        user,
        domainSessions,
        loading,
        getDomainUser,
        isDomainLoggedIn,
        login,
        signup,
        logout,
        logoutDomain,
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
