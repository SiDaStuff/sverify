const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Helper function to read data from JSON file
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    return [];
  }
}

// Helper function to write data to JSON file
async function writeData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data file:', error);
  }
}

// POST /verify endpoint
app.post('/verify', async (req, res) => {
  try {
    const { ip } = req.body;

    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    const data = await readData();
    const entry = data.find(item => item.ip === ip);

    if (!entry) {
      return res.json({ valid: false });
    }

    // Check if time is less than 15 minutes ago
    const entryTime = new Date(entry.timestamp);
    const currentTime = new Date();
    const timeDiff = currentTime - entryTime;
    const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds

    const isValid = timeDiff < fifteenMinutes;
    res.json({ valid: isValid });

  } catch (error) {
    console.error('Error in /verify endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /addtemp endpoint (serves the verification page)
app.get('/addtemp', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Diagnostic endpoint to check server status
app.get('/diagnostic', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    workingDirectory: process.cwd(),
    port: process.env.PORT || 3000,
    endpoints: ['/verify', '/addtemp', '/diagnostic', '/api/ip']
  });
});

// Server-side IP detection endpoint
app.get('/api/ip', (req, res) => {
  try {
    // Get client IP from various possible headers (for proxy/load balancer support)
    let clientIP = req.ip ||
                   req.connection.remoteAddress ||
                   req.socket.remoteAddress ||
                   req.connection.socket?.remoteAddress;

    // Handle IPv6 localhost
    if (clientIP === '::1' || clientIP === '::ffff:127.0.0.1') {
      clientIP = '127.0.0.1';
    }

    // Remove IPv6 prefix if present
    if (clientIP && clientIP.startsWith('::ffff:')) {
      clientIP = clientIP.substring(7);
    }

    // Try headers from proxy/load balancers
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    const cfConnectingIP = req.headers['cf-connecting-ip'];

    // Use the most reliable IP (prioritize Cloudflare, then forwarded headers)
    const detectedIP = cfConnectingIP ||
                      (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
                      realIP ||
                      clientIP;

    // Validate the IP format
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (detectedIP && ipv4Regex.test(detectedIP)) {
      res.json({
        ip: detectedIP,
        source: 'server',
        method: cfConnectingIP ? 'cloudflare' :
                forwardedFor ? 'forwarded' :
                realIP ? 'real-ip' : 'direct'
      });
    } else {
      res.status(400).json({
        error: 'Unable to determine valid IPv4 address',
        detectedIP: detectedIP
      });
    }
  } catch (error) {
    console.error('Error in /api/ip endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /addtemp endpoint (handles the verification and data storage)
app.post('/addtemp', async (req, res) => {
  try {
    const { ip, browserChecks } = req.body;

    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    // Perform browser checks
    if (!browserChecks) {
      return res.status(400).json({ error: 'Browser checks are required' });
    }

    // Check for suspicious behavior
    const suspiciousIndicators = [
      browserChecks.isEmbedded,
      browserChecks.isBot,
      browserChecks.hasAdBlock,
      browserChecks.isIncognito,
      !browserChecks.isCleanLoad
    ];

    if (suspiciousIndicators.some(indicator => indicator === true)) {
      return res.status(400).json({ error: 'Suspicious activity detected' });
    }

    // Add IP and timestamp to data.json
    const data = await readData();
    const newEntry = {
      ip: ip,
      timestamp: new Date().toISOString()
    };

    // Remove any existing entries for this IP
    const filteredData = data.filter(item => item.ip !== ip);
    filteredData.push(newEntry);

    await writeData(filteredData);

    res.json({ success: true });

  } catch (error) {
    console.error('Error in /addtemp endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files from the root directory (must be last)
app.use(express.static(path.join(__dirname, '../')));

// Catch all handler: serve React index.html for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(PORT, () => {
  console.log(`S Verify server running on port ${PORT}`);
});
