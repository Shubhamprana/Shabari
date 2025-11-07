
    const { YaraSecurityService } = require('./src/services/YaraSecurityService');
    
    console.log('🔍 Testing YARA engine integration...');
    
    YaraSecurityService.getEngineStatus()
      .then(status => {
        console.log('✅ YARA Engine Status:', status);
        console.log('✅ Engine Type:', status.engineType);
        console.log('✅ Native Available:', status.native);
        console.log('✅ Rules Count:', status.rulesCount);
      })
      .catch(error => {
        console.log('⚠️ YARA Engine Test Warning:', error.message);
        console.log('💡 This is normal in development mode');
      });
  