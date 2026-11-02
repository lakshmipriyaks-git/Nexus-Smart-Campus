import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AiProvider } from './context/AiContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Layout from './components/Layout';
import { ROLES, getAllowedDomainsForRole, DOMAIN_HOME_PATHS } from './utils/constants';

import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import HodTeachers from './pages/HodTeachers';
import HodStudents from './pages/HodStudents';
import HodClassesPage from './pages/HodClassesPage';

import TeacherDashboard from './pages/TeacherDashboard';
import StudentProfile from './pages/StudentProfile';
import TeacherProfile from './pages/TeacherProfile';
import Courses from './pages/Courses';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import ClassesPage from './pages/ClassesPage';
import StudentsPage from './pages/StudentsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SubjectPreferences from './pages/SubjectPreferences';
import HodSubjectAllocations from './pages/HodSubjectAllocations';
import HodCreatePreferenceForm from './pages/HodCreatePreferenceForm';
import BusTrackingPage from './pages/BusTrackingPage';
import DigitalLibraryPage from './pages/DigitalLibraryPage';
import PrintHubPage from './pages/PrintHubPage';
import CanteenPage from './pages/CanteenPage';
import EventManagementPage from './pages/EventManagementPage';
import ComplaintPortalPage from './pages/ComplaintPortalPage';

import CampusHomePage from './pages/CampusHomePage';
import ErrorBoundary from './components/ErrorBoundary';
import HelpPage from './pages/HelpPage';
import ChatWidget from './components/ai/ChatWidget';

function ProtectedRoute({ children, domain = 'eduhub' }) {
    const { user, getDomainUser, loading } = useAuth();
    const location = useLocation();
    const domainUser = getDomainUser(domain);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading Nexus Smart Campus...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
    }

    if (!domainUser) {
        const userAllowedDomains = getAllowedDomainsForRole(user.role);
        const fallbackDomain = userAllowedDomains[0];
        const fallbackPath = DOMAIN_HOME_PATHS[fallbackDomain] || '/';
        return <Navigate to={fallbackPath} replace />;
    }

    return children;
}

function AppRoutes() {
    const navigate = useNavigate();
    const { user, getDomainUser } = useAuth();
    const eduhubUser = getDomainUser('eduhub') || user;

    return (
        <Routes>
            {/* ── Public Main Campus Home Page (No Login Required) ── */}
            <Route path="/" element={<CampusHomePage />} />

            {/* ── Auth Routes (Render per-domain login/signup dynamically) ── */}
            <Route path="/login" element={<Login onSwitchToSignup={() => navigate('/signup')} />} />
            <Route path="/signup" element={<Signup onSwitchToLogin={() => navigate('/login')} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* ── Direct Campus Domain Routes (Protected: Login Required) ── */}
            <Route path="/bus-tracking" element={
                <ProtectedRoute domain="bustracking">
                    <BusTrackingPage />
                </ProtectedRoute>
            } />
            <Route path="/digital-library" element={
                <ProtectedRoute domain="library">
                    <DigitalLibraryPage />
                </ProtectedRoute>
            } />
            <Route path="/print-hub" element={
                <ProtectedRoute domain="printhub">
                    <PrintHubPage />
                </ProtectedRoute>
            } />
            <Route path="/canteen" element={
                <ProtectedRoute domain="canteen">
                    <CanteenPage />
                </ProtectedRoute>
            } />
            <Route path="/events" element={
                <ProtectedRoute domain="events">
                    <EventManagementPage />
                </ProtectedRoute>
            } />
            <Route path="/event-management" element={<Navigate to="/events" replace />} />
            <Route path="/complaints" element={
                <ProtectedRoute domain="complaints">
                    <ComplaintPortalPage />
                </ProtectedRoute>
            } />
            <Route path="/complaint-portal" element={<Navigate to="/complaints" replace />} />

            {/* ── Edu Hub / Academic Portal Protected Routes ── */}
            <Route path="/eduhub" element={<Navigate to="/dashboard" replace />} />

            <Route element={
                <ProtectedRoute domain="eduhub">
                    <Layout />
                </ProtectedRoute>
            }>
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Profile routes */}
                <Route path="/profile" element={
                    eduhubUser?.role === ROLES.STUDENT ? <StudentProfile /> : <TeacherProfile />
                } />

                {/* Classes route: for Teachers -> ClassesPage; for HOD -> HodClassesPage */}
                {(eduhubUser?.role === ROLES.TEACHER || eduhubUser?.role === ROLES.STAFF || eduhubUser?.role === ROLES.HOD) && (
                    <Route path="/classes" element={
                        eduhubUser?.role === ROLES.HOD ? <HodClassesPage /> : <ClassesPage />
                    } />
                )}

                {/* Teacher-specific routes */}
                {(eduhubUser?.role === ROLES.TEACHER || eduhubUser?.role === ROLES.STAFF) && (
                    <>
                        <Route path="/students" element={<StudentsPage />} />
                        <Route path="/subject-preferences" element={<SubjectPreferences />} />
                    </>
                )}

                {/* Shared Teacher & HOD routes */}
                {(eduhubUser?.role === ROLES.TEACHER || eduhubUser?.role === ROLES.STAFF || eduhubUser?.role === ROLES.HOD) && (
                    <Route path="/analytics" element={<AnalyticsPage />} />
                )}

                {/* HOD-specific routes */}
                {eduhubUser?.role === ROLES.HOD && (
                    <>
                        <Route path="/teachers" element={<HodTeachers />} />
                        <Route path="/students" element={<HodStudents />} />
                        <Route path="/subject-allocations" element={<HodSubjectAllocations />} />
                        <Route path="/create-preference-form" element={<HodCreatePreferenceForm />} />
                    </>
                )}

                {/* Course, Tasks, Notifications, Settings */}
                <Route path="/courses" element={<Courses />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<HelpPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    console.log('App: Rendering');
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <AuthProvider>
                    <ThemeProvider>
                        <DataProvider>
                            <AiProvider>
                                <AppRoutes />
                                <ChatWidget />
                                <Toaster
                                    position="top-right"
                                    toastOptions={{
                                        className: '',
                                        style: {
                                            background: 'rgba(255, 255, 255, 0.8)',
                                            backdropFilter: 'blur(10px)',
                                            color: '#333',
                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                        },
                                        success: {
                                            iconTheme: {
                                                primary: '#10B981',
                                                secondary: 'white',
                                            },
                                        },
                                        error: {
                                            iconTheme: {
                                                primary: '#EF4444',
                                                secondary: 'white',
                                            },
                                        },
                                    }}
                                />

                            </AiProvider>
                        </DataProvider>
                    </ThemeProvider>
                </AuthProvider>
            </ErrorBoundary>
        </BrowserRouter>
    );
}

export default App;
