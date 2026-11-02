import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ override: true });

const PROXY_URL = 'http://localhost:3001';
const key = process.env.GEMINI_API_KEY?.trim();
const genAI = new GoogleGenerativeAI(key);

async function main() {
    console.log('=== 1. Testing Backend Health Endpoint ===');
    const healthRes = await fetch(`${PROXY_URL}/api/bob/health`);
    const healthData = await healthRes.json();
    console.log('Health status:', healthData.status);
    console.log('Backend model:', healthData.model);
    console.log('Key Configured:', healthData.keyConfigured);
    console.log('Auth Enforcement:', healthData.authEnforcement);

    console.log('\n=== 2. Real Authenticated Request: Gemini 2.5 Flash ===');
    try {
        const model25 = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const res25 = await model25.generateContent('Say hello from BOB AI.');
        console.log('Gemini 2.5 Flash SUCCESS:', res25.response.text().trim());
    } catch (err) {
        console.log('Gemini 2.5 Flash Upstream Response:');
        console.log(err.message.split('\n')[0]);
    }

    console.log('\n=== 3. Real Authenticated Request: Recommended Production Flash (gemini-3.8-flash) ===');
    try {
        const model38 = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
        const res38 = await model38.generateContent('Introduce yourself as BOB AI for NEXUS Smart Campus in one short sentence.');
        console.log('✅ Google API Authenticated & Generated Response:');
        console.log(`"${res38.response.text().trim()}"`);
    } catch (err) {
        console.error('Gemini 3.8 Flash FAILED:', err.message);
    }

    console.log('\n=== 4. Real Authenticated Streaming Request (gemini-3.8-flash) ===');
    try {
        const modelStream = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
        const streamResult = await modelStream.generateContentStream('Count 1 to 5 separated by spaces.');
        let streamedText = '';
        for await (const chunk of streamResult.stream) {
            streamedText += chunk.text();
        }
        console.log('✅ Streaming Response Received from Google:');
        console.log(`"${streamedText.trim()}"`);
    } catch (err) {
        console.error('Streaming FAILED:', err.message);
    }
}

main().catch(e => {
    console.error('Fatal error:', e.message);
    process.exit(1);
});
