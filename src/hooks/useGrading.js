import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, getDocs, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export const useGrading = (user) => {
    const [assessments, setAssessments] = useState([]);
    const [grades, setGrades] = useState([]);

    // Load assessments
    useEffect(() => {
        if (!user?.id || !user?.role) {
            setAssessments([]);
            return;
        }

        const assessmentsRef = collection(db, 'assessments');
        const unsubscribe = onSnapshot(assessmentsRef, (snapshot) => {
            const assessmentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAssessments(assessmentsData);
        });

        return unsubscribe;
    }, [user]);

    // Load grades
    useEffect(() => {
        if (!user?.id || !user?.role) {
            setGrades([]);
            return;
        }

        const gradesRef = collection(db, 'grades');
        // Students can only read their own grades; scope the query accordingly
        const q = user.role === 'student'
            ? query(gradesRef, where('studentId', '==', user.id))
            : gradesRef;
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const gradesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setGrades(gradesData);
        });

        return unsubscribe;
    }, [user?.id, user?.role]);

    const calculateGradeLetter = (percentage) => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C';
        return 'F';
    };

    const createAssessment = async (assessmentData) => {
        try {
            const docRef = await addDoc(collection(db, 'assessments'), {
                ...assessmentData,
                createdAt: serverTimestamp()
            });
            toast.success('Assessment created');
            return { id: docRef.id, ...assessmentData };
        } catch (error) {
            console.error('Error creating assessment:', error);
            toast.error('Failed to create assessment');
            return null;
        }
    };

    const updateAssessment = async (assessmentId, updates) => {
        try {
            await updateDoc(doc(db, 'assessments', assessmentId), {
                ...updates,
                updatedAt: serverTimestamp()
            });
            toast.success('Assessment updated');
        } catch (error) {
            console.error('Error updating assessment:', error);
            toast.error('Failed to update assessment');
        }
    };

    const deleteAssessment = async (assessmentId) => {
        try {
            // Delete assessment
            await deleteDoc(doc(db, 'assessments', assessmentId));

            // Delete all grades for this assessment
            const gradesRef = collection(db, 'grades');
            const q = query(gradesRef, where('assessmentId', '==', assessmentId));
            const querySnapshot = await getDocs(q);

            const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
            toast.success('Assessment deleted');
        } catch (error) {
            console.error('Error deleting assessment:', error);
            toast.error('Failed to delete assessment');
        }
    };

    const enterGrade = async (assessmentId, courseId, studentId, marksScored, maxMarks) => {
        try {
            const percentage = Math.round((marksScored / maxMarks) * 100);
            const grade = calculateGradeLetter(percentage);

            const gradesRef = collection(db, 'grades');
            const q = query(
                gradesRef,
                where('assessmentId', '==', assessmentId),
                where('studentId', '==', studentId)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Update existing grade
                const docId = querySnapshot.docs[0].id;
                await updateDoc(doc(db, 'grades', docId), {
                    marksScored,
                    maxMarks,
                    percentage,
                    grade,
                    updatedAt: serverTimestamp()
                });
                toast.success('Grade updated');
            } else {
                // Create new grade
                await addDoc(gradesRef, {
                    assessmentId,
                    courseId,
                    studentId,
                    marksScored,
                    maxMarks,
                    percentage,
                    grade,
                    createdAt: serverTimestamp()
                });
                toast.success('Grade entered');
            }
        } catch (error) {
            console.error('Error entering grade:', error);
            toast.error('Failed to enter grade');
        }
    };

    const getCourseGrades = (courseId) => {
        return grades.filter(g => g.courseId === courseId);
    };

    const getStudentCourseGrades = (studentId, courseId) => {
        return grades.filter(g => g.studentId === studentId && g.courseId === courseId);
    };

    const calculateOverallGrade = (studentId, courseId) => {
        const studentGrades = getStudentCourseGrades(studentId, courseId);

        if (studentGrades.length === 0) {
            return { percentage: 0, grade: 'N/A', count: 0 };
        }

        const totalPercentage = studentGrades.reduce((sum, g) => sum + g.percentage, 0);
        const averagePercentage = Math.round(totalPercentage / studentGrades.length);
        const overallGrade = calculateGradeLetter(averagePercentage);

        return {
            percentage: averagePercentage,
            grade: overallGrade,
            count: studentGrades.length
        };
    };

    const getAssessmentAverages = (courseId) => {
        const courseAssessments = assessments.filter(a => a.courseId === courseId);
        const courseGradesData = getCourseGrades(courseId);

        return courseAssessments.map(assessment => {
            const assessmentGrades = courseGradesData.filter(g => g.assessmentId === assessment.id);

            if (assessmentGrades.length === 0) {
                return {
                    ...assessment,
                    name: assessment.title || assessment.name || 'Untitled Assessment',
                    title: assessment.title || assessment.name || 'Untitled Assessment',
                    average: 0,
                    count: 0
                };
            }

            const totalPercentage = assessmentGrades.reduce((sum, g) => sum + g.percentage, 0);
            const average = Math.round(totalPercentage / assessmentGrades.length);

            return {
                ...assessment,
                name: assessment.title || assessment.name || 'Untitled Assessment',
                title: assessment.title || assessment.name || 'Untitled Assessment',
                average,
                count: assessmentGrades.length
            };
        });
    };

    return {
        assessments,
        grades,
        createAssessment,
        updateAssessment,
        deleteAssessment,
        enterGrade,
        getCourseGrades,
        getStudentCourseGrades,
        calculateOverallGrade,
        getAssessmentAverages
    };
};
