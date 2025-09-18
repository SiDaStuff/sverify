// Test script to verify IP reset functionality
const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.join(__dirname, 'backend/data.json');

// Helper function to read data
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    return [];
  }
}

// Helper function to write data
async function writeData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data file:', error);
  }
}

// Test IP reset functionality
async function testIPReset() {
  console.log('🧪 Testing IP reset functionality...\n');

  const testIP = '192.168.1.100';

  // Step 1: Add a verified IP to data.json
  console.log('📝 Step 1: Adding verified IP to data.json');
  const testEntry = {
    ip: testIP,
    timestamp: new Date().toISOString(),
    userAgent: 'Test User Agent',
    browserChecks: {
      trustScore: 'high',
      suspiciousIndicators: 0,
      verifiedAt: new Date().toISOString()
    }
  };

  let data = await readData();
  data.push(testEntry);
  await writeData(data);
  console.log('✅ Added test IP to data.json');

  // Step 2: Verify the IP is in data.json
  console.log('\n🔍 Step 2: Verifying IP is in data.json');
  data = await readData();
  const foundEntry = data.find(item => item.ip === testIP);
  if (foundEntry) {
    console.log('✅ IP found in data.json:', foundEntry);
  } else {
    console.log('❌ IP not found in data.json');
    return;
  }

  // Step 3: Simulate IP removal (what happens on verification failure)
  console.log('\n🗑️ Step 3: Simulating IP reset (verification failure)');
  const filteredData = data.filter(item => item.ip !== testIP);
  await writeData(filteredData);
  console.log('✅ Removed IP from data.json');

  // Step 4: Verify IP is removed
  console.log('\n🔍 Step 4: Verifying IP is removed from data.json');
  data = await readData();
  const removedEntry = data.find(item => item.ip === testIP);
  if (!removedEntry) {
    console.log('✅ IP successfully removed from data.json');
  } else {
    console.log('❌ IP still found in data.json:', removedEntry);
  }

  console.log('\n🎉 IP reset functionality test completed!');
}

// Run the test
testIPReset().catch(console.error);
