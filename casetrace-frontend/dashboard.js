const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verify Authentication
    const token = localStorage.getItem('citizen_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Fetch Basic Info (Username extracted from local storage or token, or placeholder for now)
    document.getElementById('header-user-name').textContent = "Welcome, Citizen";

    // 3. Fetch Statistics
    fetchDashboardStats(token);
});

async function fetchDashboardStats(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/complaints/my-complaints`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const complaints = await response.json();
            const total = complaints.length;
            const investigating = complaints.filter(c => c.current_status === 'INVESTIGATING').length;
            const closed = complaints.filter(c => c.current_status === 'CLOSED').length;
            
            document.getElementById('stat-total').textContent = total;
            document.getElementById('stat-investigating').textContent = investigating;
            document.getElementById('stat-closed').textContent = closed;
        }
    } catch (err) {
        console.error("Failed to load dashboard stats", err);
    }
}

// UI Navigation
function showDashboard(e) { 
    e.preventDefault(); 
    setActive('nav-dashboard', 'dashboard-view'); 
    fetchDashboardStats(localStorage.getItem('citizen_token'));
}
function showFileComplaint(e) { e.preventDefault(); setActive('nav-file-complaint', 'file-complaint-view'); }
function showMyComplaints(e) { 
    e.preventDefault(); 
    setActive('nav-my-complaints', 'my-complaints-view'); 
    loadMyComplaints(localStorage.getItem('citizen_token'));
}
function showUploadEvidence(e) { 
    e.preventDefault(); 
    setActive('nav-upload-evidence', 'upload-evidence-view'); 
    loadComplaintsForEvidence(localStorage.getItem('citizen_token'));
}

async function loadMyComplaints(token) {
    const tbody = document.getElementById('my-complaints-body');
    tbody.innerHTML = '<tr><td colspan="4">Loading complaints...</td></tr>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/complaints/my-complaints`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const complaints = await response.json();
            if (complaints.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4">No complaints filed yet.</td></tr>';
                return;
            }
            tbody.innerHTML = complaints.map(c => `
                <tr>
                    <td>${c.complaint_id.substring(0,8)}...</td>
                    <td>${c.category}</td>
                    <td>${new Date(c.filed_at).toLocaleDateString()}</td>
                    <td><span class="status-badge ${c.current_status.toLowerCase()}">${c.current_status}</span></td>
                </tr>
            `).join('');
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="4">Failed to load complaints.</td></tr>';
    }
}

async function handleFileComplaint(e) {
    e.preventDefault();
    const token = localStorage.getItem('citizen_token');
    const msgBox = document.getElementById('file-complaint-message');
    
    const category = document.getElementById('complaint-category').value;
    const incident_date = document.getElementById('complaint-date').value;
    const incident_location = document.getElementById('complaint-location').value;
    const description = document.getElementById('complaint-desc').value;

    try {
        const response = await fetch(`${API_BASE_URL}/complaints`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ category, incident_date, incident_location, description })
        });
        const data = await response.json();

        if (response.ok) {
            msgBox.textContent = `Success! Complaint ID: ${data.complaint_id}`;
            msgBox.className = 'message-box message-success';
            document.getElementById('file-complaint-form').reset();
            fetchDashboardStats(token); // update stats behind the scenes
        } else {
            msgBox.textContent = data.error || 'Failed to file complaint';
            msgBox.className = 'message-box message-error';
        }
    } catch (err) {
        msgBox.textContent = 'Server connection error';
        msgBox.className = 'message-box message-error';
    }
}

async function loadComplaintsForEvidence(token) {
    const select = document.getElementById('evidence-complaint-id');
    select.innerHTML = '<option value="" disabled selected>Loading...</option>';
    try {
        const response = await fetch(`${API_BASE_URL}/complaints/my-complaints`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const complaints = await response.json();
            if(complaints.length === 0){
                select.innerHTML = '<option value="" disabled selected>No complaints available</option>';
                return;
            }
            select.innerHTML = '<option value="" disabled selected>Choose a complaint</option>' + 
                complaints.map(c => `<option value="${c.complaint_id}">${c.category} - ${new Date(c.filed_at).toLocaleDateString()}</option>`).join('');
        }
    } catch (err) {
        select.innerHTML = '<option value="" disabled selected>Error loading complaints</option>';
    }
}

function setActive(navId, viewId) {
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.getElementById(navId).classList.add('active');
    
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    
    const view = document.getElementById(viewId);
    if(view) view.classList.add('active');
}

function logout(e) {
    e.preventDefault();
    localStorage.removeItem('citizen_token');
    window.location.href = 'index.html';
}
