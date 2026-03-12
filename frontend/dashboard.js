document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const token = localStorage.getItem('studentToken');
    const studentDataStr = localStorage.getItem('studentData');

    if (!token || !studentDataStr) {
        window.location.href = 'student-login.html';
        return;
    }

    const studentData = JSON.parse(studentDataStr);

    // Populate Header
    document.getElementById('topName').textContent = studentData.name;
    document.getElementById('topId').textContent = `ID: ${studentData.studentId}`;
    document.getElementById('topAvatar').textContent = studentData.name.charAt(0).toUpperCase();

    // Fetch User Profile to get Avatar
    try {
        const userRes = await fetch(`${window.API_BASE_URL}/api/user/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (userRes.ok) {
            const userData = await userRes.json();
            if (userData.profileImage) {
                document.getElementById('topAvatar').innerHTML = `<img src="${userData.profileImage}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                document.getElementById('topAvatar').style.background = 'transparent';
                document.getElementById('topAvatar').style.color = 'transparent';
            }
        }
    } catch (e) {
        console.error('Error fetching profile image:', e);
    }

    // Logout Logic
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentData');
        window.location.href = 'student-login.html';
    });

    // Fetch Complaints wrapper
    const loadDashboardData = async () => {
        let complaints = [];
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/complaints/student`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('studentToken');
                window.location.href = 'student-login.html';
                return;
            }

            complaints = await res.json();
        } catch (err) {
            console.error('Error fetching complaints:', err);
            return; // exit if error
        }

        // Calculate Metrics
        const total = complaints.length;
        const pending = complaints.filter(c => c.status === 'Pending' || c.status === 'In Progress').length;
        const resolved = complaints.filter(c => c.status === 'Resolved').length;

        // Update UI Metrics
        document.getElementById('valTotal').textContent = total;
        document.getElementById('valPending').textContent = pending;
        document.getElementById('valResolved').textContent = resolved;

        // Init Charts Analytics
        initCharts(complaints);
    };

    // Initial Load
    await loadDashboardData();

    // Supabase Realtime Listener
    if (window.supabaseClient) {
        window.supabaseClient
            .channel('dashboard-updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'complaints', filter: `studentId=eq.${studentData.studentId}` },
                (payload) => {
                    // Show toast
                    if (typeof showToast === 'function') {
                        showToast(`Your complaint status has been updated to ${payload.new.status}`, 'info');
                    } else {
                        let tc = document.getElementById('toastContainer');
                        if (!tc) {
                            tc = document.createElement('div');
                            tc.id = 'toastContainer';
                            tc.className = 'toast-container';
                            document.body.appendChild(tc);
                        }
                        const toast = document.createElement('div');
                        toast.className = `toast info`;
                        toast.innerHTML = `<i class="fa-solid fa-info-circle" style="color: var(--primary)"></i> <span>Your complaint status has been updated to ${payload.new.status}</span>`;
                        tc.appendChild(toast);
                        setTimeout(() => {
                            toast.style.animation = 'slideOutRight 0.3s ease forwards';
                            setTimeout(() => toast.remove(), 300);
                        }, 4000);
                    }
                    
                    // Refresh data dynamically
                    loadDashboardData();
                }
            )
            .subscribe();
    }

});

function initCharts(complaints) {
    // Category Breakdown for Pie Chart
    const categoriesMap = { 'Hostel': 0, 'Canteen': 0, 'Bus': 0, 'Classroom': 0, 'Other': 0 };

    // Monthly Breakdown for Bar Chart (last 6 months logic, simplified)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();

    // Initialize last 5 months + current
    const barLabels = [];
    const barData = [0, 0, 0, 0, 0, 0];

    for (let i = 5; i >= 0; i--) {
        let d = new Date();
        d.setMonth(currentMonth - i);
        barLabels.push(monthNames[d.getMonth()]);
    }

    complaints.forEach(c => {
        // Add to categories
        if (categoriesMap[c.category] !== undefined) categoriesMap[c.category]++;
        else categoriesMap['Other'] = (categoriesMap['Other'] || 0) + 1;

        // Add to monthly
        const d = new Date(c.createdAt);
        // Rough check if within last 6 months
        const monthDiff = (new Date().getFullYear() - d.getFullYear()) * 12 + currentMonth - d.getMonth();
        if (monthDiff >= 0 && monthDiff < 6) {
            // Index 5 is current month, 0 is 5 months ago
            barData[5 - monthDiff]++;
        }
    });

    // Chart Global Config
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Poppins', sans-serif";

    // Render Pie Chart
    const ctxPie = document.getElementById('pieChart').getContext('2d');
    new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoriesMap),
            datasets: [{
                data: Object.values(categoriesMap),
                backgroundColor: [
                    '#3b82f6', // Blue
                    '#f59e0b', // Yellow
                    '#10b981', // Green
                    '#8b5cf6', // Purple
                    '#64748b'  // Gray
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            },
            cutout: '70%'
        }
    });

    // Render Bar Chart
    const ctxBar = document.getElementById('barChart').getContext('2d');
    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: barLabels,
            datasets: [{
                label: 'Complaints Submitted',
                data: barData,
                backgroundColor: '#2563EB',
                borderRadius: 6,
                borderWidth: 0,
                barThickness: 32
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { stepSize: 1 }
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
