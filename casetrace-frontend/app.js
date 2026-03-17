// Backend API URL
const API_BASE_URL = 'http://localhost:3000/api';

// UI Logic mapping
function switchTheme(type) {
    const citizenSection = document.getElementById('citizen-section');
    const officerSection = document.getElementById('officer-section');
    const tabs = document.querySelectorAll('.tab-btn');
    
    // Reset messages
    hideMessage();

    if (type === 'citizen') {
        citizenSection.style.display = 'block';
        officerSection.style.display = 'none';
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
        document.querySelector('.gov-header').style.backgroundColor = 'var(--primary-color)';
    } else {
        citizenSection.style.display = 'none';
        officerSection.style.display = 'block';
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
        document.querySelector('.gov-header').style.backgroundColor = 'var(--officer-color)';
    }
}

function showMessage(msg, isError = false) {
    const msgBox = document.getElementById('api-message');
    msgBox.textContent = msg;
    msgBox.className = 'message-box ' + (isError ? 'message-error' : 'message-success');
}

function hideMessage() {
    const msgBox = document.getElementById('api-message');
    msgBox.className = 'message-box';
}

// API Calls
async function handleCitizenRegister(e) {
    e.preventDefault();
    
    const full_name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const phone_number = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name, email, phone_number, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || 'Registration failed', true);
        } else {
            showMessage('Citizen registered successfully! You can now login.');
            document.getElementById('citizen-register-form').reset();
        }
    } catch (err) {
        showMessage('Unable to connect to the server. Is the backend running?', true);
    }
}

async function handleCitizenLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('citizen-email').value;
    const password = document.getElementById('citizen-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || 'Login failed', true);
        } else {
            showMessage(`Login successful! Welcome, ${data.user.name}`);
            // In a real app, you would save data.token to localStorage and redirect to dashboard
            localStorage.setItem('citizen_token', data.token);
        }
    } catch (err) {
        showMessage('Unable to connect to the server. Is the backend running?', true);
    }
}

async function handleOfficerLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('officer-email').value;
    const password = document.getElementById('officer-password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/officer/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || 'Login failed', true);
        } else {
            showMessage(`Login successful! Officer ${data.officer.name} (Badge: ${data.officer.badge}) authenticated.`);
            localStorage.setItem('officer_token', data.token);
        }
    } catch (err) {
        showMessage('Unable to connect to the server. Is the backend running?', true);
    }
}
