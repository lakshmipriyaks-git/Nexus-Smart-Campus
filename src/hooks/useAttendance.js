import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, getDocs, doc, setDoc, writeBatch, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { mockStore } from '../mock/mockStore';
import { sendCampusNotification } from '../services/notificationService';
import toast from 'react-hot-toast';

export const useAttendance = (user) => {
    const [attendance, setAttendance] = useState([]);

    useEffect(() => {
        if (!user?.id) {
            setAttendance([]);
            return;
        }

        if (user.isDemo) {
            const unsub = mockStore.subscribe('attendance', (data) => {
                const list = data || [];
                if (user.role === 'student') {
                    // Restrict in-memory demo data for students as well
                    setAttendance(list.filter(att => att.records && att.records[user.id]));
                } else {
                    setAttendance(list);
                }
            });
            return unsub;
        }

        let unsubscribe = null;
        let isMounted = true;

        const setupRoleAwareListener = async () => {
            try {
                const userRole = (user.role || '').toLowerCase();
                const attendanceRef = collection(db, 'attendance');

                if (userRole === 'student') {
                    // Student: strictly query own private subcollection users/{userId}/attendanceRecords
                    // Guarantees zero other students' data in the network payload
                    const studentRecordsRef = collection(db, 'users', user.id, 'attendanceRecords');

                    unsubscribe = onSnapshot(
                        studentRecordsRef,
                        (snapshot) => {
                            if (!isMounted) return;
                            const attendanceData = snapshot.docs.map(doc => {
                                const data = doc.data();
                                return {
                                    id: doc.id,
                                    sessionId: data.sessionId || doc.id,
                                    classId: data.classId,
                                    courseId: data.courseId,
                                    date: data.date,
                                    status: data.status,
                                    createdAt: data.createdAt,
                                    updatedAt: data.updatedAt,
                                    records: {
                                        [user.id]: data.status
                                    }
                                };
                            });
                            setAttendance(attendanceData);
                        },
                        (err) => {
                            console.warn('Student attendance subcollection fallback:', err.message);
                            if (isMounted) setAttendance(mockStore.get('attendance') || []);
                        }
                    );
                } else if (userRole === 'teacher' || userRole === 'staff') {
                    // Faculty: query only classes assigned to this teacher
                    const classesSnap = await getDocs(
                        query(collection(db, 'classes'), where('teacherId', '==', user.id))
                    );
                    const classIds = classesSnap.docs.map(d => d.id);

                    if (classIds.length === 0) {
                        if (isMounted) setAttendance([]);
                        return;
                    }

                    const qTeacher = query(
                        attendanceRef,
                        where('classId', 'in', classIds.slice(0, 30))
                    );

                    unsubscribe = onSnapshot(
                        qTeacher,
                        (snapshot) => {
                            if (!isMounted) return;
                            const attendanceData = snapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));
                            setAttendance(attendanceData);
                        },
                        (err) => {
                            console.warn('Faculty attendance listener fallback:', err.message);
                            if (isMounted) setAttendance(mockStore.get('attendance') || []);
                        }
                    );
                } else if (userRole === 'hod') {
                    // HOD: query classes belonging to HOD's verified department
                    const dept = user.departmentId || user.department || 'CSE';
                    const deptClassesSnap = await getDocs(
                        query(collection(db, 'classes'), where('departmentId', '==', dept))
                    );
                    const classIds = deptClassesSnap.docs.map(d => d.id);

                    if (classIds.length === 0) {
                        if (isMounted) setAttendance([]);
                        return;
                    }

                    const qHod = query(
                        attendanceRef,
                        where('classId', 'in', classIds.slice(0, 30))
                    );

                    unsubscribe = onSnapshot(
                        qHod,
                        (snapshot) => {
                            if (!isMounted) return;
                            const attendanceData = snapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));
                            setAttendance(attendanceData);
                        },
                        (err) => {
                            console.warn('HOD attendance listener fallback:', err.message);
                            if (isMounted) setAttendance(mockStore.get('attendance') || []);
                        }
                    );
                } else {
                    // Admin: administrative access
                    unsubscribe = onSnapshot(
                        attendanceRef,
                        (snapshot) => {
                            if (!isMounted) return;
                            const attendanceData = snapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));
                            setAttendance(attendanceData);
                        },
                        (err) => {
                            console.warn('Admin attendance listener fallback:', err.message);
                            if (isMounted) setAttendance(mockStore.get('attendance') || []);
                        }
                    );
                }
            } catch (error) {
                console.warn('Attendance setup error, falling back:', error.message);
                if (isMounted) setAttendance(mockStore.get('attendance') || []);
            }
        };

        setupRoleAwareListener();

        return () => {
            isMounted = false;
            if (unsubscribe) unsubscribe();
        };
    }, [user?.id, user?.role, user?.departmentId, user?.department, user?.isDemo]);

    const markAttendance = async (classId, courseId, date, records) => {
        if (user?.isDemo) {
            const allAtt = mockStore.get('attendance');
            const existing = allAtt.find(a => a.classId === classId && a.courseId === courseId && a.date === date);
            if (existing) {
                mockStore.update('attendance', existing.id, { records });
                toast.success('Attendance updated');
            } else {
                mockStore.add('attendance', { classId, courseId, date, records });
                toast.success('Attendance marked');
            }

            // Send notification to each student
            notifyStudents(classId, courseId, date, records);
            return;
        }

        try {
            const attendanceRef = collection(db, 'attendance');
            const q = query(
                attendanceRef,
                where('classId', '==', classId),
                where('courseId', '==', courseId),
                where('date', '==', date)
            );
            const querySnapshot = await getDocs(q);

            let activeSessionId;
            if (!querySnapshot.empty) {
                const docId = querySnapshot.docs[0].id;
                activeSessionId = docId;
                await updateDoc(doc(db, 'attendance', docId), {
                    records,
                    updatedAt: serverTimestamp()
                });
                mockStore.update('attendance', docId, { classId, courseId, date, records });
                toast.success('Attendance updated');
            } else {
                const docRef = await addDoc(attendanceRef, {
                    classId,
                    courseId,
                    date,
                    records,
                    teacherId: user?.id || '',
                    departmentId: user?.departmentId || user?.department || 'CSE',
                    createdAt: serverTimestamp()
                });
                activeSessionId = docRef.id;
                mockStore.add('attendance', {
                    id: docRef.id,
                    classId,
                    courseId,
                    date,
                    records,
                    teacherId: user?.id || '',
                    departmentId: user?.departmentId || user?.department || 'CSE'
                });
                toast.success('Attendance marked');
            }

            // Idempotent fan-out to each marked student's attendanceRecords subcollection
            try {
                let batch = writeBatch(db);
                let batchCount = 0;
                for (const [studentId, status] of Object.entries(records || {})) {
                    const studentDocRef = doc(db, 'users', studentId, 'attendanceRecords', activeSessionId);
                    batch.set(studentDocRef, {
                        sessionId: activeSessionId,
                        classId,
                        courseId,
                        date,
                        status,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                    batchCount++;
                    if (batchCount >= 400) {
                        await batch.commit();
                        batch = writeBatch(db);
                        batchCount = 0;
                    }
                }
                if (batchCount > 0) {
                    await batch.commit();
                }
            } catch (fanOutErr) {
                console.warn('Attendance projection fan-out error:', fanOutErr.message);
            }

            // Send real-time notification to each student
            notifyStudents(classId, courseId, date, records);
        } catch (error) {
            console.error('Error marking attendance in Firestore, falling back to local store:', error);
            const allAtt = mockStore.get('attendance');
            const existing = allAtt.find(a => a.classId === classId && a.courseId === courseId && a.date === date);
            if (existing) {
                mockStore.update('attendance', existing.id, { records });
            } else {
                mockStore.add('attendance', {
                    id: `att_${Date.now()}`,
                    classId,
                    courseId,
                    date,
                    records,
                    teacherId: user?.id || '',
                    departmentId: user?.departmentId || user?.department || 'CSE'
                });
            }
            toast.success('Attendance recorded');
            notifyStudents(classId, courseId, date, records);
        }
    };

    const notifyStudents = (classId, courseId, date, records) => {
        if (!records) return;
        Object.entries(records).forEach(([studentId, status]) => {
            sendCampusNotification({
                title: `Attendance Marked: ${status.toUpperCase()}`,
                message: `Your attendance was recorded as ${status} on ${date}.`,
                type: 'attendance_marked',
                targetUserId: studentId,
                actorName: user?.name || 'Faculty',
                actorRole: user?.role || 'teacher',
                metadata: { classId, courseId, date, status }
            }).catch(() => {});
        });
    };

    const getStudentAttendance = (studentId, courseId = null) => {
        // Enforce student ownership: student can only query their own attendance records
        const targetStudentId = (user?.role === 'student' && user?.id) ? user.id : studentId;
        const sourceData = user?.isDemo ? mockStore.get('attendance') : (attendance.length > 0 ? attendance : mockStore.get('attendance'));
        const studentRecords = [];
        sourceData.forEach(item => {
            if (courseId && item.courseId !== courseId) return;
            if (item.records && item.records[targetStudentId]) {
                studentRecords.push({
                    id: item.id,
                    classId: item.classId,
                    courseId: item.courseId,
                    date: item.date,
                    status: item.records[targetStudentId]
                });
            }
        });
        return studentRecords;
    };

    return { attendance, markAttendance, getStudentAttendance };
};
