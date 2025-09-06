/**
 * -----------------------------------------------------------------------------
 * Configuration
 * -----------------------------------------------------------------------------
 * These are the only values you should need to change.
 */

// The base URL of your deployed Spring Boot Identity Provider (IdP).
// For local testing, this will be localhost:8080.
const IDP_BASE_URL = 'http://localhost:8080';

// The URL of your "Main Application" where the user should be sent after a
// successful login. The access token will be appended to this URL.
const MAIN_APP_CALLBACK_URL = 'http://localhost:3000/auth/callback'; 

/**
 * -----------------------------------------------------------------------------
 * DOM Element Selection
 * -----------------------------------------------------------------------------
 * Caching references to the DOM elements we'll be working with.
 */
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('password-toggle');
const passwordIcon = document.getElementById('password-icon');
const linkedinLoginBtn = document.getElementById('linkedin-login-btn');
const messageArea = document.getElementById('message-area');

/**
 * -----------------------------------------------------------------------------
 * Event Listeners
 * -----------------------------------------------------------------------------
 * Attaching functions to be called when the user interacts with the page.
 */

// Listen for the submission of the email/password form.
if (loginForm) {
    loginForm.addEventListener('submit', handleEmailPasswordLogin);
}

// Listen for clicks on the LinkedIn login button.
if (linkedinLoginBtn) {
    linkedinLoginBtn.addEventListener('click', handleLinkedInLogin);
}

// Listen for clicks on the password toggle button.
if (passwordToggle) {
    passwordToggle.addEventListener('click', togglePasswordVisibility);
}

// Add input animations and validation
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

// Check for error messages in the URL when the page loads.
document.addEventListener('DOMContentLoaded', () => {
    checkForUrlErrors();
    initializeAnimations();
});

/**
 * -----------------------------------------------------------------------------
 * Core Functions
 * -----------------------------------------------------------------------------
 */

/**
 * Handles the email and password login form submission.
 * @param {Event} event - The form submission event.
 */
