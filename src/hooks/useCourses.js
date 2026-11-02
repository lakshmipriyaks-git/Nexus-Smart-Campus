import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { mockStore } from '../mock/mockStore';
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

        if (user.isDemo) {
            const unsubCourses = mockStore.subscribe('courses', (data) => {
                const list = data || [];
                if (user.role === 'teacher') {
                    setCourses(list.filter(c => c.teacherId === user.id));
                } else {
                    setCourses(list);
                }
            });
            const unsubAnnouncements = mockStore.subscribe('announcements', (data) => {
                setAnnouncements(data || []);
            });

            return () => {
                unsubCourses();
                unsubAnnouncements();
            };
        }

        const coursesRef = collection(db, 'courses');
        let coursesQuery;
        if (user.role === 'teacher') {
            coursesQuery = query(coursesRef, where('teacherId', '==', user.id));
        } else {
            coursesQuery = coursesRef;
        }

        let unsubscribe;
        try {
            unsubscribe = onSnapshot(coursesQuery, (snapshot) => {
                const coursesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCourses(coursesData);
            }, (err) => {
                console.warn('Courses listener fallback:', err.message);
                setCourses(mockStore.get('courses'));
            });
        } catch (e) {
            setCourses(mockStore.get('courses'));
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user?.id, user?.isDemo, user?.role]);

    // Load announcements
    useEffect(() => {
        if (!user?.id || user.isDemo) return;

        const announcementsRef = collection(db, 'announcements');
        let unsubscribe;
        try {
            unsubscribe = onSnapshot(announcementsRef, (snapshot) => {
                const announcementsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setAnnouncements(announcementsData);
            }, (err) => {
                setAnnouncements(mockStore.get('announcements'));
            });
        } catch (e) {
            setAnnouncements(mockStore.get('announcements'));
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user?.id, user?.isDemo]);

    const createCourse = async (courseData) => {
        if (user?.isDemo) {
            const newCourse = mockStore.add('courses', {
                ...courseData,
                teacherId: user.id,
                teacherName: user.name
            });
            toast.success('Course created successfully');
            return newCourse;
        }

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

    const deleteCourse = async (courseId) => {
        if (user?.isDemo) {
            mockStore.remove('courses', courseId);
            toast.success('Course deleted successfully');
            return;
        }

        try {
            await deleteDoc(doc(db, 'courses', courseId));
            toast.success('Course deleted successfully');
        } catch (error) {
            console.error('Error deleting course:', error);
            toast.error(`Failed to delete course: ${error.message}`);
        }
    };

    const addAnnouncement = async (announcement) => {
        if (user?.isDemo) {
            mockStore.add('announcements', {
                ...announcement,
                authorId: user.id,
                author: user.name,
                authorRole: user.role === 'hod' ? 'HOD' : 'Teacher',
                date: new Date().toISOString().split('T')[0]
            });
            toast.success('Announcement posted');
            return;
        }

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
        .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

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
