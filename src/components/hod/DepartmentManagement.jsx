import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, BookOpen, Library, Trash2, UserMinus, Mail, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import ConfirmModal from '../ui/ConfirmModal';
import LoadingSpinner from '../ui/LoadingSpinner';

const TAB_STUDENTS = 'students';
const TAB_TEACHERS = 'teachers';
const TAB_COURSES = 'courses';
const TAB_CLASSES = 'classes';

/**
 * DepartmentManagement
 * Tabbed HOD panel: Students | Teachers | Courses with remove/delete actions.
 *
 * Props:
 *   allStudents       – from useHodAdmin
 *   activeTeachers    – from useHodAdmin
 *   hodLoading        – from useHodAdmin
 *   removeStudent(id) – from useHodAdmin
 *   removeTeacher(id) – from useHodAdmin
 *   courses           – from useData
 *   deleteCourse(id)  – from useData
 *   onViewTeacher(teacher) – optional callback to open teacher performance view
 */
export default function DepartmentManagement({
    allStudents = [],
    activeTeachers = [],
    departmentClasses = [],
    courses = [],
    hodLoading,
    removeStudent, removeTeacher, deleteClass, deleteCourse,
    onViewTeacher,
}) {
    const [activeTab, setActiveTab] = useState(TAB_STUDENTS);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, item: null });

    const tabs = [
        { id: TAB_STUDENTS, label: 'Students', icon: Users, count: allStudents.length },
        { id: TAB_TEACHERS, label: 'Teachers', icon: Shield, count: activeTeachers.length },
        { id: TAB_CLASSES, label: 'Classes', icon: Library, count: departmentClasses.length },
        { id: TAB_COURSES, label: 'Courses', icon: BookOpen, count: courses.length },
    ];

    const openConfirm = (type, item) => setConfirmModal({ isOpen: true, type, item });
    const closeConfirm = () => setConfirmModal({ isOpen: false, type: null, item: null });

    const handleConfirm = () => {
        const { type, item } = confirmModal;
        if (type === 'student') removeStudent(item.id);
        else if (type === 'teacher') removeTeacher(item.id);
        else if (type === 'course') deleteCourse(item.id);
        else if (type === 'class') deleteClass(item.id);
        closeConfirm();
    };

    const confirmMessage = () => {
        const { type, item } = confirmModal;
        if (type === 'student') return `Remove student "${item?.name}" from the department? This action cannot be undone.`;
        if (type === 'teacher') return `Remove teacher "${item?.name}" from the department? Their classes will also be deleted. This action cannot be undone.`;
        if (type === 'course') return `Delete course "${item?.name}"? All associated grades and resources will be removed. This action cannot be undone.`;
        if (type === 'class') return `Delete class "${item?.name}"? All student join requests for this class will also be removed. This action cannot be undone.`;
        return '';
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-indigo-500" />
                        Department Management
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Tab Bar */}
                    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    activeTab === tab.id
                                        ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                                    activeTab === tab.id
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                        : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {hodLoading ? (
                        <div className="flex justify-center py-10">
                            <LoadingSpinner size="medium" />
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18 }}
                            >
                                {/* ── STUDENTS TAB ── */}
                                {activeTab === TAB_STUDENTS && (
                                    <EntityTable
                                        items={allStudents}
                                        emptyMessage="No students registered yet."
                                        columns={['Student', 'Email', 'Joined', 'Action']}
                                        renderRow={(student) => (
                                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar name={student.name} color="purple" picture={student.profilePicture} />
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{student.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{student.email}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(student.createdAt)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <RemoveButton onClick={() => openConfirm('student', student)} label="Remove" />
                                                </td>
                                            </tr>
                                        )}
                                    />
                                )}

                                {/* ── TEACHERS TAB ── */}
                                {activeTab === TAB_TEACHERS && (
                                    <EntityTable
                                        items={activeTeachers}
                                        emptyMessage="No active teachers in the department."
                                        columns={['Teacher', 'Email', 'Joined', 'Actions']}
                                        renderRow={(teacher) => (
                                            <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar name={teacher.name} color="indigo" picture={teacher.profilePicture} />
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{teacher.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{teacher.email}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(teacher.createdAt)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {onViewTeacher && (
                                                            <button
                                                                onClick={() => onViewTeacher(teacher)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40 transition-colors"
                                                            >
                                                                <BarChart2 className="h-3.5 w-3.5" />
                                                                Performance
                                                            </button>
                                                        )}
                                                        <RemoveButton onClick={() => openConfirm('teacher', teacher)} label="Remove" />
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    />
                                )}

                                {/* ── CLASSES TAB ── */}
                                {activeTab === TAB_CLASSES && (
                                    <EntityTable
                                        items={departmentClasses}
                                        emptyMessage="No classes in this department yet."
                                        columns={['Class', 'Teacher', 'Students', 'Action']}
                                        renderRow={(cls) => (
                                            <tr key={cls.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{cls.name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{cls.teacherName || '—'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{cls.studentCount ?? '—'}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => openConfirm('class', { id: cls.id, name: cls.name })}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    />
                                )}

                                {/* ── COURSES TAB ── */}
                                {activeTab === TAB_COURSES && (
                                    <EntityTable
                                        items={courses}
                                        emptyMessage="No courses created yet."
                                        columns={['Course', 'Teacher', 'Class', 'Action']}
                                        renderRow={(course) => (
                                            <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{course.name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{course.teacherName || '—'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{course.classId?.slice(0, 8) || '—'}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => openConfirm('course', { id: course.id, name: course.name })}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </CardContent>
            </Card>

            {/* Shared Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={handleConfirm}
                title={
                    confirmModal.type === 'student' ? 'Remove Student'
                    : confirmModal.type === 'teacher' ? 'Remove Teacher'
                    : confirmModal.type === 'class' ? 'Delete Class'
                    : 'Delete Course'
                }
                message={confirmMessage()}
                confirmText='Delete'
                cancelText="Cancel"
                variant="danger"
            />
        </>
    );
}

/* ── Helper sub-components ── */

function EntityTable({ items, emptyMessage, columns, renderRow }) {
    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <p>{emptyMessage}</p>
            </div>
        );
    }
    return (
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <tr>
                        {columns.map((col) => (
                            <th key={col} className={`px-4 py-3 font-semibold ${col === 'Action' || col === 'Actions' ? 'text-right' : ''}`}>
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800/50">
                    {items.map(renderRow)}
                </tbody>
            </table>
        </div>
    );
}

function Avatar({ name, color, picture }) {
    const colors = {
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
        indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    };
    return (
        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0 ${colors[color] || colors.indigo}`}>
            {picture
                ? <img src={picture} alt={name} className="h-full w-full object-cover" />
                : name?.[0]?.toUpperCase() || '?'}
        </div>
    );
}

function RemoveButton({ onClick, label }) {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
        >
            <UserMinus className="h-3.5 w-3.5" />
            {label}
        </button>
    );
}

function formatDate(val) {
    if (!val) return 'N/A';
    try {
        return new Date(val?.toDate?.() || val).toLocaleDateString();
    } catch {
        return 'N/A';
    }
}
