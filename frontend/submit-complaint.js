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

    // File Preview Logic
    const evidenceInput = document.getElementById('evidenceFile');
    const filePreviewContainer = document.getElementById('filePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const pdfPreview = document.getElementById('pdfPreview');
    const pdfName = document.getElementById('pdfName');
    const removeFileBtn = document.getElementById('removeFileBtn');

    evidenceInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            filePreviewContainer.classList.remove('hidden');
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                    pdfPreview.style.display = 'none';
                }
                reader.readAsDataURL(file);
            } else if (file.type === 'application/pdf') {
                pdfName.textContent = file.name;
                pdfPreview.style.display = 'block';
                imagePreview.style.display = 'none';
            }
        } else {
            filePreviewContainer.classList.add('hidden');
        }
    });

    removeFileBtn.addEventListener('click', () => {
        evidenceInput.value = '';
        filePreviewContainer.classList.add('hidden');
        imagePreview.src = '';
    });

    const complaintForm = document.getElementById('complaintForm');
    const submitBtn = document.getElementById('submitBtn');

    complaintForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        const file = evidenceInput.files[0];

        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting...';
        submitBtn.disabled = true;

        try {
            let uploadedFilePath = null;

            // Handle File Upload First
            if (file) {
                const formData = new FormData();
                formData.append('evidence', file);

                const uploadRes = await fetch(`${window.API_BASE_URL}/api/complaints/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    uploadedFilePath = uploadData.filePath;
                } else {
                    const errorData = await uploadRes.json();
                    showToast(errorData.msg || 'File upload failed.', 'error');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    return;
                }
            }

            // Submit Complaint Details
            const res = await fetch(`${window.API_BASE_URL}/api/complaints`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    title, 
                    category, 
                    description, 
                    evidenceFile: uploadedFilePath 
                })
            });

            if (res.ok) {
                showToast('Complaint submitted successfully!', 'success');
                complaintForm.reset();
                filePreviewContainer.classList.add('hidden');

                // Redirect to list after a short delay
                setTimeout(() => {
                    window.location.href = 'complaint-list.html';
                }, 1500);
            } else {
                const data = await res.json();
                showToast(data.msg || 'Submission failed', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (err) {
            showToast('Server error. Please try again.', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

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
