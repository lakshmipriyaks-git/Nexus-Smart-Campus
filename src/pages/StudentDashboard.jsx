import React, { useState } from 'react';
import PomodoroTimer from '../components/student/PomodoroTimer';
import AnnouncementFeed from '../components/student/AnnouncementFeed';
import CalendarWidget from '../components/common/CalendarWidget';
import NotesWidget from '../components/common/NotesWidget';
import { StudentGradesView } from '../components/student/StudentGradesView';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs } from '../components/ui/Tabs';
import { Home, BookOpen, UserPlus, GraduationCap, CalendarCheck, AlertCircle, FileText } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import SearchBar from '../components/ui/SearchBar';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import StudentGradeChart from '../components/student/StudentGradeChart';
import GlobalAnnouncementsBanner from '../components/common/GlobalAnnouncementsBanner';

export default function StudentDashboard() {
    const { user } = useAuth();
    const { classes, joinRequests, requestJoinClass, courses, resources, getCourseAnnouncements, downloadResource, loading } = useData();
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [classSearch, setClassSearch] = useState('');

    const handleJoin = async (classId) => {
        if (!user?.id) return;
        const success = await requestJoinClass(classId, user.id, user.name);
        if (success) {
            alert("Join request sent successfully!");
        }
    };

    const getJoinStatus = (classId) => {
        const request = joinRequests.find(req => req.classId === classId && req.studentId === user.id);
        if (!request) return null;
        return request.status;
    };

    const joinedClasses = classes.filter(c => getJoinStatus(c.id) === 'approved');
    const availableClasses = classes.filter(c => {
        if (getJoinStatus(c.id) === 'approved') return false;

        // Apply search filter
        if (classSearch) {
            const searchLower = classSearch.toLowerCase();
            const matchesName = c.name?.toLowerCase().includes(searchLower);
            const matchesTeacher = c.teacherName?.toLowerCase().includes(searchLower);
            return matchesName || matchesTeacher;
        }

        return true;
    });

    const myClasses = joinedClasses;
    const selectedClass = classes.find(c => c.id === selectedClassId);
    const coursesInSelectedClass = courses.filter(c => c.classId === selectedClassId);
    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    const courseResources = resources.filter(r => r.courseId === selectedCourseId);
    const courseAnnouncements = selectedCourseId ? getCourseAnnouncements(selectedCourseId) : [];

    const handleDownloadResource = (resource) => {
        // If it's an external link, open it
        if (resource.url && !resource.downloadURL) {
            window.open(resource.url, '_blank');
            return;
        }

        // If it has a downloadURL from Storage, download it
        if (resource.downloadURL) {
            downloadResource(resource.downloadURL, resource.fileName || resource.title);
            return;
        }

        // Old chunked resources (pre-Storage migration)
        if (resource.isChunked) {
            alert('This resource was uploaded using an older system and needs to be re-uploaded by your teacher. Please contact your teacher to re-upload this file.');
            return;
        }

        // Unknown resource type
        alert('Unable to download this resource. It may be corrupted or missing.');
    };

    const tabs = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'classes', label: 'My Classes', icon: BookOpen },
        { id: 'join', label: 'Join Class', icon: UserPlus },
        { id: 'grades', label: 'Grades', icon: GraduationCap },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h1 className="text-heading">Student Dashboard</h1>
                <div className="text-caption">
                    Welcome back, {user?.name}
                </div>
            </div>

            <GlobalAnnouncementsBanner />

            <Tabs tabs={tabs} defaultTab="home">
                {(activeTab) => (
                    <div className="space-y-6 animate-scaleIn">
                        {activeTab === 'home' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <PomodoroTimer />
                                        <CalendarWidget />
                                    </div>
                                    <NotesWidget />
                                </div>
                                <div>
                                    <AnnouncementFeed />
                                </div>
                            </div>
                        )}

                        {activeTab === 'classes' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="glass-card p-6">
                                        <h2 className="text-section-title mb-4">My Classes</h2>
                                        {loading ? (
                                            <SkeletonLoader variant="list" count={3} />
                                        ) : myClasses.length === 0 ? (
                                            <EmptyState
                                                icon={BookOpen}
                                                title="No Classes Joined"
                                                description="You haven't joined any classes yet. Go to the 'Join Class' tab to find one."
                                                className="py-8"
                                            />
                                        ) : (
                                            <div className="space-y-3">
                                                {myClasses.map(cls => (
                                                    <div
                                                        key={cls.id}
                                                        onClick={() => {
                                                            setSelectedClassId(cls.id);
                                                            setSelectedCourseId(null);
                                                        }}
                                                        className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 ${selectedClassId === cls.id
                                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-md transform scale-[1.02]'
                                                            : 'border-gray-200 dark:border-gray-600 hover:border-indigo-200 dark:hover:border-indigo-600 bg-white/50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700'
                                                            }`}
                                                    >
                                                        <h3 className="font-medium text-gray-900 dark:text-gray-100">{cls.name}</h3>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{cls.teacherName}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {selectedClass && (
                                        <div className="glass-card p-6 animate-fadeIn">
                                            <h2 className="text-section-title mb-4">Courses</h2>
                                            {loading ? (
                                                <SkeletonLoader variant="card" count={2} />
                                            ) : coursesInSelectedClass.length === 0 ? (
                                                <div className="text-center py-6">
                                                    <p className="text-gray-500 dark:text-gray-400 italic text-sm">No courses added to this class yet.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {coursesInSelectedClass.map(course => (
                                                        <div
                                                            key={course.id}
                                                            onClick={() => setSelectedCourseId(course.id)}
                                                            className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 ${selectedCourseId === course.id
                                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm'
                                                                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white/50 dark:bg-gray-700/50'
                                                                }`}
                                                        >
                                                            <div className="font-medium text-gray-800 dark:text-gray-100">{course.name}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="lg:col-span-2">
                                    {selectedCourseId ? (
                                        <div className="glass-card p-6 animate-fadeIn">
                                            <h2 className="text-section-title mb-4">{selectedCourse?.name}</h2>

                                            <div className="mb-6">
                                                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Resources</h3>
                                                <ul className="space-y-2">
                                                    {courseResources.map(r => (
                                                        <li key={r.id} className="flex items-center text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                                            <span className={`w-2 h-2 rounded-full mr-3 ${r.type === 'pdf' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                                            <button
                                                                onClick={() => handleDownloadResource(r)}
                                                                className="hover:text-indigo-600 dark:hover:text-indigo-400 text-left focus:outline-none font-medium transition-colors"
                                                            >
                                                                {r.title}
                                                            </button>
                                                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{r.date}</span>
                                                        </li>
                                                    ))}
                                                    {courseResources.length === 0 && (
                                                        <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No resources available.</p>
                                                        </div>
                                                    )}
                                                </ul>
                                            </div>

                                            <div>
                                                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Announcements</h3>
                                                <div className="space-y-3">
                                                    {courseAnnouncements.map(a => (
                                                        <div key={a.id} className="p-4 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-800/30">
                                                            <p className="text-sm text-gray-800 dark:text-gray-200">{a.content}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">{a.date} • {a.author}</p>
                                                        </div>
                                                    ))}
                                                    {courseAnnouncements.length === 0 && (
                                                        <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No announcements.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <EmptyState
                                            icon={BookOpen}
                                            title="Select a Course"
                                            description="Choose a class and then a course from the left menu to view content."
                                            className="h-full border-dashed"
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'join' && (
                            <div className="glass-card p-6">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Available Classes</h2>

                                {/* Search Bar */}
                                <SearchBar
                                    value={classSearch}
                                    onChange={setClassSearch}
                                    placeholder="Search by class name or teacher..."
                                    className="mb-4"
                                />

                                {loading ? (
                                    <SkeletonLoader variant="card" count={3} />
                                ) : availableClasses.length === 0 ? (
                                    <EmptyState
                                        icon={UserPlus}
                                        title="No New Classes"
                                        description="You have joined all available classes."
                                        className="py-12"
                                    />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {availableClasses.map(cls => {
                                            const status = getJoinStatus(cls.id);
                                            return (
                                                <div key={cls.id} className="p-5 border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-300 hover:shadow-md group">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{cls.name}</h3>
                                                        <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full font-medium">
                                                            {cls.teacherName}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 line-clamp-2">{cls.description}</p>
                                                    {status === 'pending' ? (
                                                        <button disabled className="w-full px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl text-sm font-medium cursor-not-allowed opacity-75">
                                                            Request Pending
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleJoin(cls.id)}
                                                            className="w-full btn-primary text-sm"
                                                        >
                                                            Join Class
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'grades' && (
                            <StudentGradesView />
                        )}

                        {activeTab === 'attendance' && (
                            <div className="glass-card p-6">
                                <EmptyState
                                    icon={CalendarCheck}
                                    title="Attendance Tracking"
                                    description="Your attendance records will be displayed here."
                                    className="py-12"
                                />
                            </div>
                        )}
                    </div>
                )}
            </Tabs>
        </div>
    );
}
