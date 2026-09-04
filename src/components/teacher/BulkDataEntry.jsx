import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Upload, Download, AlertCircle, CheckCircle2, FileSpreadsheet, Save } from 'lucide-react';
import { parseExcelForGrades, downloadGradeTemplate } from '../../utils/excelParser';
import SkeletonLoader from '../ui/SkeletonLoader';

export default function BulkDataEntry({ courseId, courseName }) {
    const { user } = useAuth();
    const {
        joinRequests,
        classes,
        courses,
        createAssessment,
        enterGrade
    } = useData();

    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState(null);
    const [parsing, setParsing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    const fileInputRef = useRef(null);

    // Get enrolled students
    const teacherClasses = classes.filter(c => 
        c.teacherId === user?.id || 
        courses.some(course => course.classId === c.id && course.teacherId === user?.id)
    );
    const classIds = teacherClasses.map(c => c.id);
    const enrolledStudents = joinRequests.filter(
        req => classIds.includes(req.classId) && req.status === 'approved'
    );

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError('');
        setSuccessMsg('');
        setParsedData(null);
        setParsing(true);

        try {
            const result = await parseExcelForGrades(selectedFile, enrolledStudents);
            setParsedData(result);
        } catch (err) {
            setError(err.message || 'Error parsing Excel file. Please ensure it follows the template format.');
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } finally {
            setParsing(false);
        }
    };

    const handleConfirmAndSave = async () => {
        if (!parsedData) return;

        setSaving(true);
        setError('');
        setSuccessMsg('');

        try {
            const { assessments, grades } = parsedData;

            // 1. Create all assessments first
            const assessmentMap = {}; // Maps originalColumn -> newly created assessmentId
            for (const meta of assessments) {
                const newAssessment = await createAssessment({
                    courseId,
                    courseName,
                    name: meta.name,
                    type: meta.type,
                    maxMarks: meta.maxMarks,
                    modulesCovered: []
                });
                
                if (newAssessment?.id) {
                    assessmentMap[meta.originalColumn] = newAssessment.id;
                } else {
                    throw new Error(`Failed to create assessment: ${meta.name}`);
                }
            }

            // 2. Enter grades
            const gradePromises = grades.map(g => {
                const assessmentId = assessmentMap[g.originalColumn];
                const meta = assessments.find(a => a.originalColumn === g.originalColumn);
                
                if (assessmentId && meta) {
                    return enterGrade(
                        assessmentId,
                        courseId,
                        g.studentId,
                        g.marksScored,
                        meta.maxMarks
                    );
                }
                return Promise.resolve();
            });

            await Promise.all(gradePromises);

            setSuccessMsg('Successfully created assessments and entered grades!');
            
            // Reset
            setFile(null);
            setParsedData(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err) {
            setError('Error saving data. Some assessments or grades may not have been saved.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const resetSelection = () => {
        setFile(null);
        setParsedData(null);
        setError('');
        setSuccessMsg('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Bulk Grade Entry
                    </CardTitle>
                    <Button 
                        onClick={downloadGradeTemplate}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download Template
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Upload Section */}
                {!parsedData && (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <div className="flex flex-col items-center gap-4">
                            <Upload className="h-10 w-10 text-gray-400" />
                            <div>
                                <p className="text-gray-700 dark:text-gray-300 font-medium">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Excel or CSV file (following the template format)
                                </p>
                            </div>
                            <Button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={parsing}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {parsing ? 'Parsing...' : 'Select File'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Error / Success Messages */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
                
                {successMsg && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
                        <p>{successMsg}</p>
                    </div>
                )}

                {/* Preview Section */}
                {parsedData && (
                    <div className="mt-6 space-y-6 animate-fadeIn">
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet className="h-8 w-8 text-green-600" />
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {file?.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Found {parsedData.assessments.length} assessments and {parsedData.grades.length} grade entries.
                                </p>
                            </div>
                        </div>

                        {/* Assessments Found */}
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                Assessments to be Created
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {parsedData.assessments.map((a, i) => (
                                    <div key={i} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <p className="font-semibold">{a.name}</p>
                                        <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            <span>Max: {a.maxMarks}</span>
                                            <span>•</span>
                                            <span className="capitalize">{a.type}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Warnings */}
                        {(parsedData.unmappedStudents.length > 0 || parsedData.invalidGrades.length > 0) && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg space-y-3">
                                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300 font-medium">
                                    <AlertCircle className="h-5 w-5" />
                                    Warnings (These will be skipped)
                                </div>
                                
                                {parsedData.unmappedStudents.length > 0 && (
                                    <div className="text-sm text-yellow-700 dark:text-yellow-400">
                                        <p className="font-semibold mb-1">Unmatched Students (Not found in course):</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {parsedData.unmappedStudents.slice(0, 5).map((u, i) => (
                                                <li key={i}>{u.name} (Row {u.rowNumber})</li>
                                            ))}
                                            {parsedData.unmappedStudents.length > 5 && (
                                                <li>...and {parsedData.unmappedStudents.length - 5} more</li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                {parsedData.invalidGrades.length > 0 && (
                                    <div className="text-sm text-yellow-700 dark:text-yellow-400">
                                        <p className="font-semibold mb-1">Invalid Grades (Exceeds max marks or NaN):</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {parsedData.invalidGrades.slice(0, 5).map((g, i) => (
                                                <li key={i}>{g.studentName} - {g.assessmentName}: {g.marksScored} (Max: {g.maxMarks})</li>
                                            ))}
                                            {parsedData.invalidGrades.length > 5 && (
                                                <li>...and {parsedData.invalidGrades.length - 5} more</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                onClick={handleConfirmAndSave}
                                disabled={saving || parsedData.assessments.length === 0}
                                className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving Data...' : 'Confirm & Save'}
                            </Button>
                            <Button
                                onClick={resetSelection}
                                disabled={saving}
                                variant="outline"
                                className="flex-1 md:flex-none"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
