document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('studentToken');
    const studentData = JSON.parse(localStorage.getItem('studentData') || '{}');

    if (!token || !studentData.studentId) {
        window.location.href = 'student-login.html';
        return;
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentData');
        window.location.href = 'student-login.html';
    });

    const getInitials = (name) => {
        if (!name) return 'S';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const loadProfile = async () => {
        try {
            // First display cached data for instant UI load
            document.getElementById('topName').textContent = studentData.name;
            document.getElementById('topId').textContent = 'ID: ' + studentData.studentId;
            document.getElementById('topAvatar').textContent = getInitials(studentData.name);

            document.getElementById('mainName').textContent = studentData.name;
            document.getElementById('mainAvatarText').textContent = getInitials(studentData.name);
            document.getElementById('infoStudentId').textContent = studentData.studentId;

            // Fetch full details from backend using the new user route
            const res = await fetch(`${window.API_BASE_URL}/api/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const fullProfile = await res.json();
                document.getElementById('infoDepartment').textContent = fullProfile.department || 'Not Provided';
                document.getElementById('infoEmail').textContent = fullProfile.email || 'Not Provided';
                document.getElementById('infoPhone').textContent = fullProfile.phone || 'Not Provided';
                
                // Set form values for edit
                document.getElementById('editEmail').value = fullProfile.email || '';
                document.getElementById('editPhone').value = fullProfile.phone || '';

                if (fullProfile.profileImage) {
                    document.getElementById('mainAvatar').style.background = 'transparent';
                    document.getElementById('mainAvatarText').style.display = 'none';
                    let imgTag = document.getElementById('mainAvatarImg');
                    if (!imgTag) {
                        imgTag = document.createElement('img');
                        imgTag.id = 'mainAvatarImg';
                        document.getElementById('mainAvatar').insertBefore(imgTag, document.getElementById('mainAvatar').firstChild);
                    }
                    imgTag.src = fullProfile.profileImage;
                    document.getElementById('topAvatar').innerHTML = `<img src="${fullProfile.profileImage}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                    document.getElementById('topAvatar').style.background = 'transparent';
                    document.getElementById('topAvatar').style.color = 'transparent';
                }
            } else if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('studentToken');
                window.location.href = 'student-login.html';
            }
        } catch (err) {
            console.error('Error fetching full profile:', err);
        }
    };

    // Modal Logic
    const editModal = document.getElementById('editProfileModal');
    const pwdModal = document.getElementById('changePasswordModal');

    document.getElementById('editProfileBtn').addEventListener('click', () => editModal.classList.add('active'));
    document.getElementById('closeEditModal').addEventListener('click', () => editModal.classList.remove('active'));

    document.getElementById('changePasswordBtn').addEventListener('click', () => pwdModal.classList.add('active'));
    document.getElementById('closePasswordModal').addEventListener('click', () => {
        pwdModal.classList.remove('active');
        document.getElementById('changePasswordForm').reset();
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === editModal) editModal.classList.remove('active');
        if (e.target === pwdModal) {
            pwdModal.classList.remove('active');
            document.getElementById('changePasswordForm').reset();
        }
    });

    // Profile Image Upload
    document.getElementById('profileImageUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('Image must be less than 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onload = async function(event) {
                const base64Image = event.target.result;
                
                try {
                    const res = await fetch(`${window.API_BASE_URL}/api/user/profile`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ profileImage: base64Image })
                    });
                    
                    if (res.ok) {
                        alert('Profile picture updated successfully!');
                        loadProfile();
                    } else {
                        const errorData = await res.json();
                        alert('Failed to update picture: ' + (errorData.msg || 'Server Error'));
                    }
                } catch (err) {
                    console.error(err);
                    alert('Error updating profile picture.');
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Edit Profile Submit
    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('editEmail').value;
        const phone = document.getElementById('editPhone').value;

        try {
            const res = await fetch(`${window.API_BASE_URL}/api/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email, phone })
            });

            if (res.ok) {
                alert('Profile updated successfully!');
                editModal.classList.remove('active');
                loadProfile();
            } else {
                const errorData = await res.json();
                alert(errorData.msg || 'Error updating profile');
            }
        } catch (err) {
            console.error(err);
            alert('Error updating profile');
        }
    });

    // Change Password Submit
    document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        try {
            const res = await fetch(`${window.API_BASE_URL}/api/user/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();
            if (res.ok) {
                alert('Password updated successfully!');
                pwdModal.classList.remove('active');
                document.getElementById('changePasswordForm').reset();
            } else {
                alert(data.msg || 'Error changing password');
            }
        } catch (err) {
            console.error(err);
            alert('Error changing password');
        }
    });

    loadProfile();
});
