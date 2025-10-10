/**
 * Convert PhishTank CSV to JSON for React Native app
 */

const fs = require('fs');
const path = require('path');

// CSV parsing functions
function parseCSVFields(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      fields.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  fields.push(current.trim());
  return fields;
}

function parseCSVLine(line) {
  const fields = parseCSVFields(line);
  
  if (fields.length < 8) {
    return null;
  }

  return {
    phish_id: fields[0],
    url: fields[1],
    phish_detail_url: fields[2],
    submission_time: fields[3],
    verified: fields[4],
    verification_time: fields[5],
    online: fields[6],
    target: fields[7]
  };
}

function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

function mapTargetToCategory(target) {
  const targetLower = target.toLowerCase();
  
  if (targetLower.includes('coinbase') || targetLower.includes('crypto') || targetLower.includes('bitcoin')) {
    return 'crypto_phishing';
  } else if (targetLower.includes('microsoft') || targetLower.includes('office') || targetLower.includes('outlook')) {
    return 'microsoft_phishing';
  } else if (targetLower.includes('apple') || targetLower.includes('icloud') || targetLower.includes('iphone')) {
    return 'apple_phishing';
  } else if (targetLower.includes('google') || targetLower.includes('gmail') || targetLower.includes('youtube')) {
    return 'google_phishing';
  } else if (targetLower.includes('facebook') || targetLower.includes('instagram') || targetLower.includes('whatsapp')) {
    return 'social_phishing';
  } else if (targetLower.includes('bank') || targetLower.includes('paypal') || targetLower.includes('payment')) {
    return 'financial_phishing';
  } else if (targetLower.includes('amazon') || targetLower.includes('ebay') || targetLower.includes('allegro')) {
    return 'ecommerce_phishing';
  } else {
    return 'phishing';
  }
}

function calculateSeverity(target) {
  const targetLower = target.toLowerCase();
  
  if (targetLower.includes('coinbase') || targetLower.includes('crypto')) {
    return 95;
  } else if (targetLower.includes('microsoft') || targetLower.includes('apple') || targetLower.includes('google')) {
    return 90;
  } else if (targetLower.includes('bank') || targetLower.includes('paypal')) {
    return 85;
  } else if (targetLower.includes('amazon') || targetLower.includes('facebook')) {
    return 80;
  } else {
    return 75;
  }
}

async function convertCSVToJSON() {
  console.log('🔄 Converting PhishTank CSV to JSON...\n');

  try {
    // Read CSV file
    const csvPath = path.join(__dirname, 'phistank_csv', 'verified_online.csv');
    console.log(`📁 Reading CSV file: ${csvPath}`);
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n');
    
    console.log(`📊 Found ${lines.length} lines in CSV file`);

    // Parse CSV entries
    const entries = [];
    const categoryStats = {};
    let processedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const entry = parseCSVLine(line);
        if (entry) {
          // Add additional metadata
          const domain = extractDomain(entry.url);
          const category = mapTargetToCategory(entry.target);
          const severity = calculateSeverity(entry.target);

          const enhancedEntry = {
            ...entry,
            domain: domain,
            category: category,
            severity: severity
          };

          entries.push(enhancedEntry);
          
          // Update category stats
          categoryStats[category] = (categoryStats[category] || 0) + 1;
          processedCount++;

          // Log progress every 1000 entries
          if (processedCount % 1000 === 0) {
            console.log(`📊 Processed ${processedCount} entries...`);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to parse line ${i}:`, error.message);
      }
    }

    console.log(`✅ Parsed ${entries.length} valid entries from CSV`);

    // Create optimized JSON structure
    const jsonData = {
      metadata: {
        totalEntries: entries.length,
        generatedAt: new Date().toISOString(),
        source: 'PhishTank verified_online.csv',
        version: '1.0'
      },
      categories: categoryStats,
      entries: entries
    };

    // Write JSON file
    const jsonPath = path.join(__dirname, 'src', 'data', 'phishtank-data.json');
    const jsonDir = path.dirname(jsonPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(jsonDir)) {
      fs.mkdirSync(jsonDir, { recursive: true });
    }

    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    
    console.log(`\n🎉 Conversion completed successfully!`);
    console.log(`📁 JSON file created: ${jsonPath}`);
    console.log(`📊 Total entries: ${entries.length}`);
    
    console.log('\n📋 Category breakdown:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} entries`);
    });

    // Create a smaller sample file for testing
    const sampleData = {
      metadata: {
        totalEntries: 100,
        generatedAt: new Date().toISOString(),
        source: 'PhishTank verified_online.csv (sample)',
        version: '1.0'
      },
      categories: categoryStats,
      entries: entries.slice(0, 100)
    };

    const samplePath = path.join(__dirname, 'src', 'data', 'phishtank-sample.json');
    fs.writeFileSync(samplePath, JSON.stringify(sampleData, null, 2));
    
    console.log(`\n📁 Sample file created: ${samplePath} (100 entries)`);

    console.log('\n🔧 Next steps:');
    console.log('   1. Update LocalThreatDetectionService to load from JSON');
    console.log('   2. Test threat detection with sample data');
    console.log('   3. Integrate with proxy engine');

  } catch (error) {
    console.error('❌ Conversion failed:', error);
  }
}

// Run the conversion
convertCSVToJSON();
