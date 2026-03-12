document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');

    if (!token) {
        window.location.href = 'admin-login.html';
        return;
    }

    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('adminToken');
        window.location.href = 'admin-login.html';
    });

    const tableBody = document.getElementById('adminTableBody');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');

    let allComplaints = [];
    let currentFilter = 'All';

    // Hardcoded Departments
    const departments = [
        "Hostel Maintenance",
        "Electrical Maintenance",
        "Transport Department",
        "Canteen Management",
        "IT Support",
        "Other"
    ];

    const fetchComplaints = async () => {
        tableBody.innerHTML = '';
        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');

        try {
            const res = await fetch(`${window.API_BASE_URL}/api/complaints/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('adminToken');
                window.location.href = 'admin-login.html';
                return;
            }

            const data = await res.json();
            allComplaints = data;
            renderTable();

        } catch (err) {
            console.error(err);
            loadingState.innerHTML = 'Error loading complaints.';
        }
    };

    const renderTable = () => {
        loadingState.classList.add('hidden');
        tableBody.innerHTML = '';

        const filtered = allComplaints.filter(c => {
            if (currentFilter === 'All') return true;
            if (currentFilter === 'Pending') return c.status === 'Pending' || c.status === 'Acknowledged' || c.status === 'In Progress';
            if (currentFilter === 'Resolved') return c.status === 'Resolved';
            return true;
        });

        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        } else {
            emptyState.classList.add('hidden');
        }

        filtered.forEach(complaint => {
            const tr = document.createElement('tr');
            const dateObj = new Date(complaint.createdAt);
            const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            let statusClass = `status-${complaint.status}`;
            if (complaint.status === 'In Progress') statusClass = 'status-progress';
            if (complaint.status === 'Acknowledged') statusClass = 'status-progress';

            const staffOptions = departments.map(d => 
                `<option value="${d}" ${complaint.assignedTo === d ? 'selected' : ''}>${d}</option>`
            ).join('');

            tr.innerHTML = `
        <td><span style="color: var(--text-muted); font-family: monospace;">#${complaint.id.split('-')[0].toUpperCase()}</span></td>
        <td>
          <div style="font-weight: 500;">${complaint.studentName}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${complaint.studentId}</div>
        </td>
        <td>
          <div style="font-weight: 500;">${complaint.title}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${complaint.description}</div>
          ${complaint.evidenceFile ? `<a href="${complaint.evidenceFile}" target="_blank" style="font-size: 0.75rem; color: var(--primary); text-decoration: none; margin-top: 4px; display: inline-block; font-weight: 500;"><i class="fa-solid fa-paperclip"></i> View Evidence</a>` : ''}
        </td>
        <td>${complaint.category}<br><small style="color:var(--text-muted)">${dateStr}</small></td>
        <td>
          <select class="form-control" style="padding: 0.25rem; font-size: 0.85rem; background: var(--surface-light); border-color: var(--surface-border); border-radius: 4px;" onchange="assignStaff('${complaint.id}', this.value)">
            <option value="Unassigned" ${complaint.assignedTo === 'Unassigned' ? 'selected' : ''}>Unassigned</option>
            ${staffOptions}
          </select>
        </td>
        <td><span class="status-badge ${statusClass}">${complaint.status}</span></td>
        <td style="text-align: right; white-space: nowrap;">
          ${complaint.status === 'Pending' ? `<button class="action-btn" onclick="updateStatus('${complaint.id}', 'Acknowledged')" title="Acknowledge"><i class="fa-solid fa-eye"></i></button>` : ''}
          ${(complaint.status === 'Pending' || complaint.status === 'Acknowledged') ? `<button class="action-btn" onclick="updateStatus('${complaint.id}', 'In Progress')" title="Mark In Progress"><i class="fa-solid fa-hourglass-half"></i></button>` : ''}
          ${complaint.status !== 'Resolved' ? `<button class="action-btn" onclick="updateStatus('${complaint.id}', 'Resolved')" title="Mark Resolved"><i class="fa-solid fa-check"></i></button>` : ''}
          <button class="action-btn delete" onclick="deleteComplaint('${complaint.id}')" title="Delete Complaint"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
            tableBody.appendChild(tr);
        });
    };

    // Global functions for inline onclick handlers
    window.assignStaff = async (id, staffName) => {
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/admin/assign-complaint/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ assignedTo: staffName })
            });
            if (res.ok) {
                showToast('Complaint assigned successfully!');
            } else {
                showToast('Failed to assign complaint', 'error');
            }
        } catch (e) {
            showToast('Error assigning complaint', 'error');
        }
    };

    window.updateStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/complaints/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                showToast('Complaint status updated');
                fetchComplaints();
            }
        } catch (err) {
            showToast('Error updating status', 'error');
        }
    };

    window.deleteComplaint = async (id) => {
        if (!confirm("Are you sure you want to delete this complaint permanently?")) return;
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/complaints/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast('Complaint deleted');
                fetchComplaints();
            }
        } catch (err) {
            showToast('Error deleting complaint', 'error');
        }
    };

    // Nav filters
    const navItems = document.querySelectorAll('.nav-item');
    const tableView = document.getElementById('tableView');
    const analyticsView = document.getElementById('analyticsView');

    const updateNav = (id, filterVal) => {
        const navEl = document.getElementById(id);
        if (!navEl) return;
        navEl.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            navEl.classList.add('active');

            if (id === 'nav-analytics') {
                tableView.classList.add('hidden');
                analyticsView.classList.remove('hidden');
                fetchAnalytics();
            } else {
                tableView.classList.remove('hidden');
                analyticsView.classList.add('hidden');
                currentFilter = filterVal;
                renderTable();
            }
        });
    };
    updateNav('nav-all', 'All');
    updateNav('nav-pending', 'Pending');
    updateNav('nav-solved', 'Resolved');
    updateNav('nav-analytics', 'Analytics');

    // --- Analytics Logic ---
    let categoryChartInstance = null;
    let monthlyChartInstance = null;
    let deptChartInstance = null;

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/admin/analytics`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return;
            const data = await res.json();
            
            document.getElementById('statTotal').innerText = data.totalComplaints;
            document.getElementById('statPending').innerText = data.pendingComplaints;
            document.getElementById('statResolved').innerText = data.resolvedComplaints;

            renderCharts(data);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
        }
    };

    const renderCharts = (data) => {
        if (categoryChartInstance) categoryChartInstance.destroy();
        if (monthlyChartInstance) monthlyChartInstance.destroy();
        if (deptChartInstance) deptChartInstance.destroy();

        const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        
        // 1. Category Pie Chart
        const ctxCat = document.getElementById('categoryChart').getContext('2d');
        categoryChartInstance = new Chart(ctxCat, {
            type: 'pie',
            data: {
                labels: data.categoryStats.map(item => item._id || 'Uncategorized'),
                datasets: [{
                    data: data.categoryStats.map(item => item.count),
                    backgroundColor: chartColors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8' } }
                }
            }
        });

        // 2. Monthly Trends Bar Chart
        const ctxMonth = document.getElementById('monthlyChart').getContext('2d');
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        monthlyChartInstance = new Chart(ctxMonth, {
            type: 'bar',
            data: {
                labels: data.monthlyStats.map(item => `${monthNames[item._id.month - 1]} ${item._id.year}`),
                datasets: [{
                    label: 'Complaints',
                    data: data.monthlyStats.map(item => item.count),
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                },
                plugins: { legend: { display: false } }
            }
        });

        // 3. Department Chart
        const ctxDept = document.getElementById('departmentChart').getContext('2d');
        deptChartInstance = new Chart(ctxDept, {
            type: 'bar',
            data: {
                labels: data.departmentStats.map(item => item._id || 'Unknown'),
                datasets: [{
                    label: 'Complaints by Dept',
                    data: data.departmentStats.map(item => item.count),
                    backgroundColor: chartColors,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                },
                plugins: { legend: { display: false } }
            }
        });
    };

    const initDashboard = async () => {
        fetchComplaints();
    };

    initDashboard();
});

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '<i class="fa-solid fa-check-circle" style="color: var(--success)"></i>' : '<i class="fa-solid fa-circle-exclamation" style="color: var(--danger)"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
