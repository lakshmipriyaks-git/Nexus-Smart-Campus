import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import WebSocket from 'ws';

const chromePaths = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`
];
const chromeExe = chromePaths.find(p => p && fs.existsSync(p));
const remotePort = 9345;
const chromeProc = spawn(chromeExe, [
    `--remote-debugging-port=${remotePort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-allow-origins=*',
    'about:blank'
], { stdio: 'ignore' });

await new Promise(r => setTimeout(r, 2000));

const res = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${remotePort}/json`, r => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
});

const page = res.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, rej) => { ws.on('open', r); ws.on('error', rej); });

let id = 1;
function send(method, params = {}) {
    return new Promise((resolve, reject) => {
        const cur = id++;
        const onMsg = (msg) => {
            const p = JSON.parse(msg);
            if (p.id === cur) {
                ws.off('message', onMsg);
                if (p.error) reject(new Error(p.error.message));
                else resolve(p.result);
            }
        };
        ws.on('message', onMsg);
        ws.send(JSON.stringify({ id: cur, method, params }));
    });
}

ws.on('message', (msg) => {
    const p = JSON.parse(msg);
    if (p.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', p.params.type, p.params.args.map(a => a.value || a.description || JSON.stringify(a)));
    }
    if (p.method === 'Log.entryAdded') {
        console.log('[BROWSER LOG]', p.params.entry);
    }
});

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');

const studentUser = {
    id: 'demo-student-1',
    uid: 'demo-student-1',
    name: 'Ananya Sharma',
    email: 'student@kssem.edu',
    role: 'student',
    usn: '1KS21CS088',
    departmentId: 'CSE',
    semester: '6'
};
const studentSessions = {
    eduhub: studentUser,
    canteen: studentUser,
    printhub: studentUser,
    library: studentUser,
    transit: studentUser,
    bustracking: studentUser,
    events: studentUser,
    complaints: studentUser
};

await send('Page.navigate', { url: 'http://localhost:5173/' });
await new Promise(r => setTimeout(r, 1000));

await send('Runtime.evaluate', {
    expression: `
        localStorage.setItem('darkMode', 'false');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('nexus_unified_auth_user', JSON.stringify(${JSON.stringify(studentUser)}));
        localStorage.setItem('nexus_demo_auth_user', JSON.stringify(${JSON.stringify(studentUser)}));
        localStorage.setItem('nexus_domain_auth_sessions', JSON.stringify(${JSON.stringify(studentSessions)}));
        localStorage.setItem('nexus_student_usn', '1KS21CS088');
    `
});

await send('Page.navigate', { url: 'http://localhost:5173/dashboard' });
await new Promise(r => setTimeout(r, 2000));

// Open BOB
await send('Runtime.evaluate', {
    expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('BOB AI'));
        if (btn) btn.click();
    })()`
});
await new Promise(r => setTimeout(r, 1000));

// Inspect the input element and form
const inspectRes = await send('Runtime.evaluate', {
    expression: `(() => {
        const input = document.querySelector('input[placeholder*="Ask BOB"]');
        const form = input?.closest('form');
        const submitBtn = form?.querySelector('button[type="submit"]');
        return {
            hasInput: !!input,
            inputValue: input?.value,
            hasForm: !!form,
            btnDisabled: submitBtn?.disabled,
            btnHtml: submitBtn?.outerHTML
        };
    })()`,
    returnByValue: true
});
console.log('Inspect Before Type:', inspectRes.result.value);

// Click suggestion chip directly to verify that works
const clickChip = await send('Runtime.evaluate', {
    expression: `(() => {
        const chip = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('attendance summary'));
        if (chip) {
            chip.click();
            return chip.innerText;
        }
        return false;
    })()`,
    returnByValue: true
});
console.log('Clicked Suggestion Chip:', clickChip.result.value);

// Wait and check what happens
for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const status = await send('Runtime.evaluate', {
        expression: `(() => {
            const msgs = Array.from(document.querySelectorAll('.shadow-2xl .prose')).map(p => p.innerText);
            return {
                count: msgs.length,
                lastMsg: msgs[msgs.length - 1]?.slice(0, 100)
            };
        })()`,
        returnByValue: true
    });
    console.log(`Step ${i+1}:`, status.result.value);
}

ws.close();
chromeProc.kill();

