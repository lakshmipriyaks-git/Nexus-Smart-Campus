import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    collection, onSnapshot, query, where,
    updateDoc, doc, writeBatch, getDocs
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { ROLES, STATUS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { mockStore } from '../mock/mockStore';
import { sendCampusNotification } from '../services/notificationService';
import toast from 'react-hot-toast';

export const useHodAdmin = () => {
    const { user } = useAuth();

    // Default to HOD's assigned department, e.g. 'CSE'
    const defaultDept = user?.departmentId || user?.department || 'CSE';
    const [selectedDepartment, setSelectedDepartment] = useState(defaultDept);

    const [allUsers, setAllUsers] = useState([]);
    const [allClasses, setAllClasses] = useState([]);
    const [allJoinRequests, setAllJoinRequests] = useState([]);
    const [allNotifications, setAllNotifications] = useState([]);
    const [hodLoading, setHodLoading] = useState(true);

    // Keep selected department updated if user changes
    useEffect(() => {
        if (user?.departmentId || user?.department) {
            setSelectedDepartment(user.departmentId || user.department);
        }
    }, [user?.departmentId, user?.department]);

    // Listen to users, classes, join requests, and notifications
    useEffect(() => {
        if (!user?.id) {
            setHodLoading(false);
            return;
        }

        // MockStore subscriptions
        const unsubMockUsers = mockStore.subscribe('users', (data) => {
            if (!isFirebaseConfigured || user?.isDemo) {
                setAllUsers(data || []);
                setHodLoading(false);
            }
        });

        const unsubMockClasses = mockStore.subscribe('classes', (data) => {
            if (!isFirebaseConfigured || user?.isDemo) {
                setAllClasses(data || []);
            }
        });

        const unsubMockRequests = mockStore.subscribe('joinRequests', (data) => {
            if (!isFirebaseConfigured || user?.isDemo) {
                setAllJoinRequests(data || []);
            }
        });

        const unsubMockNotifs = mockStore.subscribe('notifications', (data) => {
            if (!isFirebaseConfigured || user?.isDemo) {
                setAllNotifications(data || []);
            }
        });

        let unsubFbUsers = null;
        let unsubFbClasses = null;
        let unsubFbRequests = null;
        let unsubFbNotifs = null;

        if (isFirebaseConfigured && !user?.isDemo) {
            try {
                // Listen to all users
                const usersRef = collection(db, 'users');
                unsubFbUsers = onSnapshot(
                    usersRef,
                    (snapshot) => {
                        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                        setAllUsers(items);
                        setHodLoading(false);
                    },
                    (err) => {
                        console.warn('HOD users listener fallback:', err.message);
                        setAllUsers(mockStore.get('users') || []);
                        setHodLoading(false);
                    }
                );

                // Listen to classes
                const classesRef = collection(db, 'classes');
                unsubFbClasses = onSnapshot(
                    classesRef,
                    (snapshot) => {
                        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                        setAllClasses(items);
                    },
                    (err) => {
                        console.warn('HOD classes listener fallback:', err.message);
                        setAllClasses(mockStore.get('classes') || []);
                    }
                );

                // Listen to join requests
                const reqsRef = collection(db, 'joinRequests');
                unsubFbRequests = onSnapshot(
                    reqsRef,
                    (snapshot) => {
                        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                        setAllJoinRequests(items);
                    },
                    (err) => {
                        console.warn('HOD join requests listener fallback:', err.message);
                        setAllJoinRequests(mockStore.get('joinRequests') || []);
                    }
                );

                // Listen to notifications
                const notifsRef = collection(db, 'notifications');
                unsubFbNotifs = onSnapshot(
                    notifsRef,
                    (snapshot) => {
                        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                        setAllNotifications(items);
                    },
                    (err) => {
                        setAllNotifications(mockStore.get('notifications') || []);
                    }
                );
            } catch (error) {
                console.warn('HOD snapshot listeners setup error:', error);
                setAllUsers(mockStore.get('users') || []);
                setAllClasses(mockStore.get('classes') || []);
                setAllJoinRequests(mockStore.get('joinRequests') || []);
                setAllNotifications(mockStore.get('notifications') || []);
                setHodLoading(false);
            }
        }

        return () => {
            if (unsubMockUsers) unsubMockUsers();
            if (unsubMockClasses) unsubMockClasses();
            if (unsubMockRequests) unsubMockRequests();
            if (unsubMockNotifs) unsubMockNotifs();
            if (unsubFbUsers) unsubFbUsers();
            if (unsubFbClasses) unsubFbClasses();
            if (unsubFbRequests) unsubFbRequests();
            if (unsubFbNotifs) unsubFbNotifs();
        };
    }, [user?.id, user?.isDemo]);

    // Department-isolated Teachers (Pending vs Active)
    const { pendingTeachers, activeTeachers } = useMemo(() => {
        const pending = [];
        const active = [];

        allUsers.forEach((u) => {
            const role = (u.role || '').toLowerCase();
            const isFaculty = role === ROLES.TEACHER || role === ROLES.STAFF || role === 'teacher' || role === 'staff';
            if (!isFaculty) return;

            const userDept = (u.departmentId || u.department || 'CSE').toUpperCase();
            const currDept = selectedDepartment.toUpperCase();

            // Strict department isolation: matches HOD's active department
            if (userDept !== currDept) return;

            const status = (u.status || '').toLowerCase();
            if (status === STATUS.PENDING || status === 'pending') {
                pending.push(u);
            } else if (status !== STATUS.REJECTED && status !== 'rejected') {
                active.push(u);
            }
        });

        return { pendingTeachers: pending, activeTeachers: active };
    }, [allUsers, selectedDepartment]);

    // Department-isolated Classes with accurate student list and counts
    const departmentClasses = useMemo(() => {
        const currDept = selectedDepartment.toUpperCase();
        const deptTeacherIds = new Set(activeTeachers.map(t => t.id));

        return allClasses
            .filter((c) => {
                const classDept = (c.departmentId || '').toUpperCase();
                // Match either explicit class department or if taught by department teacher
                return classDept === currDept || (!classDept && deptTeacherIds.has(c.teacherId));
            })
            .map((c) => {
                // Find all student requests for this class
                const classRequests = allJoinRequests.filter(r => r.classId === c.id);
                const approvedStudents = classRequests.filter(r => r.status === 'approved');
                const pendingStudents = classRequests.filter(r => r.status === 'pending');

                return {
                    ...c,
                    departmentId: c.departmentId || selectedDepartment,
                    studentCount: approvedStudents.length || c.studentCount || 0,
                    approvedStudents,
                    pendingStudents,
                    allJoinedStudents: approvedStudents.map(r => ({
                        id: r.studentId,
                        name: r.studentName,
                        date: r.date || 'Recent',
                        status: r.status
                    }))
                };
            });
    }, [allClasses, allJoinRequests, selectedDepartment, activeTeachers]);

    // Department-isolated Students
    const allStudents = useMemo(() => {
        const currDept = selectedDepartment.toUpperCase();
        const deptClassIds = new Set(departmentClasses.map(c => c.id));

        return allUsers.filter((u) => {
            const role = (u.role || '').toLowerCase();
            if (role !== ROLES.STUDENT && role !== 'student') return false;

            const studentDept = (u.departmentId || u.department || '').toUpperCase();
            // Student belongs directly to this department
            if (studentDept === currDept) return true;

            // Or student has joined classes under this department
            const isEnrolledInDeptClass = allJoinRequests.some(
                r => r.studentId === u.id && deptClassIds.has(r.classId)
            );

            return isEnrolledInDeptClass;
        });
    }, [allUsers, selectedDepartment, departmentClasses, allJoinRequests]);

    // Department Activities & Audit Stream (Classes created, students joined, teachers approved)
    const departmentActivities = useMemo(() => {
        const currDept = selectedDepartment.toUpperCase();
        const deptClassIds = new Set(departmentClasses.map(c => c.id));

        const notifs = allNotifications
            .filter(n => {
                const notifDept = (n.departmentId || 'ALL').toUpperCase();
                return notifDept === 'ALL' || notifDept === currDept;
            })
            .map(n => ({
                id: n.id,
                title: n.title,
                message: n.message,
                type: n.type || 'general',
                timestamp: n.createdAt?.toDate?.() || n.createdAt || n.timestamp || new Date(),
                actorName: n.actorName || n.metadata?.teacherName || n.metadata?.studentName || 'System',
                metadata: n.metadata || {}
            }));

        return notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [allNotifications, selectedDepartment, departmentClasses]);

    // Approve a pending teacher
    const approveTeacher = async (uid) => {
        const teacher = allUsers.find(u => u.id === uid) || pendingTeachers.find(u => u.id === uid);
        const tName = teacher?.name || 'Faculty Member';
        const tDept = teacher?.departmentId || selectedDepartment;

        // 1. Update mockStore immediately
        mockStore.update('users', uid, { status: STATUS.ACTIVE });

        // 2. Send notification to Teacher
        sendCampusNotification({
            title: 'Faculty Account Approved',
            message: `Congratulations ${tName}! Your faculty account for the ${tDept} department has been approved by the Head of Department. You can now create classes and manage coursework.`,
            type: 'staff_approved',
            departmentId: tDept,
            targetUserId: uid,
            targetRole: 'teacher',
            actorName: user?.name || 'HOD',
            actorRole: 'hod',
            metadata: { teacherId: uid, teacherName: tName, departmentId: tDept }
        });

        // 3. Log notification for HOD
        sendCampusNotification({
            title: 'Staff Approved',
            message: `You approved faculty member ${tName} for the ${tDept} department.`,
            type: 'staff_approved',
            departmentId: tDept,
            targetRole: 'hod',
            actorName: user?.name || 'HOD',
            actorRole: 'hod',
            metadata: { teacherId: uid, teacherName: tName, departmentId: tDept }
        });

        if (user?.isDemo) {
            toast.success(`Teacher ${tName} approved successfully`);
            return;
        }

        try {
            await updateDoc(doc(db, 'users', uid), { status: STATUS.ACTIVE });
            toast.success(`Teacher ${tName} approved successfully`);
        } catch (error) {
            console.error('Error approving teacher in cloud Firestore:', error);
            toast.error('Approved locally');
        }
    };

    // Reject a pending teacher
    const rejectTeacher = async (uid) => {
        const teacher = allUsers.find(u => u.id === uid) || pendingTeachers.find(u => u.id === uid);
        const tName = teacher?.name || 'Faculty Member';

        mockStore.update('users', uid, { status: STATUS.REJECTED });

        if (user?.isDemo) {
            toast.success('Teacher request rejected');
            return;
        }

        try {
            await updateDoc(doc(db, 'users', uid), { status: STATUS.REJECTED });
            toast.success('Teacher request rejected');
        } catch (error) {
            console.error('Error rejecting teacher:', error);
            toast.error('Rejected locally');
        }
    };

    // Remove an active teacher
    const removeTeacher = async (uid) => {
        mockStore.remove('users', uid);

        if (user?.isDemo) {
            toast.success('Teacher removed from department');
            return;
        }

        try {
            const batch = writeBatch(db);
            const classesRef = collection(db, 'classes');
            const classQuery = query(classesRef, where('teacherId', '==', uid));
            const classSnap = await getDocs(classQuery);

            for (const classDoc of classSnap.docs) {
                batch.delete(classDoc.ref);
            }
            batch.delete(doc(db, 'users', uid));
            await batch.commit();
            toast.success('Teacher removed from department');
        } catch (error) {
            console.error('Error removing teacher:', error);
            toast.error('Removed locally');
        }
    };

    // Remove a student
    const removeStudent = async (uid) => {
        mockStore.remove('users', uid);

        if (user?.isDemo) {
            toast.success('Student removed from department');
            return;
        }

        try {
            await updateDoc(doc(db, 'users', uid), { status: STATUS.REJECTED });
            toast.success('Student removed from department');
        } catch (error) {
            console.error('Error removing student:', error);
            toast.error('Removed locally');
        }
    };

    // Delete a class
    const deleteClass = async (classId) => {
        mockStore.remove('classes', classId);

        if (user?.isDemo) {
            toast.success('Class deleted');
            return;
        }

        try {
            const batch = writeBatch(db);
            batch.delete(doc(db, 'classes', classId));
            await batch.commit();
            toast.success('Class deleted');
        } catch (error) {
            console.error('Error deleting class:', error);
            toast.error('Deleted locally');
        }
    };

    return {
        selectedDepartment,
        setSelectedDepartment,
        pendingTeachers,
        activeTeachers,
        allStudents,
        departmentClasses,
        departmentActivities,
        hodLoading,
        approveTeacher,
        rejectTeacher,
        removeTeacher,
        removeStudent,
        deleteClass,
    };
};
