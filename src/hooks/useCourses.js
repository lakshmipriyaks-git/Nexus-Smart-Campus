import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export const useCourses = (user) => {
    const [courses, setCourses] = useState([]);
    const [announcements, setAnnouncements] = useState([]);

    // Load courses based on user role
    useEffect(() => {
        if (!user?.id) {
            setCourses([]);
            return;
        }

        const coursesRef = collection(db, 'courses');

        // For teachers, filter by teacherId
        let coursesQuery;
        if (user.role === 'teacher') {
            coursesQuery = query(coursesRef, where('teacherId', '==', user.id));
        } else {
            // For students, load all courses (they'll be filtered by joined classes later)
            coursesQuery = coursesRef;
        }

        const unsubscribe = onSnapshot(coursesQuery, (snapshot) => {
            const coursesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCourses(coursesData);
        });

        return unsubscribe;
    }, [user]);

    // Load announcements
    useEffect(() => {
        if (!user?.id) {
            setAnnouncements([]);
            return;
        }

        const announcementsRef = collection(db, 'announcements');
        const unsubscribe = onSnapshot(announcementsRef, (snapshot) => {
            const announcementsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAnnouncements(announcementsData);
        });

        return unsubscribe;
    }, [user]);

    const createCourse = async (courseData) => {
        try {
            const docRef = await addDoc(collection(db, 'courses'), {
                ...courseData,
                createdAt: serverTimestamp()
            });
            toast.success('Course created successfully');
            return { id: docRef.id, ...courseData };
        } catch (error) {
            console.error('Error creating course:', error);
            toast.error('Failed to create course');
        }
    };

    const deleteCourse = async (courseId, deleteAssessment) => {
        // Note: deleteAssessment is passed as a dependency to avoid circular dependency
        // Ideally, we might want to structure this differently, but for now this works.
        // Or we can just import the logic if it was a standalone function.
        // Since deleteAssessment is in useGrading, we might need to handle this carefully.
        // For now, I'll assume deleteAssessment is passed in or we replicate the logic.
        // Actually, let's replicate the logic for independence or expect it as an argument.

        try {
            // Delete course
            await deleteDoc(doc(db, 'courses', courseId));

            // Delete associated resources
            const resourcesRef = collection(db, 'resources');
            const qResources = query(resourcesRef, where('courseId', '==', courseId));
            const resourcesSnapshot = await getDocs(qResources);
            const deleteResourcesPromises = resourcesSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deleteResourcesPromises);

            // Delete associated announcements
            const announcementsRef = collection(db, 'announcements');
            const qAnnouncements = query(announcementsRef, where('courseId', '==', courseId));
            const announcementsSnapshot = await getDocs(qAnnouncements);
            const deleteAnnouncementsPromises = announcementsSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deleteAnnouncementsPromises);

            // Delete associated assessments and grades
            const assessmentsRef = collection(db, 'assessments');
            const qAssessments = query(assessmentsRef, where('courseId', '==', courseId));
            const assessmentsSnapshot = await getDocs(qAssessments);

            // We need to delete grades for each assessment
            for (const assessmentDoc of assessmentsSnapshot.docs) {
                // Delete assessment
                await deleteDoc(doc(db, 'assessments', assessmentDoc.id));

                // Delete grades for this assessment
                const gradesRef = collection(db, 'grades');
                const qGrades = query(gradesRef, where('assessmentId', '==', assessmentDoc.id));
                const gradesSnapshot = await getDocs(qGrades);
                const deleteGradesPromises = gradesSnapshot.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(deleteGradesPromises);
            }

            toast.success('Course deleted successfully');
        } catch (error) {
            console.error('Error deleting course:', error);
            toast.error(`Failed to delete course: ${error.message}`);
        }
    };

    const addAnnouncement = async (announcement) => {
        try {
            await addDoc(collection(db, 'announcements'), {
                ...announcement,
                authorId: user?.id,
                author: user?.name || 'Unknown',
                date: new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp()
            });
            toast.success('Announcement posted');
        } catch (error) {
            console.error('Error adding announcement:', error);
            toast.error('Failed to post announcement');
        }
    };

    const getCourseAnnouncements = (courseId) => {
        return announcements.filter(a => a.courseId === courseId);
    };

    const globalAnnouncements = announcements
        .filter(a => a.isGlobal === true)
        .sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.() || 0);

    return {
        courses,
        announcements,
        globalAnnouncements,
        createCourse,
        deleteCourse,
        addAnnouncement,
        getCourseAnnouncements
    };
};
