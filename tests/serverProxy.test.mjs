import test from 'node:test';
import assert from 'node:assert/strict';

const PROXY_URL = 'http://localhost:3001';

test('1. Proxy Health Check: Confirms Firebase Admin verifyIdToken() enforcement', async () => {
    const res = await fetch(`${PROXY_URL}/api/bob/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'online');
    assert.strictEqual(data.model, 'gemini-3.8-flash');
    assert.strictEqual(data.keyConfigured, true);
    assert.ok(data.authEnforcement.includes('verifyIdToken(token, true)'));
    assert.ok(Array.isArray(data.allowedOrigins));
});

test('2. Content-Type Validation: Rejects non-JSON POST requests with HTTP 415', async () => {
    const res = await fetch(`${PROXY_URL}/api/bob/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'hello'
    });
    assert.strictEqual(res.status, 415);
    const json = await res.json();
    assert.strictEqual(json.code, 'INVALID_CONTENT_TYPE');
});

test('3. Authentication Barrier: Rejects requests missing Authorization header with HTTP 401', async () => {
    const res = await fetch(`${PROXY_URL}/api/bob/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Hello' })
    });
    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.code, 'AUTH_REQUIRED');
});

test('4. Malformed/Invalid Token: Rejects invalid Firebase tokens with HTTP 401 INVALID_TOKEN', async () => {
    const res = await fetch(`${PROXY_URL}/api/bob/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer malformed-jwt-token'
        },
        body: JSON.stringify({ prompt: 'Hello' })
    });
    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.code, 'INVALID_TOKEN');
});

test('5. Expired Token Enforcement: Rejects expired Firebase ID tokens with HTTP 401 TOKEN_EXPIRED', async () => {
    const res = await fetch(`${PROXY_URL}/api/bob/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer expired-jwt-token'
        },
        body: JSON.stringify({ prompt: 'Hello' })
    });
    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.code, 'TOKEN_EXPIRED');
});

test('6. Privilege Escalation Prevention: Ignores client x-user-role and derives role from trusted records', async () => {
    // Student token attempting to send x-user-role: hod to access grade sheet endpoint
    const res = await fetch(`${PROXY_URL}/api/bob/analyze-grade-sheet`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-student-token',
            'x-user-role': 'hod' // Malicious spoof attempt
        },
        body: JSON.stringify({ imageBase64: 'dGVzdA==' })
    });

    // Server must reject: role is derived from verified token/email as student, NOT the spoofed header
    assert.strictEqual(res.status, 403, 'Must reject student privilege escalation with HTTP 403');
    const json = await res.json();
    assert.strictEqual(json.code, 'ROLE_FORBIDDEN');
});

test('7. Authorized Role Access: Permits authorized faculty to access grade sheet endpoint', async () => {
    const res = await fetch(`${PROXY_URL}/api/bob/analyze-grade-sheet`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-faculty-token'
        },
        body: JSON.stringify({ imageBase64: 'dGVzdA==' })
    });

    // Will pass auth (not 401 or 403); may fail on Gemini image decode, but must not be forbidden
    assert.notStrictEqual(res.status, 401);
    assert.notStrictEqual(res.status, 403);
});

test('8. Payload Sanitization: Rejects oversized prompts (> 250k chars) with HTTP 413', async () => {
    const oversizedPrompt = 'A'.repeat(260000);
    const res = await fetch(`${PROXY_URL}/api/bob/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-student-token'
        },
        body: JSON.stringify({ prompt: oversizedPrompt })
    });
    assert.strictEqual(res.status, 413);
    const json = await res.json();
    assert.strictEqual(json.code, 'PAYLOAD_TOO_LARGE');
});

test('9. Per-User Rate Limiting: Blocks requests exceeding 20 req/min (HTTP 429)', async () => {
    const spammerToken = `test-spammer-${Date.now()}`;
    let rateLimited = false;

    for (let i = 0; i < 22; i++) {
        const res = await fetch(`${PROXY_URL}/api/bob/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${spammerToken}`
            },
            body: JSON.stringify({ prompt: 'RATE_LIMIT_TEST_PROBE' })
        });

        if (res.status === 429) {
            rateLimited = true;
            const json = await res.json();
            assert.strictEqual(json.code, 'RATE_LIMITED');
            break;
        }
    }

    assert.ok(rateLimited, 'Must trigger HTTP 429 after exceeding rate limit');
});

test('10. Authorized Stream Request: Successfully streams SSE events with [DONE] termination', async () => {
    const res = await fetch(`${PROXY_URL}/api/bob/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-student-stream'
        },
        body: JSON.stringify({
            prompt: 'Say exactly: "SECURITY VERIFIED".',
            history: []
        })
    });

    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/event-stream'));

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let received = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        received += decoder.decode(value);
    }

    assert.ok(received.includes('data:'), 'SSE response must contain data: events');
    assert.ok(received.includes('[DONE]'), 'SSE stream must terminate with [DONE]');
});

test('11. Revoked Token Enforcement: Rejects revoked Firebase ID tokens with HTTP 401 TOKEN_REVOKED', async () => {
    const res = await fetch(`${PROXY_URL}/api/bob/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-revoked-token'
        },
        body: JSON.stringify({ prompt: 'Hello' })
    });
    assert.strictEqual(res.status, 401);
    const json = await res.json();
    assert.strictEqual(json.code, 'TOKEN_REVOKED');
});

