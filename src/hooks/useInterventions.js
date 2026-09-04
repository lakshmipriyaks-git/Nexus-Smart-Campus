import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export function useInterventions(user) {
    const [interventions, setInterventions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) {
            setInterventions([]);
            setLoading(false);
            return;
        }

        // For students, get interventions where they are the student
        // For teachers, get interventions they created
        const interventionsRef = collection(db, 'interventions');
        const interventionsQuery = user.role === 'student'
            ? query(interventionsRef, where('studentId', '==', user.id))
            : query(interventionsRef, where('teacherId', '==', user.id));

        const unsubscribe = onSnapshot(interventionsQuery, (snapshot) => {
            const interventionsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setInterventions(interventionsData);
            setLoading(false);
        }, (error) => {
            console.error('Error loading interventions:', error);
            setLoading(false);
        });

        return unsubscribe;
    }, [user]);

    return {
        interventions,
        loading
    };
}
