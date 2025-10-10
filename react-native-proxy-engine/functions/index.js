const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

const db = admin.firestore();

// Constants for threat scoring
const REPORT_THRESHOLD_BLOCK = 100;
const REPORT_THRESHOLD_WARN = 50;
const REPORT_THRESHOLD_MONITOR = 20;
const CONFIDENCE_MULTIPLIER = 10;

/**
 * Cloud Function triggered when a new report is created
 * Increments counters and promotes threats based on thresholds
 */
exports.onReportCreate = functions.firestore
  .document('reports/{reportId}')
  .onCreate(async (snap, context) => {
    const report = snap.data();
    const { target, type, action, device_id, timestamp } = report;
    
    try {
      // Hash sensitive data
      const hashedTarget = type === 'phone' 
        ? hashWithSalt(target, 'shabari_salt_2024')
        : target;
      
      // Determine collection based on type
      let collectionName;
      switch (type) {
        case 'domain':
          collectionName = 'fraud_domains';
          break;
        case 'phone':
          collectionName = 'fraud_numbers';
          break;
        case 'ip':
          collectionName = 'fraud_ips';
          break;
        default:
          console.error('Unknown report type:', type);
          return;
      }
      
      // Update or create threat entry
      const threatRef = db.collection(collectionName).doc(hashedTarget);
      
      await db.runTransaction(async (transaction) => {
        const threatDoc = await transaction.get(threatRef);
        
        if (threatDoc.exists) {
          // Update existing threat
          const currentData = threatDoc.data();
          const newReportCount = (currentData.report_count || 0) + 1;
          const newBlockCount = currentData.block_count || 0;
          const newWarnCount = currentData.warn_count || 0;
          
          // Update counters based on action
          const updates = {
            report_count: newReportCount,
            last_reported: timestamp,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          };
          
          if (action === 'blocked') {
            updates.block_count = newBlockCount + 1;
          } else if (action === 'warned') {
            updates.warn_count = newWarnCount + 1;
          }
          
          // Calculate new severity based on reports
          const severity = calculateSeverity(
            newReportCount,
            updates.block_count || newBlockCount,
            updates.warn_count || newWarnCount
          );
          
          updates.severity = severity;
          updates.active = severity > REPORT_THRESHOLD_MONITOR;
          
          // Add reporter to unique reporters list
          if (!currentData.reporters?.includes(device_id)) {
            updates.reporters = admin.firestore.FieldValue.arrayUnion(device_id);
          }
          
          transaction.update(threatRef, updates);
          
          // Log promotion if threshold crossed
          if (!currentData.active && updates.active) {
            await logPromotion(hashedTarget, type, severity, newReportCount);
          }
          
        } else {
          // Create new threat entry
          const severity = calculateSeverity(1, action === 'blocked' ? 1 : 0, action === 'warned' ? 1 : 0);
          
          transaction.set(threatRef, {
            [type === 'domain' ? 'domain' : type === 'phone' ? 'number' : 'range']: target,
            hashed_value: hashedTarget,
            type: type,
            category: detectCategory(target, type),
            report_count: 1,
            block_count: action === 'blocked' ? 1 : 0,
            warn_count: action === 'warned' ? 1 : 0,
            severity: severity,
            active: severity > REPORT_THRESHOLD_MONITOR,
            first_reported: timestamp,
            last_reported: timestamp,
            reporters: [device_id],
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            metadata: {
              source: 'user_report',
              confidence: calculateConfidence(1),
            }
          });
        }
      });
      
      // Send notification to admin if high severity
      const threatDoc = await threatRef.get();
      const threatData = threatDoc.data();
      
      if (threatData.severity >= REPORT_THRESHOLD_BLOCK) {
        await notifyAdmin('high_severity_threat', {
          target: target,
          type: type,
          severity: threatData.severity,
          reports: threatData.report_count,
        });
      }
      
      console.log(`Report processed for ${type}: ${hashedTarget}`);
      
    } catch (error) {
      console.error('Error processing report:', error);
      throw new functions.https.HttpsError('internal', 'Failed to process report');
    }
  });

/**
 * Admin callable function to add/remove seed entries
 */
