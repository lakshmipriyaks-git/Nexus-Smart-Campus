import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export function useInterventions(user) {
    const [interventions, setInterventions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user?.id) {
            setInterventions([]);
            setLoading(false);
            return;
        }

        if (user.isDemo) {
            setInterventions([]);
            setLoading(false);
            return;
        }

        const interventionsRef = collection(db, 'interventions');
        const interventionsQuery = user.role === 'student'
            ? query(interventionsRef, where('studentId', '==', user.id))
            : query(interventionsRef, where('teacherId', '==', user.id));

        let unsubscribe;
        try {
            unsubscribe = onSnapshot(interventionsQuery, (snapshot) => {
                const interventionsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setInterventions(interventionsData);
                setLoading(false);
            }, () => {
                setInterventions([]);
                setLoading(false);
            });
        } catch (e) {
            setInterventions([]);
            setLoading(false);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user?.id, user?.role, user?.isDemo]);

    return {
        interventions,
        loading
    };
}
