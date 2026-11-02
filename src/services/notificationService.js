import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { mockStore } from '../mock/mockStore';

const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Send a campus notification across both Firestore and mockStore.
 * 
 * @param {Object} param0
 * @param {string} param0.title - Title of the notification
 * @param {string} param0.message - Detailed notification message
 * @param {string} param0.type - 'class_created' | 'student_joined' | 'staff_registered' | 'staff_approved' | 'staff_rejected' | 'announcement' | 'general'
 * @param {string} [param0.departmentId] - e.g. 'CSE', 'ECE', or 'ALL'
 * @param {string} [param0.targetRole] - 'hod' | 'teacher' | 'student' | 'all'
 * @param {string} [param0.targetUserId] - Specific user ID if personal notification
 * @param {string} [param0.actorName] - Name of actor (e.g. staff name, student name)
 * @param {string} [param0.actorRole] - Role of actor
 * @param {Object} [param0.metadata] - Extra context (classId, className, teacherId, etc.)
 */
export const sendCampusNotification = async ({
    title,
    message,
    type = 'general',
    departmentId = 'CSE',
    targetRole = 'all',
    targetUserId = null,
    actorName = 'System',
    actorRole = 'system',
    metadata = {}
}) => {
    const timestamp = new Date().toISOString();
    const notificationPayload = {
        title,
        message,
        type,
        departmentId: departmentId || 'CSE',
        targetRole,
        targetUserId,
        actorName,
        actorRole,
        metadata,
        isRead: false,
        createdAt: timestamp,
        timestamp
    };

    // 1. Always save in mockStore so in-memory & local state sync immediately
    let mockResult = null;
    try {
        mockResult = mockStore.add('notifications', notificationPayload);
    } catch (e) {
        console.warn('Could not save notification to mockStore:', e);
    }

    // 2. Persist to Firestore if configured
    if (isFirebaseConfigured) {
        try {
            const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
                ...notificationPayload,
                createdAt: serverTimestamp()
            });
            return { id: docRef.id, ...notificationPayload };
        } catch (error) {
            console.warn('Could not persist notification to Firestore:', error.message);
        }
    }

    return mockResult || { id: `notif-${Date.now()}`, ...notificationPayload };
};
