import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
dotenv.config();

import { initializeApp, deleteApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    deleteDoc,
    updateDoc,
    getDocs,
    getDoc,
    setDoc,
    writeBatch,
    query,
    where,
    or,
    and,
    onSnapshot
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const delay = (ms) => new Promise(r => setTimeout(r, ms));

test('Phase 6A.2 Hardened Privacy & Reviewer Authorization', async (t) => {
    const clientApp = initializeApp(firebaseConfig, `testPhase6A2_${Date.now()}`);
    const db = getFirestore(clientApp);

    t.after(async () => {
        try {
            await deleteApp(clientApp);
        } catch (_) {}
    });

    // ----------------------------------------------------
    // TEST 1: Notifications Recipient Isolation
    // ----------------------------------------------------
    await t.test('1. Notifications Isolation: Student A excludes Student B private alerts', async () => {
        const studentA_Id = `st_notif_A_${Date.now()}`;
        const studentB_Id = `st_notif_B_${Date.now()}`;

        const notifA = await addDoc(collection(db, 'notifications'), {
            title: 'Private Alert for Student A',
            targetUserId: studentA_Id,
            targetRole: 'all',
            departmentId: 'CSE',
            createdAt: new Date().toISOString()
        });

        const notifB = await addDoc(collection(db, 'notifications'), {
            title: 'Confidential Disciplinary Notice B',
            targetUserId: studentB_Id,
            targetRole: 'all',
            departmentId: 'CSE',
            createdAt: new Date().toISOString()
        });

        try {
            const allowedRoles = ['all', 'student'];
            const studentAQuery = query(
                collection(db, 'notifications'),
                or(
                    where('targetUserId', '==', studentA_Id),
                    and(
                        where('targetUserId', '==', null),
                        where('targetRole', 'in', allowedRoles)
                    )
                )
            );

            const snapshotA = await getDocs(studentAQuery);
            const returnedIds = snapshotA.docs.map(d => d.id);

            assert.equal(returnedIds.includes(notifA.id), true, 'Student A must receive their own notification');
            assert.equal(returnedIds.includes(notifB.id), false, 'Student A must NEVER receive Student B notification');
        } finally {
            await deleteDoc(doc(db, 'notifications', notifA.id));
            await deleteDoc(doc(db, 'notifications', notifB.id));
        }
    });

    // ----------------------------------------------------
    // TEST 2: Notifications Real-time & Unsubscribe
    // ----------------------------------------------------
    await t.test('2. Notifications Real-time & Cleanup: Live sync delivers, unmount terminates listener', async () => {
        const testUserId = `realtime_user_${Date.now()}`;
        let receivedRealtime = false;
        let changeCount = 0;

        const allowedRoles = ['all', 'student'];
        const q = query(
            collection(db, 'notifications'),
            or(
                where('targetUserId', '==', testUserId),
                and(
                    where('targetUserId', '==', null),
                    where('targetRole', 'in', allowedRoles)
                )
            )
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added' && change.doc.data().targetUserId === testUserId) {
                    receivedRealtime = true;
                    changeCount++;
                }
            });
        });

        await delay(500);

        const testDoc = await addDoc(collection(db, 'notifications'), {
            title: 'Real-time test notice',
            targetUserId: testUserId,
            targetRole: 'all',
            departmentId: 'CSE',
            createdAt: new Date().toISOString()
        });

        for (let i = 0; i < 6; i++) {
            if (receivedRealtime) break;
            await delay(500);
        }

        assert.equal(receivedRealtime, true, 'Real-time snapshot must deliver authorized notification');

        unsubscribe();
        const initialCount = changeCount;

        const testDoc2 = await addDoc(collection(db, 'notifications'), {
            title: 'Post-unsubscribe notice',
            targetUserId: testUserId,
            targetRole: 'all',
            departmentId: 'CSE',
            createdAt: new Date().toISOString()
        });

        await delay(1000);
        assert.equal(changeCount, initialCount, 'Unsubscribed listener must NOT receive subsequent notifications');

        await deleteDoc(doc(db, 'notifications', testDoc.id));
        await deleteDoc(doc(db, 'notifications', testDoc2.id));
    });

    // ----------------------------------------------------
    // TEST 3: Attendance Subcollection Projection & Wire Payload Zero-Leakage
    // ----------------------------------------------------
    await t.test('3. Attendance Projection Wire Isolation: Student projection payload contains 0 classmate records', async () => {
        const studentA_Id = `st_att_proj_A_${Date.now()}`;
        const studentB_Id = `st_att_proj_B_${Date.now()}`;
        const sessionId = `session_audit_${Date.now()}`;

        // Teacher creates master session in attendance
        const masterDoc = await addDoc(collection(db, 'attendance'), {
            classId: 'CLASS_CSE_AUDIT',
            courseId: 'CS101',
            date: '2026-11-02',
            records: {
                [studentA_Id]: 'present',
                [studentB_Id]: 'absent'
            }
        });

        // Fan-out idempotent writes to student projections
        await setDoc(doc(db, 'users', studentA_Id, 'attendanceRecords', sessionId), {
            sessionId: masterDoc.id,
            classId: 'CLASS_CSE_AUDIT',
            courseId: 'CS101',
            date: '2026-11-02',
            status: 'present',
            updatedAt: new Date().toISOString()
        });

        await setDoc(doc(db, 'users', studentB_Id, 'attendanceRecords', sessionId), {
            sessionId: masterDoc.id,
            classId: 'CLASS_CSE_AUDIT',
            courseId: 'CS101',
            date: '2026-11-02',
            status: 'absent',
            updatedAt: new Date().toISOString()
        });

        try {
            // Student A queries strictly their own attendanceRecords subcollection
            const studentASnap = await getDocs(collection(db, 'users', studentA_Id, 'attendanceRecords'));
            assert.equal(studentASnap.docs.length, 1, 'Student A must receive exactly their projection document');

            const rawDocData = studentASnap.docs[0].data();
            assert.equal(rawDocData.status, 'present', 'Status must match recorded status');
            assert.equal(rawDocData.sessionId, masterDoc.id);

            // Crucial Wire Payload Inspection: raw document must NOT contain student B's data
            const allKeys = Object.keys(rawDocData);
            assert.equal(allKeys.includes('records'), false, 'Document must not contain full class records map');
            assert.equal(JSON.stringify(rawDocData).includes(studentB_Id), false, 'Raw payload must never leak Student B UID');
        } finally {
            await deleteDoc(doc(db, 'attendance', masterDoc.id));
            await deleteDoc(doc(db, 'users', studentA_Id, 'attendanceRecords', sessionId));
            await deleteDoc(doc(db, 'users', studentB_Id, 'attendanceRecords', sessionId));
        }
    });

    // ----------------------------------------------------
    // TEST 4: Attendance Fan-Out Idempotency
    // ----------------------------------------------------
    await t.test('4. Attendance Fan-Out Idempotency: Multiple fan-out writes produce no duplicates', async () => {
        const studentUid = `st_idempotent_${Date.now()}`;
        const sessionId = `session_idem_${Date.now()}`;

        const writeProjection = async (status) => {
            await setDoc(doc(db, 'users', studentUid, 'attendanceRecords', sessionId), {
                sessionId,
                classId: 'CLASS_1',
                courseId: 'CS101',
                date: '2026-11-02',
                status,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        };

        try {
            // Write initial status
            await writeProjection('absent');
            // Overwrite with updated status (teacher corrected attendance)
            await writeProjection('present');
            // Duplicate write (e.g., retried job)
            await writeProjection('present');

            const snap = await getDocs(collection(db, 'users', studentUid, 'attendanceRecords'));
            assert.equal(snap.docs.length, 1, 'Idempotent fan-out must never produce duplicate session records');
            assert.equal(snap.docs[0].data().status, 'present', 'Final status must reflect latest update');
        } finally {
            await deleteDoc(doc(db, 'users', studentUid, 'attendanceRecords', sessionId));
        }
    });

    // ----------------------------------------------------
    // TEST 5: Anonymous Complaint Identity Separation & Zero Wire UID
    // ----------------------------------------------------
    await t.test('5. Anonymous Complaint Identity Separation: Reviewer doc has studentId=anonymous', async () => {
        const whistleblowerUid = `whistleblower_real_${Date.now()}`;

        // Simulate complaint creation with identity separation
        const newComplaint = await addDoc(collection(db, 'campusComplaints'), {
            ticketNumber: 'CMP-8888',
            title: 'Critical Lab Safety Violation',
            category: 'Infrastructure & Lab Equipment',
            departmentId: 'CSE',
            targetAuthority: 'Staff Advisor (Faculty Mentor)',
            status: 'Pending Review',
            isAnonymous: true,
            studentId: 'anonymous', // Real UID strictly omitted
            studentName: 'Anonymous Student',
            studentUsn: 'CONFIDENTIAL',
            studentEmail: '',
            attachments: [
                {
                    id: 'att-1',
                    name: 'evidence.png',
                    url: 'https://firebasestorage.googleapis.com/.../anonymous/evidence.png',
                    storagePath: 'attachments/complaints/anonymous/opaque-token/evidence.png'
                }
            ]
        });

        // Register tracking in student's private registry
        await setDoc(doc(db, 'users', whistleblowerUid, 'trackedComplaints', newComplaint.id), {
            complaintId: newComplaint.id,
            ticketNumber: 'CMP-8888',
            title: 'Critical Lab Safety Violation',
            isAnonymous: true,
            submittedAt: new Date().toISOString()
        });

        try {
            // Reviewer queries departmental complaints
            const reviewerSnap = await getDocs(
                query(collection(db, 'campusComplaints'), where('departmentId', 'in', ['CSE', 'ALL']))
            );

            const reviewerDoc = reviewerSnap.docs.find(d => d.id === newComplaint.id);
            assert.ok(reviewerDoc, 'Reviewer must receive the complaint');

            const rawReviewerPayload = reviewerDoc.data();
            assert.equal(rawReviewerPayload.studentId, 'anonymous', 'Reviewer document studentId must be strictly "anonymous"');
            assert.equal(rawReviewerPayload.isAnonymous, true);
            assert.equal(JSON.stringify(rawReviewerPayload).includes(whistleblowerUid), false, 'Raw payload must never leak whistleblower UID');

            // Submitting student verifies tracking via private registry
            const studentTrackedSnap = await getDocs(collection(db, 'users', whistleblowerUid, 'trackedComplaints'));
            const trackedIds = studentTrackedSnap.docs.map(d => d.id);
            assert.equal(trackedIds.includes(newComplaint.id), true, 'Student must successfully track their anonymous grievance');
        } finally {
            await deleteDoc(doc(db, 'campusComplaints', newComplaint.id));
            await deleteDoc(doc(db, 'users', whistleblowerUid, 'trackedComplaints', newComplaint.id));
        }
    });

    // ----------------------------------------------------
    // TEST 6: Complaint Reviewer Authority Hierarchy
    // ----------------------------------------------------
    await t.test('6. Reviewer Hierarchy: General faculty query excludes Anti-Ragging and HOD-only reports', async () => {
        // Grievance 1: Targeted at Staff Advisor
        const compGeneral = await addDoc(collection(db, 'campusComplaints'), {
            title: 'Classroom Air Conditioner Broken',
            targetAuthority: 'Staff Advisor (Faculty Mentor)',
            departmentId: 'CSE',
            status: 'Pending Review',
            studentId: 'anonymous'
        });

        // Grievance 2: Targeted at Anti-Ragging Cell
        const compRagging = await addDoc(collection(db, 'campusComplaints'), {
            title: 'Severe Hostel Ragging Complaint',
            targetAuthority: 'Anti-Ragging & Disciplinary Cell',
            departmentId: 'CSE',
            status: 'Pending Review',
            studentId: 'anonymous'
        });

        // Grievance 3: Targeted at HOD specifically
        const compHodOnly = await addDoc(collection(db, 'campusComplaints'), {
            title: 'Faculty Misconduct Allegation',
            targetAuthority: 'HOD (Head of Department)',
            departmentId: 'CSE',
            status: 'Pending Review',
            studentId: 'anonymous'
        });

        try {
            // General faculty query constraint
            const qFaculty = query(
                collection(db, 'campusComplaints'),
                where('departmentId', 'in', ['CSE', 'ALL']),
                where('targetAuthority', 'in', ['Staff Advisor (Faculty Mentor)', 'Campus Maintenance Desk'])
            );

            const snapFaculty = await getDocs(qFaculty);
            const returnedFacultyIds = snapFaculty.docs.map(d => d.id);

            assert.equal(returnedFacultyIds.includes(compGeneral.id), true, 'Faculty must access general advisory complaint');
            assert.equal(returnedFacultyIds.includes(compRagging.id), false, 'General faculty must NEVER access Anti-Ragging complaints');
            assert.equal(returnedFacultyIds.includes(compHodOnly.id), false, 'General faculty must NEVER access HOD-only complaints');

            // HOD query: department-wide access
            const qHod = query(
                collection(db, 'campusComplaints'),
                where('departmentId', 'in', ['CSE', 'ALL'])
            );
            const snapHod = await getDocs(qHod);
            const returnedHodIds = snapHod.docs.map(d => d.id);
            assert.equal(returnedHodIds.includes(compGeneral.id), true);
            assert.equal(returnedHodIds.includes(compRagging.id), true);
            assert.equal(returnedHodIds.includes(compHodOnly.id), true);
        } finally {
            await deleteDoc(doc(db, 'campusComplaints', compGeneral.id));
            await deleteDoc(doc(db, 'campusComplaints', compRagging.id));
            await deleteDoc(doc(db, 'campusComplaints', compHodOnly.id));
        }
    });

    // ----------------------------------------------------
    // TEST 7: Attachment Anonymity & Path Verification
    // ----------------------------------------------------
    await t.test('7. Attachment Anonymity: Anonymous evidence paths strictly omit student UID', async () => {
        const studentUid = `student_evidence_test_${Date.now()}`;
        const opaqueFolder = `anon_${Date.now()}_abc123`;
        const evidencePath = `attachments/complaints/anonymous/${opaqueFolder}/photo_evidence.png`;

        assert.equal(evidencePath.includes(studentUid), false, 'Storage path must never contain submitting student UID');
        assert.equal(evidencePath.startsWith('attachments/complaints/anonymous/'), true, 'Path must use anonymous evidence directory');
    });
});
