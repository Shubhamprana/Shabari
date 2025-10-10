// Supabase Configuration - Uses your existing Supabase setup
const supabaseUrl = 'https://mynbtxrbqbmhxvaimfhs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bmJ0eHJicWJtaHh2YWltZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4MzI1NzEsImV4cCI6MjA2NTQwODU3MX0.c8K9g6NsT3MjYMcQYiSAzP8Tb05OYzY5WPHPrq-HJL0';

// Initialize Supabase client
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// Global variables
let currentUser = null;
let threatsData = [];
let reportsData = [];
let charts = {};

// Database table names
const TABLES = {
  FRAUD_DOMAINS: 'fraud_domains',
  FRAUD_NUMBERS: 'fraud_numbers',
  FRAUD_IPS: 'fraud_ips',
  REPORTS: 'proxy_reports',
  FILTER_RULES: 'filter_rules',
  ADMIN_NOTIFICATIONS: 'admin_notifications',
  AUDIT_LOGS: 'audit_logs',
  DAILY_REPORTS: 'daily_reports',
  USER_SETTINGS: 'user_settings',
  DEVICES: 'devices',
  STATISTICS: 'statistics',
};

// Authentication
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        
        // Check if user is admin (you can implement your own admin check logic)
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', currentUser.id)
            .single();
        
        if (profile?.is_admin) {
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
supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
        currentUser = session.user;
        
        // Check admin status
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', currentUser.id)
            .single();
        
        if (profile?.is_admin) {
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
    supabase.auth.signOut();
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
        const stats = {
            domains: { total: 0, active: 0, high_severity: 0 },
            numbers: { total: 0, active: 0, high_severity: 0 },
            ips: { total: 0, active: 0, high_severity: 0 },
            reports: { total: 0, today: 0, this_week: 0, this_month: 0 },
        };
        
        // Get domain statistics
        const { data: domains, error: domainsError } = await supabase
            .from(TABLES.FRAUD_DOMAINS)
            .select('*');
        
        if (!domainsError && domains) {
            stats.domains.total = domains.length;
            stats.domains.active = domains.filter(d => d.active).length;
            stats.domains.high_severity = domains.filter(d => d.severity >= 80).length;
        }
        
        // Get phone number statistics
        const { data: numbers, error: numbersError } = await supabase
            .from(TABLES.FRAUD_NUMBERS)
            .select('*');
        
        if (!numbersError && numbers) {
            stats.numbers.total = numbers.length;
            stats.numbers.active = numbers.filter(n => n.active).length;
            stats.numbers.high_severity = numbers.filter(n => n.severity >= 80).length;
        }
        
        // Get IP statistics
        const { data: ips, error: ipsError } = await supabase
            .from(TABLES.FRAUD_IPS)
            .select('*');
        
        if (!ipsError && ips) {
            stats.ips.total = ips.length;
            stats.ips.active = ips.filter(i => i.active).length;
            stats.ips.high_severity = ips.filter(i => i.severity >= 80).length;
        }
        
        // Get report statistics
        const { data: reports, error: reportsError } = await supabase
            .from(TABLES.REPORTS)
            .select('*');
        
        if (!reportsError && reports) {
            const now = Date.now();
            const todayStart = new Date().setHours(0, 0, 0, 0);
            const weekStart = now - (7 * 24 * 60 * 60 * 1000);
            const monthStart = now - (30 * 24 * 60 * 60 * 1000);
            
            stats.reports.total = reports.length;
            stats.reports.today = reports.filter(r => r.timestamp >= todayStart).length;
            stats.reports.this_week = reports.filter(r => r.timestamp >= weekStart).length;
            stats.reports.this_month = reports.filter(r => r.timestamp >= monthStart).length;
        }
        
        // Update UI
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
            const { data: domains, error } = await supabase
                .from(TABLES.FRAUD_DOMAINS)
                .select('*')
                .eq('active', true)
                .order('severity', { ascending: false })
                .limit(50);
            
            if (!error && domains) {
                threats.push(...domains.map(d => ({ ...d, type: 'domain' })));
            }
        }
        
        if (filter === 'all' || filter === 'phone') {
            const { data: numbers, error } = await supabase
                .from(TABLES.FRAUD_NUMBERS)
                .select('*')
                .eq('active', true)
                .order('severity', { ascending: false })
                .limit(50);
            
            if (!error && numbers) {
                threats.push(...numbers.map(n => ({ ...n, type: 'phone' })));
            }
        }
        
        if (filter === 'all' || filter === 'ip') {
            const { data: ips, error } = await supabase
                .from(TABLES.FRAUD_IPS)
                .select('*')
                .eq('active', true)
                .order('severity', { ascending: false })
                .limit(50);
            
            if (!error && ips) {
                threats.push(...ips.map(i => ({ ...i, type: 'ip' })));
            }
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
        const { data: reports, error } = await supabase
            .from(TABLES.REPORTS)
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);
        
        if (!error && reports) {
            reportsData = reports;
            displayReports(reports);
        }
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
        const tableName = type === 'domain' ? TABLES.FRAUD_DOMAINS : 
                         type === 'phone' ? TABLES.FRAUD_NUMBERS : TABLES.FRAUD_IPS;
        
        const updates = {
            reviewed: true,
            reviewed_by: currentUser.id,
            reviewed_at: new Date().toISOString(),
            review_decision: decision,
            review_notes: notes || '',
            updated_at: new Date().toISOString(),
        };
        
        if (decision === 'approve') {
            updates.active = true;
            updates.severity = 80;
        } else if (decision === 'reject') {
            updates.active = false;
            updates.severity = 0;
        } else if (decision === 'monitor') {
            updates.active = true;
            updates.severity = 30;
        }
        
        const { error } = await supabase
            .from(tableName)
            .update(updates)
            .eq('id', threatId);
        
        if (error) throw error;
        
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
        const tableName = type === 'domain' ? TABLES.FRAUD_DOMAINS : 
                         type === 'phone' ? TABLES.FRAUD_NUMBERS : TABLES.FRAUD_IPS;
        
        const { error } = await supabase
            .from(tableName)
            .update({ 
                active: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', threatId);
        
        if (error) throw error;
        
        alert('Threat removed successfully');
        loadThreats();
    } catch (error) {
        alert('Error removing threat: ' + error.message);
    }
}

// Approve report
async function approveReport(reportId, target, type) {
    try {
        const tableName = type === 'domain' ? TABLES.FRAUD_DOMAINS : 
                         type === 'phone' ? TABLES.FRAUD_NUMBERS : 
                         type === 'ip' ? TABLES.FRAUD_IPS : null;
        
        if (tableName) {
            const { error } = await supabase
                .from(tableName)
                .upsert({
                    [type === 'domain' ? 'domain' : type === 'phone' ? 'number' : 'range']: target,
                    type: type,
                    category: 'user_reported',
                    severity: 70,
                    active: true,
                    report_count: 1,
                    metadata: {
                        source: 'admin_approved',
                        approved_by: currentUser.id
                    },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
        }
        
        // Mark report as reviewed
        const { error: reportError } = await supabase
            .from(TABLES.REPORTS)
            .update({
                reviewed: true,
                reviewed_by: currentUser.id,
                review_decision: 'approved',
                reviewed_at: new Date().toISOString()
            })
            .eq('id', reportId);
        
        if (reportError) throw reportError;
        
        alert('Report approved and threat added');
        loadReports();
    } catch (error) {
        alert('Error approving report: ' + error.message);
    }
}

// Reject report
async function rejectReport(reportId) {
    try {
        const { error } = await supabase
            .from(TABLES.REPORTS)
            .update({
                reviewed: true,
                reviewed_by: currentUser.id,
                review_decision: 'rejected',
                reviewed_at: new Date().toISOString()
            })
            .eq('id', reportId);
        
        if (error) throw error;
        
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
        const tableName = type === 'domain' ? TABLES.FRAUD_DOMAINS : 
                         type === 'phone' ? TABLES.FRAUD_NUMBERS : TABLES.FRAUD_IPS;
        
        const { error } = await supabase
            .from(tableName)
            .upsert({
                [type === 'domain' ? 'domain' : type === 'phone' ? 'number' : 'range']: value,
                type: type,
                category: category,
                severity: severity,
                active: true,
                description: description,
                report_count: 0,
                metadata: {
                    source: 'admin_seed',
                    added_by: currentUser.id,
                    confidence: 1.0,
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        
        if (error) throw error;
        
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
