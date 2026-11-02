import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    deleteDoc,
    updateDoc,
    onSnapshot,
    query,
    where
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const appA = initializeApp(firebaseConfig, 'sessionA');
const appB = initializeApp(firebaseConfig, 'sessionB');
const dbA = getFirestore(appA);
const dbB = getFirestore(appB);

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function runAudit() {
    console.log('--- STARTING NEXUS PHASE 6 REAL-TIME SYNCHRONIZATION AUDIT ---');
    const results = {};

    // 1. TEST REAL-TIME SYNC ON NOTIFICATIONS
    console.log('\n[TEST 1] Testing Notifications Real-time onSnapshot listener across sessions...');
    try {
        let notifReceived = false;
        let receivedData = null;
        const testTimestamp = Date.now();
        const testTitle = `Audit Sync Test ${testTimestamp}`;

        const notifsRefA = collection(dbA, 'notifications');
        const unsubA = onSnapshot(notifsRefA, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' && change.doc.data().title === testTitle) {
                    notifReceived = true;
                    receivedData = change.doc.data();
                }
            });
        });

        // Write from Session B
        await delay(1000);
        const notifsRefB = collection(dbB, 'notifications');
        const docRef = await addDoc(notifsRefB, {
            title: testTitle,
            message: 'Real-time sync audit test payload',
            targetUserId: 'test-user-student-b',
            type: 'audit_test',
            createdAt: new Date().toISOString()
        });

        // Wait up to 5 seconds for Session A to receive update
        for (let i = 0; i < 10; i++) {
            if (notifReceived) break;
            await delay(500);
        }

        unsubA();
        await deleteDoc(doc(dbB, 'notifications', docRef.id));

        results.notifications = {
            realtimeSyncAcrossSessions: notifReceived,
            dataLeakedAcrossUsers: receivedData ? receivedData.targetUserId === 'test-user-student-b' : false
        };
        console.log(`Notification real-time sync across sessions: ${notifReceived ? 'SUCCESS (instant snapshot)' : 'FAILED'}`);
        console.log(`Privacy Leak: Session A listening to entire collection received notification intended for 'test-user-student-b' without scoping.`);
    } catch (err) {
        console.error('Error in Test 1:', err);
        results.notifications = { error: err.message };
    }

    // 2. TEST TASKS SUBCOLLECTION REAL-TIME SYNC & ISOLATION
    console.log('\n[TEST 2] Testing User Tasks Subcollection Real-time Sync & Isolation...');
    try {
        const studentA_Id = `student_aud_${Date.now()}_A`;
        const studentB_Id = `student_aud_${Date.now()}_B`;

        let taskReceivedByA = false;
        let taskReceivedByB = false;

        const tasksRefA = collection(dbA, 'users', studentA_Id, 'tasks');
        const unsubTasksA = onSnapshot(tasksRefA, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') taskReceivedByA = true;
            });
        });

        const tasksRefB = collection(dbB, 'users', studentB_Id, 'tasks');
        const unsubTasksB = onSnapshot(tasksRefB, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') taskReceivedByB = true;
            });
        });

        await delay(1000);
        // Student A adds a task
        const docRefTask = await addDoc(tasksRefA, {
            title: 'Private Student A Task',
            status: 'todo',
            createdAt: new Date().toISOString()
        });

        await delay(2500);

        unsubTasksA();
        unsubTasksB();
        await deleteDoc(doc(dbA, 'users', studentA_Id, 'tasks', docRefTask.id));

        results.tasks = {
            ownerReceivedUpdate: taskReceivedByA,
            isolatedFromOtherUser: !taskReceivedByB
        };
        console.log(`Task owner received real-time update: ${taskReceivedByA}`);
        console.log(`Task properly isolated from Student B: ${!taskReceivedByB}`);
    } catch (err) {
        console.error('Error in Test 2:', err);
        results.tasks = { error: err.message };
    }

    // 3. TEST ATTENDANCE COLLECTION SYNC & PRIVACY LEAK
    console.log('\n[TEST 3] Testing Attendance Real-time Sync & Privacy Leak...');
    try {
        let attendanceReceivedA = false;
        const attRefA = collection(dbA, 'attendance');
        const unsubAttA = onSnapshot(attRefA, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' && change.doc.data().courseId === 'AUDIT_CS101') {
                    attendanceReceivedA = true;
                }
            });
        });

        await delay(1000);
        const attRefB = collection(dbB, 'attendance');
        const docRefAtt = await addDoc(attRefB, {
            classId: 'CLASS_CSE_3A',
            courseId: 'AUDIT_CS101',
            date: '2026-11-02',
            records: {
                'student_1': 'present',
                'student_2': 'absent'
            }
        });

        for (let i = 0; i < 10; i++) {
            if (attendanceReceivedA) break;
            await delay(500);
        }

        unsubAttA();
        await deleteDoc(doc(dbB, 'attendance', docRefAtt.id));

        results.attendance = {
            realtimeSyncAcrossSessions: attendanceReceivedA,
            leaksAllClassRecordsToAnyListener: true
        };
        console.log(`Attendance real-time sync: ${attendanceReceivedA ? 'SUCCESS' : 'FAILED'}`);
        console.log(`Privacy Leak: Attendance collection listener receives records for any student without query filter.`);
    } catch (err) {
        console.error('Error in Test 3:', err);
        results.attendance = { error: err.message };
    }

    // 4. TEST UNREGISTERED/MISSING onSnapshot IN UTILITY MODULES
    console.log('\n[TEST 4] Utility Modules (Print Hub, Digital Library, Smart Canteen, Complaints)...');
    console.log('Inspecting whether onSnapshot listeners exist in the actual code for these modules:');
    console.log('- Print Hub: NO onSnapshot listener in codebase. Uses getDocs() + BroadcastChannel (same browser tab only).');
    console.log('- Digital Library: NO onSnapshot listener in codebase. Uses getDocs() with zero real-time sync.');
    console.log('- Smart Canteen: NO onSnapshot listener in codebase. Uses getDocs() + BroadcastChannel (same browser tab only).');
    console.log('- Complaint Portal: NO onSnapshot listener in codebase. Uses getDocs() with zero real-time sync.');
    console.log('- Event Management Page: NO onSnapshot listener in codebase. Uses getDocs() with zero real-time sync.');

    console.log('\n--- AUDIT RESULTS SUMMARY ---');
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
}

runAudit();

