import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

async function check() {
    const snap = await getDocs(collection(db, 'users'));
    const roleSummary = {};
    let missingRole = 0;
    let missingEmail = 0;

    snap.forEach(d => {
        const data = d.data();
        const role = data.role || 'UNSET';
        if (!data.role) missingRole++;
        if (!data.email) missingEmail++;
        if (!roleSummary[role]) {
            roleSummary[role] = {
                count: 0,
                hasName: 0,
                hasDept: 0,
                hasStatus: 0,
                statusTypes: new Set()
            };
        }
        roleSummary[role].count++;
        if (data.name) roleSummary[role].hasName++;
        if (data.departmentId || data.department) roleSummary[role].hasDept++;
        if (data.status) {
            roleSummary[role].hasStatus++;
            roleSummary[role].statusTypes.add(data.status);
        }
    });

    console.log('--- USER PROFILE SCHEMA VALIDATION ---');
    console.log('Total Profiles Checked:', snap.size);
    console.log('Missing Roles:', missingRole);
    console.log('Missing Emails:', missingEmail);

    for (const [role, info] of Object.entries(roleSummary)) {
        console.log(`Role [${role}]:`);
        console.log(`  Total: ${info.count}`);
        console.log(`  Valid Names: ${info.hasName}/${info.count}`);
        console.log(`  Valid Departments: ${info.hasDept}/${info.count}`);
        console.log(`  Statuses: ${Array.from(info.statusTypes).join(', ') || 'None'}`);
    }
    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});

