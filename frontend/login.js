document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');

    // Toggle Password Visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.innerHTML = type === 'password' ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
    });

    // Handle Login Submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const studentId = document.getElementById('studentId').value;
        const password = document.getElementById('password').value;

        // Button loading state
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Signing in...';
        loginBtn.disabled = true;

        try {
            const res = await fetch(`${window.API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ studentId, password })
            });

            const data = await res.json();

            if (res.ok) {
                // Save token & user
                localStorage.setItem('studentToken', data.token);
                localStorage.setItem('studentData', JSON.stringify(data.student));

                showToast('Login successful! Redirecting...', 'success');

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                showToast(data.msg || 'Login failed', 'error');
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        } catch (err) {
            showToast('Server error. Please try again.', 'error');
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    });
});

// Toast Utility
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
