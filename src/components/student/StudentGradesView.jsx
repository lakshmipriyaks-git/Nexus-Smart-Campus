import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Award, TrendingUp } from 'lucide-react';
import StudentTrendChart from '../common/StudentTrendChart';

export function StudentGradesView() {
    const { user } = useAuth();
    const {
        courses,
        assessments,
        grades,
        joinRequests,
        classes,
        calculateOverallGrade
    } = useData();

    const [selectedCourseId, setSelectedCourseId] = useState('');

    // Get classes the student has joined
    const myJoinRequests = joinRequests.filter(
        req => req.studentId === user?.id && req.status === 'approved'
    );
    const myClassIds = myJoinRequests.map(req => req.classId);

    // Get courses in my classes
    const myCourses = courses.filter(c => myClassIds.includes(c.classId));

    // Get grades for selected course
    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    const myGrades = grades.filter(
        g => g.studentId === user?.id && g.courseId === selectedCourseId
    );

    // Get assessments for selected course with my grades
    const courseAssessments = assessments
        .filter(a => a.courseId === selectedCourseId)
        .map(assessment => {
            const grade = myGrades.find(g => g.assessmentId === assessment.id);
            return {
                ...assessment,
                myGrade: grade
            };
        });

    // Calculate overall for selected course
    const overallGrade = selectedCourseId
        ? calculateOverallGrade(user?.id, selectedCourseId)
        : null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    My Grades
                </CardTitle>
            </CardHeader>
            <CardContent>
                {myCourses.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        You haven't joined any classes yet. Join a class to see your grades.
                    </p>
                ) : (
                    <div className="space-y-6">
                        {/* Course Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Course
                            </label>
                            <select
                                className="input-field w-full md:w-1/2"
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                            >
                                <option value="">-- Select a Course --</option>
                                {myCourses.map(course => {
                                    const className = classes.find(c => c.id === course.classId)?.name;
                                    return (
                                        <option key={course.id} value={course.id}>
                                            {course.name} ({className})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {selectedCourseId && (
                            <>
                                {/* Performance Trend Chart */}
                                {courseAssessments.length >= 2 && (
                                    <StudentTrendChart
                                        grades={myGrades}
                                        assessments={assessments.filter(a => a.courseId === selectedCourseId)}
                                        studentName="You"
                                    />
                                )}

                                {/* Overall Grade Card */}
                                {overallGrade && overallGrade.count > 0 && (
                                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Overall Grade</p>
                                                <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-200 mt-1">
                                                    {overallGrade.grade}
                                                </p>
                                                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                                                    {overallGrade.percentage}% average
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <TrendingUp className="h-12 w-12 text-yellow-600 dark:text-yellow-400 opacity-80" />
                                                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2 font-medium">
                                                    {overallGrade.count} test{overallGrade.count !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Assessment Grades */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        Test Scores for {selectedCourse?.name}
                                    </h3>

                                    {courseAssessments.length === 0 ? (
                                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                            No assessments available for this course yet.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {courseAssessments.map(assessment => (
                                                <div
                                                    key={assessment.id}
                                                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-200 backdrop-blur-sm shadow-sm"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                                {assessment.name}
                                                            </h4>
                                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${assessment.type === 'internal'
                                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                                                }`}>
                                                                {assessment.type === 'internal' ? 'Internal' : 'External'}
                                                            </span>
                                                        </div>
                                                        {assessment.modulesCovered && assessment.modulesCovered.length > 0 && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                Modules: {assessment.modulesCovered.join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        {assessment.myGrade ? (
                                                            <>
                                                                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                                    {assessment.myGrade.marksScored}/{assessment.maxMarks}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1 justify-end">
                                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                        {assessment.myGrade.percentage}%
                                                                    </span>
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${assessment.myGrade.grade === 'A+' || assessment.myGrade.grade === 'A'
                                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                                        : assessment.myGrade.grade === 'B+' || assessment.myGrade.grade === 'B'
                                                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                                                            : assessment.myGrade.grade === 'C'
                                                                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                                                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                                                        }`}>
                                                                        {assessment.myGrade.grade}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="text-gray-400 dark:text-gray-500">
                                                                <p className="text-sm">Not graded yet</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
