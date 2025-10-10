const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Initialize Firebase Admin SDK
// You need to download your service account key from Firebase Console
// and place it in this directory as 'serviceAccountKey.json'
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Load seed data
const seedData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'seed-list.json'), 'utf8')
);

// Hash function for phone numbers
function hashPhoneNumber(phoneNumber) {
  const salt = 'shabari_salt_2024';
  return crypto
    .createHash('sha256')
    .update(salt + phoneNumber)
    .digest('hex');
}

// Seed domains
async function seedDomains() {
  console.log('Seeding domains...');
  const batch = db.batch();
  
  for (const domain of seedData.domains) {
    const docRef = db.collection('fraud_domains').doc(domain.value);
    
    batch.set(docRef, {
      domain: domain.value,
      hashed_value: domain.value,
      type: 'domain',
      category: domain.category,
      severity: domain.severity,
      active: true,
      description: domain.description,
      report_count: 0,
      block_count: 0,
      warn_count: 0,
      metadata: {
        source: 'seed_data',
        confidence: 1.0,
        seed_version: '1.0.0'
      },
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  await batch.commit();
  console.log(`Seeded ${seedData.domains.length} domains`);
}

// Seed IPs
async function seedIps() {
  console.log('Seeding IP ranges...');
  const batch = db.batch();
  
  for (const ip of seedData.ips) {
    const docRef = db.collection('fraud_ips').doc(ip.value.replace(/\//g, '_'));
    
    batch.set(docRef, {
      range: ip.value,
      hashed_value: ip.value.replace(/\//g, '_'),
      type: 'ip',
      category: ip.category,
      severity: ip.severity,
      active: true,
      description: ip.description,
      report_count: 0,
      block_count: 0,
      warn_count: 0,
      metadata: {
        source: 'seed_data',
        confidence: 1.0,
        seed_version: '1.0.0'
      },
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  await batch.commit();
  console.log(`Seeded ${seedData.ips.length} IP ranges`);
}

// Seed phone numbers
async function seedPhoneNumbers() {
  console.log('Seeding phone numbers...');
  const batch = db.batch();
  
  for (const phone of seedData.phones) {
    const hashedNumber = hashPhoneNumber(phone.value);
    const docRef = db.collection('fraud_numbers').doc(hashedNumber);
    
    batch.set(docRef, {
      number: phone.value,
      hashed_value: hashedNumber,
      type: 'phone',
      category: phone.category,
      severity: phone.severity,
      active: true,
      description: phone.description,
      report_count: 0,
      block_count: 0,
      warn_count: 0,
      metadata: {
        source: 'seed_data',
        confidence: 1.0,
        seed_version: '1.0.0',
        country_code: phone.value.split('-')[0]
      },
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  await batch.commit();
  console.log(`Seeded ${seedData.phones.length} phone numbers`);
}

// Seed filter rules for apps
async function seedAppRules() {
  console.log('Seeding app filter rules...');
  const batch = db.batch();
  
  for (const app of seedData.apps) {
    const docRef = db.collection('filter_rules').doc(app.value);
    
    batch.set(docRef, {
      pattern: app.value,
      type: 'exact',
      action: app.severity >= 80 ? 'block' : 'warn',
      priority: app.severity * 10,
      category: app.category,
      description: app.description,
      enabled: true,
      metadata: {
        source: 'seed_data',
        target_type: 'app',
        seed_version: '1.0.0'
      },
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  await batch.commit();
  console.log(`Seeded ${seedData.apps.length} app rules`);
}

// Create initial statistics document
async function createStatistics() {
  console.log('Creating initial statistics...');
  
  await db.collection('statistics').doc('global').set({
    total_domains: seedData.domains.length,
    total_ips: seedData.ips.length,
    total_phones: seedData.phones.length,
    total_apps: seedData.apps.length,
    total_threats: seedData.domains.length + seedData.ips.length + seedData.phones.length + seedData.apps.length,
    last_updated: admin.firestore.FieldValue.serverTimestamp(),
    seed_version: '1.0.0'
  });
  
  console.log('Statistics document created');
}

// Main seeding function
async function seedDatabase() {
  console.log('Starting database seeding...');
  console.log('================================');
  
  try {
    await seedDomains();
    await seedIps();
    await seedPhoneNumbers();
    await seedAppRules();
    await createStatistics();
    
    console.log('================================');
    console.log('Database seeding completed successfully!');
    console.log(`Total items seeded: ${
      seedData.domains.length + 
      seedData.ips.length + 
      seedData.phones.length + 
      seedData.apps.length
    }`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
