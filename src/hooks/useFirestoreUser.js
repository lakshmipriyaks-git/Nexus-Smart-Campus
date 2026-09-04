import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export function useFirestoreUser(authUserId) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authUserId) {
            setUserData(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        console.log('useFirestoreUser: Subscribing to user profile', authUserId);

        const unsubscribe = onSnapshot(
            doc(db, 'users', authUserId),
            (docSnapshot) => {
                console.log('useFirestoreUser: Snapshot received');
                console.log('useFirestoreUser: Document exists?', docSnapshot.exists());
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    console.log('useFirestoreUser: User data:', data);
                    console.log('useFirestoreUser: Role field:', data?.role);
                    setUserData(data);
                } else {
                    console.log('useFirestoreUser: No document found');
                    // Profile might not exist yet (race condition during signup) or deleted
                    setUserData(null);
                }
                setLoading(false);
            },
            (err) => {
                console.error('useFirestoreUser Error:', err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [authUserId]);

    return { userData, loading, error };
}
