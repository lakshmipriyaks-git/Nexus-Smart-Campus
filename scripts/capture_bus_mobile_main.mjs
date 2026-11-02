import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

const outDir = 'C:/Users/laksh/.gemini/antigravity/brain/9d3dd8bf-0f4e-4423-97a9-8f91a985600f/screenshots';
const chromePaths = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`
];
const chromeExe = chromePaths.find(p => fs.existsSync(p));

const remotePort = 9305;
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

async function setViewport(width, height) {
    await sendCommand('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: true
    });
    await sendCommand('Emulation.setVisibleSize', { width, height });
}

async function saveScreenshot(filename) {
    const params = { format: 'png' };
    const res = await sendCommand('Page.captureScreenshot', params);
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(path.join(outDir, filename), buf);
    console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
}

const authScript = `
    const u = {
        id: 'demo-student-1',
        uid: 'demo-student-1',
        name: 'Ananya Sharma',
        email: 'ananya.s@kssem.edu.in',
        role: 'student',
        usn: '1KS21CS088',
        departmentId: 'CSE',
        semester: '6'
    };
    const s = { eduhub: u, canteen: u, printhub: u, library: u, transit: u, bustracking: u, events: u, complaints: u };
    localStorage.setItem('nexus_unified_auth_user', JSON.stringify(u));
    localStorage.setItem('nexus_demo_auth_user', JSON.stringify(u));
    localStorage.setItem('nexus_domain_auth_sessions', JSON.stringify(s));
    localStorage.setItem('nexus_student_usn', '1KS21CS088');
`;

try {
    await setViewport(390, 844);

    // 1. Mobile Light Mode
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 1000));
    await sendCommand('Runtime.evaluate', {
        expression: `
            localStorage.setItem('darkMode', 'false');
            document.documentElement.classList.remove('dark');
            ${authScript}
        `
    });
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/bus-tracking' });
    await new Promise(r => setTimeout(r, 3500));
    await saveScreenshot('bus_qa_mobile_main_light_390.png');

    // 2. Mobile Dark Mode
    await sendCommand('Runtime.evaluate', {
        expression: `
            localStorage.setItem('darkMode', 'true');
            document.documentElement.classList.add('dark');
        `
    });
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/bus-tracking' });
    await new Promise(r => setTimeout(r, 3000));
    await saveScreenshot('bus_qa_mobile_main_dark_390.png');

    console.log('Mobile screenshots captured successfully.');
} catch (e) {
    console.error('Mobile capture failed:', e);
} finally {
    try { ws.close(); } catch(e) {}
    chromeProc.kill();
    process.exit(0);
}

