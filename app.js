// Enhanced browser verification checks
function performBrowserChecks() {
    const checks = {
        isEmbedded: false,
        isBot: false,
        hasAdBlock: false,
        isIncognito: false,
        isCleanLoad: true,
        // Additional security checks
        hasWebdriver: false,
        hasSelenium: false,
        hasHeadless: false,
        hasAutomation: false,
        isTrustedDevice: true,
        hasValidViewport: true,
        hasValidTimezone: true,
        hasValidLanguage: true,
        hasValidPlugins: true,
        hasValidCanvas: true,
        hasValidWebGL: true
    };

    // Check if page is embedded (iframe)
    try {
        checks.isEmbedded = window.self !== window.top;
    } catch (e) {
        checks.isEmbedded = true;
    }

    // Enhanced bot detection
    const userAgent = navigator.userAgent.toLowerCase();
    const botPatterns = [
        'bot', 'crawl', 'spider', 'scraper', 'headless', 'selenium',
        'chrome-headless', 'phantomjs', 'puppeteer', 'nightmare',
        'electron', 'webdriver', 'selenium', 'chrome-lighthouse'
    ];

    checks.isBot = botPatterns.some(pattern => userAgent.includes(pattern));

    // Automation detection
    checks.hasWebdriver = navigator.webdriver === true;
    checks.hasSelenium = !!window.navigator.webdriver;
    checks.hasHeadless = userAgent.includes('headless') ||
                        userAgent.includes('electron') ||
                        !window.chrome;

    // Check for automation indicators
    const automationIndicators = [
        window.callPhantom,
        window._phantom,
        window.__nightmare,
        window._seleniumRunner,
        window.__webdriver_script_fn,
        window.__driver_evaluate,
        window.__selenium_evaluate,
        window.__fxdriver_evaluate,
        window.__driver_unwrapped,
        window.__selenium_unwrapped,
        window.__fxdriver_unwrapped
    ];

    checks.hasAutomation = automationIndicators.some(indicator => !!indicator);

    // Check for ad blocker (enhanced test)
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

    // Viewport validation
    checks.hasValidViewport = window.innerWidth > 0 && window.innerHeight > 0 &&
                             window.innerWidth >= 320 && window.innerHeight >= 240;

    // Timezone validation
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    checks.hasValidTimezone = timezone && timezone.length > 0;

    // Language validation
    checks.hasValidLanguage = navigator.language && navigator.language.length >= 2;

    // Plugin validation (deprecated but still useful)
    checks.hasValidPlugins = navigator.plugins && navigator.plugins.length >= 0;

    // Canvas fingerprinting validation
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0, 0, 10, 10);
        const canvasData = canvas.toDataURL();
        checks.hasValidCanvas = canvasData && canvasData.length > 100;
    } catch (e) {
        checks.hasValidCanvas = false;
    }

    // WebGL validation
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
            checks.hasValidWebGL = true;
        } else {
            checks.hasValidWebGL = false;
        }
    } catch (e) {
        checks.hasValidWebGL = false;
    }

    // Check for clean HTML load (not embedded, not in popup, etc.)
    checks.isCleanLoad = !checks.isEmbedded &&
                        window.opener === null &&
                        window.history.length > 1 &&
                        !checks.isIncognito;

    // Overall trust score
    checks.isTrustedDevice = !checks.isBot &&
                            !checks.hasWebdriver &&
                            !checks.hasSelenium &&
                            !checks.hasHeadless &&
                            !checks.hasAutomation &&
                            checks.hasValidViewport &&
                            checks.hasValidTimezone &&
                            checks.hasValidLanguage &&
                            checks.hasValidCanvas &&
                            checks.hasValidWebGL;

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

    loadingContainer.classList.remove('hidden', 'success', 'failed');
    loadingContainer.classList.add('show', 'loading');
    content.classList.add('hidden');
}

// Show success state
function showSuccess(message = 'Verification successful!') {
    const loadingContainer = document.getElementById('loading-container');
    const loadingText = document.querySelector('.loading-text');
    const loadingSubtitle = document.querySelector('.loading-subtitle');

    loadingContainer.classList.remove('loading', 'failed');
    loadingContainer.classList.add('success');
    loadingText.textContent = '✓ Success!';
    loadingSubtitle.textContent = message;

    // Auto navigate back after showing success
    setTimeout(() => {
        window.history.back();
    }, 2000);
}

