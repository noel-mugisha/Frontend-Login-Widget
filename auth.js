// --- Configuration ---
const IDP_BASE_URL = 'http://localhost:8080';

// --- DOM Element Selection ---
const registerForm = document.getElementById('register-form');
const verifyForm = document.getElementById('verify-form');
const messageArea = document.getElementById('message-area');

// --- Event Listeners ---
if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
}
if (verifyForm) {
    verifyForm.addEventListener('submit', handleVerify);
    // Auto-populate email if it's in the URL
    window.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        if (email) {
            document.getElementById('email').value = email;
        }
    });
}

// --- Core Functions ---

async function handleRegister(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const role = document.getElementById('role').value;

    if (password !== confirmPassword) {
        displayMessage('Passwords do not match.', 'error');
        return;
    }

    try {
        const response = await fetch(`${IDP_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed.');
        }

        // Redirect to verification page, passing email in URL
        window.location.href = `verify.html?email=${encodeURIComponent(email)}`;

    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

async function handleVerify(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const otp = document.getElementById('otp').value;

    try {
        const response = await fetch(`${IDP_BASE_URL}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Verification failed.');
        }
        
        displayMessage('Verification successful! Redirecting to login...', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);

    } catch (error) {
        displayMessage(error.message, 'error');
    }
}

// --- UI Helper Functions (can be shared or duplicated from script.js) ---
function displayMessage(text, type) {
    if (!messageArea) return;
    messageArea.textContent = text;
    messageArea.className = `message-area ${type}`;
    messageArea.style.display = 'block';
}