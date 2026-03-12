document.addEventListener('DOMContentLoaded', () => {
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
    const fetchAvatar = async () => {
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
    };
    fetchAvatar();

    // Logout Logic
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentData');
        window.location.href = 'student-login.html';
    });

    // DOM Elements
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');

    let debounceTimer;

    // Fetch Logic
    const fetchComplaints = async () => {
        tableBody.innerHTML = '';
        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');

        const search = searchInput.value;
        const category = categoryFilter.value;
        const status = statusFilter.value;

        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category && category !== 'All') params.append('category', category);
        if (status && status !== 'All') params.append('status', status);

        try {
            const res = await fetch(`${window.API_BASE_URL}/api/complaints/student?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) {
                window.location.href = 'student-login.html';
                return;
            }

            const data = await res.json();
            loadingState.classList.add('hidden');

            if (data.length === 0) {
                emptyState.classList.remove('hidden');
                return;
            }

            data.forEach(complaint => {
                const tr = document.createElement('tr');

                // Formatting Date
                const dateObj = new Date(complaint.createdAt);
                const dateStr = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

                // Status class mapping
                const statusClass = complaint.status === 'In Progress' ? 'status-progress' : `status-${complaint.status}`;

              // Add click listener for row (excluding action buttons if any were present)
            tr.addEventListener('click', (e) => {
                if(e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('.action-btn')) return;
                openComplaintDetails(
                    complaint.id,
                    complaint.title,
                    complaint.category,
                    complaint.description,
                    complaint.evidenceFile,
                    complaint.assignedTo
                );
            });
                tr.innerHTML = `
          <td><span style="color: var(--text-muted); font-family: monospace;">#${complaint.id.split('-')[0].toUpperCase()}</span></td>
          <td style="font-weight: 500;">${complaint.title}</td>
          <td>${complaint.category}</td>
          <td>${dateStr}</td>
          <td><span class="status-badge ${statusClass}">${complaint.status}</span></td>
        `;
                tableBody.appendChild(tr);
            });

        } catch (err) {
            console.error(err);
            loadingState.innerHTML = 'Error loading complaints.';
        }
    };

    // Event Listeners with Debounce for Search
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fetchComplaints, 400); // 400ms debounce
    });

    categoryFilter.addEventListener('change', fetchComplaints);
    statusFilter.addEventListener('change', fetchComplaints);

    // Initial Fetch
    fetchComplaints();

    // Socket.io Listener
    // Supabase Realtime Listener
    if (window.supabaseClient) {
        window.supabaseClient
            .channel('complaint-updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'complaints', filter: `studentId=eq.${studentData.studentId}` },
                (payload) => {
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
                    
                    // Refresh table dynamically
                    fetchComplaints();
                }
            )
            .subscribe();
    }

    /* Complaint Details Modal Logic */
    const detailsModal = document.getElementById('complaintDetailsModal');
    const closeDetailsBtn = document.getElementById('closeDetailsBtn');
    const detailTimeline = document.getElementById('detailTimeline');

    if (closeDetailsBtn) {
        closeDetailsBtn.addEventListener('click', () => {
            detailsModal.classList.remove('active');
        });
    }

    const openComplaintDetails = async (id, title, category, description, evidenceFile, assignedTo) => {
        document.getElementById('detailTitle').textContent = title;
        document.getElementById('detailCategory').textContent = category;
        document.getElementById('detailDescription').textContent = description;
        
        const assignedContainer = document.getElementById('detailAssignedTo');
        if (assignedContainer) {
            if (assignedTo && assignedTo !== 'Unassigned') {
                assignedContainer.innerHTML = `<span style="display:inline-block; padding: 4px 10px; border-radius: 4px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; font-size: 0.85rem; font-weight: 500; border: 1px solid rgba(59, 130, 246, 0.2);">Assigned To: ${assignedTo}</span>`;
            } else {
                assignedContainer.innerHTML = '';
            }
        }

        const evidenceContainer = document.getElementById('detailEvidence');
        if (evidenceContainer) {
            if (evidenceFile) {
                evidenceContainer.innerHTML = `<a href="${evidenceFile}" target="_blank" style="color: var(--primary); font-weight: 500; text-decoration: none;"><i class="fa-solid fa-paperclip"></i> View Attached Evidence</a>`;
                evidenceContainer.style.display = 'block';
            } else {
                evidenceContainer.style.display = 'none';
            }
        }
        
        detailsModal.classList.add('active');
        detailTimeline.innerHTML = '<div style="text-align:center; padding: 2rem; color: var(--text-muted);"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading timeline...</div>';

        try {
            const res = await fetch(`${window.API_BASE_URL}/api/complaints/${id}/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const history = await res.json();
                renderTimeline(history);
            } else {
                detailTimeline.innerHTML = '<div style="color: var(--danger)">Failed to load timeline.</div>';
            }
        } catch (e) {
            console.error(e);
            detailTimeline.innerHTML = '<div style="color: var(--danger)">Error loading timeline.</div>';
        }
    };

    const renderTimeline = (history) => {
        if (!history || history.length === 0) {
            detailTimeline.innerHTML = '<div style="color: var(--text-muted); padding: 2rem;">No timeline data available.</div>';
            return;
        }
        
        detailTimeline.innerHTML = history.map((event, index) => {
            const dateObj = new Date(event.timestamp);
            const timeStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            let iconHtml = '<i class="fa-solid fa-check"></i>';
            let bgClass = 'bg-info';
            
            if (event.status.includes('Submitted')) {
                 bgClass = 'bg-primary'; 
                 iconHtml = '<i class="fa-solid fa-file-alt"></i>';
            } else if (event.status.includes('Acknowledged')) {
                 bgClass = 'bg-info';
                 iconHtml = '<i class="fa-solid fa-eye"></i>';
            } else if (event.status === 'In Progress') {
                 bgClass = 'bg-warning';
                 iconHtml = '<i class="fa-solid fa-hourglass-half"></i>';
            } else if (event.status === 'Resolved' || event.status === 'Solved') {
                 bgClass = 'bg-success';
                 iconHtml = '<i class="fa-solid fa-check"></i>';
            }

            const completedClass = index === history.length - 1 ? 'completed active-step' : 'completed';

            return `
            <div class="timeline-item">
                <div class="timeline-icon ${completedClass} ${bgClass}">
                    ${iconHtml}
                </div>
                <div class="timeline-content">
                    <div class="timeline-status">${event.status}</div>
                    <div class="timeline-meta">
                        <span><i class="fa-regular fa-user"></i> ${event.updatedBy}</span>
                        <span><i class="fa-regular fa-clock"></i> ${timeStr}</span>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    };

});
