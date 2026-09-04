import { useState, useEffect } from 'react';
import {
    collection, onSnapshot, query, where,
    updateDoc, doc, writeBatch, getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ROLES, STATUS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * useHodAdmin — all HOD administrative operations scoped to the HOD's department.
 * Falls back to showing all data when departmentId is missing (backward compat).
 */
export const useHodAdmin = () => {
    const { user } = useAuth();
    const [pendingTeachers, setPendingTeachers] = useState([]);
    const [activeTeachers, setActiveTeachers] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [departmentClasses, setDepartmentClasses] = useState([]);
    const [hodLoading, setHodLoading] = useState(true);

    const deptId = user?.departmentId;

    useEffect(() => {
        if (!user?.id) return;

        const usersRef = collection(db, 'users');

        // Build teacher query — scope to department if HOD has one
        const teacherQuery = deptId
            ? query(usersRef, where('role', '==', ROLES.TEACHER), where('departmentId', '==', deptId))
            : query(usersRef, where('role', '==', ROLES.TEACHER));

        const unsubTeachers = onSnapshot(
            teacherQuery,
            (snapshot) => {
                const pending = [];
                const active = [];
                snapshot.docs.forEach((d) => {
                    const data = { id: d.id, ...d.data() };
                    if (data.status === STATUS.PENDING) pending.push(data);
                    else if (data.status !== STATUS.REJECTED) active.push(data);
                    // missing status treated as active (legacy accounts)
                });
                setPendingTeachers(pending);
                setActiveTeachers(active);
                setHodLoading(false);
            },
            (error) => {
                console.error('useHodAdmin teachers listener error:', error);
                setHodLoading(false);
            }
        );

        // Students query
        const studentQuery = query(usersRef, where('role', '==', ROLES.STUDENT));
        const unsubStudents = onSnapshot(
            studentQuery,
            (snapshot) => {
                setAllStudents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
            },
            (error) => console.error('useHodAdmin students listener error:', error)
        );

        // Classes in this department
        const classesRef = collection(db, 'classes');
        const classQuery = deptId
            ? query(classesRef, where('departmentId', '==', deptId))
            : query(classesRef); // no deptId = show all (backward compat)
        const unsubClasses = onSnapshot(
            classQuery,
            (snapshot) => {
                setDepartmentClasses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
            },
            (error) => console.error('useHodAdmin classes listener error:', error)
        );

        return () => {
            unsubTeachers();
            unsubStudents();
            unsubClasses();
        };
    }, [user?.id, deptId]);

    /** Approve a pending teacher → set status to 'active' */
    const approveTeacher = async (uid) => {
        try {
            await updateDoc(doc(db, 'users', uid), { status: STATUS.ACTIVE });
            toast.success('Teacher approved successfully');
        } catch (error) {
            console.error('Error approving teacher:', error);
            toast.error('Failed to approve teacher');
        }
    };

    /** Reject a pending teacher → set status to 'rejected' */
    const rejectTeacher = async (uid) => {
        try {
            await updateDoc(doc(db, 'users', uid), { status: STATUS.REJECTED });
            toast.success('Teacher request rejected');
        } catch (error) {
            console.error('Error rejecting teacher:', error);
            toast.error('Failed to reject teacher');
        }
    };

    /** Batch-delete a teacher's user doc, their classes, and join requests */
    const removeTeacher = async (uid) => {
        try {
            const batch = writeBatch(db);
            const classesRef = collection(db, 'classes');
            const classQuery = query(classesRef, where('teacherId', '==', uid));
            const classSnap = await getDocs(classQuery);

            for (const classDoc of classSnap.docs) {
                const reqQuery = query(
                    collection(db, 'joinRequests'),
                    where('classId', '==', classDoc.id)
                );
                const reqSnap = await getDocs(reqQuery);
                reqSnap.docs.forEach((r) => batch.delete(r.ref));
                batch.delete(classDoc.ref);
            }
            batch.delete(doc(db, 'users', uid));
            await batch.commit();
            toast.success('Teacher removed from department');
        } catch (error) {
            console.error('Error removing teacher:', error);
            toast.error('Failed to remove teacher');
        }
    };

    /** Batch-delete a student's user doc and their join requests */
    const removeStudent = async (uid) => {
        try {
            const batch = writeBatch(db);
            const reqQuery = query(collection(db, 'joinRequests'), where('studentId', '==', uid));
            const reqSnap = await getDocs(reqQuery);
            reqSnap.docs.forEach((r) => batch.delete(r.ref));
            batch.delete(doc(db, 'users', uid));
            await batch.commit();
            toast.success('Student removed from department');
        } catch (error) {
            console.error('Error removing student:', error);
            toast.error('Failed to remove student');
        }
    };

    /** HOD delete a class and all its joinRequests */
    const deleteClass = async (classId) => {
        try {
            const batch = writeBatch(db);
            const reqQuery = query(collection(db, 'joinRequests'), where('classId', '==', classId));
            const reqSnap = await getDocs(reqQuery);
            reqSnap.docs.forEach((r) => batch.delete(r.ref));
            batch.delete(doc(db, 'classes', classId));
            await batch.commit();
            toast.success('Class deleted');
        } catch (error) {
            console.error('Error deleting class:', error);
            toast.error('Failed to delete class');
        }
    };

    return {
        pendingTeachers,
        activeTeachers,
        allStudents,
        departmentClasses,
        hodLoading,
        approveTeacher,
        rejectTeacher,
        removeTeacher,
        removeStudent,
        deleteClass,
    };
};