exports.manageSeedData = functions.https.onCall(async (data, context) => {
  // Check admin authentication
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can manage seed data'
    );
  }
  
  const { action, type, entries } = data;
  
  if (!action || !type || !entries || !Array.isArray(entries)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required parameters'
    );
  }
  
  try {
    const batch = db.batch();
    let collectionName;
    
    switch (type) {
      case 'domain':
        collectionName = 'fraud_domains';
        break;
      case 'phone':
        collectionName = 'fraud_numbers';
        break;
      case 'ip':
        collectionName = 'fraud_ips';
        break;
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid type');
    }
    
    if (action === 'add') {
      // Add seed entries
      for (const entry of entries) {
        const docId = type === 'phone' 
          ? hashWithSalt(entry.value, 'shabari_salt_2024')
          : entry.value;
        
        const docRef = db.collection(collectionName).doc(docId);
        
        batch.set(docRef, {
          [type === 'domain' ? 'domain' : type === 'phone' ? 'number' : 'range']: entry.value,
          hashed_value: docId,
          type: type,
          category: entry.category || 'seed',
          severity: entry.severity || 100,
          active: true,
          description: entry.description || '',
          report_count: 0,
          metadata: {
            source: 'admin_seed',
            added_by: context.auth.uid,
            confidence: 1.0,
          },
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      
    } else if (action === 'remove') {
      // Remove seed entries
      for (const entry of entries) {
        const docId = type === 'phone' 
          ? hashWithSalt(entry, 'shabari_salt_2024')
          : entry;
        
        const docRef = db.collection(collectionName).doc(docId);
        batch.delete(docRef);
      }
      
    } else {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
    }
    
    await batch.commit();
    
    return {
      success: true,
      message: `Successfully ${action}ed ${entries.length} ${type} entries`,
      timestamp: Date.now(),
    };
    
  } catch (error) {
    console.error('Error managing seed data:', error);
    throw new functions.https.HttpsError('internal', 'Failed to manage seed data');
  }
});

/**
 * Get threat statistics for admin dashboard
 */
exports.getThreatStatistics = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Authentication required'
    );
  }
  
  try {
    const stats = {
      domains: {
        total: 0,
        active: 0,
        high_severity: 0,
      },
      numbers: {
        total: 0,
        active: 0,
        high_severity: 0,
      },
      ips: {
        total: 0,
        active: 0,
        high_severity: 0,
      },
      reports: {
        total: 0,
        today: 0,
        this_week: 0,
        this_month: 0,
      },
    };
    
    // Get domain statistics
    const domainsSnapshot = await db.collection('fraud_domains').get();
    stats.domains.total = domainsSnapshot.size;
    domainsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.active) stats.domains.active++;
      if (data.severity >= REPORT_THRESHOLD_BLOCK) stats.domains.high_severity++;
    });
    
    // Get phone number statistics
    const numbersSnapshot = await db.collection('fraud_numbers').get();
    stats.numbers.total = numbersSnapshot.size;
    numbersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.active) stats.numbers.active++;
      if (data.severity >= REPORT_THRESHOLD_BLOCK) stats.numbers.high_severity++;
    });
    
    // Get IP statistics
    const ipsSnapshot = await db.collection('fraud_ips').get();
    stats.ips.total = ipsSnapshot.size;
    ipsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.active) stats.ips.active++;
      if (data.severity >= REPORT_THRESHOLD_BLOCK) stats.ips.high_severity++;
    });
    
    // Get report statistics
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekStart = now - (7 * 24 * 60 * 60 * 1000);
    const monthStart = now - (30 * 24 * 60 * 60 * 1000);
    
    const reportsSnapshot = await db.collection('reports')
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get();
    
    stats.reports.total = reportsSnapshot.size;
    reportsSnapshot.forEach(doc => {
      const timestamp = doc.data().timestamp;
      if (timestamp >= todayStart) stats.reports.today++;
      if (timestamp >= weekStart) stats.reports.this_week++;
      if (timestamp >= monthStart) stats.reports.this_month++;
    });
    
    return {
      success: true,
      statistics: stats,
      timestamp: now,
    };
    
  } catch (error) {
    console.error('Error getting statistics:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get statistics');
  }
});

/**
 * Review and approve/reject reported threats
 */
exports.reviewThreat = functions.https.onCall(async (data, context) => {
  // Check admin authentication
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can review threats'
    );
  }
  
  const { threatId, type, decision, notes } = data;
  
  if (!threatId || !type || !decision) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required parameters'
    );
  }
  
  try {
    let collectionName;
    switch (type) {
      case 'domain':
        collectionName = 'fraud_domains';
        break;
      case 'phone':
        collectionName = 'fraud_numbers';
        break;
      case 'ip':
        collectionName = 'fraud_ips';
        break;
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid type');
    }
    
    const threatRef = db.collection(collectionName).doc(threatId);
    const threatDoc = await threatRef.get();
    
    if (!threatDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Threat not found');
    }
    
    const updates = {
      reviewed: true,
      reviewed_by: context.auth.uid,
      reviewed_at: admin.firestore.FieldValue.serverTimestamp(),
      review_decision: decision,
      review_notes: notes || '',
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    if (decision === 'approve') {
      updates.active = true;
      updates.severity = Math.max(threatDoc.data().severity, REPORT_THRESHOLD_BLOCK);
    } else if (decision === 'reject') {
      updates.active = false;
      updates.severity = 0;
    } else if (decision === 'monitor') {
      updates.active = true;
      updates.severity = REPORT_THRESHOLD_MONITOR;
    }
    
    await threatRef.update(updates);
    
    // Log the review action
    await db.collection('audit_logs').add({
      action: 'threat_review',
      threat_id: threatId,
      threat_type: type,
      decision: decision,
      notes: notes,
      admin_id: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return {
      success: true,
      message: `Threat ${decision}ed successfully`,
      timestamp: Date.now(),
    };
    
  } catch (error) {
    console.error('Error reviewing threat:', error);
    throw new functions.https.HttpsError('internal', 'Failed to review threat');
  }
});

/**
 * Scheduled function to clean up old reports and update threat scores
 */
exports.dailyMaintenance = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Starting daily maintenance...');
    
    try {
      const now = Date.now();
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
      
      // Clean up old reports
      const oldReports = await db.collection('reports')
        .where('timestamp', '<', thirtyDaysAgo)
        .limit(500)
        .get();
      
      const batch = db.batch();
      oldReports.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`Deleted ${oldReports.size} old reports`);
      
      // Update threat scores based on decay
      await decayThreatScores();
      
      // Generate daily report for admins
      await generateDailyReport();
      
      console.log('Daily maintenance completed');
      
    } catch (error) {
      console.error('Error in daily maintenance:', error);
    }
  });

