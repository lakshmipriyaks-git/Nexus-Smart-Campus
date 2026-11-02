import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/laksh/.gemini/antigravity/brain/9d3dd8bf-0f4e-4423-97a9-8f91a985600f/screenshots';
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

// Find Chrome executable on Windows
const chromePaths = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`
];
const chromeExe = chromePaths.find(p => fs.existsSync(p));

if (!chromeExe) {
    console.error('Chrome executable not found');
    process.exit(1);
}

const remotePort = 9229;
const chromeProc = spawn(chromeExe, [
    `--remote-debugging-port=${remotePort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--remote-allow-origins=*',
    'about:blank'
], { stdio: 'ignore' });

// Wait for Chrome to open debugging port
await new Promise(r => setTimeout(r, 1500));

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
if (!target || !target.webSocketDebuggerUrl) {
    console.error('No page target found');
    chromeProc.kill();
    process.exit(1);
}

import WebSocket from 'ws';

function connectCDP(wsUrl) {
    const ws = new WebSocket(wsUrl);
    let id = 1;
    const callbacks = new Map();

    ws.on('message', data => {
        const msg = JSON.parse(data);
        if (msg.id && callbacks.has(msg.id)) {
            const { resolve, reject } = callbacks.get(msg.id);
            callbacks.delete(msg.id);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
        }
    });

    const send = (method, params = {}) => {
        return new Promise((resolve, reject) => {
            const reqId = id++;
            callbacks.set(reqId, { resolve, reject });
            ws.send(JSON.stringify({ id: reqId, method, params }));
        });
    };

    return new Promise((resolve) => {
        ws.on('open', () => resolve({ send, close: () => ws.close() }));
    });
}

const cdp = await connectCDP(target.webSocketDebuggerUrl);

async function captureUrl(url, width, height, filename) {
    console.log(`Capturing ${filename} (${width}x${height}) from ${url}...`);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: width < 768
    });
    await cdp.send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 2000));
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    const fullPath = path.join(outDir, filename);
    fs.writeFileSync(fullPath, buffer);
    console.log(`Saved: ${fullPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

async function injectSessionAndCapture(userObj, targetUrl, width, height, filename, postNavFn) {
    console.log(`Setting session for ${userObj.role} and capturing ${filename}...`);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: width < 768
    });
    // Navigate to home to establish origin
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 1200));

    // Inject localStorage session
    const jsonStr = JSON.stringify(userObj);
    const usnStr = userObj.usn || '';
    await cdp.send('Runtime.evaluate', {
        expression: `
            localStorage.setItem('nexus_mock_auth_user', ${JSON.stringify(jsonStr)});
            localStorage.setItem('nexus_unified_auth_user', ${JSON.stringify(jsonStr)});
            localStorage.setItem('theme', 'dark');
            document.documentElement.classList.add('dark');
            if ('${usnStr}') localStorage.setItem('nexus_student_usn', '${usnStr}');
            window.location.href = '${targetUrl}';
        `
    });
    await new Promise(r => setTimeout(r, 2500));

    if (postNavFn) {
        await postNavFn(cdp);
        await new Promise(r => setTimeout(r, 1500));
    }

    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    const fullPath = path.join(outDir, filename);
    fs.writeFileSync(fullPath, buffer);
    console.log(`Saved: ${fullPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

try {
    const studentUser = {
        id: 'student-demo',
        name: 'Ananya Sharma',
        email: 'ananya.cs21@kssem.edu.in',
        role: 'student',
        usn: '1KS21CS088',
        departmentId: 'CSE',
        status: 'active'
    };

    // 1. Gateway Desktop 1440
    await captureUrl('http://localhost:5173/', 1440, 900, 'nexus_os_gateway_desktop_1440.png');

    // 2. Login Desktop 1440
    await captureUrl('http://localhost:5173/login', 1440, 900, 'nexus_os_login_desktop_1440.png');

    // 3. Student Dashboard (repaired Pomodoro, Calendar, Notes, Feed)
    await injectSessionAndCapture(studentUser, 'http://localhost:5173/dashboard', 1440, 900, 'nexus_os_student_dashboard_1440.png');

    // 4. Campus Events (repaired midnight theme)
    await injectSessionAndCapture(studentUser, 'http://localhost:5173/events', 1440, 900, 'nexus_os_events_1440.png');

    // 5. BOB AI Copilot
    await injectSessionAndCapture(studentUser, 'http://localhost:5173/dashboard', 1440, 900, 'nexus_os_bob_copilot_1440.png', async (cdp) => {
        await cdp.send('Runtime.evaluate', {
            expression: `
                const btn = document.querySelector('button[aria-label="Toggle BOB AI Copilot"]');
                if (btn) btn.click();
            `
        });
    });

    // 6. Faculty Dashboard
    const facultyUser = {
        id: 'teacher-demo',
        name: 'Dr. Ramesh Kumar',
        email: 'ramesh.cs@kssem.edu.in',
        role: 'teacher',
        departmentId: 'CSE',
        status: 'approved'
    };
    await injectSessionAndCapture(facultyUser, 'http://localhost:5173/dashboard', 1440, 900, 'nexus_os_faculty_dashboard_1440.png');

    // 7. HOD Dashboard
    const hodUser = {
        id: 'hod-demo',
        name: 'Dr. Suresh Babu',
        email: 'hod.cs@kssem.edu.in',
        role: 'hod',
        departmentId: 'CSE',
        status: 'active'
    };
    await injectSessionAndCapture(hodUser, 'http://localhost:5173/dashboard', 1440, 900, 'nexus_os_hod_dashboard_1440.png');

    // 8. Smart Canteen
    await injectSessionAndCapture(studentUser, 'http://localhost:5173/canteen', 1440, 900, 'nexus_os_smart_canteen_1440.png');

    // 9. Digital Library
    await injectSessionAndCapture(studentUser, 'http://localhost:5173/digital-library', 1440, 900, 'nexus_os_digital_library_1440.png');

    console.log('All verification screens successfully captured!');
} catch (err) {
    console.error('Error during capture:', err);
} finally {
    cdp.close();
    chromeProc.kill();
    process.exit(0);
}
