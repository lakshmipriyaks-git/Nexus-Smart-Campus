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
const chromeExe = chromePaths.find(p => fs.existsSync(p));

if (!chromeExe) {
    console.error('Chrome executable not found');
    process.exit(1);
}

const remotePort = 9266;
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
await sendCommand('Network.enable');

async function setViewport(width, height) {
    await sendCommand('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 768
    });
    await sendCommand('Emulation.setVisibleSize', { width, height });
}

async function navigateAndWait(url, waitMs = 2500) {
    await sendCommand('Page.navigate', { url });
    await new Promise(r => setTimeout(r, waitMs));
}

async function saveScreenshot(filename, clip = null) {
    const params = { format: 'png' };
    if (clip) params.clip = clip;
    const res = await sendCommand('Page.captureScreenshot', params);
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(path.join(outDir, filename), buf);
    console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
}

try {
    // 1. Public Gateway Desktop View
    await setViewport(1440, 900);
    await navigateAndWait('http://localhost:5173/');
    await saveScreenshot('nexus_brand_public_gateway_1440.png', {
        x: 0,
        y: 0,
        width: 1440,
        height: 780,
        scale: 1
    });

    // 2. Campus Services grid on Home Page
    await sendCommand('Runtime.evaluate', {
        expression: `window.scrollTo(0, 680);`
    });
    await new Promise(r => setTimeout(r, 600));
    await saveScreenshot('nexus_brand_campus_services_1440.png', {
        x: 0,
        y: 0,
        width: 1440,
        height: 850,
        scale: 1
    });

    // 3. Authenticated Dashboard with Sidebar
    await sendCommand('Runtime.evaluate', {
        expression: `
            localStorage.setItem('nexus_demo_auth_user', JSON.stringify({
                id: 'demo-student-1',
                name: 'Ananya Sharma',
                email: 'ananya.s@kssem.edu.in',
                role: 'student',
                usn: '1KS21CS088',
                departmentId: 'CSE',
                semester: '6'
            }));
        `
    });
    await navigateAndWait('http://localhost:5173/dashboard');
    await saveScreenshot('nexus_brand_authenticated_sidebar_1440.png', {
        x: 0,
        y: 0,
        width: 1440,
        height: 900,
        scale: 1
    });

    // 4. Mobile Viewport (390 x 844)
    await setViewport(390, 844);
    await navigateAndWait('http://localhost:5173/');
    await saveScreenshot('nexus_brand_mobile_gateway_390.png', {
        x: 0,
        y: 0,
        width: 390,
        height: 844,
        scale: 1
    });

    console.log('Branding capture completed successfully.');
} catch (err) {
    console.error('Error during capture:', err);
} finally {
    ws.close();
    chromeProc.kill();
    process.exit(0);
}

