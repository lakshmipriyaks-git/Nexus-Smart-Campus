const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfigStr = fs.readFileSync('src/config/firebase.js', 'utf8');

// Extract just the config object
const match = firebaseConfigStr.match(/const firebaseConfig = ({[\s\S]*?});/);

if (match && match[1]) {
    const configStr = match[1]
        .replace(/import.meta.env.VITE_FIREBASE_API_KEY/g, `"${process.env.VITE_FIREBASE_API_KEY}"`)
        .replace(/import.meta.env.VITE_FIREBASE_AUTH_DOMAIN/g, `"${process.env.VITE_FIREBASE_AUTH_DOMAIN}"`)
        .replace(/import.meta.env.VITE_FIREBASE_PROJECT_ID/g, `"${process.env.VITE_FIREBASE_PROJECT_ID}"`)
        .replace(/import.meta.env.VITE_FIREBASE_STORAGE_BUCKET/g, `"${process.env.VITE_FIREBASE_STORAGE_BUCKET}"`)
        .replace(/import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID/g, `"${process.env.VITE_FIREBASE_MESSAGING_SENDER_ID}"`)
        .replace(/import.meta.env.VITE_FIREBASE_APP_ID/g, `"${process.env.VITE_FIREBASE_APP_ID}"`);
        
    // Use eval carefully just to get the config object
    let config;
    eval(`config = ${configStr}`);

    const app = initializeApp(config);
    const db = getFirestore(app);

    async function test() {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        console.log("Total Users found:", snapshot.size);
        snapshot.forEach(doc => {
            console.log(doc.id, "=>", doc.data());
        });
        process.exit(0);
    }
    test().catch(console.error);
} else {
    console.log("Could not parse config");
}
