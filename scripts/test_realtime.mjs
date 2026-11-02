import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v) env[k.trim()] = v.join('=').trim();
});

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const targets = ['canteenOrders', 'printJobs', 'notifications', 'libraryBorrowings'];

async function testSubscriptions() {
    console.log('--- TESTING REAL-TIME FIRESTORE SUBSCRIPTIONS (CROSS-DEVICE CAPABILITY) ---');
    
    for (const target of targets) {
        await new Promise((resolve) => {
            const colRef = collection(db, target);
            const unsubscribe = onSnapshot(colRef, (snapshot) => {
                console.log(`[REALTIME ACTIVE] '${target}' listener received ${snapshot.size} documents from Cloud Firestore.`);
                unsubscribe();
                resolve();
            }, (error) => {
                console.log(`[REALTIME BLOCKED] '${target}' listener failed: ${error.code} - ${error.message}`);
                unsubscribe();
                resolve();
            });
        });
    }
    process.exit(0);
}

testSubscriptions();

