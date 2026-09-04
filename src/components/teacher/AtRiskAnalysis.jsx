import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { ROLES } from '../../utils/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { AlertTriangle, TrendingDown, UserX, CheckCircle, Calendar, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';
import { BookOpen } from 'lucide-react';
import VtuPerformanceModal from './VtuPerformanceModal';

export default function AtRiskAnalysis({ targetTeacherId }) {
    const { user } = useAuth();
    const { joinRequests, attendance, grades, classes, courses, assessments } = useData();
    const { darkMode } = useTheme();
    const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
    const [interventionModal, setInterventionModal] = useState({ isOpen: false, student: null });
    const [meetingForm, setMeetingForm] = useState({ show: false, date: '', time: '', notes: '' });
    const [actionPlanForm, setActionPlanForm] = useState({ show: false, goals: '', resources: '', timeline: '', checkIns: '' });
    const [vtuModal, setVtuModal] = useState({ isOpen: false, student: null });

    // Derive students from joinRequests
    const students = useMemo(() => {
        if (!user?.id) return [];

        // Include classes where target teacher owns OR has courses assigned, or all classes if HOD and no target
        const effectiveTeacherId = targetTeacherId || user.id;
        const myClasses = classes.filter(c =>
            user.role === ROLES.HOD || c.teacherId === effectiveTeacherId ||
            courses.some(course => course.classId === c.id && course.teacherId === effectiveTeacherId)
        );
        const myClassIds = myClasses.map(c => c.id);
        const approvedRequests = joinRequests.filter(
            req => myClassIds.includes(req.classId) && req.status === 'approved'
        );

        const uniqueStudents = [];
        const seenIds = new Set();

        approvedRequests.forEach(req => {
            if (!seenIds.has(req.studentId)) {
                seenIds.add(req.studentId);
                uniqueStudents.push({
                    id: req.studentId,
                    name: req.studentName,
                    classId: req.classId
                });
            }
        });

        return uniqueStudents;
    }, [joinRequests, classes, courses, user]);

    // Calculate Risk Scores
    const riskData = useMemo(() => {
        const effectiveTeacherId = targetTeacherId || user?.id;
        const targetCourseIds = courses
            .filter(c => (user?.role === ROLES.HOD && !targetTeacherId) || c.teacherId === effectiveTeacherId)
            .map(c => c.id);

        return students.map(student => {
            // Calculate Attendance %
            const studentAttendance = attendance.filter(a => {
                return a.records && a.records[student.id] && targetCourseIds.includes(a.courseId);
            });
            const totalClasses = studentAttendance.length;
            const presentCount = studentAttendance.filter(a => a.records[student.id] === 'present').length;
            const attendancePercentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 100;

            // Calculate Average Grade %
            const studentGrades = grades.filter(g => g.studentId === student.id && targetCourseIds.includes(g.courseId));
            const totalScored = studentGrades.reduce((sum, g) => sum + (g.marksScored || 0), 0);
            const maxPossibleScore = studentGrades.reduce((sum, g) => {
                const assessment = assessments.find(a => a.id === g.assessmentId);
                return sum + (assessment ? (assessment.totalMarks || assessment.maxMarks || 100) : 100);
            }, 0);
            const gradePercentage = maxPossibleScore > 0 ? (totalScored / maxPossibleScore) * 100 : 100;

            // Risk Algorithm
            const attendanceRisk = (100 - attendancePercentage) * 0.4;
            const gradeRisk = (100 - gradePercentage) * 0.6;
            const riskScore = Math.round(attendanceRisk + gradeRisk);

            let riskLevel = 'low';
            if (riskScore > 40) riskLevel = 'high';
            else if (riskScore > 20) riskLevel = 'medium';

            // Identify specific issues
            const issues = [];
            if (attendancePercentage < 75) issues.push(`Low Attendance (${Math.round(attendancePercentage)}%)`);
            if (gradePercentage < 60) issues.push(`Failing Grades (Avg ${Math.round(gradePercentage)}%)`);
            if (studentGrades.length === 0 && totalClasses > 5) issues.push('No Grades Recorded');

            return {
                ...student,
                attendancePercentage,
                gradePercentage,
                riskScore,
                riskLevel,
                issues,
                className: classes.find(c => c.id === student.classId)?.name || 'Unknown Class',
                currentSubjects: studentGrades.map(g => {
                    const assessment = assessments.find(a => a.id === g.assessmentId);
                    const course = courses.find(c => c.id === g.courseId);
                    return {
                        name: course ? course.name : (assessment ? assessment.title : 'Assessment'),
                        totalMarks: g.marksScored,
                        maxMarks: assessment ? (assessment.totalMarks || assessment.maxMarks || 100) : 100,
                        credits: 4
                    };
                })
            };
        }).sort((a, b) => b.riskScore - a.riskScore);
    }, [students, attendance, grades, classes, assessments]);

    const filteredStudents = selectedRiskLevel === 'all'
        ? riskData
        : riskData.filter(s => s.riskLevel === selectedRiskLevel);

    const stats = {
        high: riskData.filter(s => s.riskLevel === 'high').length,
        medium: riskData.filter(s => s.riskLevel === 'medium').length,
        low: riskData.filter(s => s.riskLevel === 'low').length,
        total: riskData.length
    };

    // Handle scheduling a meeting
    const handleScheduleMeeting = async () => {
        try {
            await addDoc(collection(db, 'interventions'), {
                type: 'meeting',
                studentId: interventionModal.student.id,
                studentName: interventionModal.student.name,
                teacherId: user.id,
                teacherName: user.name,
                classId: interventionModal.student.classId,
                className: interventionModal.student.className,
                date: meetingForm.date,
                time: meetingForm.time,
                notes: meetingForm.notes,
                issues: interventionModal.student.issues,
                riskScore: interventionModal.student.riskScore,
                createdAt: serverTimestamp(),
                status: 'scheduled'
            });
            toast.success(`Meeting scheduled with ${interventionModal.student.name}`);
            setMeetingForm({ show: false, date: '', time: '', notes: '' });
            setInterventionModal({ isOpen: false, student: null });
        } catch (error) {
            console.error('Error scheduling meeting:', error);
            toast.error('Failed to schedule meeting');
        }
    };

    // Handle creating action plan
    const handleCreateActionPlan = async () => {
        try {
            await addDoc(collection(db, 'interventions'), {
                type: 'action_plan',
                studentId: interventionModal.student.id,
                studentName: interventionModal.student.name,
                teacherId: user.id,
                teacherName: user.name,
                classId: interventionModal.student.classId,
                className: interventionModal.student.className,
                goals: actionPlanForm.goals,
                resources: actionPlanForm.resources,
                timeline: actionPlanForm.timeline,
                checkIns: actionPlanForm.checkIns,
                issues: interventionModal.student.issues,
                riskScore: interventionModal.student.riskScore,
                createdAt: serverTimestamp(),
                status: 'active'
            });
            toast.success(`Action plan created for ${interventionModal.student.name}`);
            setActionPlanForm({ show: false, goals: '', resources: '', timeline: '', checkIns: '' });
            setInterventionModal({ isOpen: false, student: null });
        } catch (error) {
            console.error('Error creating action plan:', error);
            toast.error('Failed to create action plan');
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">High Risk Students</p>
                            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.high}</h3>
                            <p className="text-xs text-red-500 mt-1">Immediate intervention needed</p>
                        </div>
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Medium Risk Students</p>
                            <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.medium}</h3>
                            <p className="text-xs text-yellow-500 mt-1">Monitor closely</p>
                        </div>
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                            <TrendingDown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Low Risk Students</p>
                            <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.low}</h3>
                            <p className="text-xs text-green-500 mt-1">On track</p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Student Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <UserX className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        At-Risk Student Analysis
                    </CardTitle>
                    <div className="flex gap-2">
                        {['all', 'high', 'medium', 'low'].map(level => (
                            <button
                                key={level}
                                onClick={() => setSelectedRiskLevel(level)}
                                className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-all ${selectedRiskLevel === level
                                    ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Student</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Class</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Risk Score</th>
                                    <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Key Issues</th>
                                    <th className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-gray-300">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No students found in this category.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map(student => (
                                        <motion.tr
                                            key={student.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors"
                                        >
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                                                {student.name}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                {student.className}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${student.riskLevel === 'high' ? 'bg-red-500' :
                                                                student.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                                                }`}
                                                            style={{ width: `${student.riskScore}%` }}
                                                        />
                                                    </div>
                                                    <span className={`font-bold ${student.riskLevel === 'high' ? 'text-red-600 dark:text-red-400' :
                                                        student.riskLevel === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                                                        }`}>
                                                        {student.riskScore}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {student.issues.length > 0 ? (
                                                        student.issues.map((issue, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 text-xs rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800">
                                                                {issue}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">No major issues</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setInterventionModal({ isOpen: true, student })}
                                                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
                                                >
                                                    Intervene
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Intervention Modal */}
            {interventionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setInterventionModal({ isOpen: false, student: null })}
                    />

                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto animate-scaleIn">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Intervention for {interventionModal.student?.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Class: {interventionModal.student?.className} • Risk:
                                    <span className={`ml-1 font-medium ${interventionModal.student?.riskLevel === 'high' ? 'text-red-600' :
                                        interventionModal.student?.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                                        }`}>
                                        {interventionModal.student?.riskLevel?.toUpperCase()}
                                    </span>
                                </p>
                            </div>
                            <button
                                onClick={() => setInterventionModal({ isOpen: false, student: null })}
                                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Issues Summary */}
                        {interventionModal.student?.issues && interventionModal.student.issues.length > 0 && (
                            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <h4 className="font-medium text-red-900 dark:text-red-200 mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Identified Issues
                                </h4>
                                <ul className="list-disc list-inside text-sm text-red-800 dark:text-red-300 space-y-1">
                                    {interventionModal.student.issues.map((issue, idx) => (
                                        <li key={idx}>{issue}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="space-y-3 mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-white">Quick Actions</h4>

                            <button
                                onClick={() => {
                                    const email = `mailto:student@example.com?subject=Check-in%20Required&body=Dear%20${interventionModal.student?.name},%0D%0A%0D%0AI've%20noticed%20some%20concerns%20regarding%20your%20performance%20in%20${interventionModal.student?.className}.%0D%0A%0D%0AIdentified%20Issues:%0D%0A${interventionModal.student?.issues.map(i => `-%20${i}`).join('%0D%0A')}%0D%0A%0D%0ALet's%20schedule%20a%20meeting%20to%20discuss%20how%20we%20can%20help%20you%20succeed.%0D%0A%0D%0ABest%20regards`;
                                    window.location.href = email;
                                }}
                                className="w-full p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">Send Email</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Email student about concerns</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setMeetingForm({ show: true, date: '', time: '', notes: '' })}
                                className="w-full p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">Schedule Meeting</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Set up one-on-one discussion</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setActionPlanForm({ show: true, goals: '', resources: '', timeline: '', checkIns: '' })}
                                className="w-full p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">Create Action Plan</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Develop improvement strategy</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setVtuModal({ isOpen: true, student: interventionModal.student })}
                                className="w-full p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                        <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">VTU Performance Analysis</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">View detailed SGPA & grades</p>
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Performance Stats */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Grade Average</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {interventionModal.student?.gradePercentage?.toFixed(1)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Attendance</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {interventionModal.student?.attendancePercentage?.toFixed(1)}%
                                </p>
                            </div>
                        </div>

                        {/* Meeting Scheduler Form */}
                        {meetingForm.show && (
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-4">
                                <div className="flex items-center justify-between">
                                    <h5 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Schedule Meeting
                                    </h5>
                                    <button
                                        onClick={() => setMeetingForm({ show: false, date: '', time: '', notes: '' })}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={meetingForm.date}
                                            onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                                            className="input-field w-full text-sm"
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                                        <input
                                            type="time"
                                            value={meetingForm.time}
                                            onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                                            className="input-field w-full text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meeting Notes</label>
                                    <textarea
                                        value={meetingForm.notes}
                                        onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                                        placeholder="Topics to discuss, objectives, etc."
                                        rows={3}
                                        className="input-field w-full text-sm"
                                    />
                                </div>

                                <button
                                    onClick={handleScheduleMeeting}
                                    disabled={!meetingForm.date || !meetingForm.time}
                                    className="w-full btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm Meeting
                                </button>
                            </div>
                        )}

                        {/* Action Plan Form */}
                        {actionPlanForm.show && (
                            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg space-y-4">
                                <div className="flex items-center justify-between">
                                    <h5 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Create Action Plan
                                    </h5>
                                    <button
                                        onClick={() => setActionPlanForm({ show: false, goals: '', resources: '', timeline: '', checkIns: '' })}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goals</label>
                                    <textarea
                                        value={actionPlanForm.goals}
                                        onChange={(e) => setActionPlanForm({ ...actionPlanForm, goals: e.target.value })}
                                        placeholder="What should the student achieve? (e.g., Improve test scores to 70%+)"
                                        rows={2}
                                        className="input-field w-full text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resources Provided</label>
                                    <textarea
                                        value={actionPlanForm.resources}
                                        onChange={(e) => setActionPlanForm({ ...actionPlanForm, resources: e.target.value })}
                                        placeholder="Study materials, tutoring, extra practice, etc."
                                        rows={2}
                                        className="input-field w-full text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timeline</label>
                                    <input
                                        type="text"
                                        value={actionPlanForm.timeline}
                                        onChange={(e) => setActionPlanForm({ ...actionPlanForm, timeline: e.target.value })}
                                        placeholder="e.g., 4 weeks, by next exam"
                                        className="input-field w-full text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Check-in Schedule</label>
                                    <input
                                        type="text"
                                        value={actionPlanForm.checkIns}
                                        onChange={(e) => setActionPlanForm({ ...actionPlanForm, checkIns: e.target.value })}
                                        placeholder="e.g., Weekly meetings every Friday"
                                        className="input-field w-full text-sm"
                                    />
                                </div>

                                <button
                                    onClick={handleCreateActionPlan}
                                    disabled={!actionPlanForm.goals || !actionPlanForm.timeline}
                                    className="w-full btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Plan
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <VtuPerformanceModal 
                isOpen={vtuModal.isOpen} 
                onClose={() => setVtuModal({...vtuModal, isOpen: false})} 
                studentName={vtuModal.student?.name} 
                studentId={vtuModal.student?.id} 
                studentClass={vtuModal.student?.className} 
                currentSubjects={vtuModal.student?.currentSubjects} 
            />
        </div>
    );
}
