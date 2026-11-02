import dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig, 'attendanceBackfill');
const db = getFirestore(app);

async function backfill() {
    console.log('=== STARTING IDEMPOTENT ATTENDANCE FAN-OUT BACKFILL ===');
    const attendanceSnap = await getDocs(collection(db, 'attendance'));
    console.log(`Found ${attendanceSnap.docs.length} authoritative attendance sessions.`);

    let totalProjectionsWritten = 0;

    for (const sessionDoc of attendanceSnap.docs) {
        const sessionId = sessionDoc.id;
        const data = sessionDoc.data();
        const records = data.records || {};
        const studentIds = Object.keys(records);
        console.log(`Processing session [${sessionId}]: Date=${data.date}, Class=${data.classId}, Course=${data.courseId}, Students=${studentIds.length}`);

        let batch = writeBatch(db);
        let batchCount = 0;

        for (const studentUid of studentIds) {
            const status = records[studentUid];
            const targetDocRef = doc(db, 'users', studentUid, 'attendanceRecords', sessionId);
            batch.set(targetDocRef, {
                sessionId,
                classId: data.classId || '',
                courseId: data.courseId || '',
                date: data.date || '',
                status,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            batchCount++;
            totalProjectionsWritten++;

            if (batchCount >= 400) {
                await batch.commit();
                batch = writeBatch(db);
                batchCount = 0;
            }
        }

        if (batchCount > 0) {
            await batch.commit();
        }
    }

    console.log(`=== BACKFILL COMPLETED: Wrote ${totalProjectionsWritten} student projection records ===`);
    process.exit(0);
}

backfill().catch(e => {
    console.error('Backfill failed:', e);
    process.exit(1);
});

