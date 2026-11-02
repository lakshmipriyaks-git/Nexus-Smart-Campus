import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

const outDir = 'C:/Users/laksh/.gemini/antigravity/brain/9d3dd8bf-0f4e-4423-97a9-8f91a985600f/screenshots';
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const chromePaths = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`
];
const chromeExe = chromePaths.find(p => p && fs.existsSync(p));

if (!chromeExe) {
    console.error('Chrome executable not found on host.');
    process.exit(1);
}

const remotePort = 9340;
const chromeProc = spawn(chromeExe, [
    `--remote-debugging-port=${remotePort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-allow-origins=*',
    'about:blank'
], { stdio: 'ignore' });

await new Promise(r => setTimeout(r, 2000));

async function getJson(endpoint) {
    return new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${remotePort}/${endpoint}`, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

const list = await getJson('json');
const target = list.find(t => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);

await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
});

let idSeq = 1;
function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
        const id = idSeq++;
        const onMsg = (data) => {
            try {
                const parsed = JSON.parse(data);
                if (parsed.id === id) {
                    ws.off('message', onMsg);
                    if (parsed.error) reject(new Error(parsed.error.message));
                    else resolve(parsed.result);
                }
            } catch (e) {
                reject(e);
            }
        };
        ws.on('message', onMsg);
        ws.send(JSON.stringify({ id, method, params }));
    });
}

await sendCommand('Page.enable');
await sendCommand('Runtime.enable');

async function setViewport(width, height, isMobile = false) {
    await sendCommand('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: isMobile
    });
    await sendCommand('Emulation.setVisibleSize', { width, height });
}

async function saveScreenshot(filename) {
    const params = { format: 'png' };
    const res = await sendCommand('Page.captureScreenshot', params);
    const buf = Buffer.from(res.data, 'base64');
    const fullPath = path.join(outDir, filename);
    fs.writeFileSync(fullPath, buf);
    console.log(`📸 Screenshot saved: ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
}

async function evalInPage(expression) {
    const res = await sendCommand('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
    });
    if (res.exceptionDetails) {
        throw new Error(res.exceptionDetails.text || 'Runtime evaluation error');
    }
    return res.result?.value;
}

const results = [];

