import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { ClipboardList, Save, AlertCircle, Camera, Loader2, Upload } from 'lucide-react';
import { analyzeGradeSheet } from '../../services/gemini';
import SearchBar from '../ui/SearchBar';
import SkeletonLoader from '../ui/SkeletonLoader';

export default function GradeEntry({ courseId, courseName }) {
    const { user } = useAuth();
    const {
        assessments,
        grades,
        joinRequests,
        classes,
        courses,
        loading,
        enterGrade
    } = useData();

    const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
    const [studentGrades, setStudentGrades] = useState({});
    const [saving, setSaving] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const fileInputRef = useRef(null);

    const courseAssessments = assessments.filter(a => a.courseId === courseId);
    const selectedAssessment = courseAssessments.find(a => a.id === selectedAssessmentId);

    // Get students enrolled in courses for this class
    // Include classes where teacher owns OR has courses assigned
    const teacherClasses = classes.filter(c =>
        c.teacherId === user?.id ||
        courses.some(course => course.classId === c.id && course.teacherId === user?.id)
    );
    const classIds = teacherClasses.map(c => c.id);

    const enrolledStudents = joinRequests.filter(
        req => classIds.includes(req.classId) && req.status === 'approved'
    );

    // Filter students based on search query
    const filteredStudents = enrolledStudents.filter(student => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            student.studentName?.toLowerCase().includes(query) ||
            (student.studentUsn && student.studentUsn.toLowerCase().includes(query))
        );
    });

    // Load existing grades when assessment changes
    useEffect(() => {
        if (!selectedAssessmentId) {
            setStudentGrades({});
            return;
        }

        const assessmentGrades = grades.filter(g => g.assessmentId === selectedAssessmentId);
        const gradesMap = {};

        assessmentGrades.forEach(grade => {
            gradesMap[grade.studentId] = {
                marksScored: grade.marksScored,
                percentage: grade.percentage,
                grade: grade.grade
            };
        });

        setStudentGrades(gradesMap);
    }, [selectedAssessmentId, grades]);

    const handleMarksChange = (studentId, marks) => {
        if (!selectedAssessment) return;

        const marksScored = Number(marks);
        const maxMarks = selectedAssessment.maxMarks;

        if (marksScored > maxMarks) {
            toast.error(`Marks cannot exceed ${maxMarks}`);
            return;
        }

        const percentage = Math.round((marksScored / maxMarks) * 100);
        const grade = calculateGrade(percentage);

        setStudentGrades(prev => ({
            ...prev,
            [studentId]: {
                marksScored,
                percentage,
                grade
            }
        }));
    };

    const calculateGrade = (percentage) => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C';
        return 'F';
    };

    const handleScan = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setScanning(true);
        setMessage('Analyzing grade sheet... this may take a moment.');

        try {
            const extractedData = await analyzeGradeSheet(file);
            console.log("Extracted Data:", extractedData);

            let matchedCount = 0;
            const newGrades = { ...studentGrades };

            extractedData.forEach(item => {
                // Simple fuzzy match: check if extracted name contains student name or vice versa
                // In a real app, use a proper fuzzy matching library like fuse.js
                const student = enrolledStudents.find(s =>
                    s.studentName.toLowerCase().includes(item.studentName.toLowerCase()) ||
                    item.studentName.toLowerCase().includes(s.studentName.toLowerCase())
                );

                if (student) {
                    const marksScored = Number(item.marks);
                    if (!isNaN(marksScored) && marksScored <= selectedAssessment.maxMarks) {
                        const percentage = Math.round((marksScored / selectedAssessment.maxMarks) * 100);
                        const grade = calculateGrade(percentage);

                        newGrades[student.studentId] = {
                            marksScored,
                            percentage,
                            grade
                        };
                        matchedCount++;
                    }
                }
            });

            setStudentGrades(newGrades);
            setMessage(`Successfully matched ${matchedCount} students! Please review before saving.`);
        } catch (error) {
            console.error(error);
            setMessage('Error analyzing image. Please try again with a clearer photo.');
        } finally {
            setScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSaveAll = async () => {
        if (!selectedAssessmentId || !selectedAssessment) {
            setMessage('Please select an assessment');
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            const savePromises = Object.entries(studentGrades).map(([studentId, data]) => {
                if (data.marksScored !== undefined && data.marksScored !== '') {
                    return enterGrade(
                        selectedAssessmentId,
                        courseId,
                        studentId,
                        data.marksScored,
                        selectedAssessment.maxMarks
                    );
                }
                return null;
            }).filter(Boolean);

            await Promise.all(savePromises);
            setMessage('Grades saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error saving grades');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (courseAssessments.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-green-600" />
                        Grade Entry - {courseName}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500 text-center py-8">
                        No assessments available. Please create an assessment first.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Grade Entry - {courseName}
                    </CardTitle>
                    {selectedAssessmentId && (
                        <div>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleScan}
                            />
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={scanning}
                                variant="outline"
                                className="flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                            >
                                {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                {scanning ? 'Scanning...' : 'Scan Grade Sheet'}
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Assessment
                    </label>
                    <select
                        className="w-full md:w-1/2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={selectedAssessmentId}
                        onChange={(e) => setSelectedAssessmentId(e.target.value)}
                    >
                        <option value="">-- Select Assessment --</option>
                        {courseAssessments.map(assessment => (
                            <option key={assessment.id} value={assessment.id}>
                                {assessment.name} ({assessment.type}) - Max: {assessment.maxMarks}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedAssessmentId && (
                    <div className="mb-6">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search by student name or USN..."
                        />
                    </div>
                )}

                {selectedAssessmentId && (
                    <>
                        {loading ? (
                            <SkeletonLoader variant="table" count={1} />
                        ) : enrolledStudents.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                No students enrolled in your classes yet.
                            </p>
                        ) : (
                            <>
                                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Student & USN</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Marks Scored</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Max Marks</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Percentage</th>
                                                <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm">
                                            {filteredStudents.length === 0 && searchQuery ? (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                        No students found matching "{searchQuery}"
                                                    </td>
                                                </tr>
                                            ) : filteredStudents.map(student => {
                                                const studentGrade = studentGrades[student.studentId] || {};
                                                return (
                                                    <tr key={student.studentId} className="hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span>{student.studentName}</span>
                                                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                                                                    {student.studentUsn || '1KS21CS001'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={selectedAssessment.maxMarks}
                                                                className="w-24 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                                                                placeholder="0"
                                                                value={studentGrade.marksScored || ''}
                                                                onChange={(e) => handleMarksChange(student.studentId, e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                            {selectedAssessment.maxMarks}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {studentGrade.percentage !== undefined ? (
                                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                                    {studentGrade.percentage}%
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400 dark:text-gray-500">-</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {studentGrade.grade ? (
                                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${studentGrade.grade === 'A+' || studentGrade.grade === 'A' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                                                                    studentGrade.grade === 'B+' || studentGrade.grade === 'B' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                                                                        studentGrade.grade === 'C' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                                                                            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                                                    }`}>
                                                                    {studentGrade.grade}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-400 dark:text-gray-500">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 flex items-center gap-4">
                                    <Button
                                        onClick={handleSaveAll}
                                        disabled={saving}
                                        className="btn-primary bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {saving ? 'Saving...' : 'Save All Grades'}
                                    </Button>
                                    {message && (
                                        <span className={`text-sm font-medium animate-fadeIn ${message.includes('success') || message.includes('matched') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {message}
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
