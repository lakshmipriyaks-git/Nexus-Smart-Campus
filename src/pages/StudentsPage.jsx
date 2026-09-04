import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import StudentRoster from '../components/teacher/StudentRoster';

export default function StudentsPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Students</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage your students</p>
            </div>

            {/* Student Roster */}
            <StudentRoster />
        </div>
    );
}
