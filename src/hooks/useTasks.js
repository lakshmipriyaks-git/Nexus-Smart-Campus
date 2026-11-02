import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { mockStore } from '../mock/mockStore';
import toast from 'react-hot-toast';

export const useTasks = (user) => {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        if (!user?.id) {
            setTasks([]);
            return;
        }

        if (user.isDemo) {
            const unsub = mockStore.subscribe('tasks', (data) => {
                setTasks(data || []);
            });
            return unsub;
        }

        const tasksRef = collection(db, 'users', user.id, 'tasks');
        let unsubscribe;
        try {
            unsubscribe = onSnapshot(tasksRef, (snapshot) => {
                const tasksData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTasks(tasksData);
            }, (err) => {
                setTasks(mockStore.get('tasks'));
            });
        } catch (e) {
            setTasks(mockStore.get('tasks'));
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user?.id, user?.isDemo]);

    const addTask = async (task) => {
        if (!user?.id) return;
        if (user.isDemo) {
            mockStore.add('tasks', {
                ...task,
                status: 'todo',
                createdAt: new Date().toISOString()
            });
            toast.success('Task added successfully');
            return;
        }

        try {
            await addDoc(collection(db, 'users', user.id, 'tasks'), {
                ...task,
                status: 'todo',
                createdAt: serverTimestamp()
            });
            toast.success('Task added successfully');
        } catch (error) {
            console.error('Error adding task:', error);
            toast.error('Failed to add task');
        }
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        if (!user?.id) return;
        if (user.isDemo) {
            mockStore.update('tasks', taskId, { status: newStatus });
            return;
        }

        try {
            await updateDoc(doc(db, 'users', user.id, 'tasks', taskId), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error('Failed to update task');
        }
    };

    const deleteTask = async (taskId) => {
        if (!user?.id) return;
        if (user.isDemo) {
            mockStore.remove('tasks', taskId);
            toast.success('Task deleted');
            return;
        }

        try {
            await deleteDoc(doc(db, 'users', user.id, 'tasks', taskId));
            toast.success('Task deleted');
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Failed to delete task');
        }
    };

    return { tasks, addTask, updateTaskStatus, deleteTask };
};