async function handleEmailPasswordLogin(event) {
    event.preventDefault(); // Prevent the browser from reloading the page
    clearMessage();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Client-side validation
    if (!email || !password) {
        displayMessage('Please fill in all fields.', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        displayMessage('Please enter a valid email address.', 'error');
        return;
    }

    // Show loading state
    setLoadingState(true);

    try {
        // Make a POST request to our IdP's login endpoint.
        const response = await fetch(`${IDP_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        // The fetch API doesn't throw an error for HTTP error statuses (like 401 or 500),
        // so we need to check the 'ok' status and handle errors manually.
        if (!response.ok) {
            const errorData = await response.json();
            // Use the meaningful error message from our backend's ErrorResponseDto
            throw new Error(errorData.message || 'An unknown error occurred.');
        }

        const data = await response.json();
        
        // The refresh token is automatically set as an HttpOnly cookie by the backend.
        // We only receive the access token in the response body.
        displayMessage('Login successful! Redirecting...', 'success');
        
        // Small delay to show success message
        setTimeout(() => {
            handleSuccessfulLogin(data.access_token);
        }, 1000);

    } catch (error) {
        // Display any errors (network errors, or errors thrown from our check above)
        displayMessage(error.message, 'error');
        setLoadingState(false);
    }
}

/**
 * Handles the click event for the LinkedIn login button.
 */
function handleLinkedInLogin() {
    // Add loading state to LinkedIn button
    linkedinLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Connecting...</span>';
    linkedinLoginBtn.disabled = true;

    // This is the "magic" URL that starts the OAuth2 flow.
    // We simply redirect the user's browser to this IdP endpoint.
    // Spring Security takes over from here.
    window.location.href = `${IDP_BASE_URL}/oauth2/authorization/linkedin`;
}

/**
 * This function is the final step after a successful login from any method.
 * It redirects the user back to the main application with the access token.
 * @param {string} accessToken - The short-lived JWT access token.
 */
function handleSuccessfulLogin(accessToken) {
    if (!accessToken) {
        displayMessage('Login successful, but no access token was received.', 'error');
        setLoadingState(false);
        return;
    }

    // The access token should be stored in memory. The most secure way to pass it
    // from the IdP widget to the main app is via a URL parameter in a one-time redirect.
    const redirectUrl = new URL(MAIN_APP_CALLBACK_URL);
    redirectUrl.searchParams.set('access_token', accessToken);
    
    // Redirect the user to the main application.
    window.location.href = redirectUrl.toString();
}

/**
 * Toggles the visibility of the password field.
 */
function togglePasswordVisibility() {
    const isPasswordVisible = passwordInput.type === 'text';
    
    passwordInput.type = isPasswordVisible ? 'password' : 'text';
    passwordIcon.className = isPasswordVisible ? 'far fa-eye' : 'far fa-eye-slash';
    
    // Add a small animation
    passwordToggle.style.transform = 'scale(0.9)';
    setTimeout(() => {
        passwordToggle.style.transform = 'scale(1)';
    }, 100);
    
    // Focus back on the password input
    passwordInput.focus();
}

/**
 * -----------------------------------------------------------------------------
 * UI Helper Functions
 * -----------------------------------------------------------------------------
 */

/**
 * Displays a message to the user in the message area.
 * @param {string} text - The message to display.
 * @param {'error' | 'success'} type - The type of message, for styling.
 */
function displayMessage(text, type) {
    messageArea.textContent = text;
    messageArea.className = `message-area ${type}`;
    messageArea.style.display = 'block';
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            clearMessage();
        }, 3000);
    }
}

/**
 * Hides the message area.
 */
function clearMessage() {
    messageArea.textContent = '';
    messageArea.style.display = 'none';
    messageArea.className = 'message-area';
}

/**
 * Sets the loading state for the login form.
 * @param {boolean} isLoading - Whether to show loading state.
 */
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

/**
 * Validates email format.
 * @param {string} email - The email to validate.
 * @returns {boolean} - Whether the email is valid.
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Handles input focus events for enhanced UX.
 * @param {Event} event - The focus event.
 */
function handleInputFocus(event) {
    const inputWrapper = event.target.closest('.input-wrapper');
    if (inputWrapper) {
        inputWrapper.style.transform = 'translateY(-1px)';
        inputWrapper.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
    }
}

/**
 * Handles input blur events for enhanced UX.
 * @param {Event} event - The blur event.
 */
function handleInputBlur(event) {
    const inputWrapper = event.target.closest('.input-wrapper');
    if (inputWrapper) {
        inputWrapper.style.transform = 'translateY(0)';
        inputWrapper.style.boxShadow = 'none';
    }
}

/**
 * Handles input change events for real-time validation.
 * @param {Event} event - The input event.
 */
function handleInputChange(event) {
    const input = event.target;
    const inputWrapper = input.closest('.input-wrapper');
    
    // Remove any existing validation classes
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

/**
 * Initializes page animations and interactions.
 */
function initializeAnimations() {
    // Add stagger animation to form elements
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
    
    // Add hover effects to buttons
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

/**
 * Checks the URL for "error" and "message" query parameters on page load.
 * This is useful for displaying messages from the OAuth2 failure handler.
 */
function checkForUrlErrors() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasError = urlParams.get('error');
    const message = urlParams.get('message');

    if (hasError && message) {
        // Clean up the URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Display the error message
        displayMessage(message.replace(/_/g, ' '), 'error');
        
        // Add shake animation to the form
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                loginCard.style.animation = '';
            }, 500);
        }
    }
}

// Additional styles for enhanced functionality
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

// Inject additional styles if they don't exist
if (!document.getElementById('enhanced-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'enhanced-styles';
    styleElement.textContent = additionalStyles;
    document.head.appendChild(styleElement);
}

/**
 * -----------------------------------------------------------------------------
 * Keyboard Shortcuts and Accessibility
 * -----------------------------------------------------------------------------
 */

// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Enter key to submit form when focused on inputs
    if (event.key === 'Enter' && (event.target === emailInput || event.target === passwordInput)) {
        event.preventDefault();
        loginForm.dispatchEvent(new Event('submit'));
    }
    
    // Escape key to clear messages
    if (event.key === 'Escape') {
        clearMessage();
    }
});

// Add ARIA labels for better accessibility
if (passwordToggle) {
    passwordToggle.setAttribute('aria-label', 'Toggle password visibility');
    passwordToggle.setAttribute('title', 'Show/Hide password');
}

// Form validation feedback for screen readers
const addAriaValidation = (input, isValid, message) => {
    if (isValid) {
        input.setAttribute('aria-invalid', 'false');
        input.removeAttribute('aria-describedby');
    } else {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', `${input.id}-error`);
        
        // Create or update error message for screen readers
        let errorElement = document.getElementById(`${input.id}-error`);
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = `${input.id}-error`;
            errorElement.className = 'sr-only'; // Screen reader only
            input.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }
};

// Enhanced email validation with ARIA feedback
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

// Enhanced password validation with ARIA feedback
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