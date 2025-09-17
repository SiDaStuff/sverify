// Diagnostic script for S Verify deployment
console.log('🔍 S Verify Diagnostic Script');
console.log('================================');

// Check Node.js version
console.log('📋 Node.js Version:', process.version);

// Check current working directory
console.log('📁 Current Working Directory:', process.cwd());

// Check if package.json exists
const fs = require('fs');
const path = require('path');

try {
  const packageJson = require('./package.json');
  console.log('✅ package.json found');
  console.log('📦 Dependencies:', Object.keys(packageJson.dependencies || {}));
} catch (error) {
  console.log('❌ package.json not found or invalid');
  console.log('Error:', error.message);
}

// Check if data.json exists
try {
  const dataPath = path.join(__dirname, 'data.json');
  if (fs.existsSync(dataPath)) {
    console.log('✅ data.json found');
  } else {
    console.log('⚠️  data.json not found, creating empty file');
    fs.writeFileSync(dataPath, '[]');
  }
} catch (error) {
  console.log('❌ Error with data.json:', error.message);
}

// Check if index.html exists
try {
  const indexPath = path.join(__dirname, '../index.html');
  if (fs.existsSync(indexPath)) {
    console.log('✅ index.html found');
  } else {
    console.log('❌ index.html not found');
  }
} catch (error) {
  console.log('❌ Error checking index.html:', error.message);
}

// Test Express server startup
console.log('\n🚀 Testing Express Server...');
try {
  const express = require('express');
  console.log('✅ Express module loaded successfully');

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.get('/diagnostic', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      workingDirectory: process.cwd()
    });
  });

  const server = app.listen(PORT, () => {
    console.log(`✅ Server started successfully on port ${PORT}`);
    console.log(`🌐 Diagnostic endpoint: http://localhost:${PORT}/diagnostic`);
    server.close(() => {
      console.log('🛑 Server closed for testing');
    });
  });

} catch (error) {
  console.log('❌ Express server test failed');
  console.log('Error:', error.message);
}

console.log('\n✨ Diagnostic complete!');
