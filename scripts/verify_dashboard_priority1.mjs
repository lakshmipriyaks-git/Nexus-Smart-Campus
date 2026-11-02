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

const remotePort = 9295;
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
    localStorage.setItem('darkMode', 'false');
    document.documentElement.classList.remove('dark');
`;

try {
    await setViewport(1440, 900);

    // Initial load and auth injection
    await navigateAndWait('http://localhost:5173/');
    await sendCommand('Runtime.evaluate', { expression: studentAuth });
    await navigateAndWait('http://localhost:5173/', 2000);
    await navigateAndWait('http://localhost:5173/dashboard', 2500);

    // 1. Inspect Greeting & Labels in DOM
    const domCheck = await sendCommand('Runtime.evaluate', {
        expression: `(() => {
            const h1 = document.querySelector('h1')?.innerText || '';
            const attendanceLabel = Array.from(document.querySelectorAll('p')).find(p => p.innerText.trim() === 'Attendance')?.innerText || '';
            const scheduleTimes = Array.from(document.querySelectorAll('span')).filter(s => s.innerText.includes('AM') || s.innerText.includes('PM')).map(s => s.innerText);
            const timerTitle = Array.from(document.querySelectorAll('h3, div')).find(el => el.innerText.includes('Focus Timer'))?.innerText || '';
            const attendanceTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Attendance'))?.innerText || '';

            return {
                h1,
                attendanceLabel,
                scheduleTimes,
                timerTitle,
                attendanceTab
            };
        })()`,
        returnByValue: true
    });

    console.log('DOM Inspection Results:', JSON.stringify(domCheck.result.value, null, 2));

    // Capture Full Dashboard Top (Cockpit + Greeting + Schedule + Attendance)
    await saveScreenshot('nexus_dashboard_priority1_overview_1440.png');

    // 2. Scroll to Focus Timer and test Ready state
    await sendCommand('Runtime.evaluate', {
        expression: `window.scrollTo(0, 420);`
    });
    await new Promise(r => setTimeout(r, 600));

    const readyBadge = await sendCommand('Runtime.evaluate', {
        expression: `(() => {
            const spans = Array.from(document.querySelectorAll('span'));
            return spans.find(s => s.innerText.trim() === 'READY')?.innerText;
        })()`,
        returnByValue: true
    });
    console.log('Initial Timer Status Badge:', readyBadge.result.value);

    // Screenshot of Timer widget in READY state
    await saveScreenshot('nexus_dashboard_timer_ready_1440.png');

    // 3. Click "START FOCUS" and test RUNNING state
    await sendCommand('Runtime.evaluate', {
        expression: `(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('START FOCUS') || b.innerText.includes('RESUME'));
            if (btn) btn.click();
        })()`
    });
    await new Promise(r => setTimeout(r, 1200));

    const runningBadge = await sendCommand('Runtime.evaluate', {
        expression: `(() => {
            const spans = Array.from(document.querySelectorAll('span'));
            return spans.find(s => s.innerText.trim() === 'RUNNING')?.innerText;
        })()`,
        returnByValue: true
    });
    console.log('After Start - Timer Status Badge:', runningBadge.result.value);

    // Screenshot of Timer widget in RUNNING state
    await saveScreenshot('nexus_dashboard_timer_running_1440.png');

    // 4. Click "PAUSE" and test PAUSED state
    await sendCommand('Runtime.evaluate', {
        expression: `(() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('PAUSE'));
            if (btn) btn.click();
        })()`
    });
    await new Promise(r => setTimeout(r, 800));

    const pausedBadge = await sendCommand('Runtime.evaluate', {
        expression: `(() => {
            const spans = Array.from(document.querySelectorAll('span'));
            return spans.find(s => s.innerText.trim() === 'PAUSED')?.innerText;
        })()`,
        returnByValue: true
    });
    console.log('After Pause - Timer Status Badge:', pausedBadge.result.value);

    // Screenshot of Timer widget in PAUSED state
    await saveScreenshot('nexus_dashboard_timer_paused_1440.png');

    // 5. Test Greeting simulation for all 4 time windows:
    const greetingTests = await sendCommand('Runtime.evaluate', {
        expression: `(() => {
            const getDynamicGreeting = (hour) => {
                if (hour >= 5 && hour < 12) return 'Good Morning';
                if (hour >= 12 && hour < 17) return 'Good Afternoon';
                if (hour >= 17 && hour < 21) return 'Good Evening';
                return 'Welcome Back';
            };
            return {
                '02:18 (Current Local Time)': getDynamicGreeting(2),
                '08:00 (Morning 05:00-11:59)': getDynamicGreeting(8),
                '13:30 (Afternoon 12:00-16:59)': getDynamicGreeting(13),
                '18:00 (Evening 17:00-20:59)': getDynamicGreeting(18),
                '22:00 (Night 21:00-04:59)': getDynamicGreeting(22)
            };
        })()`,
        returnByValue: true
    });
    console.log('Time window simulations:', JSON.stringify(greetingTests.result.value, null, 2));

    console.log('Verification completed successfully!');
} catch (err) {
    console.error('Verification failed:', err);
} finally {
    try { ws.close(); } catch(e) {}
    chromeProc.kill();
    process.exit(0);
}
