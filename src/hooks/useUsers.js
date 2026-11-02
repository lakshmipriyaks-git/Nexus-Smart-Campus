import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ROLES } from '../utils/constants';
import { mockStore } from '../mock/mockStore';

export const useUsers = () => {
    const findTeacherByEmail = async (email) => {
        try {
            const users = mockStore.get('users');
            const match = users.find(u => u.email === email && u.role === ROLES.TEACHER);
            if (match) return match;

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
        const [stats, setStats] = useState({ teachers: 0, students: 0 });
        const [loading, setLoading] = useState(false);

        useEffect(() => {
            if (user?.role !== ROLES.HOD) {
                setLoading(false);
                return;
            }

            if (user.isDemo) {
                const users = mockStore.get('users');
                let teacherCount = 0;
                let studentCount = 0;
                users.forEach(u => {
                    if (u.role === ROLES.TEACHER) teacherCount++;
                    if (u.role === ROLES.STUDENT) studentCount++;
                });
                setStats({ teachers: teacherCount, students: studentCount });
                setLoading(false);
                return;
            }

            const usersRef = collection(db, 'users');
            let unsubscribe;
            try {
                unsubscribe = onSnapshot(usersRef, (snapshot) => {
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
                }, () => {
                    setStats({ teachers: 0, students: 0 });
                    setLoading(false);
                });
            } catch (e) {
                setStats({ teachers: 0, students: 0 });
                setLoading(false);
            }

            return () => {
                if (unsubscribe) unsubscribe();
            };
        }, [user]);

        return { stats, loading };
    };

    return { findTeacherByEmail, usePlatformStats };
};
