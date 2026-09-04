import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Plus, BookOpen, Users, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function ClassesPage() {
    const { user } = useAuth();
    const { classes, courses, createClass, createCourse, joinRequests, findTeacherByEmail } = useData();

    const [showCreateClass, setShowCreateClass] = useState(false);
    const [showCreateCourse, setShowCreateCourse] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [newClass, setNewClass] = useState({ name: '', section: '' });
    const [newCourse, setNewCourse] = useState({ name: '', code: '' });
    const [teacherEmail, setTeacherEmail] = useState('');

    const myClasses = classes.filter(c =>
        c.teacherId === user?.id ||
        courses.some(course => course.classId === c.id && course.teacherId === user?.id)
    );
    const handleCreateClass = async (e) => {
        e.preventDefault();
        await createClass(newClass);
        setNewClass({ name: '', section: '' });
        setShowCreateClass(false);
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();

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

        await createCourse({
            ...newCourse,
            classId: selectedClassId,
            teacherId: assignedTeacherId,
            teacherName: assignedTeacherName
        });
        setNewCourse({ name: '', code: '' });
        setTeacherEmail('');
        setShowCreateCourse(false);
        setSelectedClassId('');
    };


    const getClassCourses = (classId) => {
        return courses.filter(c => c.classId === classId);
    };

    const getClassStudentCount = (classId) => {
        return joinRequests.filter(req => req.classId === classId && req.status === 'approved').length;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Classes</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your classes and courses</p>
                </div>
                <Button onClick={() => setShowCreateClass(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Class
                </Button>
            </div>

            {/* Create Class Modal */}
            {showCreateClass && (
                <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30">
                    <CardHeader>
                        <CardTitle>Create New Class</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateClass} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    value={newClass.name}
                                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                                    placeholder="e.g., AI & DS"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    value={newClass.section}
                                    onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                                    placeholder="e.g., 5th Sem"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit">Create</Button>
                                <Button type="button" variant="outline" onClick={() => setShowCreateClass(false)}>Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Classes Grid */}
            {myClasses.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No classes yet. Create your first class to get started!</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myClasses.map(classItem => {
                        const classCourses = getClassCourses(classItem.id);
                        const studentCount = getClassStudentCount(classItem.id);

                        return (
                            <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-xl">{classItem.name}</CardTitle>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{classItem.section}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Users className="h-4 w-4" />
                                            <span>{studentCount} students</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Courses List */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Courses ({classCourses.length})</h4>
                                                <button
                                                    onClick={() => {
                                                        setSelectedClassId(classItem.id);
                                                        setShowCreateCourse(true);
                                                    }}
                                                    className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                                >
                                                    + Add Course
                                                </button>
                                            </div>
                                            {classCourses.length === 0 ? (
                                                <p className="text-xs text-gray-400 dark:text-gray-500">No courses added yet</p>
                                            ) : (
                                                <div className="space-y-1">
                                                    {classCourses.map(course => (
                                                        <div key={course.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                                                            <span className="font-medium text-gray-700 dark:text-gray-100">{course.name}</span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">{course.code}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create Course Modal */}
            {showCreateCourse && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Add Course</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateCourse} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        value={newCourse.name}
                                        onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                                        placeholder="e.g., Data Structures"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Code</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        value={newCourse.code}
                                        onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                                        placeholder="e.g., CS301"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teacher Email (Optional)</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        value={teacherEmail}
                                        onChange={(e) => setTeacherEmail(e.target.value)}
                                        placeholder="Leave blank to assign to yourself"
                                    />
                                </div>
                                <div className="flex gap-2">

                                    <Button type="submit">Add Course</Button>
                                    <Button type="button" variant="outline" onClick={() => {
                                        setShowCreateCourse(false);
                                        setSelectedClassId('');
                                    }}>Cancel</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