// Helper functions

function hashWithSalt(value, salt) {
  return crypto
    .createHash('sha256')
    .update(salt + value)
    .digest('hex');
}

function calculateSeverity(reportCount, blockCount, warnCount) {
  // Calculate severity score based on reports and actions
  const baseScore = reportCount * 2;
  const blockScore = blockCount * 5;
  const warnScore = warnCount * 3;
  
  return Math.min(100, baseScore + blockScore + warnScore);
}

function calculateConfidence(reportCount) {
  // Calculate confidence based on number of reports
  if (reportCount >= 100) return 1.0;
  if (reportCount >= 50) return 0.9;
  if (reportCount >= 20) return 0.7;
  if (reportCount >= 10) return 0.5;
  if (reportCount >= 5) return 0.3;
  return 0.1;
}

function detectCategory(target, type) {
  // Detect category based on patterns
  if (type === 'domain') {
    if (target.includes('bank') || target.includes('paypal')) return 'phishing';
    if (target.includes('virus') || target.includes('malware')) return 'malware';
    if (target.includes('casino') || target.includes('bet')) return 'gambling';
    if (target.includes('xxx') || target.includes('porn')) return 'adult';
    if (target.includes('torrent') || target.includes('pirate')) return 'piracy';
  } else if (type === 'phone') {
    if (target.startsWith('1-900') || target.startsWith('+44-90')) return 'premium_rate';
    if (target.startsWith('+234')) return 'known_scam';
    if (target.startsWith('+91-')) return 'tech_support_scam';
  }
  
  return 'unknown';
}

async function logPromotion(threatId, type, severity, reportCount) {
  await db.collection('audit_logs').add({
    action: 'threat_promoted',
    threat_id: threatId,
    threat_type: type,
    severity: severity,
    report_count: reportCount,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function notifyAdmin(type, data) {
  // Send notification to admin (implement based on your notification service)
  console.log(`Admin notification - ${type}:`, data);
  
  // Store notification in database
  await db.collection('admin_notifications').add({
    type: type,
    data: data,
    read: false,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function decayThreatScores() {
  // Reduce severity of threats that haven't been reported recently
  const batch = db.batch();
  const collections = ['fraud_domains', 'fraud_numbers', 'fraud_ips'];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName)
      .where('active', '==', true)
      .get();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const daysSinceLastReport = (Date.now() - data.last_reported) / (24 * 60 * 60 * 1000);
      
      if (daysSinceLastReport > 7) {
        // Decay severity by 10% per week of inactivity
        const newSeverity = Math.max(0, data.severity * 0.9);
        
        batch.update(doc.ref, {
          severity: newSeverity,
          active: newSeverity > REPORT_THRESHOLD_MONITOR,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });
  }
  
  await batch.commit();
}

async function generateDailyReport() {
  const stats = {
    new_threats: 0,
    total_reports: 0,
    high_severity_threats: 0,
  };
  
  // Get statistics for the last 24 hours
  const yesterday = Date.now() - (24 * 60 * 60 * 1000);
  
  const reportsSnapshot = await db.collection('reports')
    .where('timestamp', '>', yesterday)
    .get();
  
  stats.total_reports = reportsSnapshot.size;
  
  // Get new high severity threats
  const collections = ['fraud_domains', 'fraud_numbers', 'fraud_ips'];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName)
      .where('created_at', '>', admin.firestore.Timestamp.fromMillis(yesterday))
      .get();
    
    stats.new_threats += snapshot.size;
    
    snapshot.forEach(doc => {
      if (doc.data().severity >= REPORT_THRESHOLD_BLOCK) {
        stats.high_severity_threats++;
      }
    });
  }
  
  // Store daily report
  await db.collection('daily_reports').add({
    date: new Date().toISOString().split('T')[0],
    stats: stats,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // Notify admins if high severity threats detected
  if (stats.high_severity_threats > 0) {
    await notifyAdmin('daily_report', stats);
  }
}

module.exports = exports;
