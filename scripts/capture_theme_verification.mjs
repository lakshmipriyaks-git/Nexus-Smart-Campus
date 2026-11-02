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

const remotePort = 9288;
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
        mobile: false
    });
    await sendCommand('Emulation.setVisibleSize', { width, height });
}

async function navigateAndWait(url, waitMs = 3000) {
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
    await setViewport(1440, 900);

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

    // ──────────────────────────────────────────────
    // 1. LIGHT MODE TEST (darkMode = false)
    // ──────────────────────────────────────────────
    await navigateAndWait('http://localhost:5173/');
    await sendCommand('Runtime.evaluate', {
        expression: `
            localStorage.setItem('darkMode', 'false');
            document.documentElement.classList.remove('dark');
            ${authScript}
        `
    });
    await navigateAndWait('http://localhost:5173/', 2500);

    // 1. Light Mode - Public Gateway
    await saveScreenshot('nexus_theme_light_public_gateway_1440.png', {
        x: 0,
        y: 0,
        width: 1440,
        height: 800,
        scale: 1
    });

    // 2. Light Mode - Campus Services
    await sendCommand('Runtime.evaluate', {
        expression: `window.scrollTo(0, 680);`
    });
    await new Promise(r => setTimeout(r, 600));
    await saveScreenshot('nexus_theme_light_campus_services_1440.png', {
        x: 0,
        y: 0,
        width: 1440,
        height: 850,
        scale: 1
    });

    // 3. Light Mode - Student Dashboard
    await navigateAndWait('http://localhost:5173/dashboard', 2500);
    await saveScreenshot('nexus_theme_light_student_dashboard_1440.png', {
        x: 0,
        y: 0,
        width: 1440,
        height: 900,
        scale: 1
    });

    // 3b. Light Mode - Teacher Dashboard (Faculty OS)
    const teacherAuthScript = `
        const tu = {
            id: 'demo-teacher-1',
            uid: 'demo-teacher-1',
            name: 'Dr. Ramesh Kumar',
            email: 'ramesh.k@kssem.edu.in',
            role: 'teacher',
            departmentId: 'CSE'
        };
        const ts = { eduhub: tu, canteen: tu, printhub: tu, library: tu, transit: tu, events: tu, complaints: tu };
        localStorage.setItem('nexus_unified_auth_user', JSON.stringify(tu));
        localStorage.setItem('nexus_demo_auth_user', JSON.stringify(tu));
        localStorage.setItem('nexus_domain_auth_sessions', JSON.stringify(ts));
    `;
    await sendCommand('Runtime.evaluate', { expression: teacherAuthScript });
    await navigateAndWait('http://localhost:5173/dashboard', 2500);
    await saveScreenshot('nexus_theme_light_faculty_os_1440.png', {
        x: 0,
        y: 0,
        width: 1440,
        height: 900,
        scale: 1
    });

    // 3c. Light Mode - HOD Dashboard (Governance)
    const hodAuthScript = `
        const hu = {
            id: 'demo-hod-1',
            uid: 'demo-hod-1',
            name: 'Dr. Sudhir Rao',
            email: 'sudhir.r@kssem.edu.in',
            role: 'hod',
            departmentId: 'CSE'
        };
        const hs = { eduhub: hu, canteen: hu, printhub: hu, library: hu, transit: hu, events: hu, complaints: hu };
        localStorage.setItem('nexus_unified_auth_user', JSON.stringify(hu));
        localStorage.setItem('nexus_demo_auth_user', JSON.stringify(hu));
        localStorage.setItem('nexus_domain_auth_sessions', JSON.stringify(hs));
    `;
    await sendCommand('Runtime.evaluate', { expression: hodAuthScript });
    await navigateAndWait('http://localhost:5173/dashboard', 2500);
    await saveScreenshot('nexus_theme_light_hod_governance_1440.png', {
        x: 0,
        y: 0,
        width: 1440,
        height: 900,
        scale: 1
    });

    // Switch back to Student for Settings & BOB AI
    await sendCommand('Runtime.evaluate', { expression: authScript });

    // 4. Light Mode - Settings (Theme Selector)
    await navigateAndWait('http://localhost:5173/settings', 2000);
    await saveScreenshot('nexus_theme_light_settings_1440.png', {
        x: 0,
        y: 0,
        width: 1440,
        height: 900,
        scale: 1
    });

    // 5. Light Mode - BOB AI Widget
    await sendCommand('Runtime.evaluate', {
        expression: `
            const btn = document.querySelector('button[aria-label="Toggle BOB AI Copilot"]');
            if (btn) btn.click();
        `
    });
    await new Promise(r => setTimeout(r, 800));
    await saveScreenshot('nexus_theme_light_bob_ai_1440.png', {
        x: 0,
        y: 0,
        width: 1440,
        height: 900,
        scale: 1
    });

    // ──────────────────────────────────────────────
    // 6. DARK MODE TEST (darkMode = true)
    // ──────────────────────────────────────────────
    await sendCommand('Runtime.evaluate', {
        expression: `
            localStorage.setItem('darkMode', 'true');
            document.documentElement.classList.add('dark');
        `
    });
    await navigateAndWait('http://localhost:5173/dashboard', 2500);
    await saveScreenshot('nexus_theme_dark_student_dashboard_1440.png', {
        x: 0,
        y: 0,
        width: 1440,
        height: 900,
        scale: 1
    });

    console.log('All theme verification screenshots captured successfully.');
} catch (err) {
    console.error('Error during theme capture:', err);
} finally {
    ws.close();
    chromeProc.kill();
    process.exit(0);
}
