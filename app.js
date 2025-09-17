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

// Multiple free IP services for redundancy
const IP_SERVICES = [
    'https://api.ipify.org?format=json',
    'https://api.ip.sb/jsonip',
    'https://api.myip.com',
    'https://ipapi.co/json/',
    'https://api.ipify.org/?format=json' // backup
];

// Validate IP address format
function isValidIPv4(ip) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) return false;

    const parts = ip.split('.');
    return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
    });
}

// Get client IP address with multiple fallbacks
async function getClientIP() {
    console.log('🔍 Detecting client IP address...');

    for (let i = 0; i < IP_SERVICES.length; i++) {
        try {
            console.log(`📡 Trying IP service ${i + 1}/${IP_SERVICES.length}: ${IP_SERVICES[i]}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(IP_SERVICES[i], {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'S-Verify/1.0'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn(`❌ IP service ${i + 1} returned status: ${response.status}`);
                continue;
            }

            const data = await response.json();
            let ip = null;

            // Handle different response formats
            if (data.ip) {
                ip = data.ip;
            } else if (data.query) {
                ip = data.query;
            } else if (typeof data === 'string') {
                ip = data;
            }

            if (ip && isValidIPv4(ip)) {
                console.log(`✅ Successfully detected IP: ${ip} (from service ${i + 1})`);
                return ip;
            } else {
                console.warn(`⚠️ Invalid IP format from service ${i + 1}: ${ip}`);
            }

        } catch (error) {
            console.warn(`❌ IP service ${i + 1} failed:`, error.message);
            continue;
        }
    }

    // Final fallback: try to get IP from server
    try {
        console.log('🔄 Trying server-side IP detection...');
        const response = await fetch('https://sverify.onrender.com/api/ip', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.ip && isValidIPv4(data.ip)) {
                console.log(`✅ Server-side IP detection successful: ${data.ip} (method: ${data.method})`);
                return data.ip;
            }
        }
    } catch (error) {
        console.warn('❌ Server-side IP detection failed:', error.message);
    }

    console.error('❌ All IP detection methods failed');
    return null;
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
