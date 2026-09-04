import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { BookOpen } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function Courses() {
    const { user } = useAuth();
    const { classes, courses, joinRequests } = useData();
    const [filter, setFilter] = useState('my'); // Default to 'my' courses only

    const getJoinStatus = (classId) => {
        const request = joinRequests.find(req => req.classId === classId && req.studentId === user.id);
        return request ? request.status : null;
    };

    const myClassIds = classes
        .filter(c => getJoinStatus(c.id) === 'approved')
        .map(c => c.id);

    const filteredCourses = courses.filter(course => {
        if (filter === 'my') {
            return myClassIds.includes(course.classId);
        }
        return true;
    });

    // Group courses by Class
    const coursesByClass = filteredCourses.reduce((acc, course) => {
        const className = classes.find(c => c.id === course.classId)?.name || 'Unknown Class';
        if (!acc[className]) {
            acc[className] = [];
        }
        acc[className].push(course);
        return acc;
    }, {});

    return (
        <div className="p-6 max-w-6xl mx-auto animate-scaleIn">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Courses</h1>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        All Courses
                    </button>
                    <button
                        onClick={() => setFilter('my')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'my'
                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        My Courses
                    </button>
                </div>
            </div>

            {Object.keys(coursesByClass).length === 0 ? (
                <EmptyState
                    icon={BookOpen}
                    title="No Courses Found"
                    description={filter === 'my' ? "You haven't joined any classes with courses yet." : "No courses are currently available."}
                    className="py-12"
                />
            ) : (
                <div className="space-y-8">
                    {Object.entries(coursesByClass).map(([className, classCourses]) => (
                        <div key={className} className="glass-card p-6">
                            <h2 className="text-section-title mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">{className}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {classCourses.map(course => (
                                    <div key={course.id} className="p-4 border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-300 group hover:shadow-md">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {course.name}
                                            </h3>
                                            <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full font-medium">
                                                {classes.find(c => c.id === course.classId)?.teacherName}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                                            {classes.find(c => c.id === course.classId)?.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
