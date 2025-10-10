// Firebase configuration - Replace with your own config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions();

// Global variables
let currentUser = null;
let threatsData = [];
let reportsData = [];
let charts = {};

// Authentication
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        
        // Check if user is admin
        const idTokenResult = await currentUser.getIdTokenResult();
        if (idTokenResult.claims.admin) {
            showDashboard();
        } else {
            throw new Error('You do not have admin privileges');
        }
    } catch (error) {
        document.getElementById('loginError').textContent = error.message;
        document.getElementById('loginError').classList.remove('hidden');
    }
});

// Auth state observer
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims.admin) {
            showDashboard();
        }
    } else {
        showLogin();
    }
});

function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('userEmail').textContent = currentUser.email;
    
    loadStatistics();
    loadThreats();
    loadReports();
    initCharts();
}

function signOut() {
    auth.signOut();
}

// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-white', 'text-blue-600');
        btn.classList.add('text-gray-600');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}Tab`).classList.remove('hidden');
    
    // Add active class to selected button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    activeBtn.classList.add('active', 'bg-white', 'text-blue-600');
    activeBtn.classList.remove('text-gray-600');
}

// Load statistics
async function loadStatistics() {
    try {
        const getThreatStats = functions.httpsCallable('getThreatStatistics');
        const result = await getThreatStats();
        const stats = result.data.statistics;
        
        document.getElementById('totalDomains').textContent = stats.domains.total;
        document.getElementById('totalPhones').textContent = stats.numbers.total;
        document.getElementById('totalIps').textContent = stats.ips.total;
        document.getElementById('reportsToday').textContent = stats.reports.today;
        
        updateCharts(stats);
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load threats
async function loadThreats(filter = 'all') {
    try {
        let threats = [];
        
        if (filter === 'all' || filter === 'domain') {
            const domainsSnapshot = await db.collection('fraud_domains')
                .where('active', '==', true)
                .orderBy('severity', 'desc')
                .limit(50)
                .get();
            
            domainsSnapshot.forEach(doc => {
                threats.push({ id: doc.id, type: 'domain', ...doc.data() });
            });
        }
        
        if (filter === 'all' || filter === 'phone') {
            const phonesSnapshot = await db.collection('fraud_numbers')
                .where('active', '==', true)
                .orderBy('severity', 'desc')
                .limit(50)
                .get();
            
            phonesSnapshot.forEach(doc => {
                threats.push({ id: doc.id, type: 'phone', ...doc.data() });
            });
        }
        
        if (filter === 'all' || filter === 'ip') {
            const ipsSnapshot = await db.collection('fraud_ips')
                .where('active', '==', true)
                .orderBy('severity', 'desc')
                .limit(50)
                .get();
            
            ipsSnapshot.forEach(doc => {
                threats.push({ id: doc.id, type: 'ip', ...doc.data() });
            });
        }
        
        threatsData = threats;
        displayThreats(threats);
    } catch (error) {
        console.error('Error loading threats:', error);
    }
}

// Display threats in table
function displayThreats(threats) {
    const tbody = document.getElementById('threatsTableBody');
    tbody.innerHTML = '';
    
    threats.forEach(threat => {
        const row = document.createElement('tr');
        const severityColor = threat.severity >= 80 ? 'red' : threat.severity >= 50 ? 'yellow' : 'green';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${threat.domain || threat.number || threat.range || threat.pattern}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${threat.type}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${threat.category}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${severityColor}-100 text-${severityColor}-800">
                    ${threat.severity}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${threat.report_count || 0}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="reviewThreat('${threat.id}', '${threat.type}')" 
                    class="text-indigo-600 hover:text-indigo-900 mr-2">Review</button>
                <button onclick="removeThreat('${threat.id}', '${threat.type}')" 
                    class="text-red-600 hover:text-red-900">Remove</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Filter threats
function filterThreats() {
    const filter = document.getElementById('threatFilter').value;
    loadThreats(filter);
}

// Load reports
async function loadReports() {
    try {
        const reportsSnapshot = await db.collection('reports')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();
        
        const reports = [];
        reportsSnapshot.forEach(doc => {
            reports.push({ id: doc.id, ...doc.data() });
        });
        
        reportsData = reports;
        displayReports(reports);
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// Display reports in table
function displayReports(reports) {
    const tbody = document.getElementById('reportsTableBody');
    tbody.innerHTML = '';
    
    reports.forEach(report => {
        const row = document.createElement('tr');
        const timestamp = new Date(report.timestamp).toLocaleString();
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${timestamp}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${report.target}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${report.type}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${report.action === 'blocked' ? 'red' : 'yellow'}-100 text-${report.action === 'blocked' ? 'red' : 'yellow'}-800">
                    ${report.action}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${report.device_id?.substring(0, 8)}...</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="approveReport('${report.id}', '${report.target}', '${report.type}')" 
                    class="text-green-600 hover:text-green-900 mr-2">Approve</button>
                <button onclick="rejectReport('${report.id}')" 
                    class="text-red-600 hover:text-red-900">Reject</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Review threat
async function reviewThreat(threatId, type) {
    const decision = prompt('Enter decision (approve/reject/monitor):');
    if (!decision) return;
    
    const notes = prompt('Enter review notes (optional):');
    
    try {
        const reviewThreatFunc = functions.httpsCallable('reviewThreat');
        await reviewThreatFunc({
            threatId,
            type,
            decision,
            notes
        });
        
        alert('Threat reviewed successfully');
        loadThreats();
    } catch (error) {
        alert('Error reviewing threat: ' + error.message);
    }
}

// Remove threat
async function removeThreat(threatId, type) {
    if (!confirm('Are you sure you want to remove this threat?')) return;
    
    try {
        const collection = type === 'domain' ? 'fraud_domains' : 
                          type === 'phone' ? 'fraud_numbers' : 'fraud_ips';
        
        await db.collection(collection).doc(threatId).update({
            active: false,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Threat removed successfully');
        loadThreats();
    } catch (error) {
        alert('Error removing threat: ' + error.message);
    }
}

// Approve report
async function approveReport(reportId, target, type) {
    try {
        // Add to appropriate collection based on type
        const collection = type === 'domain' ? 'fraud_domains' : 
                          type === 'phone' ? 'fraud_numbers' : 
                          type === 'ip' ? 'fraud_ips' : null;
        
        if (collection) {
            await db.collection(collection).doc(target).set({
                [type === 'domain' ? 'domain' : type === 'phone' ? 'number' : 'range']: target,
                type: type,
                category: 'user_reported',
                severity: 70,
                active: true,
                report_count: 1,
                metadata: {
                    source: 'admin_approved',
                    approved_by: currentUser.uid
                },
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        
        // Mark report as reviewed
        await db.collection('reports').doc(reportId).update({
            reviewed: true,
            reviewed_by: currentUser.uid,
            review_decision: 'approved',
            reviewed_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Report approved and threat added');
        loadReports();
    } catch (error) {
        alert('Error approving report: ' + error.message);
    }
}

// Reject report
async function rejectReport(reportId) {
    try {
        await db.collection('reports').doc(reportId).update({
            reviewed: true,
            reviewed_by: currentUser.uid,
            review_decision: 'rejected',
            reviewed_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Report rejected');
        loadReports();
    } catch (error) {
        alert('Error rejecting report: ' + error.message);
    }
}

// Seed form submission
document.getElementById('seedForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const type = document.getElementById('seedType').value;
    const category = document.getElementById('seedCategory').value;
    const value = document.getElementById('seedValue').value;
    const description = document.getElementById('seedDescription').value;
    const severity = parseInt(document.getElementById('seedSeverity').value);
    
    try {
        const manageSeedData = functions.httpsCallable('manageSeedData');
        await manageSeedData({
            action: 'add',
            type: type,
            entries: [{
                value: value,
                category: category,
                severity: severity,
                description: description
            }]
        });
        
        alert('Seed entry added successfully');
        document.getElementById('seedForm').reset();
        loadThreats();
    } catch (error) {
        alert('Error adding seed entry: ' + error.message);
    }
});

// Update severity label
function updateSeverityLabel() {
    const severity = document.getElementById('seedSeverity').value;
    document.getElementById('severityLabel').textContent = severity;
}

// Initialize charts
function initCharts() {
    // Category chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    charts.categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: ['Phishing', 'Malware', 'Scam', 'Spam', 'Other'],
            datasets: [{
                data: [0, 0, 0, 0, 0],
                backgroundColor: [
                    '#EF4444',
                    '#F59E0B',
                    '#10B981',
                    '#3B82F6',
                    '#8B5CF6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // Reports chart
    const reportsCtx = document.getElementById('reportsChart').getContext('2d');
    charts.reportsChart = new Chart(reportsCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Reports',
                data: [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update charts with data
function updateCharts(stats) {
    // Update category chart with actual data
    if (charts.categoryChart && threatsData.length > 0) {
        const categories = {};
        threatsData.forEach(threat => {
            categories[threat.category] = (categories[threat.category] || 0) + 1;
        });
        
        charts.categoryChart.data.labels = Object.keys(categories);
        charts.categoryChart.data.datasets[0].data = Object.values(categories);
        charts.categoryChart.update();
    }
    
    // Update reports chart with mock data (replace with actual data)
    if (charts.reportsChart) {
        charts.reportsChart.data.datasets[0].data = [
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            stats.reports.today
        ];
        charts.reportsChart.update();
    }
}

// Add CSS for tab buttons
const style = document.createElement('style');
style.textContent = `
    .tab-btn {
        flex: 1;
        padding: 0.75rem;
        border-radius: 0.5rem;
        font-weight: 500;
        transition: all 0.2s;
        background: transparent;
    }
    .tab-btn:hover {
        background: white;
    }
    .tab-btn.active {
        background: white;
        color: rgb(37, 99, 235);
    }
`;
document.head.appendChild(style);
