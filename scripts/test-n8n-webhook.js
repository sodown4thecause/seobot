#!/usr/bin/env node

/**
 * Test script for n8n backlinks webhook
 * Tests both production and test webhook endpoints
 */

const productionUrl = 'https://zuded9wg.rcld.app/webhook/domain';
const testUrl = 'https://zuded9wg.rcld.app/webhook-test/domain';

async function testWebhook(url, label) {
  console.log(`\n🧪 Testing ${label} webhook...`);
  console.log('📡 URL:', url);

  const testDomain = 'example.com';

  // Try POST first (original expectation)
  try {
    console.log('📤 Trying POST request...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain: testDomain }),
    });

    console.log(`📊 POST Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      return await handleSuccessResponse(response, 'POST');
    } else {
      const errorText = await response.text();
      console.log(`❌ POST Error: ${errorText}`);

      // If POST fails with 404, try GET as fallback
      if (response.status === 404) {
        console.log('🔄 Trying GET request instead...');
        return await testGetRequest(url, testDomain);
      }
    }
  } catch (error) {
    console.error(`❌ POST Failed:`, error.message);

    // Try GET as fallback
    console.log('🔄 Trying GET request as fallback...');
    return await testGetRequest(url, testDomain);
  }

  return false;
}

async function testGetRequest(url, domain) {
  try {
    const getUrl = `${url}?domain=${encodeURIComponent(domain)}`;
    console.log(`📤 GET URL: ${getUrl}`);

    const response = await fetch(getUrl, {
      method: 'GET',
    });

    console.log(`📊 GET Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      return await handleSuccessResponse(response, 'GET');
    } else {
      const errorText = await response.text();
      console.error(`❌ GET Error: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ GET Failed:`, error.message);
    return false;
  }
}

async function handleSuccessResponse(response, method) {
  const contentType = response.headers.get('content-type');
  console.log(`📄 Content-Type: ${contentType}`);

  const data = await response.json();
  console.log(`✅ ${method} Success! Response structure:`);

  // Analyze response structure
  console.log('  - Type:', Array.isArray(data) ? 'array' : typeof data);
  console.log('  - Keys:', Array.isArray(data) ? 'array' : typeof data === 'object' && data !== null ? Object.keys(data) : 'primitive');

  if (Array.isArray(data)) {
    console.log('  - Array length:', data.length);
    if (data.length > 0) {
      console.log('  - First item keys:', Object.keys(data[0] || {}));
    }
  } else if (typeof data === 'object' && data !== null) {
    // Look for common backlink response fields
    const possibleBacklinkFields = ['backlinks', 'links', 'items', 'results', 'data'];
    for (const field of possibleBacklinkFields) {
      if (data[field]) {
        console.log(`  - Found ${field}:`, Array.isArray(data[field]) ? `array with ${data[field].length} items` : typeof data[field]);
      }
    }
  }

  // Pretty print a sample of the response
  const sample = JSON.stringify(data, null, 2);
  const truncated = sample.length > 1000 ? sample.substring(0, 1000) + '...' : sample;
  console.log('  - Sample response:', truncated);

  return true;
}

// Test both endpoints
async function runTests() {
  console.log('🚀 Starting n8n webhook tests...\n');

  const productionSuccess = await testWebhook(productionUrl, 'production');
  const testSuccess = await testWebhook(testUrl, 'test');

  console.log('\n📋 Test Results:');
  console.log('  - Production webhook:', productionSuccess ? '✅ Working' : '❌ Failed');
  console.log('  - Test webhook:', testSuccess ? '✅ Working' : '❌ Failed');

  if (!productionSuccess && !testSuccess) {
    console.log('\n💡 Suggestions:');
    console.log('  1. Make sure the n8n workflow is active (toggle in top-right of editor)');
    console.log('  2. Check if the webhook path is correct');
    console.log('  3. Verify the webhook is set to respond with JSON');
    console.log('  4. Ensure the domain parameter is configured as fixed expression');
  }
}

// Run the tests
runTests().catch(console.error);
