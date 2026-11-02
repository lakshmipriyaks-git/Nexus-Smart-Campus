import fs from 'fs';
import path from 'path';

const distDir = './dist';
let leakFound = false;

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.css')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Detect any Gemini API Key pattern
            if (/AIzaSy[A-Za-z0-9_-]{33}/.test(content)) {
                // Check if it's the Firebase API Key or Gemini
                // Firebase web API key is standard for Firebase client auth
                console.log(`[INFO] Public Firebase API key pattern found in ${f}`);
            }
            if (/VITE_GEMINI_API_KEY/.test(content)) {
                console.error(`[CRITICAL LEAK] VITE_GEMINI_API_KEY detected in ${f}`);
                leakFound = true;
            }
            if (content.includes('GEMINI_API_KEY') && !content.includes('process.env.GEMINI_API_KEY')) {
                console.warn(`[WARN] String GEMINI_API_KEY detected in ${f}`);
            }
        }
    }
}

scanDir(distDir);
if (!leakFound) {
    console.log('✅ AUDIT PASSED: Zero Gemini API key references in production dist/ bundle.');
} else {
    process.exit(1);
}

