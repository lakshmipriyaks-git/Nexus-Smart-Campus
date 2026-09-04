import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AiProvider } from './context/AiContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Layout from './components/Layout';
import { ROLES } from './utils/constants';

import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import HodTeachers from './pages/HodTeachers';
import HodStudents from './pages/HodStudents';

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
import Seeder from './pages/Seeder';
import SubjectPreferences from './pages/SubjectPreferences';
import HodSubjectAllocations from './pages/HodSubjectAllocations';
import HodCreatePreferenceForm from './pages/HodCreatePreferenceForm';
import BusTrackingPage from './pages/BusTrackingPage';
import DigitalLibraryPage from './pages/DigitalLibraryPage';
import PrintHubPage from './pages/PrintHubPage';
import CanteenPage from './pages/CanteenPage';

import ErrorBoundary from './components/ErrorBoundary';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

function AppRoutes() {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <Routes>
            <Route path="/login" element={
                !user ? (
                    <Login onSwitchToSignup={() => navigate('/signup')} />
                ) : (
                    <Navigate to="/" replace />
                )
            } />
            <Route path="/signup" element={
                !user ? (
                    <Signup onSwitchToLogin={() => navigate('/login')} />
                ) : (
                    <Navigate to="/" replace />
                )
            } />
            <Route path="/forgot-password" element={
                !user ? (
                    <ForgotPassword />
                ) : (
                    <Navigate to="/" replace />
                )
            } />

            <Route path="/" element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />

                {/* Profile routes */}
                <Route path="profile" element={
                    user?.role === ROLES.STUDENT ? <StudentProfile /> : <TeacherProfile />
                } />

                {/* Teacher-specific routes */}
                {user?.role === ROLES.TEACHER && (
                    <>
                        <Route path="classes" element={<ClassesPage />} />
                        <Route path="students" element={<StudentsPage />} />
                        <Route path="subject-preferences" element={<SubjectPreferences />} />
                    </>
                )}

                {/* Shared Teacher & HOD routes */}
                {(user?.role === ROLES.TEACHER || user?.role === ROLES.HOD) && (
                    <Route path="analytics" element={<AnalyticsPage />} />
                )}

                {/* HOD-specific routes */}
                {user?.role === ROLES.HOD && (
                    <>
                        <Route path="teachers" element={<HodTeachers />} />
                        <Route path="students" element={<HodStudents />} />
                        <Route path="subject-allocations" element={<HodSubjectAllocations />} />
                        <Route path="create-preference-form" element={<HodCreatePreferenceForm />} />
                    </>
                )}

                {/* New Pages */}
                <Route path="courses" element={<Courses />} />
                <Route path="tasks" element={<Tasks />} />
                {user?.role === ROLES.STUDENT && (
                    <Route path="notifications" element={<Notifications />} />
                )}
                <Route path="settings" element={<Settings />} />
                <Route path="help" element={<div className="p-4">Help Page (Coming Soon)</div>} />

                {/* Campus Utility Routes - accessible to all authenticated users */}
                <Route path="bus-tracking" element={<BusTrackingPage />} />
                <Route path="digital-library" element={<DigitalLibraryPage />} />
                <Route path="print-hub" element={<PrintHubPage />} />
                <Route path="canteen" element={<CanteenPage />} />
            </Route>

            <Route path="/seeder" element={<Seeder />} />
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
