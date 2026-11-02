import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import WebSocket from 'ws';

const chromeExe = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const remotePort = 9312;
const chromeProc = spawn(chromeExe, [
    `--remote-debugging-port=${remotePort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-allow-origins=*',
    'about:blank'
], { stdio: 'ignore' });

await new Promise(r => setTimeout(r, 1500));
const list = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${remotePort}/json`, res => {
        let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
});
const target = list.find(t => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.on('open', r));

let id = 1;
function cmd(method, params = {}) {
    return new Promise((res, rej) => {
        const cur = id++;
        const fn = d => {
            const p = JSON.parse(d);
            if (p.id === cur) { ws.off('message', fn); p.error ? rej(p.error) : res(p.result); }
        };
        ws.on('message', fn);
        ws.send(JSON.stringify({ id: cur, method, params }));
    });
}

await cmd('Page.enable');
await cmd('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await cmd('Page.navigate', { url: 'http://localhost:5173/' });
await new Promise(r => setTimeout(r, 1000));

const authScript = `
    const u = { id: 'demo-student-1', uid: 'demo-student-1', name: 'Ananya Sharma', email: 'ananya.s@kssem.edu.in', role: 'student', usn: '1KS21CS088', departmentId: 'CSE', semester: '6' };
    const s = { eduhub: u, canteen: u, printhub: u, library: u, transit: u, bustracking: u, events: u, complaints: u };
    localStorage.setItem('nexus_unified_auth_user', JSON.stringify(u));
    localStorage.setItem('nexus_demo_auth_user', JSON.stringify(u));
    localStorage.setItem('nexus_domain_auth_sessions', JSON.stringify(s));
    localStorage.setItem('nexus_student_usn', '1KS21CS088');
    localStorage.setItem('darkMode', 'false');
    document.documentElement.classList.remove('dark');
`;
await cmd('Runtime.evaluate', { expression: authScript });
await cmd('Page.navigate', { url: 'http://localhost:5173/bus-tracking' });
await new Promise(r => setTimeout(r, 3000));

// Select Route F1
await cmd('Runtime.evaluate', { expression: `(() => {
    const sel = document.querySelector('select');
    if (sel) {
        sel.value = 'F1';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
})()` });

await new Promise(r => setTimeout(r, 2000));
const snap = await cmd('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync('C:/Users/laksh/.gemini/antigravity/brain/9d3dd8bf-0f4e-4423-97a9-8f91a985600f/screenshots/bus_qa_route_f1_selected_1440.png', Buffer.from(snap.data, 'base64'));
console.log('Saved F1 route screenshot!');
ws.close();
chromeProc.kill();
process.exit(0);

