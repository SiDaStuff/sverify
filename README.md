# S Verify

A web application that verifies IP addresses and manages temporary access with browser security checks.

**Live Demo**: https://sverify.onrender.com

## Features

- **IP Verification**: Check if an IP address is in the verified list and within a 15-minute window
- **Browser Security**: Performs multiple checks to detect suspicious or bot-like behavior
- **Temporary Access**: Manages IP addresses with timestamps for temporary verification

## Project Structure

```
/Users/silas/sverify/
├── index.html          # Frontend HTML
├── app.js             # Frontend JavaScript with browser verification
├── style.css          # Frontend styling
├── backend/
│   ├── server.js      # Express server
│   ├── package.json   # Node.js dependencies
│   └── data.json      # IP and timestamp storage
└── README.md          # This file
```

## API Endpoints

### POST /verify
Verifies if an IP address is valid (exists and within 15 minutes).

**URL**: `https://sverify.onrender.com/verify`

**Request Body:**
```json
{
  "ip": "192.168.1.1"
}
```

**Response:**
```json
{
  "valid": true/false
}
```

### GET /addtemp
Serves the verification page with loading animation.

**URL**: `https://sverify.onrender.com/addtemp`

### POST /addtemp
Adds an IP address to the verified list after performing browser checks.

**URL**: `https://sverify.onrender.com/addtemp`

**Request Body:**
```json
{
  "ip": "192.168.1.1",
  "browserChecks": {
    "isEmbedded": false,
    "isBot": false,
    "hasAdBlock": false,
    "isIncognito": false,
    "isCleanLoad": true
  }
}
```

## Browser Checks

The application performs several security checks:

- **Embedded Detection**: Checks if the page is loaded in an iframe
- **Bot Detection**: Scans user agent for bot-like patterns
- **Ad Blocker Detection**: Tests for ad blocking software
- **Incognito Mode**: Detects private browsing mode
- **Clean Load**: Ensures the page loaded normally (not in popup, etc.)

## Deployment on Render

1. **Set up your Render account** and create a new web service
2. **Connect your repository** to Render
3. **Configure the service**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Working Directory: `backend`
4. **Deploy** the application

## Local Development

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Usage

1. **Verification Process**: Visit `https://sverify.onrender.com/addtemp` to trigger the verification process
2. **IP Verification**: Send POST requests to `https://sverify.onrender.com/verify` with IP addresses to check validity
3. **Data Storage**: IP addresses and timestamps are stored in `backend/data.json`

## Testing the API

### Test /verify endpoint:
```bash
curl -X POST https://sverify.onrender.com/verify \
  -H "Content-Type: application/json" \
  -d '{"ip": "192.168.1.1"}'
```

### Test /addtemp endpoint (GET):
```bash
curl https://sverify.onrender.com/addtemp
```

### Test /addtemp endpoint (POST):
```bash
curl -X POST https://sverify.onrender.com/addtemp \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.1.1",
    "browserChecks": {
      "isEmbedded": false,
      "isBot": false,
      "hasAdBlock": false,
      "isIncognito": false,
      "isCleanLoad": true
    }
  }'
```

## Security Features

- Browser fingerprinting and anomaly detection
- IP-based temporary access with time limits
- Protection against embedded/iframe loading
- Bot and automated access prevention
- Ad blocker and incognito mode detection
