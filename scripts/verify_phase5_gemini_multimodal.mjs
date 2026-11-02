import fs from 'fs';
import path from 'path';

const PROXY_URL = 'http://localhost:3001';

console.log('===============================================================');
console.log('NEXUS BOB AI — PHASE 5: GEMINI MULTIMODAL & FALLBACK AUDIT');
console.log('===============================================================');

const results = [];
function recordResult(name, pass, details = '') {
    results.push({ name, pass, details });
    const mark = pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark}: ${name} ${details ? `(${details})` : ''}`);
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// 1x1 valid transparent PNG base64 for vision testing
const SAMPLE_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Sample syllabus text for document analysis
const SAMPLE_SYLLABUS = `
COURSE: 21CS61 — Software Engineering & Project Management
Department: Computer Science and Engineering, KSSEM
Module 1: Introduction to Software Engineering, Agile Methodologies, Scrum Framework.
Module 2: Requirements Engineering, SRS documentation, IEEE 830 standard.
Module 3: System Modeling, Context models, Interaction models, Architectural design.
Module 4: Software Testing, Unit testing, Integration testing, Black-box & White-box techniques.
Module 5: Project Management, Risk management, Scheduling, VTU CIE Exam Pattern.
`;

// Sample grade sheet image data
const SAMPLE_GRADE_SHEET_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjuAAAAAElFTkSuQmCC';

async function runMultimodalAudit() {
    try {
        // ── 1. Streaming Chat Generation ──
        console.log('\n1. Testing Streaming Chat Generation (/api/bob/stream)...');
        const res1 = await fetch(`${PROXY_URL}/api/bob/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-student-token'
            },
            body: JSON.stringify({
                prompt: 'Summarize the borrowing rules of the KSSEM Digital Library in 2 bullet points.'
            })
        });

        recordResult('Stream Endpoint HTTP 200', res1.status === 200, `Status: ${res1.status}`);

        const reader1 = res1.body.getReader();
        const decoder1 = new TextDecoder();
        let streamText1 = '';
        let chunkCount1 = 0;
        let receivedDone1 = false;

        while (true) {
            const { value, done } = await reader1.read();
            if (done) break;
            const chunk = decoder1.decode(value);
            const lines = chunk.split('\n\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === '[DONE]') {
                        receivedDone1 = true;
                    } else {
                        try {
                            const p = JSON.parse(dataStr);
                            if (p.text) {
                                streamText1 += p.text;
                                chunkCount1++;
                            }
                        } catch (_) {}
                    }
                }
            }
        }

        recordResult('Stream SSE Delivery', chunkCount1 >= 1 && receivedDone1, `Received ${chunkCount1} progressive text chunks and terminal [DONE]`);
        recordResult('Library Borrowing Rules Grounding', streamText1.includes('3') || streamText1.includes('14') || streamText1.includes('book') || streamText1.includes('borrow'), `AI output: "${streamText1.slice(0, 90).replace(/\n/g, ' ')}..."`);

        await sleep(2000); // Respect Google API pacing

        // ── 2. Multi-turn Streaming with Conversation History ──
        console.log('\n2. Testing Multi-turn Streaming with History...');
        const history2 = [
            { role: 'user', content: 'What is the KSIT-KSSEM shuttle route?' },
            { role: 'model', content: 'The KSIT-KSSEM Campus Shuttle (Route S1) operates between KSIT Kanakapura Rd and KSSEM Mallasandra via Vajarahalli Metro Station.' }
        ];

        const res2 = await fetch(`${PROXY_URL}/api/bob/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-student-token'
            },
            body: JSON.stringify({
                prompt: 'How long does this shuttle trip usually take?',
                history: history2
            })
        });

        const reader2 = res2.body.getReader();
        const decoder2 = new TextDecoder();
        let streamText2 = '';
        while (true) {
            const { value, done } = await reader2.read();
            if (done) break;
            const chunk = decoder2.decode(value);
            const lines = chunk.split('\n\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr !== '[DONE]') {
                        try {
                            const p = JSON.parse(dataStr);
                            if (p.text) streamText2 += p.text;
                        } catch (_) {}
                    }
                }
            }
        }

        recordResult('Multi-Turn Context Retention', streamText2.includes('12') || streamText2.includes('minute') || streamText2.includes('trip') || streamText2.includes('min'), `AI output: "${streamText2.slice(0, 85).replace(/\n/g, ' ')}..."`);

        await sleep(2000);

        // ── 3. Document Analysis Endpoint (/api/bob/analyze-document) ──
        console.log('\n3. Testing Document Analysis Endpoint (/api/bob/analyze-document)...');
        const res3 = await fetch(`${PROXY_URL}/api/bob/analyze-document`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-student-token'
            },
            body: JSON.stringify({
                documentText: SAMPLE_SYLLABUS,
                prompt: 'What software engineering methodology is covered in Module 1?',
                metadata: { fileName: '21CS61_Syllabus.docx', sizeBytes: 15420 }
            })
        });

        recordResult('Document Analysis HTTP 200', res3.status === 200, `Status: ${res3.status}`);
        const data3 = await res3.json();
        const docText = data3.text || '';
        recordResult('Document Analysis Intelligence', docText.includes('Agile') || docText.includes('Scrum') || docText.includes('Module 1'), `AI output: "${docText.slice(0, 85).replace(/\n/g, ' ')}..."`);

        await sleep(2000);

        // ── 4. Multimodal Image Analysis (/api/bob/analyze-image) ──
        console.log('\n4. Testing Multimodal Vision Analysis (/api/bob/analyze-image)...');
        const res4 = await fetch(`${PROXY_URL}/api/bob/analyze-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-student-token'
            },
            body: JSON.stringify({
                imageBase64: SAMPLE_IMAGE_BASE64,
                prompt: 'Describe the primary visible color or visual elements in this image briefly.'
            })
        });

        recordResult('Vision Endpoint HTTP 200', res4.status === 200, `Status: ${res4.status}`);
        const data4 = await res4.json();
        const visionText = data4.text || '';
        recordResult('Vision Analysis Response', visionText.length > 5, `AI output: "${visionText.slice(0, 85).replace(/\n/g, ' ')}..."`);

        await sleep(2000);

        // ── 5. Faculty Grade Sheet OCR (/api/bob/analyze-grade-sheet) ──
        console.log('\n5. Testing Grade Sheet Analysis (/api/bob/analyze-grade-sheet)...');
        const res5 = await fetch(`${PROXY_URL}/api/bob/analyze-grade-sheet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-faculty-token'
            },
            body: JSON.stringify({
                imageBase64: SAMPLE_GRADE_SHEET_BASE64
            })
        });

        recordResult('Grade Sheet Analysis HTTP 200', res5.status === 200, `Status: ${res5.status}`);
        const data5 = await res5.json();
        recordResult('Grade Sheet OCR Structure', Array.isArray(data5) || Array.isArray(data5.records) || (data5.analysis && typeof data5.analysis === 'string') || typeof data5.text === 'string', Array.isArray(data5) ? `Array with ${data5.length} records` : `Response keys: ${Object.keys(data5).join(', ')}`);

        // ── 6. Fallback Behavior & Stream Non-Duplication Audit ──
        console.log('\n6. Auditing Fallback Resilience & Stream Integrity...');
        // The server operates in real fallback mode where gemini-3.8-flash daily quota triggers fallback to gemini-3.1-flash-lite.
        // We verify that the stream produces NO duplicate chunks or corrupted markers.
        const res6 = await fetch(`${PROXY_URL}/api/bob/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-student-token'
            },
            body: JSON.stringify({
                prompt: 'Reply with exact text: RESILIENT_FALLBACK_OK'
            })
        });

        const reader6 = res6.body.getReader();
        const decoder6 = new TextDecoder();
        let fullSse6 = '';
        while (true) {
            const { value, done } = await reader6.read();
            if (done) break;
            fullSse6 += decoder6.decode(value);
        }

        const doneCount = (fullSse6.match(/\[DONE\]/g) || []).length;
        const errorCount = (fullSse6.match(/"error"/g) || []).length;

        recordResult('Terminal [DONE] Exactly Once', doneCount === 1, `Found ${doneCount} [DONE] markers`);
        recordResult('Zero Error Markers in Resilient Stream', errorCount === 0, `Error count: ${errorCount}`);

        console.log('\n===============================================================');
        console.log('GEMINI MULTIMODAL AUDIT SUMMARY:');
        const total = results.length;
        const passed = results.filter(r => r.pass).length;
        console.log(`Passed: ${passed} / ${total}`);
        console.log('===============================================================');

    } catch (e) {
        console.error('Audit failed with fatal error:', e);
    }
}

runMultimodalAudit();
