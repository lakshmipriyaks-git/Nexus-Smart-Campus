import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, getDocs, query, where, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { mockStore } from '../mock/mockStore';
import toast from 'react-hot-toast';

import { sendCampusNotification } from '../services/notificationService';

export const useClasses = (user) => {
    const [classes, setClasses] = useState([]);
    const [joinRequests, setJoinRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const isDemo = user?.isDemo || !user?.id;

    // Load all classes in real-time
    useEffect(() => {
        if (!user?.id) {
            setClasses([]);
            setLoading(false);
            return;
        }

        if (user.isDemo) {
            const unsubClasses = mockStore.subscribe('classes', (data) => {
                setClasses(data || []);
                setLoading(false);
            });
            const unsubReqs = mockStore.subscribe('joinRequests', (data) => {
                const reqs = data || [];
                if (user.role === 'student') {
                    setJoinRequests(reqs.filter(r => r.studentId === user.id));
                } else {
                    setJoinRequests(reqs);
                }
            });

            return () => {
                unsubClasses();
                unsubReqs();
            };
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
                    console.warn('Classes listener fallback to mockStore:', error.message);
                    setClasses(mockStore.get('classes'));
                    setLoading(false);
                }
            );
        } catch (error) {
            setClasses(mockStore.get('classes'));
            setLoading(false);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user?.id, user?.isDemo, user?.role]);

    // Load join requests for Firebase mode
    useEffect(() => {
        if (!user?.id || !user?.role || user.isDemo) return;

        const requestsRef = collection(db, 'joinRequests');
        let q = requestsRef;
        if (user.role === 'student') {
            q = query(requestsRef, where('studentId', '==', user.id));
        }

        let unsubscribe;
        try {
            unsubscribe = onSnapshot(q, (snapshot) => {
                const requestsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setJoinRequests(requestsData);
            }, (error) => {
                console.warn("Join requests listener fallback:", error.message);
                const reqs = mockStore.get('joinRequests');
                setJoinRequests(user.role === 'student' ? reqs.filter(r => r.studentId === user.id) : reqs);
            });
        } catch (error) {
            const reqs = mockStore.get('joinRequests');
            setJoinRequests(user.role === 'student' ? reqs.filter(r => r.studentId === user.id) : reqs);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user?.id, user?.role, user?.isDemo]);

    const createClass = async (classData) => {
        if (!user?.id) return;
        const deptId = classData.departmentId || user.departmentId || user.department || 'CSE';
        
        // Also add to mockStore so local updates are immediate
        const mockNewClass = mockStore.add('classes', {
            ...classData,
            teacherId: user.id,
            teacherName: user.name,
            departmentId: deptId,
            studentCount: 0
        });

        // Trigger notification to HOD
        sendCampusNotification({
            title: 'New Class Created',
            message: `Staff ${user.name} created class "${classData.name}" (${classData.section || 'General'}) under ${deptId}.`,
            type: 'class_created',
            departmentId: deptId,
            targetRole: 'hod',
            actorName: user.name,
            actorRole: user.role || 'staff',
            metadata: {
                classId: mockNewClass.id,
                className: classData.name,
                section: classData.section,
                teacherId: user.id,
                teacherName: user.name,
                departmentId: deptId
            }
        });

        if (user.isDemo) {
            toast.success('Class created successfully');
            return mockNewClass;
        }

        try {
            const docRef = await addDoc(collection(db, 'classes'), {
                ...classData,
                teacherId: user.id,
                teacherName: user.name,
                departmentId: deptId,
                studentCount: 0,
                createdAt: serverTimestamp()
            });
            toast.success('Class created successfully');
            return { id: docRef.id, ...classData, departmentId: deptId };
        } catch (error) {
            console.error('Error creating class:', error);
            toast.error('Failed to create class in cloud database, saved locally');
            return mockNewClass;
        }
    };

    const requestJoinClass = async (classId, studentId, studentName, studentUsn = null) => {
        const targetClass = classes.find(c => c.id === classId);
        const deptId = targetClass?.departmentId || user?.departmentId || 'CSE';
        const sName = studentName || user?.name || 'Student';
        const sUsn = studentUsn || user?.usn || (typeof localStorage !== 'undefined' ? localStorage.getItem('nexus_student_usn') : null) || '1KS21CS001';

        if (user?.isDemo) {
            const reqs = mockStore.get('joinRequests');
            const already = reqs.find(r => r.classId === classId && r.studentId === studentId);
            if (already) {
                toast.error('You have already requested to join this class');
                return false;
            }
            mockStore.add('joinRequests', {
                classId,
                className: targetClass?.name || 'Class',
                departmentId: deptId,
                teacherId: targetClass?.teacherId,
                teacherName: targetClass?.teacherName,
                studentId,
                studentName: sName,
                studentUsn: sUsn,
                status: 'pending',
                date: new Date().toISOString().split('T')[0]
            });

            // Notify HOD and Teacher
            sendCampusNotification({
                title: 'Student Joined Class',
                message: `Student ${sName} (USN: ${sUsn}) requested to join class "${targetClass?.name || 'Class'}" under ${targetClass?.teacherName || 'Staff'} (${deptId}).`,
                type: 'student_joined',
                departmentId: deptId,
                targetRole: 'hod',
                actorName: sName,
                actorRole: 'student',
                metadata: {
                    classId,
                    className: targetClass?.name,
                    studentId,
                    studentName: sName,
                    studentUsn: sUsn,
                    teacherId: targetClass?.teacherId,
                    teacherName: targetClass?.teacherName,
                    departmentId: deptId
                }
            });

            toast.success('Join request sent');
            return true;
        }

        try {
            const requestsRef = collection(db, 'joinRequests');
            const q = query(requestsRef, where('classId', '==', classId), where('studentId', '==', studentId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                toast.error('You have already requested to join this class');
                return false;
            }

            await addDoc(requestsRef, {
                classId,
                className: targetClass?.name || 'Class',
                departmentId: deptId,
                teacherId: targetClass?.teacherId,
                teacherName: targetClass?.teacherName,
                studentId,
                studentName: sName,
                studentUsn: sUsn,
                status: 'pending',
                date: new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp()
            });

            // Always also sync to mockStore
            mockStore.add('joinRequests', {
                classId,
                className: targetClass?.name || 'Class',
                departmentId: deptId,
                teacherId: targetClass?.teacherId,
                teacherName: targetClass?.teacherName,
                studentId,
                studentName: sName,
                studentUsn: sUsn,
                status: 'pending',
                date: new Date().toISOString().split('T')[0]
            });

            // Notify HOD
            sendCampusNotification({
                title: 'Student Joined Class',
                message: `Student ${sName} (USN: ${sUsn}) requested to join class "${targetClass?.name || 'Class'}" under ${targetClass?.teacherName || 'Staff'} (${deptId}).`,
                type: 'student_joined',
                departmentId: deptId,
                targetRole: 'hod',
                actorName: sName,
                actorRole: 'student',
                metadata: {
                    classId,
                    className: targetClass?.name,
                    studentId,
                    studentName: sName,
                    studentUsn: sUsn,
                    teacherId: targetClass?.teacherId,
                    teacherName: targetClass?.teacherName,
                    departmentId: deptId
                }
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
        const req = joinRequests.find(r => r.id === requestId) || (mockStore.get('joinRequests') || []).find(r => r.id === requestId);
        const targetClass = classes.find(c => c.id === req?.classId);
        const deptId = targetClass?.departmentId || req?.departmentId || 'CSE';

        mockStore.update('joinRequests', requestId, { status });

        // Update class student count if approved
        if (status === 'approved' && targetClass) {
            const currentCount = (targetClass.studentCount || 0) + 1;
            mockStore.update('classes', targetClass.id, { studentCount: currentCount });
        }

        // Notify Student and HOD
        if (status === 'approved') {
            sendCampusNotification({
                title: 'Class Join Approved',
                message: `Student ${req?.studentName || 'Student'} (USN: ${req?.studentUsn || 'N/A'}) was approved into class "${targetClass?.name || 'Class'}" (${deptId}).`,
                type: 'student_joined',
                departmentId: deptId,
                targetRole: 'hod',
                metadata: {
                    classId: req?.classId,
                    className: targetClass?.name,
                    studentId: req?.studentId,
                    studentName: req?.studentName,
                    studentUsn: req?.studentUsn,
                    departmentId: deptId
                }
            });

            if (req?.studentId) {
                sendCampusNotification({
                    title: 'Joined Class Successfully',
                    message: `You are now enrolled in "${targetClass?.name || 'Class'}" taught by ${targetClass?.teacherName || 'Faculty'}.`,
                    type: 'student_approved',
                    departmentId: deptId,
                    targetUserId: req.studentId,
                    targetRole: 'student',
                    metadata: { classId: req?.classId, className: targetClass?.name }
                });
            }
        }

        if (user?.isDemo) {
            toast.success(`Request ${status}`);
            return;
        }

        try {
            await updateDoc(doc(db, 'joinRequests', requestId), {
                status,
                updatedAt: serverTimestamp()
            });

            if (status === 'approved' && targetClass?.id) {
                const approvedCount = joinRequests.filter(r => r.classId === targetClass.id && (r.status === 'approved' || r.id === requestId)).length;
                try {
                    await updateDoc(doc(db, 'classes', targetClass.id), {
                        studentCount: approvedCount
                    });
                } catch (e) {
                    // ignore
                }
            }

            toast.success(`Request ${status}`);
        } catch (error) {
            console.error('Error responding to join request:', error);
            toast.error('Saved locally');
        }
    };

    const deleteClass = async (classId) => {
        if (user?.isDemo) {
            mockStore.remove('classes', classId);
            toast.success('Class deleted successfully');
            return true;
        }

        try {
            const batch = writeBatch(db);
            const requestsRef = collection(db, 'joinRequests');
            const requestsQuery = query(requestsRef, where('classId', '==', classId));
            const requestsSnapshot = await getDocs(requestsQuery);
            requestsSnapshot.docs.forEach((d) => batch.delete(d.ref));
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
        if (user?.isDemo) {
            const reqs = mockStore.get('joinRequests');
            const match = reqs.find(r => r.classId === classId && r.studentId === studentId);
            if (match) mockStore.remove('joinRequests', match.id);
            toast.success('Student removed from class');
            return true;
        }

        try {
            const batch = writeBatch(db);
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
