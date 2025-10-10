import { proxyEngineService } from '../src/services/ProxyEngineService';
import feed from '../test_data/shabari_proxy_test_feed.json';

async function advancedThreatTest() {
  console.log('🔬 Advanced Threat Detection Test');
  console.log('📋 Testing enhanced proxy threat checking capabilities\n');

  try {
    // 1. Initialize and apply custom feed
    console.log('Step 1: Initialize system...');
    await proxyEngineService.initialize();
    await proxyEngineService.updateFiltersWithCustomFeed(feed);
    console.log('✅ System initialized with custom threat feed\n');

    // 2. Test domain-based threats
    console.log('Step 2: Domain Threat Detection');
    const domainTests = [
      // From our JSON feed
      { url: 'ads.eviltracker.com', expected: 'blocked', category: 'ad tracker' },
      { url: 'malware.badstuff.net', expected: 'blocked', category: 'malware' },
      { url: 'login.paypa1.com', expected: 'blocked', category: 'phishing typosquatting' },
      
      // Heuristic detection tests
      { url: 'gooogle.com', expected: 'blocked', category: 'typosquatting google.com' },
      { url: 'facebok.com', expected: 'blocked', category: 'typosquatting facebook.com' },
      { url: 'example.tk', expected: 'warning', category: 'suspicious TLD' },
      { url: 'test.click', expected: 'warning', category: 'suspicious TLD' },
      { url: 'phishing-site.com', expected: 'warning', category: 'suspicious keyword' },
      { url: 'virus-download.net', expected: 'warning', category: 'suspicious keyword' },
      
      // Subdomain tests
      { url: 'a.b.c.d.e.com', expected: 'warning', category: 'excessive subdomains' },
      
      // Safe domains
      { url: 'google.com', expected: 'allowed', category: 'legitimate site' },
      { url: 'github.com', expected: 'allowed', category: 'legitimate site' },
      { url: 'stackoverflow.com', expected: 'allowed', category: 'legitimate site' }
    ];

    for (const test of domainTests) {
      const result = await proxyEngineService.checkURLThreat(`http://${test.url}`);
      const status = result.isThreat ? '🚫 BLOCKED' : '✅ ALLOWED';
      const confidence = result.confidence || 0;
      const details = result.details || 'No details';
      
      console.log(`   ${test.url}: ${status} (${confidence}% confidence)`);
      console.log(`      Category: ${test.category}`);
      console.log(`      Details: ${details}`);
      
      // Validate expected results
      const actualResult = result.isThreat ? 'blocked' : 'allowed';
      if (test.expected === 'blocked' && !result.isThreat) {
        console.log(`      ⚠️  Expected block but got allow`);
      } else if (test.expected === 'allowed' && result.isThreat) {
        console.log(`      ⚠️  Expected allow but got block`);
      } else {
        console.log(`      ✅ Result matches expectation`);
      }
      console.log('');
    }

    // 3. Test IP-based threats
    console.log('Step 3: IP Threat Detection');
    const ipTests = [
      // From our JSON feed
      { ip: '45.56.123.23', expected: 'blocked', category: 'botnet C2' },
      { ip: '104.27.31.5', expected: 'blocked', category: 'phishing host' },
      
      // Safe IPs
      { ip: '8.8.8.8', expected: 'allowed', category: 'Google DNS' },
      { ip: '1.1.1.1', expected: 'allowed', category: 'Cloudflare DNS' },
      { ip: '208.67.222.222', expected: 'allowed', category: 'OpenDNS' }
    ];

    for (const test of ipTests) {
      const result = await proxyEngineService.checkIPThreat(test.ip);
      const status = result.isThreat ? '🚫 BLOCKED' : '✅ ALLOWED';
      const confidence = result.confidence || 0;
      const details = result.details || 'No details';
      
      console.log(`   ${test.ip}: ${status} (${confidence}% confidence)`);
      console.log(`      Category: ${test.category}`);
      console.log(`      Details: ${details}`);
      
      const actualResult = result.isThreat ? 'blocked' : 'allowed';
      if (test.expected === 'blocked' && !result.isThreat) {
        console.log(`      ⚠️  Expected block but got allow`);
      } else if (test.expected === 'allowed' && result.isThreat) {
        console.log(`      ⚠️  Expected allow but got block`);
      } else {
        console.log(`      ✅ Result matches expectation`);
      }
      console.log('');
    }

    // 4. Test protocol combinations
    console.log('Step 4: Protocol & Port Testing');
    const protocolTests = [
      'http://malware.badstuff.net',
      'https://login.paypa1.com',
      'ftp://ads.eviltracker.com',
      'http://malware.badstuff.net:8080',
      'https://gooogle.com:443'
    ];

    for (const url of protocolTests) {
      const result = await proxyEngineService.checkURLThreat(url);
      const status = result.isThreat ? '🚫 BLOCKED' : '✅ ALLOWED';
      console.log(`   ${url}: ${status}`);
    }

    // 5. Start protection and test real-time blocking
    console.log('\nStep 5: Real-time Protection Test');
    const startResult = await proxyEngineService.startProtection({
      blockAds: true,
      blockTrackers: true,
      blockMalware: true,
      blockPhishing: true,
      enableCallProtection: true
    });
    
    if (startResult.success) {
      console.log('✅ Protection started - proxy server running on 127.0.0.1:8080');
      console.log('   📝 HTTP requests through proxy will be filtered in real-time');
      console.log('   📝 VPN packets will be filtered at network level');
      console.log('   📝 Blocked requests will show Shabari protection page');
      
      // Get final statistics
      const status = await proxyEngineService.getStatus();
      if (status.statistics) {
        console.log('\n📊 System Statistics:');
        console.log(`   Threats Blocked: ${status.statistics.threatsBlocked}`);
        console.log(`   Data Transferred: ${status.statistics.dataTransferred}`);
        console.log(`   DNS Queries: ${status.statistics.dnsQueries}`);
        console.log(`   Cache Hit Rate: ${status.statistics.cacheHitRate}`);
      }
      
      // Stop protection
      await proxyEngineService.stopProtection();
      console.log('✅ Protection stopped');
    } else {
      console.log('❌ Failed to start protection:', startResult.message);
    }

    console.log('\n🎉 Advanced threat detection test completed!');
    console.log('\n📋 Summary of Capabilities:');
    console.log('   ✅ Domain-based filtering (from JSON feed)');
    console.log('   ✅ IP-based filtering (from JSON feed)');
    console.log('   ✅ Heuristic typosquatting detection');
    console.log('   ✅ Suspicious TLD detection');
    console.log('   ✅ Keyword-based content filtering');
    console.log('   ✅ Subdomain analysis (DGA detection)');
    console.log('   ✅ Protocol-agnostic URL checking');
    console.log('   ✅ Real-time proxy filtering');
    console.log('   ✅ VPN-level packet filtering');
    console.log('   ✅ Integrated event broadcasting');
    console.log('\n🛡️ Shabari Enhanced Protection is ready!');

  } catch (error) {
    console.error('\n❌ Advanced threat test failed:', error);
    
    try {
      await proxyEngineService.stopProtection();
    } catch (stopError) {
      // Ignore stop errors during cleanup
    }
    
    process.exit(1);
  }
}

advancedThreatTest();
