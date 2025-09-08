const IDP_BASE_URL = 'http://localhost:8080';

const registerForm = document.getElementById('register-form');
const verifyForm = document.getElementById('verify-form');
const messageArea = document.getElementById('message-area');

if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
    // Add role selection functionality
    initializeRoleSelection();
    // Add password strength indicator
    initializePasswordStrength();
    // Add password match validation
    initializePasswordMatch();
    // Add password toggle functionality
    initializePasswordToggles();
}
if (verifyForm) {
    verifyForm.addEventListener('submit', handleVerify);
    window.addEventListener('DOMContentLoaded', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        if (email) {
            document.getElementById('email').value = email;
            const subtitle = document.getElementById('verification-subtitle');
            if (subtitle) {
                subtitle.innerHTML = `We've sent a 6-digit code to <strong>${email}</strong>. Please enter it below.`;
            }
        }
    });
    initializeOtpInputs();
}

async function handleRegister(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const role = document.querySelector('input[name="role"]:checked')?.value;

    if (password !== confirmPassword) {
        displayMessage('Passwords do not match.', 'error');
        return;
    }

    if (!role) {
        displayMessage('Please select a role.', 'error');
        return;
    }

    setRegisterLoadingState(true);
    clearMessage();

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
        window.location.href = `verify.html?email=${encodeURIComponent(email)}`;

    } catch (error) {
        displayMessage(error.message, 'error');
        setRegisterLoadingState(false);
    }
}

async function handleVerify(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const otpInputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    if (otp.length !== 6) {
        displayMessage('Please enter the full 6-digit code.', 'error');
        const otpContainer = document.getElementById('otp-container');
        otpContainer.classList.add('error');
        setTimeout(() => otpContainer.classList.remove('error'), 500);
        return;
    }
    setVerifyLoadingState(true);
    clearMessage();

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
        setVerifyLoadingState(false);
        const otpContainer = document.getElementById('otp-container');
        otpContainer.classList.add('error');
    }
}

function initializeOtpInputs() {
    const otpContainer = document.getElementById('otp-container');
    if (!otpContainer) return;

    const inputs = Array.from(otpContainer.querySelectorAll('.otp-input'));

    inputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            otpContainer.classList.remove('error');
            if (input.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
                inputs[index - 1].focus();
            } else if (e.key === 'ArrowLeft' && index > 0) {
                inputs[index - 1].focus();
            } else if (e.key === 'ArrowRight' && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text');
            if (pasteData.length === 6 && /^\d{6}$/.test(pasteData)) {
                inputs.forEach((box, i) => {
                    box.value = pasteData[i];
                });
                verifyForm.requestSubmit();
            }
        });
    });
}

function displayMessage(text, type) {
    if (!messageArea) return;
    messageArea.textContent = text;
    messageArea.className = `message-area ${type}`;
    messageArea.style.display = 'block';
}

function clearMessage() {
    if (!messageArea) return;
    messageArea.textContent = '';
    messageArea.style.display = 'none';
    messageArea.className = 'message-area';
}

function setRegisterLoadingState(isLoading) {
    const submitBtn = document.querySelector('#register-form button[type="submit"]');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const roleInputs = document.querySelectorAll('input[name="role"]');
    const termsCheckbox = document.getElementById('terms');
    
    if (isLoading) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        if (emailInput) emailInput.disabled = true;
        if (passwordInput) passwordInput.disabled = true;
        if (confirmPasswordInput) confirmPasswordInput.disabled = true;
        roleInputs.forEach(input => input.disabled = true);
        if (termsCheckbox) termsCheckbox.disabled = true;
    } else {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        if (emailInput) emailInput.disabled = false;
        if (passwordInput) passwordInput.disabled = false;
        if (confirmPasswordInput) confirmPasswordInput.disabled = false;
        roleInputs.forEach(input => input.disabled = false);
        if (termsCheckbox) termsCheckbox.disabled = false;
    }
}

