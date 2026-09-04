import React, { useState } from 'react';
import AnalyticsDashboard from '../components/teacher/AnalyticsDashboard';
import StudentRoster from '../components/teacher/StudentRoster';
import PostAnnouncement from '../components/teacher/PostAnnouncement';
import AssessmentManager from '../components/teacher/AssessmentManager';
import GradeEntry from '../components/teacher/GradeEntry';
import GradeAnalytics from '../components/teacher/GradeAnalytics';
import GradeStatistics from '../components/teacher/GradeStatistics';
import AtRiskAnalysis from '../components/teacher/AtRiskAnalysis';
import BulkDataEntry from '../components/teacher/BulkDataEntry';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: "easeOut"
        }
    }
};
import { Tabs } from '../components/ui/Tabs';
import { LayoutDashboard, BookOpen, Users, CalendarCheck, GraduationCap, FileText, Bell, ClipboardList, UserPlus, AlertCircle, Trash2 } from 'lucide-react';
import SearchBar from '../components/ui/SearchBar';
import FilterDropdown from '../components/ui/FilterDropdown';
import EmptyState from '../components/ui/EmptyState';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import ErrorBoundaryWrapper from '../components/ui/ErrorBoundaryWrapper';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import ConfirmModal from '../components/ui/ConfirmModal';
import GlobalAnnouncementsBanner from '../components/common/GlobalAnnouncementsBanner';

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { classes, createClass, deleteClass, joinRequests, respondToJoinRequest, courses, createCourse, deleteCourse, resources, addResource, uploadResourceToStorage, downloadResource, deleteResource, addAnnouncement, findTeacherByEmail, loading, assessments, grades } = useData();

    // Debug logging
    React.useEffect(() => {
        console.log("TeacherDashboard: useData values:", {
            hasUploadResourceToStorage: !!uploadResourceToStorage,
            hasDownloadResource: !!downloadResource
        });
    }, [uploadResourceToStorage, downloadResource]);

    const [newClassName, setNewClassName] = useState('');
    const [newClassDesc, setNewClassDesc] = useState('');

    // Search and filter states
    const [requestSearch, setRequestSearch] = useState('');
    const [requestFilter, setRequestFilter] = useState('all');
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [selectedCourseId, setSelectedCourseId] = useState(null);

    // Confirmation modals
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, item: null });

    const handleCreateClass = (e) => {
        e.preventDefault();
        if (!newClassName.trim()) return;

        createClass({
            name: newClassName,
            description: newClassDesc,
            teacherId: user.id,
            teacherName: user.name
        });
        setNewClassName('');
        setNewClassDesc('');
    };

    const myClasses = classes.filter(c =>
        c.teacherId === user.id ||
        courses.some(course => course.classId === c.id && course.teacherId === user.id)
    );

    // Filter and search join requests
    const myRequests = joinRequests.filter(req => {
        const reqClass = classes.find(c => c.id === req.classId);
        if (reqClass?.teacherId !== user?.id) return false;

        // Apply status filter - default to 'pending' if 'all' is selected
        const effectiveFilter = requestFilter === 'all' ? 'pending' : requestFilter;
        if (req.status !== effectiveFilter) return false;

        // Apply search
        if (requestSearch) {
            const searchLower = requestSearch.toLowerCase();
            const matchesName = req.studentName?.toLowerCase().includes(searchLower);
            const matchesEmail = req.studentEmail?.toLowerCase().includes(searchLower);
            return matchesName || matchesEmail;
        }

        return true;
    });

    // Handle confirmation for delete operations
    const handleConfirmDelete = () => {
        if (deleteModal.type === 'course') {
            deleteCourse(deleteModal.item.id);
            if (selectedCourseId === deleteModal.item.id) {
                setSelectedCourseId(null);
            }
        } else if (deleteModal.type === 'resource') {
            deleteResource(deleteModal.item.id, deleteModal.item.storagePath);
        } else if (deleteModal.type === 'class') {
            deleteClass(deleteModal.item.id);
            if (selectedClassId === deleteModal.item.id) {
                setSelectedClassId(null);
                setSelectedCourseId(null);
            }
        }
        setDeleteModal({ isOpen: false, type: null, item: null });
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'classes', label: 'Classes & Courses', icon: BookOpen },
        { id: 'content', label: 'Course Content', icon: FileText },
        { id: 'students', label: 'Students', icon: Users },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
        { id: 'grading', label: 'Grading', icon: GraduationCap },
    ];

    const selectedCourse = courses.find(c => c.id === selectedCourseId);

    // Build breadcrumbs based on current location
    const getBreadcrumbs = (activeTab) => {
        const breadcrumbs = [{ label: 'Teacher Dashboard', href: null }];

        if (activeTab && activeTab !== 'overview') {
            const tabLabels = {
                classes: 'Classes & Courses',
                content: 'Course Content',
                students: 'Students',
                grading: 'Grading',
                attendance: 'Attendance'
            };
            breadcrumbs.push({ label: tabLabels[activeTab] || activeTab, href: null });
        }

        if (selectedCourse) {
            breadcrumbs.push({ label: selectedCourse.name, href: null });
        }

        return breadcrumbs;
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h1 className="text-heading">Teacher Dashboard</h1>
                <div className="text-caption">
                    Welcome back, {user?.name}
                </div>
            </div>

            <GlobalAnnouncementsBanner />

            <Tabs tabs={tabs} defaultTab="overview">
                {(activeTab) => (
                    <div className="space-y-6 animate-scaleIn">
                        <Breadcrumbs items={getBreadcrumbs(activeTab)} />
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <AnalyticsDashboard />
                                
                                {/* Link to Subject Preferences */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="glass-card p-6 flex flex-col justify-between border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-900/10">
                                        <div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                                    <BookOpen className="h-6 w-6" />
                                                </div>
                                                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Subject Preferences</h3>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-medium">
                                                Submit and manage your teaching preferences for the upcoming semester.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate('/subject-preferences')}
                                            className="w-full py-2.5 px-4 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl font-semibold hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            View Form
                                        </button>
                                    </div>
                                </div>

                                <div className="glass-card p-6">
                                    <h2 className="text-section-title mb-4 flex items-center gap-2">
                                        <Bell className="w-5 h-5 text-indigo-500" />
                                        Join Requests
                                    </h2>

                                    {/* Search and Filter */}
                                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                        <SearchBar
                                            value={requestSearch}
                                            onChange={setRequestSearch}
                                            placeholder="Search by name or email..."
                                            className="flex-1"
                                        />
                                        <FilterDropdown
                                            value={requestFilter}
                                            onChange={setRequestFilter}
                                            label="Status"
                                            options={[
                                                { value: 'pending', label: 'Pending' },
                                                { value: 'approved', label: 'Approved' },
                                                { value: 'rejected', label: 'Rejected' }
                                            ]}
                                        />
                                    </div>

                                    {loading ? (
                                        <SkeletonLoader variant="list" count={3} />
                                    ) : myRequests.length === 0 ? (
                                        <EmptyState
                                            icon={UserPlus}
                                            title="No Pending Requests"
                                            description="When students request to join your classes, they will appear here."
                                            className="py-8"
                                        />
                                    ) : (
                                        <div className="space-y-3">
                                            {myRequests.map(req => {
                                                const targetClass = myClasses.find(c => c.id === req.classId);
                                                return (
                                                    <div key={req.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                                        <div>
                                                            <p className="font-medium text-gray-800 dark:text-gray-100">{req.studentName || 'Unknown Student'}</p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">wants to join {targetClass?.name || 'Unknown Class'}</p>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => respondToJoinRequest(req.id, 'approved')}
                                                                className="px-4 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition-colors"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => respondToJoinRequest(req.id, 'rejected')}
                                                                className="px-4 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <PostAnnouncement />
                            </div>
                        )}

                        {activeTab === 'classes' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="glass-card p-6">
                                    <h2 className="text-section-title mb-4">Class Management</h2>
                                <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Class to Manage</label>
                                        <div className="flex gap-2 items-center">
                                            <select
                                                className="input-field flex-1"
                                                onChange={(e) => {
                                                    setSelectedClassId(e.target.value);
                                                    setSelectedCourseId(null);
                                                }}
                                                value={selectedClassId || ''}
                                            >
                                                <option value="">-- Select a Class --</option>
                                                {myClasses.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            {selectedClassId && myClasses.find(c => c.id === selectedClassId)?.teacherId === user.id && (
                                                <button
                                                    onClick={() => {
                                                        const cls = myClasses.find(c => c.id === selectedClassId);
                                                        setDeleteModal({ isOpen: true, type: 'class', item: { id: selectedClassId, name: cls?.name } });
                                                    }}
                                                    className="p-2.5 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 transition-all"
                                                    title="Delete this class"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="border-t dark:border-gray-700 pt-4">
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Create New Class (Group)</h3>
                                        <form onSubmit={handleCreateClass} className="space-y-3">
                                            <input
                                                type="text"
                                                value={newClassName}
                                                onChange={(e) => setNewClassName(e.target.value)}
                                                className="input-field"
                                                placeholder="e.g., AI&DS 5th Sem"
                                            />
                                            <textarea
                                                value={newClassDesc}
                                                onChange={(e) => setNewClassDesc(e.target.value)}
                                                className="input-field"
                                                placeholder="Description..."
                                                rows="2"
                                            />
                                            <button
                                                type="submit"
                                                className="w-full btn-primary"
                                            >
                                                Create Class
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                <div className="glass-card p-6">
                                    <h2 className="text-section-title mb-4">Course Management</h2>
                                    {!selectedClassId ? (
                                        <EmptyState
                                            icon={BookOpen}
                                            title="Select a Class"
                                            description="Choose a class from the left to manage its courses."
                                            className="py-12 border-none bg-transparent"
                                        />
                                    ) : (
                                        <CourseManager
                                            classId={selectedClassId}
                                            courses={courses.filter(c => c.classId === selectedClassId)}
                                            createCourse={createCourse}
                                            deleteCourse={deleteCourse}
                                            onSelectCourse={setSelectedCourseId}
                                            selectedCourseId={selectedCourseId}
                                            deleteModal={deleteModal}
                                            setDeleteModal={setDeleteModal}
                                            handleConfirmDelete={handleConfirmDelete}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div>
                                {!selectedCourseId ? (
                                    <EmptyState
                                        icon={BookOpen}
                                        title="No Course Selected"
                                        description="Please select a course in the 'Classes' tab to manage its content."
                                        className="py-12 border-dashed"
                                    />
                                ) : (
                                    <CourseContentEditor
                                        courseId={selectedCourseId}
                                        courseName={selectedCourse.name}
                                        resources={resources.filter(r => r.courseId === selectedCourseId)}
                                        addResource={addResource}
                                        uploadResourceToStorage={uploadResourceToStorage}
                                        downloadResource={downloadResource}
                                        deleteResource={deleteResource}
                                        addAnnouncement={addAnnouncement}
                                        user={user}
                                        deleteModal={deleteModal}
                                        setDeleteModal={setDeleteModal}
                                        handleConfirmDelete={handleConfirmDelete}
                                    />
                                )}
                            </div>
                        )}

                        {activeTab === 'students' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <StudentRoster />
                                </div>
                                <div>
                                    <PostAnnouncement />
                                </div>
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                            <div className="glass-card p-6">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Attendance Management</h2>
                                {myClasses.length === 0 ? (
                                    <EmptyState
                                        icon={Users}
                                        title="No Classes Found"
                                        description="Create a class to start taking attendance."
                                    />
                                ) : (
                                    <AttendanceManager classes={myClasses} />
                                )}
                            </div>
                        )}

                        {activeTab === 'grading' && (
                            <div>
                                {!selectedCourseId ? (
                                    <EmptyState
                                        icon={GraduationCap}
                                        title="No Course Selected"
                                        description="Please select a course in the 'Classes' tab to manage grading."
                                        className="py-12 border-dashed"
                                    />
                                ) : (
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-xl shadow-sm border border-purple-100 dark:border-purple-800">
                                            <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                                                📊 Grading System - {courses.find(c => c.id === selectedCourseId)?.name}
                                            </h2>
                                            <p className="text-sm text-purple-700 dark:text-purple-300">
                                                Create assessments, enter grades, and view analytics for this course.
                                            </p>
                                        </div>

                                        <div className="mb-6">
                                            <BulkDataEntry
                                                courseId={selectedCourseId}
                                                courseName={courses.find(c => c.id === selectedCourseId)?.name}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <AssessmentManager
                                                courseId={selectedCourseId}
                                                courseName={courses.find(c => c.id === selectedCourseId)?.name}
                                            />
                                            <GradeEntry
                                                courseId={selectedCourseId}
                                                courseName={courses.find(c => c.id === selectedCourseId)?.name}
                                            />
                                        </div>


                                        <ErrorBoundaryWrapper errorTitle="Analytics Error" errorMessage="Unable to load grade analytics.">
                                            <GradeAnalytics
                                                courseId={selectedCourseId}
                                                courseName={courses.find(c => c.id === selectedCourseId)?.name}
                                            />
                                        </ErrorBoundaryWrapper>

                                        <ErrorBoundaryWrapper errorTitle="Statistics Error" errorMessage="Unable to load grade statistics.">
                                            <GradeStatistics
                                                courseId={selectedCourseId}
                                                grades={grades}
                                                assessments={assessments}
                                            />
                                        </ErrorBoundaryWrapper>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Tabs>

            {/* Confirm modal for class deletion (rendered at dashboard level) */}
            <ConfirmModal
                isOpen={deleteModal.isOpen && deleteModal.type === 'class'}
                onClose={() => setDeleteModal({ isOpen: false, type: null, item: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Class"
                message={`Are you sure you want to delete "${deleteModal.item?.name}"? This will also remove all students from the class. This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}

function CourseManager({ classId, courses, createCourse, deleteCourse, onSelectCourse, selectedCourseId, deleteModal, setDeleteModal, handleConfirmDelete }) {
    const [newCourseName, setNewCourseName] = useState('');
    const [teacherEmail, setTeacherEmail] = useState('');
    const { user } = useAuth();
    const { findTeacherByEmail } = useData();

    const handleAddCourse = async (e) => {
        e.preventDefault();
        if (!newCourseName.trim()) return;

        let assignedTeacherId = user.id;
        let assignedTeacherName = user.name;

        if (teacherEmail.trim()) {
            const teacher = await findTeacherByEmail(teacherEmail);
            if (teacher) {
                assignedTeacherId = teacher.id;
                assignedTeacherName = teacher.name;
            } else {
                alert('Teacher not found with this email. Course will be assigned to you.');
            }
        }

        createCourse({
            classId,
            name: newCourseName,
            teacherId: assignedTeacherId,
            teacherName: assignedTeacherName
        });
        setNewCourseName('');
        setTeacherEmail('');
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {courses.map(course => (
                    <div
                        key={course.id}
                        onClick={() => onSelectCourse(course.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 flex justify-between items-center group ${selectedCourseId === course.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm'
                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white/50 dark:bg-gray-700/50'
                            }`}
                    >
                        <div className="font-medium text-gray-800 dark:text-gray-100">{course.name}</div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setDeleteModal({ isOpen: true, type: 'course', item: { id: course.id, name: course.name } });
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete Course"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {courses.length === 0 && (
                    <EmptyState
                        icon={BookOpen}
                        title="No Courses Yet"
                        description="Add a course to get started."
                        className="py-6"
                    />
                )}
            </div>

            <form onSubmit={handleAddCourse} className='flex flex-col gap-3 mt-4'>
                <div className="flex gap-2">
                    <input
                        type='text'
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        className='input-field text-sm'
                        placeholder='New Course Name'
                    />
                    <input
                        type='email'
                        value={teacherEmail}
                        onChange={(e) => setTeacherEmail(e.target.value)}
                        className='input-field text-sm'
                        placeholder='Teacher Email (Opt)'
                    />
                </div>
                <button
                    type='submit'
                    className='w-full btn-primary text-sm py-2'
                >
                    Add Course
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Leave email blank to assign to yourself.</p>
            </form>

            {/* Confirmation Modal for course deletion */}
            <ConfirmModal
                isOpen={deleteModal?.isOpen && deleteModal?.type === 'course'}
                onClose={() => setDeleteModal({ isOpen: false, type: null, item: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Course"
                message={`Are you sure you want to delete "${deleteModal?.item?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}

import { storage } from '../config/firebase';
// import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Removed for Base64 fallback

function CourseContentEditor({ courseId, courseName, resources, addResource, uploadResourceToStorage, downloadResource, deleteResource, addAnnouncement, user, deleteModal, setDeleteModal, handleConfirmDelete }) {
    const [resTitle, setResTitle] = useState('');
    const [resType, setResType] = useState('pdf');
    const [resSource, setResSource] = useState('file'); // 'file' or 'link'
    const [resLink, setResLink] = useState('');
    const [announcementText, setAnnouncementText] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleAddResource = async (e) => {
        e.preventDefault();
        if (!resTitle || !resLink) {
            alert('Please fill in all fields');
            return;
        }

        setUploading(true);

        try {
            // Add external link resource
            await addResource({
                courseId,
                title: resTitle,
                type: 'link',
                url: resLink
            });

            setResTitle('');
            setResLink('');
        } catch (err) {
            console.error("Error saving resource: ", err);
            alert(`Failed to save resource: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadResource = async (resource) => {
        // If it's an external link or has a direct URL, open it
        if (resource.type === 'link' || resource.url) {
            window.open(resource.url, '_blank');
            return;
        }

        // If it has a downloadURL from Storage, download it
        if (resource.downloadURL) {
            downloadResource(resource.downloadURL, resource.fileName || resource.title);
            return;
        }

        // Fallback error
        alert('Unable to download this resource');
    };

    const handlePostAnnouncement = (e) => {
        e.preventDefault();
        if (!announcementText.trim()) return;
        addAnnouncement({
            id: Date.now(),
            title: `Announcement: ${courseName} `,
            content: announcementText,
            date: new Date().toISOString().split('T')[0],
            author: user.name,
            courseId
        });
        setAnnouncementText('');
        alert('Announcement posted!');
    };

    return (
        <div className='glass-card p-6'>
            <h2 className='text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4'>Managing: {courseName}</h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                    <h3 className='font-medium text-gray-700 dark:text-gray-300 mb-3'>Resources</h3>
                    <ul className='space-y-2 mb-4'>
                        {resources.map(r => (
                            <li key={r.id} className='flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group'>
                                <div className="flex items-center flex-1">
                                    <span className={`w - 2 h - 2 rounded - full mr - 3 ${r.type === 'pdf' ? 'bg-red-500' : r.type === 'link' ? 'bg-green-500' : 'bg-blue-500'} `}></span>
                                    <button
                                        onClick={() => handleDownloadResource(r)}
                                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-left transition-colors"
                                    >
                                        {r.title} ({r.type.toUpperCase()})
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        setDeleteModal({ isOpen: true, type: 'resource', item: { id: r.id, title: r.title, storagePath: r.storagePath } });
                                    }}
                                    className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete Resource"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                        {resources.length === 0 && (
                            <div className="text-center py-8 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No resources uploaded yet.</p>
                            </div>
                        )}
                    </ul>
                    <form onSubmit={handleAddResource} className='space-y-3'>
                        <input
                            type='text'
                            value={resTitle}
                            onChange={(e) => setResTitle(e.target.value)}
                            className='input-field text-sm'
                            placeholder='Resource Title (e.g., Lecture Notes)'
                        />

                        <input
                            type='url'
                            value={resLink}
                            onChange={(e) => setResLink(e.target.value)}
                            className='input-field text-sm'
                            placeholder='Google Drive Link (https://drive.google.com/...)'
                        />

                        <button
                            type='submit'
                            disabled={uploading}
                            className='w-full btn-secondary text-sm disabled:opacity-50'
                        >
                            {uploading ? 'Adding...' : 'Add Resource Link'}
                        </button>

                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            💡 Paste a link from Google Drive, YouTube, or any external resource
                        </p>
                    </form>
                </div>

                <div>
                    <h3 className='font-medium text-gray-700 dark:text-gray-300 mb-3'>Post Course Announcement</h3>
                    <form onSubmit={handlePostAnnouncement} className='space-y-3'>
                        <textarea
                            value={announcementText}
                            onChange={(e) => setAnnouncementText(e.target.value)}
                            className='input-field text-sm'
                            placeholder={`Message for ${courseName} students...`}
                            rows='4'
                        />
                        <button type='submit' className='w-full btn-primary text-sm'>
                            Post Announcement
                        </button>
                    </form>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, type: null, item: null })}
                onConfirm={handleConfirmDelete}
                title={deleteModal.type === 'course' ? 'Delete Course' : 'Delete Resource'}
                message={
                    deleteModal.type === 'course'
                        ? `Are you sure you want to delete "${deleteModal.item?.name}"? This action cannot be undone.`
                        : `Are you sure you want to delete "${deleteModal.item?.title}"? This action cannot be undone.`
                }
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}


function AttendanceManager({ classes }) {
    const { user } = useAuth();
    const { joinRequests, attendance, markAttendance, courses } = useData();
    const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState({});
    const [statusMessage, setStatusMessage] = useState('');

    // Filter courses: Show all if class owner, otherwise only assigned courses
    const classCourses = courses.filter(c => {
        if (c.classId !== selectedClassId) return false;
        const isClassOwner = classes.find(cls => cls.id === selectedClassId)?.teacherId === user.id;
        return isClassOwner || c.teacherId === user.id;
    });


    const classStudents = React.useMemo(() => joinRequests
        .filter(req => req.classId === selectedClassId && req.status === 'approved')
        .map(req => ({ id: req.studentId, name: req.studentName })), [joinRequests, selectedClassId]);

    React.useEffect(() => {
        if (classCourses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(classCourses[0].id);
        }
    }, [selectedClassId, classCourses, selectedCourseId]);

    React.useEffect(() => {
        if (!selectedCourseId) return;

        const existingRecord = attendance.find(r =>
            r.classId === selectedClassId &&
            r.courseId === selectedCourseId &&
            r.date === selectedDate
        );

        if (existingRecord) {
            setRecords(existingRecord.records);
        } else {
            const initialRecords = {};
            classStudents.forEach(s => initialRecords[s.id] = 'present');
            setRecords(initialRecords);
        }
        setStatusMessage('');
    }, [selectedClassId, selectedCourseId, selectedDate, attendance, classStudents]);

    const handleStatusChange = (studentId, status) => {
        setRecords(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSave = async () => {
        if (!selectedCourseId) {
            setStatusMessage('Please select a course');
            return;
        }

        await markAttendance(selectedClassId, selectedCourseId, selectedDate, records);
        setStatusMessage('Attendance saved successfully!');
        setTimeout(() => setStatusMessage(''), 3000);
    };

    if (classCourses.length === 0) {
        return (
            <EmptyState
                icon={BookOpen}
                title="No Courses Available"
                description="Please add courses to this class first to take attendance."
            />
        );
    }

    return (
        <div className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Select Class</label>
                    <select
                        value={selectedClassId}
                        onChange={(e) => {
                            setSelectedClassId(e.target.value);
                            setSelectedCourseId('');
                        }}
                        className='input-field'
                    >
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Select Course</label>
                    <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className='input-field'
                    >
                        <option value=''>-- Select Course --</option>
                        {classCourses.map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Date</label>
                    <input
                        type='date'
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className='input-field'
                    />
                </div>
            </div>

            {!selectedCourseId ? (
                <EmptyState
                    icon={BookOpen}
                    title="Select a Course"
                    description="Please select a course to take attendance."
                    className="py-8 border-none bg-transparent"
                />
            ) : classStudents.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No Students"
                    description="No students have joined this class yet."
                    className="py-8"
                />
            ) : (
                <div className='border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden'>
                    <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
                        <thead className='bg-gray-50 dark:bg-gray-800'>
                            <tr>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>Student</th>
                                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>Status</th>
                            </tr>
                        </thead>
                        <tbody className='bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'>
                            {classStudents.map(student => (
                                <tr key={student.id}>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100'>{student.name}</td>
                                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400'>
                                        <div className='flex space-x-2'>
                                            {['present', 'absent', 'late'].map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleStatusChange(student.id, status)}
                                                    className={`px - 3 py - 1 rounded - full text - xs font - medium capitalize transition - all duration - 200 transform hover: scale - 105 ${records[student.id] === status
                                                        ? status === 'present' ? 'bg-green-100 text-green-800 ring-2 ring-green-500 shadow-sm'
                                                            : status === 'absent' ? 'bg-red-100 text-red-800 ring-2 ring-red-500 shadow-sm'
                                                                : 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-500 shadow-sm'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                        } `}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className='flex items-center justify-between pt-2'>
                <button
                    onClick={handleSave}
                    disabled={!selectedCourseId}
                    className='btn-primary disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    Save Attendance
                </button>
                {statusMessage && <span className={`text-sm font-medium animate-fadeIn ${statusMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{statusMessage}</span>}
            </div>
        </div>
    );
}
