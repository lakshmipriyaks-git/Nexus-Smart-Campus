import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, getDocs, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export const useAttendance = (user) => {
    const [attendance, setAttendance] = useState([]);

    useEffect(() => {
        if (!user?.id) {
            setAttendance([]);
            return;
        }

        const attendanceRef = collection(db, 'attendance');

        let unsubscribe;
        try {
            unsubscribe = onSnapshot(
                attendanceRef,
                (snapshot) => {
                    const attendanceData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setAttendance(attendanceData);
                },
                (error) => {
                    console.error('Attendance listener error:', error);
                    setAttendance([]);
                }
            );
        } catch (error) {
            console.error('Failed to set up attendance listener:', error);
            setAttendance([]);
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user?.id]); // More specific dependency

    const markAttendance = async (classId, courseId, date, records) => {
        try {
            const attendanceRef = collection(db, 'attendance');
            const q = query(
                attendanceRef,
                where('classId', '==', classId),
                where('courseId', '==', courseId),
                where('date', '==', date)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Update existing record
                const docId = querySnapshot.docs[0].id;
                await updateDoc(doc(db, 'attendance', docId), {
                    records,
                    updatedAt: serverTimestamp()
                });
                toast.success('Attendance updated');
            } else {
                // Create new record
                await addDoc(attendanceRef, {
                    classId,
                    courseId,
                    date,
                    records,
                    createdAt: serverTimestamp()
                });
                toast.success('Attendance marked');
            }
        } catch (error) {
            console.error('Error marking attendance:', error);
            toast.error('Failed to mark attendance');
        }
    };

    const getStudentAttendance = async (studentId) => {
        try {
            const attendanceRef = collection(db, 'attendance');
            const snapshot = await getDocs(attendanceRef);

            const studentRecords = [];
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.records && data.records[studentId]) {
                    studentRecords.push({
                        classId: data.classId,
                        date: data.date,
                        status: data.records[studentId]
                    });
                }
            });
            return studentRecords;
        } catch (error) {
            console.error('Error getting student attendance:', error);
            return [];
        }
    };

    return { attendance, markAttendance, getStudentAttendance };
};
