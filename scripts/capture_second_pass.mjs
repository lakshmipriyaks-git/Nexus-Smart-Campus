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

const remotePort = 9292;
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

async function setViewport(width, height, isMobile = false) {
    await sendCommand('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: isMobile
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

const studentAuth = `
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
    const s = {
        eduhub: u,
        canteen: u,
        printhub: u,
        library: u,
        transit: u,
        events: u,
        complaints: u
    };
    localStorage.setItem('nexus_unified_auth_user', JSON.stringify(u));
    localStorage.setItem('nexus_demo_auth_user', JSON.stringify(u));
    localStorage.setItem('nexus_domain_auth_sessions', JSON.stringify(s));
    localStorage.setItem('nexus_student_usn', '1KS21CS088');
`;

const teacherAuth = `
    const tu = {
        id: 'demo-teacher-1',
        uid: 'demo-teacher-1',
        name: 'Dr. Ramesh Kumar',
        email: 'ramesh.k@kssem.edu.in',
        role: 'teacher',
        departmentId: 'CSE'
    };
    const ts = {
        eduhub: tu,
        canteen: tu,
        printhub: tu,
        library: tu,
        transit: tu,
        events: tu,
        complaints: tu
    };
    localStorage.setItem('nexus_unified_auth_user', JSON.stringify(tu));
    localStorage.setItem('nexus_demo_auth_user', JSON.stringify(tu));
    localStorage.setItem('nexus_domain_auth_sessions', JSON.stringify(ts));
`;

try {
    // ----------------------------------------------------
    // 1. DESKTOP VIEWPORT (1440x900)
    // ----------------------------------------------------
    await setViewport(1440, 900);

    // 1A. Public Gateway (Light Mode)
    await navigateAndWait('http://localhost:5173/');
    await sendCommand('Runtime.evaluate', {
        expression: `
            localStorage.setItem('darkMode', 'false');
            document.documentElement.classList.remove('dark');
            ${studentAuth}
        `
    });
    await navigateAndWait('http://localhost:5173/', 2000);
    await saveScreenshot('nexus_v2_light_public_gateway_1440.png');

    // 1B. Campus Services Discovery (Light Mode)
    await sendCommand('Runtime.evaluate', {
        expression: `window.scrollTo(0, 750);`
    });
    await new Promise(r => setTimeout(r, 600));
    await saveScreenshot('nexus_v2_light_campus_services_1440.png');

    // 1C. Student Dashboard - Focus Timer (Light Mode)
    await navigateAndWait('http://localhost:5173/dashboard', 2500);
    // Scroll down to where Focus Timer and widgets are placed
    await sendCommand('Runtime.evaluate', {
        expression: `window.scrollTo(0, 400);`
    });
    await new Promise(r => setTimeout(r, 600));
    await saveScreenshot('nexus_v2_light_student_dashboard_timer_1440.png');

    // 1D. Student Dashboard - Focus Timer (Dark Mode)
    await sendCommand('Runtime.evaluate', {
        expression: `
            localStorage.setItem('darkMode', 'true');
            document.documentElement.classList.add('dark');
        `
    });
    await new Promise(r => setTimeout(r, 800));
    await saveScreenshot('nexus_v2_dark_student_dashboard_timer_1440.png');

    // Switch back to Light Mode for remaining tests
    await sendCommand('Runtime.evaluate', {
        expression: `
            localStorage.setItem('darkMode', 'false');
            document.documentElement.classList.remove('dark');
        `
    });
    await new Promise(r => setTimeout(r, 500));

    // 1E. Student Edit Profile (Light Mode)
    await navigateAndWait('http://localhost:5173/profile', 2500);
    await saveScreenshot('nexus_v2_light_student_profile_1440.png');

    // 1F. Teacher Edit Profile (Light Mode)
    await sendCommand('Runtime.evaluate', { expression: teacherAuth });
    await navigateAndWait('http://localhost:5173/profile', 2500);
    await saveScreenshot('nexus_v2_light_teacher_profile_1440.png');

    // Reset back to student auth
    await sendCommand('Runtime.evaluate', { expression: studentAuth });

    // 1G. Bus Tracking (Light Mode)
    await navigateAndWait('http://localhost:5173/bus-tracking', 3000);
    // Click on a route to show the vehicle information overlay if needed
    await sendCommand('Runtime.evaluate', {
        expression: `
            const btn = document.querySelector('button[class*="rounded-xl"]');
            if (btn) btn.click();
        `
    });
    await new Promise(r => setTimeout(r, 1000));
    await saveScreenshot('nexus_v2_light_bus_tracking_1440.png');

    // ----------------------------------------------------
    // 2. MOBILE VIEWPORT (390x844)
    // ----------------------------------------------------
    await setViewport(390, 844, true);

    // 2A. Mobile Public Gateway
    await navigateAndWait('http://localhost:5173/', 2000);
    await saveScreenshot('nexus_v2_mobile_gateway_390.png');

    // 2B. Mobile Student Dashboard / Focus Timer
    await navigateAndWait('http://localhost:5173/dashboard', 2500);
    await saveScreenshot('nexus_v2_mobile_student_dashboard_390.png');

    // 2C. Mobile Bus Tracking
    await navigateAndWait('http://localhost:5173/bus-tracking', 2500);
    await saveScreenshot('nexus_v2_mobile_bus_tracking_390.png');

    console.log('All verification screenshots successfully captured!');
} catch (err) {
    console.error('Screenshot capture failed:', err);
} finally {
    try { ws.close(); } catch(e) {}
    chromeProc.kill();
    process.exit(0);
}

