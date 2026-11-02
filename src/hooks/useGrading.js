import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, getDocs, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { mockStore } from '../mock/mockStore';
import toast from 'react-hot-toast';

export const useGrading = (user) => {
    const [assessments, setAssessments] = useState([]);
    const [grades, setGrades] = useState([]);

    // Load assessments & grades
    useEffect(() => {
        if (!user?.id || !user?.role) {
            setAssessments([]);
            setGrades([]);
            return;
        }

        if (user.isDemo) {
            const unsubAssessments = mockStore.subscribe('assessments', (data) => {
                setAssessments(data || []);
            });
            const unsubGrades = mockStore.subscribe('grades', (data) => {
                const list = data || [];
                if (user.role === 'student') {
                    setGrades(list.filter(g => g.studentId === user.id));
                } else {
                    setGrades(list);
                }
            });

            return () => {
                unsubAssessments();
                unsubGrades();
            };
        }

        const assessmentsRef = collection(db, 'assessments');
        let unsub1;
        try {
            unsub1 = onSnapshot(assessmentsRef, (snapshot) => {
                const assessmentsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setAssessments(assessmentsData);
            }, () => setAssessments(mockStore.get('assessments')));
        } catch (e) {
            setAssessments(mockStore.get('assessments'));
        }

        const gradesRef = collection(db, 'grades');
        const q = user.role === 'student'
            ? query(gradesRef, where('studentId', '==', user.id))
            : gradesRef;
        let unsub2;
        try {
            unsub2 = onSnapshot(q, (snapshot) => {
                const gradesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setGrades(gradesData);
            }, () => {
                const list = mockStore.get('grades');
                setGrades(user.role === 'student' ? list.filter(g => g.studentId === user.id) : list);
            });
        } catch (e) {
            const list = mockStore.get('grades');
            setGrades(user.role === 'student' ? list.filter(g => g.studentId === user.id) : list);
        }

        return () => {
            if (unsub1) unsub1();
            if (unsub2) unsub2();
        };
    }, [user?.id, user?.role, user?.isDemo]);

    const calculateGradeLetter = (percentage) => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C';
        return 'F';
    };

    const createAssessment = async (assessmentData) => {
        if (user?.isDemo) {
            const newAssessment = mockStore.add('assessments', assessmentData);
            toast.success('Assessment created');
            return newAssessment;
        }

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
        if (user?.isDemo) {
            mockStore.update('assessments', assessmentId, updates);
            toast.success('Assessment updated');
            return;
        }

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
        if (user?.isDemo) {
            mockStore.remove('assessments', assessmentId);
            const allGrades = mockStore.get('grades');
            allGrades.filter(g => g.assessmentId === assessmentId).forEach(g => mockStore.remove('grades', g.id));
            toast.success('Assessment deleted');
            return;
        }

        try {
            await deleteDoc(doc(db, 'assessments', assessmentId));
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
        const percentage = Math.round((marksScored / maxMarks) * 100);
        const grade = calculateGradeLetter(percentage);

        if (user?.isDemo) {
            const existing = mockStore.get('grades').find(g => g.assessmentId === assessmentId && g.studentId === studentId);
            if (existing) {
                mockStore.update('grades', existing.id, { marksScored, maxMarks, percentage, grade });
                toast.success('Grade updated');
            } else {
                mockStore.add('grades', { assessmentId, courseId, studentId, marksScored, maxMarks, percentage, grade });
                toast.success('Grade entered');
            }
            return;
        }

        try {
            const gradesRef = collection(db, 'grades');
            const q = query(
                gradesRef,
                where('assessmentId', '==', assessmentId),
                where('studentId', '==', studentId)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
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
