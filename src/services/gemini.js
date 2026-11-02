/**
 * NEXUS SMART CAMPUS — BOB AI Frontend Client
 * Communicates with the authenticated Server-Side Gemini Proxy.
 * ZERO API keys are embedded or bundled in the frontend.
 */

const API_BASE = '/api/bob';
const responseCache = new Map();
const RATE_LIMIT_DELAY = 1500; // 1.5s between rapid client clicks
let lastCallTime = 0;

/**
 * Retrieves the current authenticated user's session token.
 */
function getAuthToken() {
    try {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            return 'demo-student-token';
        }
        const userRaw = localStorage.getItem('nexus_unified_auth_user') || 
                        localStorage.getItem('nexus_demo_auth_user') ||
                        localStorage.getItem('nexus_mock_auth_user');
        if (userRaw) {
            const u = JSON.parse(userRaw);
            return u.token || u.id || u.uid || 'authenticated-user-token';
        }
    } catch (_) {}
    return 'anonymous-campus-token';
}

function getUserRole() {
    try {
        const userRaw = localStorage.getItem('nexus_unified_auth_user') || 
                        localStorage.getItem('nexus_demo_auth_user');
        if (userRaw) {
            const u = JSON.parse(userRaw);
            return u.role || 'student';
        }
    } catch (_) {}
    return 'student';
}

/**
 * Initializes Gemini service by verifying backend proxy connectivity.
 */
export const initializeGemini = async () => {
    try {
        const res = await fetch(`${API_BASE}/health`);
        if (res.ok) {
            const data = await res.json();
            console.log(`✅ BOB AI Secure Proxy connected (${data.model})`);
            return true;
        }
    } catch (e) {
        console.warn('BOB AI Proxy health check notice:', e.message);
    }
    return true;
};

/**
 * Streams AI responses from the secure backend proxy via Server-Sent Events (SSE).
 */
export const generateResponseStream = async (prompt, history = [], onChunk) => {
    if (!navigator.onLine) {
        onChunk("⚠️ I am currently offline. Please check your internet connection. I can still help you organize your tasks locally!");
        return;
    }

    const now = Date.now();
    if (now - lastCallTime < RATE_LIMIT_DELAY) {
        onChunk("⏳ Whoa, slow down a bit! I'm thinking...");
        return;
    }
    lastCallTime = now;

    // Cache check
    const cacheKey = JSON.stringify({ prompt, lastHistory: history[history.length - 1] });
    if (responseCache.has(cacheKey)) {
        const cachedResponse = responseCache.get(cacheKey);
        const words = cachedResponse.split(' ');
        for (let i = 0; i < words.length; i++) {
            const chunk = (i === 0 ? '' : ' ') + words[i];
            onChunk(chunk);
            await new Promise(resolve => setTimeout(resolve, 30));
        }
        return;
    }

    const token = getAuthToken();
    const role = getUserRole();

    try {
        const response = await fetch(`${API_BASE}/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-user-role': role
            },
            body: JSON.stringify({ prompt, history })
        });

        if (!response.ok) {
            let errorMsg = `Server error (${response.status})`;
            try {
                const errJson = await response.json();
                errorMsg = errJson.error || errorMsg;
            } catch (_) {}

            if (response.status === 401) {
                onChunk("🔒 Authentication required. Please sign in to consult BOB AI.");
                return;
            } else if (response.status === 429) {
                onChunk("⏳ Rate limit exceeded (max 20 requests/min). Please pause for a moment.");
                return;
            } else if (response.status === 413) {
                onChunk("⚠️ Your request or document text was too large. Please shorten the question.");
                return;
            }
            onChunk(`⚠️ ${errorMsg}`);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        let buffer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop(); // keep last incomplete chunk

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(dataStr);
                        if (parsed.text) {
                            fullResponse += parsed.text;
                            onChunk(parsed.text);
                        } else if (parsed.error) {
                            onChunk(`\n[Error: ${parsed.error}]`);
                        }
                    } catch (_) {
                        // Plain text fallback
                        if (dataStr) {
                            fullResponse += dataStr;
                            onChunk(dataStr);
                        }
                    }
                }
            }
        }

        if (fullResponse) {
            responseCache.set(cacheKey, fullResponse);
            if (responseCache.size > 50) {
                const firstKey = responseCache.keys().next().value;
                responseCache.delete(firstKey);
            }
        }
    } catch (error) {
        console.error('Error connecting to BOB AI proxy:', error);
        onChunk(`I encountered an issue connecting to the campus intelligence proxy (${error.message || 'Network error'}). Please try again shortly.`);
    }
};

/**
 * Non-streaming fallback wrapper.
 */
export const generateResponse = async (prompt, history = []) => {
    let result = "";
    await generateResponseStream(prompt, history, (chunk) => {
        result += chunk;
    });
    return result;
};

/**
 * Sends a parsed document to the backend proxy for analysis.
 */
export const analyzeDocument = async (documentText, prompt, metadata = {}) => {
    const token = getAuthToken();
    const role = getUserRole();

    try {
        const response = await fetch(`${API_BASE}/analyze-document`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-user-role': role
            },
            body: JSON.stringify({ documentText, prompt, metadata })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `Proxy returned ${response.status}`);
        }

        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error('Error analyzing document via proxy:', error);
        return `I encountered an error analyzing the document: ${error.message || 'Unknown error'}. Please try again.`;
    }
};

/**
 * Sends a base64 image to the backend proxy for multimodal vision analysis.
 */
export const analyzeImage = async (imageBase64, prompt) => {
    const token = getAuthToken();
    const role = getUserRole();

    try {
        const response = await fetch(`${API_BASE}/analyze-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-user-role': role
            },
            body: JSON.stringify({ imageBase64, prompt })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `Proxy returned ${response.status}`);
        }

        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error('Error analyzing image via proxy:', error);
        return "I had trouble reading that image. Please try uploading a clear photo.";
    }
};

/**
 * Analyzes grade sheet OCR via backend proxy.
 */
export const analyzeGradeSheet = async (imageFile) => {
    const token = getAuthToken();
    const role = getUserRole();

    const imageBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });

    const response = await fetch(`${API_BASE}/analyze-grade-sheet`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-user-role': role
        },
        body: JSON.stringify({ imageBase64 })
    });

    if (!response.ok) {
        throw new Error(`Grade sheet OCR failed with status ${response.status}`);
    }

    return await response.json();
};
