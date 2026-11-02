import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, query, where, or, and } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { mockStore } from '../mock/mockStore';
import { ROLES } from '../utils/constants';

const READ_NOTIFS_KEY_PREFIX = 'nexus_read_notifications_';

export const useNotifications = (user) => {
    const [rawNotifications, setRawNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [readIds, setReadIds] = useState(() => {
        if (!user?.id) return new Set();
        try {
            const stored = localStorage.getItem(`${READ_NOTIFS_KEY_PREFIX}${user.id}`);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });

    // Update readIds if user changes
    useEffect(() => {
        if (!user?.id) {
            setReadIds(new Set());
            return;
        }
        try {
            const stored = localStorage.getItem(`${READ_NOTIFS_KEY_PREFIX}${user.id}`);
            setReadIds(stored ? new Set(JSON.parse(stored)) : new Set());
        } catch {
            setReadIds(new Set());
        }
    }, [user?.id]);

    const persistReadIds = (newSet) => {
        setReadIds(newSet);
        if (user?.id) {
            try {
                localStorage.setItem(
                    `${READ_NOTIFS_KEY_PREFIX}${user.id}`,
                    JSON.stringify(Array.from(newSet))
                );
            } catch (e) {
                console.warn('Could not save read notifications to localStorage:', e);
            }
        }
    };

    // Real-time listener for notifications
    useEffect(() => {
        if (!user?.id) {
            setRawNotifications([]);
            setLoading(false);
            return;
        }

        // Listener for mockStore
        const unsubMock = mockStore.subscribe('notifications', (data) => {
            if (!isFirebaseConfigured || user?.isDemo) {
                setRawNotifications(data || []);
                setLoading(false);
            }
        });

        let unsubFirestore = null;
        if (isFirebaseConfigured && !user?.isDemo) {
            try {
                const userRole = (user.role || '').toLowerCase();
                const allowedRoles = ['all'];
                if (userRole === 'student') {
                    allowedRoles.push('student');
                } else if (userRole === 'teacher' || userRole === 'staff') {
                    allowedRoles.push('teacher', 'staff');
                } else if (userRole === 'hod') {
                    allowedRoles.push('hod', 'teacher', 'staff');
                } else if (userRole) {
                    allowedRoles.push(userRole);
                }

                // Privacy-hardened query: restrict to personal notifications addressed to user.id
                // OR public announcements where targetUserId is null and targetRole matches allowed roles
                const notifsRef = collection(db, 'notifications');
                const notifsQuery = query(
                    notifsRef,
                    or(
                        where('targetUserId', '==', user.id),
                        and(
                            where('targetUserId', '==', null),
                            where('targetRole', 'in', allowedRoles)
                        )
                    )
                );

                unsubFirestore = onSnapshot(
                    notifsQuery,
                    (snapshot) => {
                        const items = snapshot.docs.map((d) => ({
                            id: d.id,
                            ...d.data()
                        }));
                        setRawNotifications(items);
                        setLoading(false);
                    },
                    (error) => {
                        console.warn('Firestore notifications listener fallback to mockStore:', error.message);
                        setRawNotifications(mockStore.get('notifications') || []);
                        setLoading(false);
                    }
                );
            } catch (e) {
                console.warn('Failed to attach Firestore notifications listener:', e);
                setRawNotifications(mockStore.get('notifications') || []);
                setLoading(false);
            }
        }

        return () => {
            if (unsubMock) unsubMock();
            if (unsubFirestore) unsubFirestore();
        };
    }, [user?.id, user?.isDemo, user?.role]);

    // Filter notifications for the current user's role and department
    const notifications = useMemo(() => {
        if (!user) return [];

        const userRole = (user.role || '').toLowerCase();
        const userDept = (user.departmentId || user.department || 'CSE').toUpperCase();

        return rawNotifications
            .filter((notif) => {
                // If notification targeted to specific user
                if (notif.targetUserId) {
                    return notif.targetUserId === user.id;
                }

                const notifRole = (notif.targetRole || 'all').toLowerCase();
                const notifDept = (notif.departmentId || 'ALL').toUpperCase();

                // Role matching
                const roleMatches =
                    notifRole === 'all' ||
                    notifRole === userRole ||
                    (userRole === ROLES.HOD && notifRole === 'hod') ||
                    ((userRole === ROLES.TEACHER || userRole === ROLES.STAFF) &&
                        (notifRole === 'teacher' || notifRole === 'staff')) ||
                    (userRole === ROLES.STUDENT && notifRole === 'student');

                if (!roleMatches) return false;

                // Department matching
                // HODs, teachers, and students should see notifications relevant to their department
                const deptMatches =
                    notifDept === 'ALL' ||
                    notifDept === userDept ||
                    !user.departmentId; // Fallback if no department set

                return deptMatches;
            })
            .sort((a, b) => {
                const timeA = new Date(a.createdAt?.toDate?.() || a.createdAt || a.timestamp || 0).getTime();
                const timeB = new Date(b.createdAt?.toDate?.() || b.createdAt || b.timestamp || 0).getTime();
                return timeB - timeA;
            });
    }, [rawNotifications, user]);

    // Unread count
    const unreadCount = useMemo(() => {
        return notifications.filter((n) => !readIds.has(n.id)).length;
    }, [notifications, readIds]);

    const markAsRead = useCallback((notificationId) => {
        const next = new Set(readIds);
        next.add(notificationId);
        persistReadIds(next);
    }, [readIds, user?.id]);

    const markAllAsRead = useCallback(() => {
        const next = new Set(readIds);
        notifications.forEach((n) => next.add(n.id));
        persistReadIds(next);
    }, [readIds, notifications, user?.id]);

    const isRead = useCallback((notificationId) => {
        return readIds.has(notificationId);
    }, [readIds]);

    return {
        notifications,
        unreadCount,
        loading,
        isRead,
        markAsRead,
        markAllAsRead
    };
};
