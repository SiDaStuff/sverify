// Test script for S Verify API endpoints
const BASE_URL = 'https://sverify.onrender.com';

async function testAPI() {
    console.log('🔍 Testing S Verify API endpoints...\n');

    // Test 1: Verify endpoint with a new IP (should return false)
    console.log('📋 Test 1: Testing /verify with new IP');
    try {
        const verifyResponse = await fetch(`${BASE_URL}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ip: '192.168.1.100'
            })
        });

        const verifyResult = await verifyResponse.json();
        console.log('✅ /verify response:', verifyResult);
    } catch (error) {
        console.log('❌ /verify test failed:', error.message);
    }

    // Test 2: Add temp endpoint with valid data
    console.log('\n📋 Test 2: Testing /addtemp POST');
    try {
        const addTempResponse = await fetch(`${BASE_URL}/addtemp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ip: '192.168.1.100',
                browserChecks: {
                    isEmbedded: false,
                    isBot: false,
                    hasAdBlock: false,
                    isIncognito: false,
                    isCleanLoad: true
                }
            })
        });

        const addTempResult = await addTempResponse.json();
        console.log('✅ /addtemp POST response:', addTempResult);
    } catch (error) {
        console.log('❌ /addtemp POST test failed:', error.message);
    }

    // Test 3: Verify the same IP again (should now return true)
    console.log('\n📋 Test 3: Testing /verify again with same IP');
    try {
        const verifyAgainResponse = await fetch(`${BASE_URL}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ip: '192.168.1.100'
            })
        });

        const verifyAgainResult = await verifyAgainResponse.json();
        console.log('✅ /verify second response:', verifyAgainResult);
    } catch (error) {
        console.log('❌ /verify second test failed:', error.message);
    }

    // Test 4: Test /addtemp GET endpoint
    console.log('\n📋 Test 4: Testing /addtemp GET (should return HTML)');
    try {
        const addTempGetResponse = await fetch(`${BASE_URL}/addtemp`);
        const html = await addTempGetResponse.text();
        console.log('✅ /addtemp GET response length:', html.length, 'characters');
        console.log('✅ Contains expected elements:', html.includes('S Verify') && html.includes('loading'));
    } catch (error) {
        console.log('❌ /addtemp GET test failed:', error.message);
    }

    console.log('\n🎉 API testing completed!');
}

// Run the tests
testAPI().catch(console.error);
