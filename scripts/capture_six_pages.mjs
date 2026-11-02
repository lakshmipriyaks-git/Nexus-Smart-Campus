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

async function injectSessionAndCapture(userObj, targetUrl, width, height, filename) {
    console.log(`Capturing ${filename} (${width}x${height}) at ${targetUrl}...`);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: width < 768
    });
    // Navigate to home to establish origin
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 1000));

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
    await new Promise(r => setTimeout(r, 2200));

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

    // The 6 targeted pages
    const pages = [
        { path: 'http://localhost:5173/courses', name: 'courses_catalog' },
        { path: 'http://localhost:5173/canteen', name: 'smart_canteen' },
        { path: 'http://localhost:5173/notifications', name: 'notifications' },
        { path: 'http://localhost:5173/print-hub', name: 'print_hub' },
        { path: 'http://localhost:5173/events', name: 'campus_events' },
        { path: 'http://localhost:5173/bus-tracking', name: 'fleet_transit' }
    ];

    // Capture each page at 1440x900 and 1366x768
    for (const page of pages) {
        // 1440x900
        await injectSessionAndCapture(
            studentUser,
            page.path,
            1440,
            900,
            `nexus_repair_${page.name}_1440.png`
        );
        // 1366x768
        await injectSessionAndCapture(
            studentUser,
            page.path,
            1366,
            768,
            `nexus_repair_${page.name}_1366.png`
        );
    }

    console.log('All 12 dual-viewport verification screenshots successfully captured!');
} catch (err) {
    console.error('Error during capture:', err);
} finally {
    cdp.close();
    chromeProc.kill();
    process.exit(0);
}

