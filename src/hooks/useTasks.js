import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export const useTasks = (user) => {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        if (!user?.id) {
            setTasks([]);
            return;
        }

        const tasksRef = collection(db, 'users', user.id, 'tasks');
        const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
            const tasksData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTasks(tasksData);
        });

        return unsubscribe;
    }, [user]);

    const addTask = async (task) => {
        if (!user?.id) return;
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
