import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { mockStore } from '../mock/mockStore';
import toast from 'react-hot-toast';

export const useEvents = (user) => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (!user?.id) {
            setEvents([]);
            return;
        }

        if (user.isDemo) {
            const unsub = mockStore.subscribe('events', (data) => {
                setEvents(data || []);
            });
            return unsub;
        }

        const eventsRef = collection(db, 'users', user.id, 'events');
        let unsubscribe;
        try {
            unsubscribe = onSnapshot(eventsRef, (snapshot) => {
                const eventsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEvents(eventsData);
            }, () => setEvents(mockStore.get('events')));
        } catch (e) {
            setEvents(mockStore.get('events'));
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user?.id, user?.isDemo]);

    const addEvent = async (event) => {
        if (!user?.id) return;
        if (user.isDemo) {
            mockStore.add('events', {
                ...event,
                createdAt: new Date().toISOString()
            });
            toast.success('Event added successfully');
            return;
        }

        try {
            await addDoc(collection(db, 'users', user.id, 'events'), {
                ...event,
                createdAt: serverTimestamp()
            });
            toast.success('Event added successfully');
        } catch (error) {
            console.error('Error adding event:', error);
            toast.error('Failed to add event');
        }
    };

    const deleteEvent = async (eventId) => {
        if (!user?.id) return;
        if (user.isDemo) {
            mockStore.remove('events', eventId);
            toast.success('Event deleted');
            return;
        }

        try {
            await deleteDoc(doc(db, 'users', user.id, 'events', eventId));
            toast.success('Event deleted');
        } catch (error) {
            console.error('Error deleting event:', error);
            toast.error('Failed to delete event');
        }
    };

    return { events, addEvent, deleteEvent };
};
