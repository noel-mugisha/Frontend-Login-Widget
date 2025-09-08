const IDP_BASE_URL = 'http://localhost:8080';
const MAIN_APP_CALLBACK_URL = 'http://localhost:3000/auth/callback';
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('password-toggle');
const passwordIcon = document.getElementById('password-icon');
const linkedinLoginBtn = document.getElementById('linkedin-login-btn');
const messageArea = document.getElementById('message-area');
if (loginForm) {
    loginForm.addEventListener('submit', handleEmailPasswordLogin);
}
if (linkedinLoginBtn) {
    linkedinLoginBtn.addEventListener('click', handleLinkedInLogin);
}
if (passwordToggle) {
    passwordToggle.addEventListener('click', togglePasswordVisibility);
}
if (emailInput) {
    emailInput.addEventListener('focus', handleInputFocus);
    emailInput.addEventListener('blur', handleInputBlur);
    emailInput.addEventListener('input', handleInputChange);
}
if (passwordInput) {
    passwordInput.addEventListener('focus', handleInputFocus);
    passwordInput.addEventListener('blur', handleInputBlur);
    passwordInput.addEventListener('input', handleInputChange);
}
document.addEventListener('DOMContentLoaded', () => {
    checkForUrlErrors();
    initializeAnimations();
});
async function handleEmailPasswordLogin(event) {
    event.preventDefault();
    clearMessage();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
        displayMessage('Please fill in all fields.', 'error');
        return;
    }
    if (!isValidEmail(email)) {
        displayMessage('Please enter a valid email address.', 'error');
        return;
    }
    setLoadingState(true);
    try {
        const response = await fetch(`${IDP_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'An unknown error occurred.');
        }
        const data = await response.json();
        displayMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            handleSuccessfulLogin(data.access_token, data.refresh_token);
        }, 1000);
    } catch (error) {
        displayMessage(error.message, 'error');
        setLoadingState(false);
    }
}
function handleLinkedInLogin() {
    linkedinLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Connecting...</span>';
    linkedinLoginBtn.disabled = true;
    window.location.href = `${IDP_BASE_URL}/linkedin/authorize`;
}
function handleSuccessfulLogin(accessToken, refreshToken) { 
    if (!accessToken || !refreshToken) { 
        displayMessage('Login failed: missing tokens.', 'error');
        setLoadingState(false);
        return;
    }
    const redirectUrl = new URL(MAIN_APP_CALLBACK_URL);
    redirectUrl.searchParams.set('access_token', accessToken);
    redirectUrl.searchParams.set('refresh_token', refreshToken); 
    window.location.href = redirectUrl.toString();
}
function togglePasswordVisibility() {
    const isPasswordVisible = passwordInput.type === 'text';
    passwordInput.type = isPasswordVisible ? 'password' : 'text';
    passwordIcon.className = isPasswordVisible ? 'far fa-eye' : 'far fa-eye-slash';
    passwordToggle.style.transform = 'scale(0.9)';
    setTimeout(() => {
        passwordToggle.style.transform = 'scale(1)';
    }, 100);
    passwordInput.focus();
}
function displayMessage(text, type) {
    messageArea.textContent = text;
    messageArea.className = `message-area ${type}`;
    messageArea.style.display = 'block';
    if (type === 'success') {
        setTimeout(() => {
            clearMessage();
        }, 3000);
    }
}
function clearMessage() {
    messageArea.textContent = '';
    messageArea.style.display = 'none';
    messageArea.className = 'message-area';
}
function setLoadingState(isLoading) {
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (isLoading) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        emailInput.disabled = true;
        passwordInput.disabled = true;
    } else {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        emailInput.disabled = false;
        passwordInput.disabled = false;
    }
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function handleInputFocus(event) {
    const inputWrapper = event.target.closest('.input-wrapper');
    if (inputWrapper) {
        inputWrapper.style.transform = 'translateY(-1px)';
        inputWrapper.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
    }
}
function handleInputBlur(event) {
    const inputWrapper = event.target.closest('.input-wrapper');
    if (inputWrapper) {
        inputWrapper.style.transform = 'translateY(0)';
        inputWrapper.style.boxShadow = 'none';
    }
}
function handleInputChange(event) {
    const input = event.target;
    const inputWrapper = input.closest('.input-wrapper');
    input.classList.remove('valid', 'invalid');
    if (input.value.trim()) {
        if (input.type === 'email') {
            if (isValidEmail(input.value.trim())) {
                input.classList.add('valid');
            } else {
                input.classList.add('invalid');
            }
        } else if (input.type === 'password' || input.type === 'text') {
            if (input.value.length >= 6) {
                input.classList.add('valid');
            } else {
                input.classList.add('invalid');
            }
        }
    }
}
function initializeAnimations() {
    const formElements = document.querySelectorAll('.form-group, .btn, .divider');
    formElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        setTimeout(() => {
            element.style.transition = 'all 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100 + 300);
    });
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
        });
        button.addEventListener('mouseleave', () => {
            if (!button.disabled) {
                button.style.transform = 'translateY(0)';
            }
        });
    });
}
function checkForUrlErrors() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasError = urlParams.get('error');
    const message = urlParams.get('message');
    if (hasError && message) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        displayMessage(message.replace(/_/g, ' '), 'error');
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                loginCard.style.animation = '';
            }, 500);
        }
    }
}
const additionalStyles = `
    .shake {
        animation: shake 0.5s ease-in-out;
    }
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
`;
if (!document.getElementById('enhanced-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'enhanced-styles';
    styleElement.textContent = additionalStyles;
    document.head.appendChild(styleElement);
}
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.target === emailInput || event.target === passwordInput)) {
        event.preventDefault();
        loginForm.dispatchEvent(new Event('submit'));
    }
    if (event.key === 'Escape') {
        clearMessage();
    }
});
if (passwordToggle) {
    passwordToggle.setAttribute('aria-label', 'Toggle password visibility');
    passwordToggle.setAttribute('title', 'Show/Hide password');
}
const addAriaValidation = (input, isValid, message) => {
    if (isValid) {
        input.setAttribute('aria-invalid', 'false');
        input.removeAttribute('aria-describedby');
    } else {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', `${input.id}-error`);
        let errorElement = document.getElementById(`${input.id}-error`);
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = `${input.id}-error`;
            errorElement.className = 'sr-only';
            input.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }
};
if (emailInput) {
    emailInput.addEventListener('blur', () => {
        const email = emailInput.value.trim();
        if (email && !isValidEmail(email)) {
            addAriaValidation(emailInput, false, 'Please enter a valid email address');
        } else {
            addAriaValidation(emailInput, true);
        }
    });
}
if (passwordInput) {
    passwordInput.addEventListener('blur', () => {
        const password = passwordInput.value;
        if (password && password.length < 6) {
            addAriaValidation(passwordInput, false, 'Password must be at least 6 characters long');
        } else {
            addAriaValidation(passwordInput, true);
        }
    });
}