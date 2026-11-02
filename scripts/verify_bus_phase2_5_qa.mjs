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

const remotePort = 9302;
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

await new Promise(r => setTimeout(r, 2500));

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
const consoleLogs = [];
const consoleErrors = [];
const networkFailures = [];

ws.on('message', (raw) => {
    try {
        const msg = JSON.parse(raw);
        if (msg.method === 'Console.messageAdded') {
            const m = msg.params.message;
            if (m.level === 'error') {
                consoleErrors.push(`[${m.level.toUpperCase()}] ${m.text}`);
            } else {
                consoleLogs.push(`[${m.level}] ${m.text}`);
            }
        }
        if (msg.method === 'Runtime.consoleAPICalled') {
            const t = msg.params.type;
            const args = msg.params.args.map(a => a.value ?? a.description ?? JSON.stringify(a)).join(' ');
            if (t === 'error') {
                consoleErrors.push(`[CONSOLE.ERROR] ${args}`);
            } else {
                consoleLogs.push(`[CONSOLE.${t}] ${args}`);
            }
        }
        if (msg.method === 'Network.loadingFailed') {
            networkFailures.push(msg.params);
        }
    } catch (e) {}
});

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
await sendCommand('Console.enable');
await sendCommand('Runtime.enable');

async function setViewport(width, height, isMobile = false) {
    await sendCommand('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: isMobile
    });
    await sendCommand('Emulation.setVisibleSize', { width, height });
}

async function navigateAndWait(url, waitMs = 3000) {
    await sendCommand('Page.navigate', { url });
    await new Promise(r => setTimeout(r, waitMs));
}

async function saveScreenshot(filename) {
    const params = { format: 'png' };
    const res = await sendCommand('Page.captureScreenshot', params);
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(path.join(outDir, filename), buf);
    console.log(`Saved screenshot: ${filename} (${buf.length} bytes)`);
}

