import React from 'react';
import { useAuth } from '../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import HodDashboard from './HodDashboard';
import { ROLES } from '../utils/constants';

export default function Dashboard() {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    const role = user.role;

    // Debug logging
    console.log('Dashboard - User object:', user);
    console.log('Dashboard - User role:', role);
    console.log('Dashboard - Expected STUDENT:', ROLES.STUDENT);
    console.log('Dashboard - Expected TEACHER:', ROLES.TEACHER);
    console.log('Dashboard - Expected HOD:', ROLES.HOD);
    console.log('Dashboard - Role comparison (student):', role === ROLES.STUDENT);
    console.log('Dashboard - Role comparison (teacher):', role === ROLES.TEACHER);
    console.log('Dashboard - Role comparison (hod):', role === ROLES.HOD);

    if (role === ROLES.STUDENT) {
        return <StudentDashboard />;
    }

    if (role === ROLES.TEACHER || role === ROLES.STAFF) {
        return <TeacherDashboard />;
    }

    if (role === ROLES.HOD) {
        return <HodDashboard />;
    }

    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Unknown Role</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Your account does not have a valid role assigned. Please contact support.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                    Current role value: "{role}"
                </p>
            </div>
        </div>
    );
}
