import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export const useEvents = (user) => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        if (!user?.id) {
            setEvents([]);
            return;
        }

        const eventsRef = collection(db, 'users', user.id, 'events');
        const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
            const eventsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEvents(eventsData);
        });

        return unsubscribe;
    }, [user]);

    const addEvent = async (event) => {
        if (!user?.id) return;
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
