import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

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

const remotePort = 9255;
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

const ws = new WebSocket(target.webSocketDebuggerUrl);

await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
});

let msgId = 1;
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

function send(method, params = {}) {
    return new Promise((resolve, reject) => {
        const id = msgId++;
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
    });
}

await send('Page.enable');
await send('Runtime.enable');
await send('DOM.enable');

async function setViewport(width, height) {
    await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: false
    });
}

async function capture(filename) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    const fullPath = path.join(outDir, filename);
    fs.writeFileSync(fullPath, buffer);
    console.log(`Saved screenshot: ${filename} (${buffer.length} bytes)`);
}

async function run() {
    await setViewport(1440, 900);

    const studentUser = {
        id: 'student-demo',
        name: 'Ananya Sharma',
        email: 'ananya.cs21@kssem.edu.in',
        role: 'student',
        usn: '1KS21CS042',
        department: 'Computer Science',
        semester: '6'
    };
    const jsonStr = JSON.stringify(studentUser);

    // ── 1. Public Gateway ──
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 1200));
    await send('Runtime.evaluate', {
        expression: `
            localStorage.setItem('theme', 'dark');
            document.documentElement.classList.add('dark');
            window.scrollTo(0, 0);
        `
    });
    await new Promise(r => setTimeout(r, 800));
    await capture('nexus_declutter_public_gateway_1440.png');

    // ── 2. Campus Services Grid ──
    await send('Runtime.evaluate', {
        expression: `window.scrollTo(0, 520);`
    });
    await new Promise(r => setTimeout(r, 600));
    await capture('nexus_declutter_campus_services_1440.png');

    // ── 3. Student Dashboard (authenticated) ──
    await send('Runtime.evaluate', {
        expression: `
            localStorage.setItem('nexus_mock_auth_user', ${JSON.stringify(jsonStr)});
            localStorage.setItem('nexus_unified_auth_user', ${JSON.stringify(jsonStr)});
            localStorage.setItem('nexus_student_usn', '1KS21CS042');
            localStorage.setItem('theme', 'dark');
            document.documentElement.classList.add('dark');
            window.location.href = 'http://localhost:5173/dashboard';
        `
    });
    await new Promise(r => setTimeout(r, 2200));
    await send('Runtime.evaluate', {
        expression: `
            document.documentElement.classList.add('dark');
            window.scrollTo(0, 0);
        `
    });
    await new Promise(r => setTimeout(r, 600));
    await capture('nexus_declutter_student_dashboard_1440.png');

    // ── 4. Sidebar View (focus on clean sidebar without decorative badges) ──
    // Capture full screen with sidebar in view
    await capture('nexus_declutter_sidebar_1440.png');

    // ── 5. Print Hub ──
    await send('Page.navigate', { url: 'http://localhost:5173/print-hub' });
    await new Promise(r => setTimeout(r, 2200));
    await send('Runtime.evaluate', {
        expression: `
            document.documentElement.classList.add('dark');
            window.scrollTo(0, 200);
        `
    });
    await new Promise(r => setTimeout(r, 600));
    await capture('nexus_declutter_print_hub_1440.png');

    ws.close();
    chromeProc.kill();
    console.log('Declutter capture completed successfully.');
    process.exit(0);
}

run().catch(err => {
    console.error('Error during capture:', err);
    try { chromeProc.kill(); } catch (e) {}
    process.exit(1);
});

