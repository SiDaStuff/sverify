// Browser verification checks
function performBrowserChecks() {
    const checks = {
        isEmbedded: false,
        isBot: false,
        hasAdBlock: false,
        isIncognito: false,
        isCleanLoad: true
    };

    // Check if page is embedded (iframe)
    try {
        checks.isEmbedded = window.self !== window.top;
    } catch (e) {
        checks.isEmbedded = true;
    }

    // Check for bot-like behavior
    const userAgent = navigator.userAgent.toLowerCase();
    const botPatterns = [
        'bot', 'crawl', 'spider', 'scraper', 'headless', 'selenium',
        'chrome-headless', 'phantomjs', 'puppeteer'
    ];

    checks.isBot = botPatterns.some(pattern => userAgent.includes(pattern));

    // Check for ad blocker (simple test)
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox adsbygoogle ad-banner';
    testAd.style.position = 'absolute';
    testAd.style.left = '-10000px';
    testAd.style.top = '-1000px';
    testAd.style.width = '1px';
    testAd.style.height = '1px';
    document.body.appendChild(testAd);

    setTimeout(() => {
        checks.hasAdBlock = testAd.offsetHeight === 0;
        document.body.removeChild(testAd);
    }, 100);

    // Check if in incognito/private mode
    const fs = window.RequestFileSystem || window.webkitRequestFileSystem;
    if (fs) {
        fs(window.TEMPORARY, 100, () => {
            checks.isIncognito = false;
        }, () => {
            checks.isIncognito = true;
        });
    }

    // Check for clean HTML load (not embedded, not in popup, etc.)
    checks.isCleanLoad = !checks.isEmbedded &&
                        window.opener === null &&
                        window.history.length > 1;

    return checks;
}

// Get client IP address (this will be handled by the server)
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error getting IP:', error);
        return null;
    }
}

// Show loading state
function showLoading() {
    const loadingContainer = document.getElementById('loading-container');
    const content = document.getElementById('content');

    loadingContainer.classList.remove('hidden');
    loadingContainer.classList.add('show');
    content.classList.add('hidden');
}

// Hide loading state
function hideLoading() {
    const loadingContainer = document.getElementById('loading-container');
    const content = document.getElementById('content');

    loadingContainer.classList.add('hidden');
    loadingContainer.classList.remove('show');
    content.classList.remove('hidden');
}

// Handle the verification process
async function handleVerification() {
    showLoading();

    try {
        // Perform browser checks
        const browserChecks = performBrowserChecks();

        // Wait a bit for async checks to complete
        await new Promise(resolve => setTimeout(resolve, 200));

        // Get client IP
        const ip = await getClientIP();

        if (!ip) {
            throw new Error('Could not determine IP address');
        }

        // Check for suspicious activity
        const suspiciousIndicators = [
            browserChecks.isEmbedded,
            browserChecks.isBot,
            browserChecks.hasAdBlock,
            browserChecks.isIncognito,
            !browserChecks.isCleanLoad
        ];

        if (suspiciousIndicators.some(indicator => indicator === true)) {
            throw new Error('Suspicious activity detected');
        }

        // Send verification request to server
        const response = await fetch('https://sverify.onrender.com/addtemp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ip: ip,
                browserChecks: browserChecks
            })
        });

        const result = await response.json();

        if (result.success) {
            // Navigate back in browser history
            setTimeout(() => {
                window.history.back();
            }, 1000);
        } else {
            throw new Error(result.error || 'Verification failed');
        }

    } catch (error) {
        console.error('Verification error:', error);
        hideLoading();
        alert('Verification failed: ' + error.message);
    }
}

// Check if we're on the /addtemp page
function checkIfOnAddTempPage() {
    const currentPath = window.location.pathname;
    if (currentPath === '/addtemp' || currentPath.endsWith('/addtemp')) {
        handleVerification();
    }
}

// Show test results section
function showTestResults() {
    const testResults = document.getElementById('test-results');
    testResults.classList.remove('hidden');
    testResults.classList.add('show');
}

// Hide test results section
function hideTestResults() {
    const testResults = document.getElementById('test-results');
    testResults.classList.add('hidden');
    testResults.classList.remove('show');
}

// Display test results in the UI
function displayTestResults(title, content, isSuccess = true) {
    const resultsContent = document.getElementById('results-content');
    const statusEmoji = isSuccess ? '✅' : '❌';

    resultsContent.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>${statusEmoji} ${title}</strong>
        </div>
        <div style="background: ${isSuccess ? '#f0fff4' : '#fff5f5'}; padding: 0.5rem; border-radius: 4px; border-left: 4px solid ${isSuccess ? '#48bb78' : '#f56565'};">
            <pre style="margin: 0; white-space: pre-wrap;">${content}</pre>
        </div>
    `;

    showTestResults();
}

// Test the /verify endpoint
async function testVerifyEndpoint() {
    try {
        const testIP = '192.168.1.100'; // Test with a sample IP

        const response = await fetch('https://sverify.onrender.com/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ip: testIP
            })
        });

        const result = await response.json();
        const resultText = `Testing IP: ${testIP}\nResponse: ${JSON.stringify(result, null, 2)}`;

        displayTestResults('/verify Endpoint Test', resultText, response.ok);

    } catch (error) {
        displayTestResults('/verify Endpoint Test', `Error: ${error.message}`, false);
    }
}

// Navigate to /addtemp page
function goToAddTemp() {
    window.location.href = 'https://sverify.onrender.com/addtemp';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkIfOnAddTempPage();

    // Add event listeners for test buttons
    const testVerifyBtn = document.getElementById('test-verify-btn');
    const goToAddTempBtn = document.getElementById('go-to-addtemp-btn');

    if (testVerifyBtn) {
        testVerifyBtn.addEventListener('click', testVerifyEndpoint);
    }

    if (goToAddTempBtn) {
        goToAddTempBtn.addEventListener('click', goToAddTemp);
    }
});
