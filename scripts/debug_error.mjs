import { spawn } from 'child_process';
import http from 'http';
import WebSocket from 'ws';

const chromeExe = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const remotePort = 9325;
const chromeProc = spawn(chromeExe, [
    `--remote-debugging-port=${remotePort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
], { stdio: 'ignore' });

await new Promise(r => setTimeout(r, 1500));
const list = await new Promise((res, rej) => http.get(`http://127.0.0.1:${remotePort}/json`, r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
}));
const target = list.find(t => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.on('open', r));

let id = 1;
const errs = [];
ws.on('message', d => {
    const p = JSON.parse(d);
    if (p.method === 'Console.messageAdded' && p.params.message.level === 'error') errs.push(p.params.message.text);
    if (p.method === 'Runtime.consoleAPICalled' && p.params.type === 'error') errs.push(p.params.args.map(a => a.value ?? a.description).join(' '));
});

function cmd(m, p = {}) {
    return new Promise((res, rej) => {
        const cur = id++;
        const fn = d => {
            const m = JSON.parse(d);
            if (m.id === cur) { ws.off('message', fn); m.error ? rej(m.error) : res(m.result); }
        };
        ws.on('message', fn);
        ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });
}

await cmd('Page.enable');
await cmd('Console.enable');
await cmd('Runtime.enable');

const authScript = `
    const u = { id: 'demo-student-1', uid: 'demo-student-1', name: 'Ananya Sharma', email: 'ananya.s@kssem.edu.in', role: 'student', usn: '1KS21CS088', departmentId: 'CSE', semester: '6' };
    const s = { eduhub: u, canteen: u, printhub: u, library: u, transit: u, bustracking: u, events: u, complaints: u };
    localStorage.setItem('nexus_unified_auth_user', JSON.stringify(u));
    localStorage.setItem('nexus_demo_auth_user', JSON.stringify(u));
    localStorage.setItem('nexus_domain_auth_sessions', JSON.stringify(s));
    localStorage.setItem('nexus_student_usn', '1KS21CS088');
    localStorage.setItem('nexus_current_domain', 'bustracking');
`;
await cmd('Page.navigate', { url: 'http://localhost:5173/' });
await new Promise(r => setTimeout(r, 1500));
await cmd('Runtime.evaluate', { expression: authScript });
await cmd('Page.navigate', { url: 'http://localhost:5173/bus-tracking' });
await new Promise(r => setTimeout(r, 3000));

const errHtml = await cmd('Runtime.evaluate', {
    expression: `(() => {
        const details = document.querySelector('details');
        if (details) {
            details.open = true;
            return details.innerText;
        }
        return document.body.innerHTML;
    })()`
});
console.log('Error content:\n', errHtml.result?.value);

ws.close();
chromeProc.kill();
process.exit(0);
