document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('studentToken');
    if (!token) return; // Only run on pages where student is logged in

    const notifBtn = document.getElementById('notifBtn');
    const notifDropdown = document.getElementById('notifDropdown');
    const notifBadge = document.getElementById('notifBadge');
    const notifList = document.getElementById('notifList');
    const notifMarkAll = document.getElementById('notifMarkAll');

    if (!notifBtn) return; // Ensure elements exist

    let unreadCount = 0;

    // Toggle Dropdown
    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle('active');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
            notifDropdown.classList.remove('active');
        }
    });

    const formatNotifTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHrs / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHrs < 24) return `${diffHrs}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const loadNotifications = async () => {
        try {
            const res = await fetch(`${window.API_BASE_URL}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const notifications = await res.json();
                renderNotifications(notifications);
            }
        } catch (e) {
            console.error('Error fetching notifications:', e);
        }
    };

    const renderNotifications = (notifications) => {
        if (notifications.length === 0) {
            notifList.innerHTML = '<li class="notification-empty">No notifications yet.</li>';
            notifBadge.classList.add('hidden');
            return;
        }

        unreadCount = notifications.filter(n => n.status === 'unread').length;
        
        if (unreadCount > 0) {
            notifBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            notifBadge.classList.remove('hidden');
            notifBtn.querySelector('i').classList.replace('fa-regular', 'fa-solid'); // Solid bell when unread
            notifBtn.querySelector('i').style.color = 'var(--primary)';
        } else {
            notifBadge.classList.add('hidden');
            notifBtn.querySelector('i').classList.replace('fa-solid', 'fa-regular');
            notifBtn.querySelector('i').style.color = 'var(--text-main)';
        }

        notifList.innerHTML = notifications.map(notif => `
            <li class="notification-item ${notif.status === 'unread' ? 'unread' : ''}" data-id="${notif._id}">
                <div class="notif-message">${notif.message}</div>
                <div class="notif-time">${formatNotifTime(notif.createdAt)}</div>
            </li>
        `).join('');

        // Attach click listeners to mark as read
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.addEventListener('click', async () => {
                const id = item.getAttribute('data-id');
                try {
                    const res = await fetch(`${window.API_BASE_URL}/api/notifications/read/${id}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        item.classList.remove('unread');
                        loadNotifications(); // Refresh totally or just update local
                    }
                } catch (e) {
                    console.error('Failed to mark read', e);
                }
            });
        });
    };

    // Mark All As Read
    if (notifMarkAll) {
        notifMarkAll.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (unreadCount === 0) return;
            
            try {
                const res = await fetch(`${window.API_BASE_URL}/api/notifications/read-all`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    loadNotifications();
                }
            } catch (e) {
                console.error('Failed to mark all read', e);
            }
        });
    }

    // Initial load
    loadNotifications();
    
    // Optional: Poll every 30 seconds for new notifications
    setInterval(loadNotifications, 30000);
});