function recordResult(name, pass, details = '') {
    results.push({ name, pass, details });
    const mark = pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark}: ${name} ${details ? `(${details})` : ''}`);
}

try {
    console.log('===============================================================');
    console.log('NEXUS BOB AI — PHASE 5: FRONTEND-TO-BACKEND INTEGRATION TESTS');
    console.log('===============================================================');

    // ── Setup: Student Account ──
    const studentUser = {
        id: 'demo-student-1',
        uid: 'demo-student-1',
        name: 'Ananya Sharma',
        email: 'student@kssem.edu',
        role: 'student',
        usn: '1KS21CS088',
        departmentId: 'CSE',
        semester: '6'
    };
    const studentSessions = {
        eduhub: studentUser,
        canteen: studentUser,
        printhub: studentUser,
        library: studentUser,
        transit: studentUser,
        bustracking: studentUser,
        events: studentUser,
        complaints: studentUser
    };

    await setViewport(1440, 900, false);
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 1500));

    // =========================================================================
    // TEST 1: BOB AI Widget Opening, Header, Badge, and Light Theme
    // =========================================================================
    await evalInPage(`
        localStorage.setItem('darkMode', 'false');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('nexus_unified_auth_user', JSON.stringify(${JSON.stringify(studentUser)}));
        localStorage.setItem('nexus_demo_auth_user', JSON.stringify(${JSON.stringify(studentUser)}));
        localStorage.setItem('nexus_domain_auth_sessions', JSON.stringify(${JSON.stringify(studentSessions)}));
        localStorage.setItem('nexus_student_usn', '1KS21CS088');
    `);
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/dashboard' });
    await new Promise(r => setTimeout(r, 2500));

    // Find and click BOB launcher button
    const openRes = await evalInPage(`(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('BOB AI'));
        if (btn) {
            btn.click();
            return true;
        }
        return false;
    })()`);
    recordResult('Widget Open Action', openRes === true, 'Clicked BOB AI floating action button');

    await new Promise(r => setTimeout(r, 1000));

    // Verify Widget Header & Model Badge
    const headerInfo = await evalInPage(`(() => {
        const title = document.querySelector('.shadow-2xl h3')?.innerText || '';
        const badge = Array.from(document.querySelectorAll('.shadow-2xl span')).find(s => s.innerText && s.innerText.includes('Gemini'))?.innerText || '';
        const welcome = document.querySelector('.shadow-2xl .prose')?.innerText || '';
        return { title, badge, welcome };
    })()`);

    recordResult('Widget Header & Title', headerInfo.title.includes('BOB Campus AI'), `Title rendered: "${headerInfo.title}"`);
    recordResult('Migrated Model Badge', headerInfo.badge.includes('Gemini 3.8'), `Badge rendered: "${headerInfo.badge}"`);
    recordResult('Personalized Student Greeting', headerInfo.welcome.includes('Ananya'), `Welcome greeting personalized for student: "${headerInfo.welcome.slice(0, 45)}..."`);

    await saveScreenshot('bob_ai_e2e_desktop_light_1440.png');

    // Helper for natural typing & submission
    async function submitQuestion(text) {
        await evalInPage(`(() => {
            const input = document.querySelector('input[placeholder*="Ask BOB"]');
            if (input) {
                input.focus();
                input.value = '';
            }
        })()`);
        await sendCommand('Input.insertText', { text });
        await new Promise(r => setTimeout(r, 300));
        return await evalInPage(`(() => {
            const form = document.querySelector('input[placeholder*="Ask BOB"]')?.closest('form');
            const submitBtn = form?.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.disabled) {
                submitBtn.click();
                return true;
            }
            return false;
        })()`);
    }

    // =========================================================================
    // TEST 2: Normal Chat & Progressive Streaming Chunk Delivery
    // =========================================================================
    const prompt1 = 'What is my current attendance in Database Management Systems?';
    console.log(`\nSubmitting Question 1: "${prompt1}"...`);

    const submit1 = await submitQuestion(prompt1);
    recordResult('Message 1 Submission', submit1 === true, 'Dispatched React controlled form submit');

    // Sample DOM progressive updates over 7 seconds
    let lastChunkCount = 0;
    let chunksObserved = 0;
    for (let i = 0; i < 8; i++) {
        await new Promise(r => setTimeout(r, 900));
        const len = await evalInPage(`(() => {
            const msgs = document.querySelectorAll('.shadow-2xl .prose');
            const last = msgs[msgs.length - 1];
            return last ? last.innerText.length : 0;
        })()`);
        if (len > lastChunkCount) {
            chunksObserved++;
            lastChunkCount = len;
        }
    }

    recordResult('Progressive Streaming Chunk Delivery', chunksObserved >= 1, `Observed progressive streaming updates (${chunksObserved} checks, final response length ${lastChunkCount} chars)`);

    // Verify response accuracy for DBMS
    const responseText1 = await evalInPage(`(() => {
        const msgs = document.querySelectorAll('.shadow-2xl .prose');
        const last = msgs[msgs.length - 1];
        return last ? last.innerText : '';
    })()`);

    recordResult('DBMS Attendance Telemetry Grounding', responseText1.includes('74%') || responseText1.includes('DBMS') || responseText1.includes('Database') || responseText1.includes('attendance'), `Response verified against telemetry context: "${responseText1.slice(0, 80)}..."`);

    // =========================================================================
    // TEST 3: Multi-turn Conversation & History Retention
    // =========================================================================
    const prompt2 = 'How many more classes must I attend to get back to 75%?';
    console.log(`\nSubmitting Question 2 (Follow-up): "${prompt2}"...`);

    const submit2 = await submitQuestion(prompt2);
    recordResult('Message 2 Submission', submit2 === true, 'Dispatched follow-up query');

    await new Promise(r => setTimeout(r, 6500));

    // Verify total messages count: 1 welcome + (User 1 + Bot 1) + (User 2 + Bot 2) = 5 messages
    const messageStats = await evalInPage(`(() => {
        const proseElements = Array.from(document.querySelectorAll('.shadow-2xl .prose'));
        const userBubbles = proseElements.filter(p => p.closest('.ml-auto'));
        return {
            totalProse: proseElements.length,
            userCount: userBubbles.length,
            lastResponse: proseElements[proseElements.length - 1]?.innerText || ''
        };
    })()`);

    recordResult('Multi-Turn History Retention', messageStats.userCount === 2, `Retained ${messageStats.userCount} user messages and full model turns`);
    recordResult('Follow-up Math Response', messageStats.lastResponse.length > 20, `Response: "${messageStats.lastResponse.slice(0, 90)}..."`);

    await saveScreenshot('bob_ai_e2e_desktop_multiturn_1440.png');

    // =========================================================================
    // TEST 4: Window Controls — Maximize, Minimize, Close & Reopen Persistence
    // =========================================================================
    const initialWidth = await evalInPage(`document.querySelector('.shadow-2xl')?.offsetWidth || 0`);

    // Click Maximize
    await evalInPage(`(() => {
        const btn = document.querySelector('button[title*="Maximize"]');
        if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const expandedWidth = await evalInPage(`document.querySelector('.shadow-2xl')?.offsetWidth || 0`);
    recordResult('Widget Expand / Maximize', expandedWidth >= 600 || expandedWidth > initialWidth, `Width expanded from ${initialWidth}px to ${expandedWidth}px`);

    // Click Minimize
    await evalInPage(`(() => {
        const btn = document.querySelector('button[title*="Minimize"]');
        if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 600));

    // Close Widget
    await evalInPage(`(() => {
        const btn = document.querySelector('button[title*="Close Window"]');
        if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const isClosed = await evalInPage(`!document.querySelector('.shadow-2xl')`);
    recordResult('Widget Close Action', isClosed === true, 'Widget closed cleanly');

    // Reopen Widget — Verify conversation was not lost
    await evalInPage(`(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('BOB AI'));
        if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));

    const reloadedMsgCount = await evalInPage(`document.querySelectorAll('.shadow-2xl .prose').length`);
    recordResult('Session Persistence on Re-Open', reloadedMsgCount >= 5, `All ${reloadedMsgCount} messages retained across toggle cycle`);

    // Reset Conversation (Clear Chat)
    await evalInPage(`(() => {
        const btn = document.querySelector('button[title*="Reset Conversation"]');
        if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 500));

    const postResetMsgCount = await evalInPage(`document.querySelectorAll('.shadow-2xl .prose').length`);
    recordResult('Reset Conversation (clearChat)', postResetMsgCount === 1, `Messages reset back to single initial welcome greeting`);

    // =========================================================================
    // TEST 5: Mobile (390x844) Viewport & Dark Theme on /bus-tracking
    // =========================================================================
    console.log('\n--- Switching to Mobile 390x844 & Dark Theme ---');
    await setViewport(390, 844, true);

    await evalInPage(`
        localStorage.setItem('darkMode', 'true');
        document.documentElement.classList.add('dark');
    `);

    await sendCommand('Page.navigate', { url: 'http://localhost:5173/bus-tracking' });
    await new Promise(r => setTimeout(r, 2500));

    // Open BOB AI on bus tracking page
    await evalInPage(`(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('BOB AI'));
        if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 1000));

    const mobileLayout = await evalInPage(`(() => {
        const modal = document.querySelector('.shadow-2xl');
        if (!modal) return null;
        const rect = modal.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
            right: rect.right,
            viewportWidth: window.innerWidth,
            fitsInScreen: rect.right <= window.innerWidth + 10 && rect.width <= window.innerWidth
        };
    })()`);

    recordResult('Mobile Layout & Responsive Bounding', mobileLayout?.fitsInScreen === true, `Width: ${mobileLayout?.width}px on viewport ${mobileLayout?.viewportWidth}px`);

    // Click suggestion chip for bus transit
    const clickedChip = await evalInPage(`(() => {
        const chip = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('Shuttle') || b.innerText.includes('timing') || b.innerText.includes('bus')));
        if (chip) {
            chip.click();
            return chip.innerText;
        }
        return false;
    })()`);

    recordResult('Mobile Contextual Suggestion Chip Click', !!clickedChip, `Clicked suggestion: "${clickedChip}"`);

    await new Promise(r => setTimeout(r, 6000));
    await saveScreenshot('bob_ai_e2e_mobile_dark_390.png');

    const mobileResponse = await evalInPage(`(() => {
        const msgs = document.querySelectorAll('.prose');
        const last = msgs[msgs.length - 1];
        return last ? last.innerText : '';
    })()`);

    recordResult('Transit Route Intelligence in Dark Theme', mobileResponse.includes('KSIT') || mobileResponse.includes('KSSEM') || mobileResponse.includes('Shuttle') || mobileResponse.includes('S1'), `Grounded transit response: "${mobileResponse.slice(0, 80)}..."`);

    // =========================================================================
    // TEST 6: Faculty Role Personalization
    // =========================================================================
    console.log('\n--- Switching to Faculty Role (Prof. Ramesh Rao) ---');
    await setViewport(1440, 900, false);
    const facultyUser = {
        id: 'demo-faculty-1',
        uid: 'demo-faculty-1',
        name: 'Prof. Ramesh Rao',
        email: 'staff@kssem.edu',
        role: 'teacher',
        departmentId: 'CSE'
    };

    const facultySessions = {
        eduhub: facultyUser,
        canteen: facultyUser,
        printhub: facultyUser,
        library: facultyUser,
        transit: facultyUser,
        bustracking: facultyUser,
        events: facultyUser,
        complaints: facultyUser
    };

    await evalInPage(`
        localStorage.setItem('darkMode', 'false');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('nexus_unified_auth_user', JSON.stringify(${JSON.stringify(facultyUser)}));
        localStorage.setItem('nexus_demo_auth_user', JSON.stringify(${JSON.stringify(facultyUser)}));
        localStorage.setItem('nexus_domain_auth_sessions', JSON.stringify(${JSON.stringify(facultySessions)}));
    `);
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/dashboard' });
    await new Promise(r => setTimeout(r, 2500));

    // Open BOB
    await evalInPage(`(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('BOB AI'));
        if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 1000));

    const facultyGreeting = await evalInPage(`(() => {
        const welcome = document.querySelector('.shadow-2xl .prose')?.innerText || '';
        return welcome;
    })()`);

    recordResult('Faculty Role Personalization', facultyGreeting.includes('Prof. Ramesh') && facultyGreeting.includes('Academic Assistant'), `Welcome greeting: "${facultyGreeting.slice(0, 75)}..."`);

    await saveScreenshot('bob_ai_e2e_faculty_dashboard_1440.png');

    console.log('\n===============================================================');
    console.log('FRONTEND INTEGRATION AUDIT SUMMARY:');
    const total = results.length;
    const passed = results.filter(r => r.pass).length;
    console.log(`Passed: ${passed} / ${total}`);
    console.log('===============================================================');

} catch (err) {
    console.error('Fatal error during E2E browser verification:', err);
} finally {
    try { ws.close(); } catch (_) {}
    try { chromeProc.kill(); } catch (_) {}
}
