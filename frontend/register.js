document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const registerBtn = document.getElementById('registerBtn');

    // Password Strength Logic
    passwordInput.addEventListener('input', () => {
        const val = passwordInput.value;
        let strength = 0;

        if (val.length >= 6) strength += 1;
        if (val.match(/[A-Z]/)) strength += 1;
        if (val.match(/[0-9]/) || val.match(/[^a-zA-Z\d]/)) strength += 1;

        strengthBar.className = 'strength-bar'; // Reset classes
        if (val.length === 0) {
            strengthText.textContent = '';
            strengthBar.style.width = '0%';
        } else if (strength === 1 || val.length < 6) {
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Weak';
            strengthText.style.color = 'var(--danger)';
        } else if (strength === 2) {
            strengthBar.classList.add('medium');
            strengthText.textContent = 'Medium';
            strengthText.style.color = 'var(--warning)';
        } else if (strength >= 3) {
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Strong';
            strengthText.style.color = 'var(--success)';
        }
    });

    // Handle Registration
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const studentId = document.getElementById('studentId').value;
        const department = document.getElementById('department').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;
        const password = passwordInput.value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            return showToast('Passwords do not match', 'error');
        }

        if (password.length < 6) {
            return showToast('Password must be at least 6 characters', 'error');
        }

        // Button loading state
        const originalText = registerBtn.innerHTML;
        registerBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Registering...';
        registerBtn.disabled = true;

        try {
            const res = await fetch(`${window.API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, studentId, department, email, phone, password })
            });

            const data = await res.json();

            if (res.ok) {
                showToast('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = 'student-login.html';
                }, 1500);
            } else {
                showToast(data.msg || 'Registration failed', 'error');
                registerBtn.innerHTML = originalText;
                registerBtn.disabled = false;
            }
        } catch (err) {
            showToast('Server error. Please try again.', 'error');
            registerBtn.innerHTML = originalText;
            registerBtn.disabled = false;
        }
    });
});

// Toast Utility (Shared logic, could be moved to a util.js but duplicated here for simplicity)
function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
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
