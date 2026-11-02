import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Users, Trash2 } from 'lucide-react';

import EmptyState from '../ui/EmptyState';
import SearchBar from '../ui/SearchBar';
import ConfirmModal from '../ui/ConfirmModal';

export default function StudentRoster() {
    const { user } = useAuth();
    const { joinRequests, classes, attendance, respondToJoinRequest, removeStudentFromClass, courses } = useData();
    const [studentsWithStats, setStudentsWithStats] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, studentId: null, classId: null, studentName: '' });

    useEffect(() => {
        // Get all classes taught by this teacher (either owned or assigned to courses)
        const myClasses = classes.filter(c =>
            c.teacherId === user?.id ||
            courses.some(course => course.classId === c.id && course.teacherId === user?.id)
        );
        const myClassIds = myClasses.map(c => c.id);

        // Get approved students from those classes
        const approvedStudents = joinRequests.filter(
            req => myClassIds.includes(req.classId) && req.status === 'approved'
        );

        // Get pending requests
        const pending = joinRequests.filter(
            req => myClassIds.includes(req.classId) && req.status === 'pending'
        );
        setPendingRequests(pending);

        // Calculate attendance for each student
        const studentsData = approvedStudents.map(req => {
            // Get all attendance records for this student
            const studentAttendance = attendance.filter(record =>
                record.records && record.records[req.studentId]
            );

            const totalClasses = studentAttendance.length;
            const presentCount = studentAttendance.filter(
                record => record.records[req.studentId] === 'present'
            ).length;
            const lateCount = studentAttendance.filter(
                record => record.records[req.studentId] === 'late'
            ).length;

            const attendancePercent = totalClasses > 0
                ? Math.round(((presentCount + (lateCount * 0.5)) / totalClasses) * 100)
                : 100;

            // Determine risk level based on attendance
            let risk = 'low';
            if (attendancePercent < 60) risk = 'high';
            else if (attendancePercent < 80) risk = 'medium';

            return {
                id: req.studentId,
                name: req.studentName,
                usn: req.studentUsn || '1KS21CS001',
                classId: req.classId,
                className: myClasses.find(c => c.id === req.classId)?.name || 'Unknown',
                attendance: attendancePercent,
                totalClasses,
                risk
            };
        });

        // Remove duplicates (student might be in multiple classes)
        const uniqueStudents = studentsData.reduce((acc, student) => {
            const existing = acc.find(s => s.id === student.id);
            if (!existing) {
                acc.push(student);
            }
            return acc;
        }, []);



        setStudentsWithStats(uniqueStudents);
    }, [joinRequests, classes, attendance, user, courses]);

    // Filter students based on search query
    const filteredStudents = studentsWithStats.filter(student => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            student.name.toLowerCase().includes(query) ||
            (student.usn && student.usn.toLowerCase().includes(query)) ||
            student.className.toLowerCase().includes(query)
        );
    });

    const getRiskBadgeVariant = (risk) => {
        switch (risk) {
            case 'low': return 'success';
            case 'medium': return 'warning';
            case 'high': return 'danger';
            default: return 'default';
        }
    };

    const handleApprove = async (requestId) => {
        await respondToJoinRequest(requestId, 'approved');
    };

    const handleReject = async (requestId) => {
        await respondToJoinRequest(requestId, 'rejected');
    };

    const handleRemoveStudent = (studentId, classId, studentName) => {
        setConfirmModal({ isOpen: true, studentId, classId, studentName });
    };

    const confirmRemove = async () => {
        await removeStudentFromClass(confirmModal.classId, confirmModal.studentId);
        setConfirmModal({ isOpen: false, studentId: null, classId: null, studentName: '' });
    };

    if (studentsWithStats.length === 0 && pendingRequests.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Student Roster
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <EmptyState
                        icon={Users}
                        title="No Students Yet"
                        description="Students who join your classes will appear here."
                        className="py-8 border-none bg-transparent"
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
                <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                            <Users className="h-5 w-5" />
                            Pending Join Requests ({pendingRequests.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-yellow-100 dark:border-yellow-800 shadow-sm backdrop-blur-sm">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{req.studentName}</p>
                                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold">
                                                USN: {req.studentUsn || '1KS21CS001'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                            wants to join <span className="font-medium text-indigo-600 dark:text-indigo-400">{classes.find(c => c.id === req.classId)?.name}</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(req.id)}
                                            className="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(req.id)}
                                            className="px-4 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-all"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Student Roster ({studentsWithStats.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search Bar */}
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search by student name, USN, or class..."
                    />

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">USN</th>
                                    <th className="px-4 py-3">Class</th>
                                    <th className="px-4 py-3">Total Classes</th>
                                    <th className="px-4 py-3">Attendance</th>
                                    <th className="px-4 py-3">Risk Level</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No students found matching "{searchQuery}"
                                        </td>
                                    </tr>
                                ) : filteredStudents.map(student => (
                                    <tr key={student.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{student.name}</td>
                                        <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">{student.usn}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{student.className}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{student.totalClasses}</td>
                                        <td className="px-4 py-3">
                                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 max-w-[100px]">
                                                <div
                                                    className={`h-1.5 rounded-full ${student.attendance >= 90 ? 'bg-green-500' : student.attendance >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${student.attendance}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{student.attendance}%</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={getRiskBadgeVariant(student.risk)}>
                                                {student.risk.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleRemoveStudent(student.id, student.classId, student.name)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
                                                title="Remove student from class"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, studentId: null, classId: null, studentName: '' })}
                onConfirm={confirmRemove}
                title="Remove Student"
                message={`Are you sure you want to remove ${confirmModal.studentName} from this class? This action cannot be undone.`}
                confirmText="Remove"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
