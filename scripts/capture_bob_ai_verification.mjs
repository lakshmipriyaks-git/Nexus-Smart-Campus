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

const remotePort = 9325;
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
    console.log("Navigating to setup session...");
    await setViewport(1440, 900, false);
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 1000));
    
    // 1. Desktop 1440x900 - Light Theme on Student Dashboard
    console.log("1. Setting light mode and navigating to /dashboard...");
    await sendCommand('Runtime.evaluate', {
        expression: `
            localStorage.setItem('darkMode', 'false');
            document.documentElement.classList.remove('dark');
            ${authScript}
        `
    });
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/dashboard' });
    await new Promise(r => setTimeout(r, 2500));

    // Open BOB AI chat widget
    console.log("Opening BOB AI widget in Light Mode...");
    await sendCommand('Runtime.evaluate', {
        expression: `(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('BOB AI'));
            if (btn) btn.click();
        })()`
    });
    await new Promise(r => setTimeout(r, 1500));
    await saveScreenshot('bob_ai_light_dashboard_1440.png');

    // 2. Click suggestion chip to test intelligent prompt response
    console.log("2. Clicking attendance suggestion chip...");
    await sendCommand('Runtime.evaluate', {
        expression: `(() => {
            const chip = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('attendance summary'));
            if (chip) chip.click();
        })()`
    });
    // Wait for streaming completion
    await new Promise(r => setTimeout(r, 5000));
    await saveScreenshot('bob_ai_light_attendance_response_1440.png');

    // 3. Switch to Dark Mode on Dashboard
    console.log("3. Toggling to Dark Mode on Dashboard...");
    await sendCommand('Runtime.evaluate', {
        expression: `
            localStorage.setItem('darkMode', 'true');
            document.documentElement.classList.add('dark');
        `
    });
    await new Promise(r => setTimeout(r, 1500));
    await saveScreenshot('bob_ai_dark_dashboard_1440.png');

    // 4. Global Accessibility Check: Navigate to Bus Tracking (/bus-tracking) in Dark Mode
    console.log("4. Navigating to /bus-tracking in Dark Mode with BOB AI open...");
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/bus-tracking' });
    await new Promise(r => setTimeout(r, 3000));
    // Click BOB FAB to open on bus tracking page
    await sendCommand('Runtime.evaluate', {
        expression: `(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('BOB AI'));
            if (btn) btn.click();
        })()`
    });
    await new Promise(r => setTimeout(r, 1500));
    await saveScreenshot('bob_ai_dark_bus_tracking_1440.png');

    // 5. Mobile Responsiveness: 390x844 Light Mode
    console.log("5. Testing Mobile 390x844 Light Mode...");
    await setViewport(390, 844, true);
    await sendCommand('Runtime.evaluate', {
        expression: `
            localStorage.setItem('darkMode', 'false');
            document.documentElement.classList.remove('dark');
        `
    });
    await sendCommand('Page.navigate', { url: 'http://localhost:5173/dashboard' });
    await new Promise(r => setTimeout(r, 2500));
    await sendCommand('Runtime.evaluate', {
        expression: `(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('BOB AI'));
            if (btn) btn.click();
        })()`
    });
    await new Promise(r => setTimeout(r, 1500));
    await saveScreenshot('bob_ai_mobile_light_390.png');

    // 6. Mobile Responsiveness: 390x844 Dark Mode
    console.log("6. Testing Mobile 390x844 Dark Mode...");
    await sendCommand('Runtime.evaluate', {
        expression: `
            localStorage.setItem('darkMode', 'true');
            document.documentElement.classList.add('dark');
        `
    });
    await new Promise(r => setTimeout(r, 1500));
    await saveScreenshot('bob_ai_mobile_dark_390.png');

    console.log("ALL BOB AI SCREENSHOTS CAPTURED SUCCESSFULLY!");
} catch (err) {
    console.error("Error during BOB AI screenshot capture:", err);
} finally {
    try { ws.close(); } catch (_) {}
    try { chromeProc.kill(); } catch (_) {}
}

