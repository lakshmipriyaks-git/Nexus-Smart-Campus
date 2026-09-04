import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, getDocs, query, where, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export const useClasses = (user) => {
    const [classes, setClasses] = useState([]);
    const [joinRequests, setJoinRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load all classes in real-time
    useEffect(() => {
        if (!user?.id) {
            setClasses([]);
            setLoading(false);
            return;
        }

        const classesRef = collection(db, 'classes');

        let unsubscribe;
        try {
            unsubscribe = onSnapshot(
                classesRef,
                (snapshot) => {
                    const classesData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setClasses(classesData);
                    setLoading(false);
                },
                (error) => {
                    console.error('Classes listener error:', error);
                    toast.error(`Classes listener error: ${error.message}`);
                    setClasses([]);
                    setLoading(false);
                }
            );
        } catch (error) {
            console.error('Failed to set up classes listener:', error);
            setLoading(false);
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user?.id]);

    // Load join requests
    useEffect(() => {
        if (!user?.id || !user?.role) {
            setJoinRequests([]);
            return;
        }

        const requestsRef = collection(db, 'joinRequests');
        let q = requestsRef;

        // Students can only see their own requests
        if (user.role === 'student') {
            q = query(requestsRef, where('studentId', '==', user.id));
        }
        // Teachers can see all (or we could filter by their classes, but rules allow all for teachers)

        let unsubscribe;
        try {
            unsubscribe = onSnapshot(q, (snapshot) => {
                const requestsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setJoinRequests(requestsData);
            }, (error) => {
                console.error("Error listening to join requests:", error);
                toast.error(`Error loading join requests: ${error.message}`);
                setJoinRequests([]);
            });
        } catch (error) {
            console.error("Failed to set up join requests listener:", error);
            setJoinRequests([]);
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user?.id, user?.role]);

    const createClass = async (classData) => {
        if (!user?.id) return;
        try {
            const docRef = await addDoc(collection(db, 'classes'), {
                ...classData,
                teacherId: user.id,
                teacherName: user.name,
                ...(user.departmentId ? { departmentId: user.departmentId } : {}),
                createdAt: serverTimestamp()
            });
            toast.success('Class created successfully');
            return { id: docRef.id, ...classData };
        } catch (error) {
            console.error('Error creating class:', error);
            toast.error('Failed to create class');
        }
    };

    const requestJoinClass = async (classId, studentId, studentName) => {
        try {
            // Check if already requested
            const requestsRef = collection(db, 'joinRequests');
            const q = query(requestsRef, where('classId', '==', classId), where('studentId', '==', studentId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                toast.error('You have already requested to join this class');
                return false;
            }

            await addDoc(requestsRef, {
                classId,
                studentId,
                studentName,
                status: 'pending',
                date: new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp()
            });
            toast.success('Join request sent');
            return true;
        } catch (error) {
            console.error('Error requesting to join class:', error);
            toast.error('Failed to send join request');
            return false;
        }
    };

    const respondToJoinRequest = async (requestId, status) => {
        try {
            await updateDoc(doc(db, 'joinRequests', requestId), {
                status,
                updatedAt: serverTimestamp()
            });
            toast.success(`Request ${status}`);
        } catch (error) {
            console.error('Error responding to join request:', error);
            toast.error('Failed to respond to request');
        }
    };

    const deleteClass = async (classId) => {
        try {
            const batch = writeBatch(db);

            // Delete all join requests for this class
            const requestsRef = collection(db, 'joinRequests');
            const requestsQuery = query(requestsRef, where('classId', '==', classId));
            const requestsSnapshot = await getDocs(requestsQuery);
            requestsSnapshot.docs.forEach((d) => batch.delete(d.ref));

            // Delete the class itself
            batch.delete(doc(db, 'classes', classId));

            await batch.commit();
            toast.success('Class deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting class:', error);
            toast.error('Failed to delete class');
            return false;
        }
    };

    const removeStudentFromClass = async (classId, studentId) => {
        try {
            const batch = writeBatch(db);

            // 1. Find and delete join request (which links student to class)
            const requestsRef = collection(db, 'joinRequests');
            const q = query(requestsRef, where('classId', '==', classId), where('studentId', '==', studentId));
            const querySnapshot = await getDocs(q);

            querySnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            toast.success('Student removed from class');
            return true;
        } catch (error) {
            console.error('Error removing student from class:', error);
            toast.error('Failed to remove student');
            return false;
        }
    };

    return {
        classes,
        joinRequests,
        loading,
        createClass,
        deleteClass,
        requestJoinClass,
        respondToJoinRequest,
        removeStudentFromClass
    };
};