test('12. Fail-Closed Unknown Identity: Rejects unmapped or unenrolled users with HTTP 403 UNVERIFIED_IDENTITY', async () => {
    const res = await fetch(`${PROXY_URL}/api/bob/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-unknown-user-token'
        },
        body: JSON.stringify({ prompt: 'Show me all grades' })
    });
    assert.strictEqual(res.status, 403);
    const json = await res.json();
    assert.strictEqual(json.code, 'UNVERIFIED_IDENTITY');
});

test('13. Cross-Department Access Prevention: Rejects faculty requesting records of another department', async () => {
    // CSE faculty attempting to access ECE department grade sheet
    const res = await fetch(`${PROXY_URL}/api/bob/analyze-grade-sheet`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-faculty-token'
        },
        body: JSON.stringify({
            imageBase64: 'dGVzdA==',
            targetDepartment: 'ECE'
        })
    });
    assert.strictEqual(res.status, 403);
    const json = await res.json();
    assert.strictEqual(json.code, 'DEPARTMENT_FORBIDDEN');
});

test('14. CORS Boundary Enforcement: Blocks requests from unapproved origins with HTTP 403 CORS_REJECTED', async () => {
    const res = await fetch(`${PROXY_URL}/api/bob/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://evil-phishing-site.com',
            'Authorization': 'Bearer test-student-token'
        },
        body: JSON.stringify({ prompt: 'Malicious origin attempt' })
    });
    assert.strictEqual(res.status, 403);
    const json = await res.json();
    assert.strictEqual(json.code, 'CORS_REJECTED');
});

test('15. Approved CORS Origin: Accepts requests from authorized NEXUS domain', async () => {
    const res = await fetch(`${PROXY_URL}/api/bob/health`, {
        headers: {
            'Origin': 'https://nexus-smart-campus-39bd7.web.app'
        }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('access-control-allow-origin'), 'https://nexus-smart-campus-39bd7.web.app');
});

test('16. Request Field Tampering (Role Override): Rejects client attempts to override role in body', async () => {
    const res = await fetch(`${PROXY_URL}/api/bob/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-student-token'
        },
        body: JSON.stringify({
            prompt: 'Summarize department',
            role: 'hod' // Malicious attempt to spoof HOD in request body
        })
    });
    assert.strictEqual(res.status, 403);
    const json = await res.json();
    assert.strictEqual(json.code, 'FORBIDDEN_FIELD_OVERRIDE');
});

test('17. Request Field Tampering (USN Override): Rejects client attempts to override USN in body', async () => {
    const res = await fetch(`${PROXY_URL}/api/bob/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-student-token'
        },
        body: JSON.stringify({
            prompt: 'Show attendance',
            usn: '1KS21CS099' // Different USN from verified 1KS21CS088
        })
    });
    assert.strictEqual(res.status, 403);
    const json = await res.json();
    assert.strictEqual(json.code, 'FORBIDDEN_FIELD_OVERRIDE');
});

test('18. Deterministic Cross-Student Isolation: Blocks student prompt querying another student USN', async () => {
    const res = await fetch(`${PROXY_URL}/api/bob/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-student-token'
        },
        body: JSON.stringify({
            prompt: 'Please tell me the attendance and internal marks for student USN: 1KS21CS005'
        })
    });
    assert.strictEqual(res.status, 403);
    const json = await res.json();
    assert.strictEqual(json.code, 'CROSS_STUDENT_FORBIDDEN');
});

test('19. Domain-Only Email Rejection: Merely ending in @kssem.edu without directory entry fails closed', async () => {
    // Verified email is unregistered@kssem.edu, not in TRUSTED_SEED_USERS or Firestore
    const res = await fetch(`${PROXY_URL}/api/bob/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-unregistered-kssem-token'
        },
        body: JSON.stringify({ prompt: 'Hello' })
    });
    assert.strictEqual(res.status, 403);
    const json = await res.json();
    assert.strictEqual(json.code, 'UNVERIFIED_IDENTITY');
});

test('20. Streaming Client Abort Safety: Handles client disconnection during stream without server crash', async () => {
    const controller = new AbortController();
    const fetchPromise = fetch(`${PROXY_URL}/api/bob/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-student-stream'
        },
        body: JSON.stringify({ prompt: 'Count from 1 to 100 slowly', history: [] }),
        signal: controller.signal
    });

    // Abort client connection after 50ms mid-flight
    setTimeout(() => {
        controller.abort();
    }, 50);

    try {
        await fetchPromise;
    } catch (e) {
        // Expected client-side abort
        assert.ok(e.name === 'AbortError' || e.code === 20 || e.name === 'DOMException');
    }

    // Verify proxy server remains healthy and responsive after client disconnect
    const healthCheck = await fetch(`${PROXY_URL}/api/bob/health`);
    assert.strictEqual(healthCheck.status, 200);
});

test('21. Model Configuration Audit: Confirms proxy runs migrated verified gemini-3.8-flash model', async () => {
    const res = await fetch(`${PROXY_URL}/api/bob/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.model, 'gemini-3.8-flash', 'Must use verified gemini-3.8-flash production model');
    assert.notStrictEqual(data.model, 'gemini-2.5-flash', 'Deprecated gemini-2.5-flash must be removed');
});
