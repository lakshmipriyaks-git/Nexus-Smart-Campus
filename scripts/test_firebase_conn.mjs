import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ override: true });

const apiKey = process.env.VITE_FIREBASE_API_KEY?.trim();
const projectId = process.env.VITE_FIREBASE_PROJECT_ID?.trim();
const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();

console.log('--- Testing Firebase Configuration & Connectivity ---');
console.log('Project ID:', projectId);
console.log('Auth Domain:', authDomain);
console.log('API Key configured:', !!apiKey);

// Test Identity Toolkit endpoint (read-only verification of project API key without modifying records)
async function testFirebase() {
    try {
        const url = `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: 'test-check@kssem.edu',
                continueUri: `https://${authDomain}`
            })
        });

        const data = await res.json();
        if (res.status === 200 || data.allProviders || data.sessionId || data.registered !== undefined) {
            console.log('✅ Firebase Auth Gateway: Successfully connected and verified (HTTP 200)');
            console.log('Registered campus account detected:', data.registered);
            return true;
        } else if (data.error) {
            console.log('Firebase response code:', res.status, data.error.message);
            if (data.error.message.includes('API_KEY_INVALID')) {
                console.error('❌ Firebase API Key is INVALID.');
                return false;
            }
            // If the error is just EMAIL_NOT_FOUND or similar, it means the API key is completely valid!
            console.log('✅ Firebase API Key is valid and project was contacted successfully.');
            return true;
        }
    } catch (err) {
        console.error('Network error contacting Firebase:', err.message);
        return false;
    }
}

testFirebase();

