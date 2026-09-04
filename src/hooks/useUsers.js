import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ROLES } from '../utils/constants';

export const useUsers = () => {
    const findTeacherByEmail = async (email) => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email), where('role', '==', ROLES.TEACHER));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error finding teacher:', error);
            return null;
        }
    };

    const usePlatformStats = (user) => {
        const [stats, setStats] = useState({
            teachers: 0,
            students: 0
        });
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            if (user?.role !== ROLES.HOD) {
                setLoading(false);
                return;
            }

            const usersRef = collection(db, 'users');

            const unsubscribe = onSnapshot(usersRef, (snapshot) => {
                let teacherCount = 0;
                let studentCount = 0;

                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (data.role === ROLES.TEACHER) teacherCount++;
                    if (data.role === ROLES.STUDENT) studentCount++;
                });

                setStats({
                    teachers: teacherCount,
                    students: studentCount
                });
                setLoading(false);
            }, (error) => {
                console.error("Error fetching platform stats:", error);
                setLoading(false);
            });

            return () => unsubscribe();
        }, [user]);

        return { stats, loading };
    };

    return { findTeacherByEmail, usePlatformStats };
};