// Show failure state
function showFailure(message = 'Verification failed. Please complete the captcha to continue.') {
    const loadingContainer = document.getElementById('loading-container');
    const loadingText = document.querySelector('.loading-text');
    const loadingSubtitle = document.querySelector('.loading-subtitle');

    loadingContainer.classList.remove('loading', 'success');
    loadingContainer.classList.add('failed');
    loadingText.textContent = '✗ Failed';
    loadingSubtitle.textContent = message;

    // Add captcha instead of simple retry
    addCaptchaAndRetry();
}

// Add captcha and retry for failed state
function addCaptchaAndRetry() {
    const loadingContainer = document.getElementById('loading-container');

    // Remove existing elements
    removeRetryButton();
    removeCaptcha();

    // Create captcha container
    const captchaContainer = document.createElement('div');
    captchaContainer.className = 'captcha-container';

    // Generate simple math captcha
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 + num2;

    captchaContainer.innerHTML = `
        <div class="captcha-question">
            <strong>Prove you're human:</strong><br>
            What is ${num1} + ${num2}?
        </div>
        <input type="text" id="captcha-input" placeholder="Enter answer" maxlength="2">
        <div class="captcha-buttons">
            <button class="captcha-submit">Verify</button>
            <button class="captcha-cancel">Cancel</button>
        </div>
        <div class="captcha-error hidden">Incorrect answer. Try again.</div>
    `;

    // Add event listeners
    const submitBtn = captchaContainer.querySelector('.captcha-submit');
    const cancelBtn = captchaContainer.querySelector('.captcha-cancel');
    const input = captchaContainer.querySelector('#captcha-input');
    const errorDiv = captchaContainer.querySelector('.captcha-error');

    submitBtn.onclick = () => {
        const userAnswer = parseInt(input.value);
        if (userAnswer === answer) {
            errorDiv.classList.add('hidden');
            removeCaptcha();
            handleVerification();
        } else {
            errorDiv.classList.remove('hidden');
            input.value = '';
            input.focus();
        }
    };

    cancelBtn.onclick = () => {
        removeCaptcha();
        hideLoading();
    };

    input.onkeypress = (e) => {
        if (e.key === 'Enter') {
            submitBtn.click();
        }
    };

    loadingContainer.appendChild(captchaContainer);
    input.focus();

    // Store the captcha answer for validation
    captchaContainer.dataset.answer = answer;
}

// Add retry button to failed state
function addRetryButton() {
    const loadingContainer = document.getElementById('loading-container');
    let retryButton = document.querySelector('.retry-button');

    if (!retryButton) {
        retryButton = document.createElement('button');
        retryButton.className = 'retry-button';
        retryButton.textContent = 'Retry Verification';
        retryButton.onclick = () => {
            removeRetryButton();
            handleVerification();
        };
        loadingContainer.appendChild(retryButton);
    }
}

// Remove retry button
function removeRetryButton() {
    const retryButton = document.querySelector('.retry-button');
    if (retryButton) {
        retryButton.remove();
    }
}

// Remove captcha
function removeCaptcha() {
    const captcha = document.querySelector('.captcha-container');
    if (captcha) {
        captcha.remove();
    }
}

// Hide loading state
function hideLoading() {
    const loadingContainer = document.getElementById('loading-container');
    const content = document.getElementById('content');

    loadingContainer.classList.add('hidden');
    loadingContainer.classList.remove('show', 'loading', 'success', 'failed');
    content.classList.remove('hidden');
    removeRetryButton();
    removeCaptcha();
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
            showSuccess('IP verification completed successfully!');
        } else {
            showFailure(result.error || 'Verification failed');
        }

    } catch (error) {
        console.error('Verification error:', error);
        showFailure('Verification failed: ' + error.message);
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

// Test the /verify endpoint with user's actual IP
async function testVerifyEndpoint() {
    try {
        // First, get the user's actual IP
        const userIP = await getClientIP();

        if (!userIP) {
            displayTestResults('/verify Endpoint Test', 'Failed to detect your IP address', false);
            return;
        }

        console.log(`🔍 Testing verification for your IP: ${userIP}`);

        const response = await fetch('https://sverify.onrender.com/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ip: userIP
            })
        });

        const result = await response.json();
        const resultText = `Your IP: ${userIP}\nVerification Status: ${result.valid ? 'VALID ✓' : 'INVALID ✗'}\nResponse: ${JSON.stringify(result, null, 2)}`;

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
