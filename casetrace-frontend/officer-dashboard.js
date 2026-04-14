const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    // Verify Authentication
    const token = localStorage.getItem('officer_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Default load
    loadAllComplaints(token);
});

// UI Navigation toggles
function showAllComplaints(e) { 
    e.preventDefault(); 
    setActive('nav-all-complaints', 'all-complaints-view'); 
    loadAllComplaints(localStorage.getItem('officer_token'));
}
function showFilterComplaints(e) { 
    e.preventDefault(); 
    setActive('nav-filter-complaints', 'filter-complaints-view'); 
}
function showAddNote(e) { 
    e.preventDefault(); 
    setActive('nav-add-note', 'add-note-view'); 
    loadComplaintsForNote(localStorage.getItem('officer_token'));
}

function setActive(navId, viewId) {
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.getElementById(navId).classList.add('active');
    
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

// API Fetching & Interaction
async function loadAllComplaints(token) {
    const tbody = document.getElementById('all-complaints-body');
    tbody.innerHTML = '<tr><td colspan="5">Loading cases...</td></tr>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/officer/complaints`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const complaints = await response.json();
            if(complaints.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">No complaints in system.</td></tr>';
                return;
            }
            tbody.innerHTML = complaints.map(c => `
                <tr>
                    <td>${c.complaint_id.substring(0,8)}...</td>
                    <td>${c.category}</td>
                    <td>${c.citizen_name || 'Citizen'}</td>
                    <td><span class="status-badge ${c.current_status.toLowerCase()}">${c.current_status}</span></td>
                    <td>${c.priority}</td>
                </tr>
            `).join('');
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5">Error loading cases.</td></tr>';
    }
}

async function applyFilters() {
    const token = localStorage.getItem('officer_token');
    const status = document.getElementById('filter-status').value;
    const priority = document.getElementById('filter-priority').value;
    const tbody = document.getElementById('filtered-complaints-body');
    tbody.innerHTML = '<tr><td colspan="5">Applying filters...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/officer/complaints`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            let complaints = await response.json();
            
            if (status) complaints = complaints.filter(c => c.current_status === status);
            if (priority) complaints = complaints.filter(c => c.priority === priority);

            if(complaints.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">No matching complaints found.</td></tr>';
                return;
            }

            tbody.innerHTML = complaints.map(c => `
                <tr>
                    <td>${c.complaint_id.substring(0,8)}...</td>
                    <td>${c.category}</td>
                    <td><span class="status-badge ${c.current_status.toLowerCase()}">${c.current_status}</span></td>
                    <td>${c.priority}</td>
                    <td><button class="btn btn-secondary" onclick="selectForUpdate('${c.complaint_id}', '${c.current_status}')" style="padding:0.4rem 0.8rem; font-size:0.85rem;">Update</button></td>
                </tr>
            `).join('');
        }
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5">Error filtering cases.</td></tr>';
    }
}

function selectForUpdate(id, currentStatus) {
    document.getElementById('status-update-container').style.display = 'block';
    document.getElementById('update-case-id').textContent = id;
    document.getElementById('new-status').value = currentStatus;
    
    document.getElementById('update-message').style.display = 'none';
}

async function submitStatusUpdate() {
    const token = localStorage.getItem('officer_token');
    const id = document.getElementById('update-case-id').textContent;
    const status = document.getElementById('new-status').value;
    const msgBox = document.getElementById('update-message');

    try {
        const response = await fetch(`${API_BASE_URL}/officer/complaints/${id}/status`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        const data = await response.json();

        msgBox.style.display = 'block';
        if (response.ok) {
            msgBox.textContent = `Status successfully updated to ${status}.`;
            msgBox.className = 'message-box message-success';
            applyFilters();
        } else {
            msgBox.textContent = data.error || 'Failed to update status.';
            msgBox.className = 'message-box message-error';
        }
    } catch (err) {
        msgBox.style.display = 'block';
        msgBox.textContent = 'Server connection error.';
        msgBox.className = 'message-box message-error';
    }
}

async function loadComplaintsForNote(token) {
    const select = document.getElementById('note-complaint-id');
    select.innerHTML = '<option value="" disabled selected>Loading...</option>';
    try {
        const response = await fetch(`${API_BASE_URL}/officer/complaints`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const complaints = await response.json();
            if(complaints.length === 0){
                select.innerHTML = '<option value="" disabled selected>No complaints available</option>';
                return;
            }
            select.innerHTML = '<option value="" disabled selected>Select a case...</option>' + 
                complaints.map(c => `<option value="${c.complaint_id}">${c.complaint_id.substring(0,8)} - ${c.category}</option>`).join('');
        }
    } catch (err) {
        select.innerHTML = '<option value="" disabled selected>Error loading complaints</option>';
    }
}

async function handleAddNote(e) {
    e.preventDefault();
    const token = localStorage.getItem('officer_token');
    const id = document.getElementById('note-complaint-id').value;
    const note_text = document.getElementById('note-text').value;
    const msgBox = document.getElementById('add-note-message');

    try {
        const response = await fetch(`${API_BASE_URL}/officer/complaints/${id}/notes`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ note_text })
        });
        const data = await response.json();

        msgBox.style.display = 'block';
        if (response.ok) {
            msgBox.textContent = 'Investigation Note securely added.';
            msgBox.className = 'message-box message-success';
            document.getElementById('add-note-form').reset();
        } else {
            msgBox.textContent = data.error || 'Failed to add note.';
            msgBox.className = 'message-box message-error';
        }
    } catch (err) {
        msgBox.style.display = 'block';
        msgBox.textContent = 'Server connection error.';
        msgBox.className = 'message-box message-error';
    }
}

function logoutOfficer(e) {
    e.preventDefault();
    localStorage.removeItem('officer_token');
    window.location.href = 'index.html';
}