async function evaluate(fnStr) {
    const res = await sendCommand('Runtime.evaluate', {
        expression: `(${fnStr})()`,
        returnByValue: true,
        awaitPromise: true
    });
    return res?.result?.value;
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

const qaResults = {
    screenshots: [],
    modeSwitching: {},
    routeSwitching: {},
    fullScreenMap: {},
    mobileAudit: {},
    consoleErrors: [],
    networkFailures: []
};

try {
    console.log('--- Step 1: Initial Authentication & Dark Mode Setup ---');
    await setViewport(1440, 900);
    await navigateAndWait('http://localhost:5173/');
    await sendCommand('Runtime.evaluate', {
        expression: `
            localStorage.setItem('darkMode', 'false');
            document.documentElement.classList.remove('dark');
            ${authScript}
        `
    });
    await navigateAndWait('http://localhost:5173/', 1000);

    // ── 1. Desktop 1440x900 - Light DEMO Mode ──
    console.log('--- Step 2: Bus Tracking Light DEMO Mode ---');
    await navigateAndWait('http://localhost:5173/bus-tracking', 3500);
    await saveScreenshot('bus_qa_light_demo_1440.png');
    qaResults.screenshots.push('bus_qa_light_demo_1440.png');

    // ── 2. Route Switching Test in Light Mode ──
    console.log('--- Step 3: Route Switching Test ---');
    const routeSwitchLog = await evaluate(`() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const routeBtns = buttons.filter(b => b.innerText && (/S1|F1|F2|F3|F4|F5/.test(b.innerText)));
        const results = [];
        
        // Find and click F1
        const f1Btn = routeBtns.find(b => b.innerText.includes('F1'));
        if (f1Btn) {
            f1Btn.click();
            results.push('Clicked F1');
        }
        return {
            foundRouteButtons: routeBtns.map(b => b.innerText.replace(/\\n/g, ' ')),
            results
        };
    }`);
    await new Promise(r => setTimeout(r, 1500));
    qaResults.routeSwitching = routeSwitchLog;
    await saveScreenshot('bus_qa_route_f1_1440.png');
    qaResults.screenshots.push('bus_qa_route_f1_1440.png');

    // Switch back to S1
    await evaluate(`() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const s1Btn = buttons.find(b => b.innerText && b.innerText.includes('S1'));
        if (s1Btn) s1Btn.click();
    }`);
    await new Promise(r => setTimeout(r, 1000));

    // ── 3. Switch to LIVE MQTT Mode in Light Mode ──
    console.log('--- Step 4: Mode Switch to LIVE MQTT Mode ---');
    const liveSwitchLog = await evaluate(`() => {
        const liveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('LIVE MQTT'));
        if (liveBtn) {
            liveBtn.click();
            return 'Clicked LIVE MQTT';
        }
        return 'LIVE MQTT button not found';
    }`);
    await new Promise(r => setTimeout(r, 2000));
    await saveScreenshot('bus_qa_light_live_1440.png');
    qaResults.screenshots.push('bus_qa_light_live_1440.png');

    // Check LIVE telemetry status in DOM
    const liveTelemetryCheck = await evaluate(`() => {
        const bodyText = document.body.innerText;
        const hasLiveIndicator = bodyText.includes('LIVE MQTT STREAM') || bodyText.includes('LIVE MQTT');
        const hasNoFix = bodyText.includes('NO HARDWARE FIX') || bodyText.includes('DISCONNECTED') || bodyText.includes('CONNECTING');
        const etaText = Array.from(document.querySelectorAll('*'))
            .filter(el => el.innerText && el.innerText.includes('ESTIMATED ARRIVAL'))
            .map(el => el.innerText.slice(0, 100));
        return {
            hasLiveIndicator,
            hasNoFix,
            etaText: etaText.slice(0, 3)
        };
    }`);
    qaResults.modeSwitching.live = liveTelemetryCheck;

    // ── 4. Fullscreen Map Verification ──
    console.log('--- Step 5: Fullscreen Map Test ---');
    const fullscreenOpenLog = await evaluate(`() => {
        const fullBtn = Array.from(document.querySelectorAll('button')).find(b => b.title && b.title.includes('Full screen') || (b.innerText && b.innerText.includes('Full')));
        if (fullBtn) {
            fullBtn.click();
            return 'Opened full map';
        }
        // Try finding button with maximize icon or title
        const mapActionBtns = Array.from(document.querySelectorAll('button')).filter(b => b.getAttribute('aria-label') === 'Full screen' || b.title === 'Full screen');
        if (mapActionBtns.length > 0) {
            mapActionBtns[0].click();
            return 'Opened full map via aria';
        }
        return 'Full map button not located';
    }`);
    await new Promise(r => setTimeout(r, 1500));
    await saveScreenshot('bus_qa_fullscreen_map_1440.png');
    qaResults.screenshots.push('bus_qa_fullscreen_map_1440.png');
    qaResults.fullScreenMap.open = fullscreenOpenLog;

    // Close full screen
    const fullscreenCloseLog = await evaluate(`() => {
        const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Close') || b.title === 'Close' || b.getAttribute('aria-label') === 'Close');
        if (closeBtn) {
            closeBtn.click();
            return 'Closed full map';
        }
        // ESC key event
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        return 'Dispatched ESC key';
    }`);
    await new Promise(r => setTimeout(r, 1000));
    qaResults.fullScreenMap.close = fullscreenCloseLog;

    // Switch back to DEMO Mode before dark mode
    await evaluate(`() => {
        const demoBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('DEMO MODE'));
        if (demoBtn) demoBtn.click();
    }`);
    await new Promise(r => setTimeout(r, 1000));

    // ── 5. Dark Mode DEMO & LIVE ──
    console.log('--- Step 6: Dark Mode DEMO & LIVE Mode ---');
    await sendCommand('Runtime.evaluate', {
        expression: `
            localStorage.setItem('darkMode', 'true');
            document.documentElement.classList.add('dark');
        `
    });
    await new Promise(r => setTimeout(r, 1000));
    await saveScreenshot('bus_qa_dark_demo_1440.png');
    qaResults.screenshots.push('bus_qa_dark_demo_1440.png');

    // Dark Live Mode
    await evaluate(`() => {
        const liveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('LIVE MQTT'));
        if (liveBtn) liveBtn.click();
    }`);
    await new Promise(r => setTimeout(r, 1500));
    await saveScreenshot('bus_qa_dark_live_1440.png');
    qaResults.screenshots.push('bus_qa_dark_live_1440.png');

    // Switch back to DEMO
    await evaluate(`() => {
        const demoBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('DEMO MODE'));
        if (demoBtn) demoBtn.click();
    }`);
    await new Promise(r => setTimeout(r, 1000));

    // ── 6. Mobile 390x844 Viewport Verification ──
    console.log('--- Step 7: Mobile 390x844 Viewport Verification ---');
    await setViewport(390, 844, true);
    await new Promise(r => setTimeout(r, 1500));
    await saveScreenshot('bus_qa_mobile_dark_390.png');
    qaResults.screenshots.push('bus_qa_mobile_dark_390.png');

    // Mobile Light Mode
    await sendCommand('Runtime.evaluate', {
        expression: `
            localStorage.setItem('darkMode', 'false');
            document.documentElement.classList.remove('dark');
        `
    });
    await new Promise(r => setTimeout(r, 1500));
    await saveScreenshot('bus_qa_mobile_light_390.png');
    qaResults.screenshots.push('bus_qa_mobile_light_390.png');

    // Mobile layout audit
    const mobileMetrics = await evaluate(`() => {
        const mapEl = document.querySelector('.maplibregl-map');
        const rect = mapEl ? mapEl.getBoundingClientRect() : null;
        const bodyWidth = document.body.clientWidth;
        const scrollWidth = document.body.scrollWidth;
        const hasHorizontalScroll = scrollWidth > bodyWidth;
        return {
            bodyWidth,
            scrollWidth,
            hasHorizontalScroll,
            mapRect: rect ? { width: Math.round(rect.width), height: Math.round(rect.height) } : null
        };
    }`);
    qaResults.mobileAudit = mobileMetrics;

    console.log('All QA steps completed successfully!');
} catch (err) {
    console.error('QA script encountered an error:', err);
} finally {
    qaResults.consoleErrors = consoleErrors;
    qaResults.networkFailures = networkFailures.map(f => ({
        url: f.requestId,
        errorText: f.errorText,
        type: f.type
    }));
    fs.writeFileSync('scripts/bus_qa_results.json', JSON.stringify(qaResults, null, 2));
    console.log(`Saved QA results to scripts/bus_qa_results.json with ${consoleErrors.length} errors, ${networkFailures.length} net failures.`);
    try { ws.close(); } catch(e) {}
    chromeProc.kill();
    process.exit(0);
}
