const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

        console.log("Navigating to http://localhost:5174 ...");
        await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });

        console.log("Finished loading.");
        await browser.close();
    } catch (err) {
        console.error("Script Error:", err);
    }
})();