function setVerifyLoadingState(isLoading) {
    const submitBtn = document.querySelector('#verify-form button[type="submit"]');
    const emailInput = document.getElementById('email');
    const otpInputs = document.querySelectorAll('.otp-input');
    
    if (isLoading) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        if (emailInput) emailInput.disabled = true;
        otpInputs.forEach(input => input.disabled = true);
    } else {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        if (emailInput) emailInput.disabled = false;
        otpInputs.forEach(input => input.disabled = false);
    }
}

function initializeRoleSelection() {
    const roleOptions = document.querySelectorAll('.role-option');
    
    roleOptions.forEach(option => {
        option.addEventListener('click', () => {
            selectRole(option, roleOptions);
        });
        
        option.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectRole(option, roleOptions);
            }
        });
        
        option.setAttribute('tabindex', '0');
        option.setAttribute('role', 'radio');
        option.setAttribute('aria-checked', 'false');
    });
}

function selectRole(selectedOption, allOptions) {
    allOptions.forEach(opt => {
        opt.classList.remove('selected');
        opt.setAttribute('aria-checked', 'false');
    });
    
    selectedOption.classList.add('selected');
    selectedOption.setAttribute('aria-checked', 'true');
    
    const radio = selectedOption.querySelector('input[type="radio"]');
    if (radio) {
        radio.checked = true;
    }
}

// --- Password Strength Functions ---
function initializePasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    const strengthContainer = document.getElementById('password-strength');
    
    if (!passwordInput || !strengthFill || !strengthText || !strengthContainer) return;
    
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const strength = calculatePasswordStrength(password);
        
        strengthContainer.classList.add('visible');
        strengthFill.className = `strength-fill ${strength.level}`;
        strengthText.textContent = strength.text;
        strengthText.className = `strength-text ${strength.level}`;
    });
}

function calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score < 2) return { level: 'weak', text: 'Weak password' };
    if (score < 3) return { level: 'fair', text: 'Fair password' };
    if (score < 4) return { level: 'good', text: 'Good password' };
    return { level: 'strong', text: 'Strong password' };
}

// --- Password Match Functions ---
function initializePasswordMatch() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const matchIndicator = document.getElementById('password-match');
    
    if (!passwordInput || !confirmPasswordInput || !matchIndicator) return;
    
    function checkPasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword.length === 0) {
            matchIndicator.style.display = 'none';
            return;
        }
        
        if (password === confirmPassword) {
            matchIndicator.style.display = 'flex';
            matchIndicator.classList.remove('error');
            matchIndicator.classList.add('success');
            matchIndicator.querySelector('i').className = 'fas fa-check-circle';
            matchIndicator.querySelector('span').textContent = 'Passwords match';
        } else {
            matchIndicator.style.display = 'flex';
            matchIndicator.classList.remove('success');
            matchIndicator.classList.add('error');
            matchIndicator.querySelector('i').className = 'fas fa-times-circle';
            matchIndicator.querySelector('span').textContent = 'Passwords do not match';
        }
    }
    
    passwordInput.addEventListener('input', checkPasswordMatch);
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);
}

function initializePasswordToggles() {
    const passwordToggle = document.getElementById('password-toggle');
    const confirmPasswordToggle = document.getElementById('confirm-password-toggle');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', () => {
            togglePasswordVisibility(passwordInput, passwordToggle);
        });
    }
    
    if (confirmPasswordToggle && confirmPasswordInput) {
        confirmPasswordToggle.addEventListener('click', () => {
            togglePasswordVisibility(confirmPasswordInput, confirmPasswordToggle);
        });
    }
}

function togglePasswordVisibility(input, toggle) {
    const isPasswordVisible = input.type === 'text';
    
    input.type = isPasswordVisible ? 'password' : 'text';
    const icon = toggle.querySelector('i');
    if (icon) {
        icon.className = isPasswordVisible ? 'far fa-eye' : 'far fa-eye-slash';
    }
    
    toggle.style.transform = 'scale(0.9)';
    setTimeout(() => {
        toggle.style.transform = 'scale(1)';
    }, 100);
    
    input.focus();
}