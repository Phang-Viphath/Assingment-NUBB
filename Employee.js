const API_URL = 'https://script.google.com/macros/s/AKfycbyPwHN19J2mjodybVmgfNwa1l3f50PAT9JYkILUcbt1DxuzEJjW4GTt1A7mYpvmi1_xCw/exec';
const API_KEY = 'your-api-key';
let currentMode = 'add';

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
    toast.className = `toast ${type}`;
    }, 3000);
}

function toggleLoading(show) {
    document.getElementById('loading-overlay').classList.toggle('hidden', !show);
}

async function populateEmployeeTable(searchQuery = '') {
    try {
    toggleLoading(true);
    const url = searchQuery ? `${API_URL}?action=read&search=${encodeURIComponent(searchQuery)}&apiKey=${API_KEY}` : `${API_URL}?action=read&apiKey=${API_KEY}`;
    const response = await fetch(url, { method: 'GET' });
    const result = await response.json();
    if (result.status === 'success') {
        const tbody = document.getElementById('employee-table-body');
        tbody.innerHTML = '';
        result.data.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="border px-4 py-2">${employee.ID}</td>
            <td class="border px-4 py-2">${employee.Name}</td>
            <td class="border px-4 py-2">${employee.Email}</td>
            <td class="border px-4 py-2">${employee.Phone}</td>
            <td class="border px-4 py-2">${employee.Position}</td>
            <td class="border px-4 py-2">
            <button onclick="editEmployee('${employee.ID}')" class="text-blue-500 hover:text-blue-700 mr-2">
                <i class="fa-solid fa-edit"></i>
            </button>
            <button onclick="deleteEmployee('${employee.ID}')" class="text-red-500 hover:text-red-700">
                <i class="fa-solid fa-trash"></i>
            </button>
            </td>
        `;
        tbody.appendChild(row);
        });
    } else {
        showToast(result.message, 'error');
    }
    } catch (error) {
    console.error('Error populating employee table:', error);
    showToast('Failed to load employee data. Please try again.', 'error');
    } finally {
    toggleLoading(false);
    }
}

function openEmployeeModal(mode, employee = null) {
    currentMode = mode;
    const modal = document.getElementById('employee-modal');
    const title = document.getElementById('employee-modal-title');
    const form = document.getElementById('employee-form');
    const idInput = document.getElementById('employee-id-input');

    if (mode === 'edit' && employee) {
    title.textContent = 'Edit Employee';
    idInput.value = employee.ID;
    idInput.disabled = true;
    document.getElementById('employee-name').value = employee.Name;
    document.getElementById('employee-email').value = employee.Email;
    document.getElementById('employee-phone').value = employee.Phone;
    document.getElementById('employee-position').value = employee.Position;
    } else {
    title.textContent = 'Add Employee';
    form.reset();
    idInput.disabled = false;
    }

    modal.classList.remove('hidden');
}

function closeEmployeeModal() {
    document.getElementById('employee-modal').classList.add('hidden');
    document.getElementById('employee-form').reset();
    document.getElementById('employee-id-input').disabled = false;
}

document.getElementById('employee-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    try {
    toggleLoading(true);
    const id = document.getElementById('employee-id-input').value.trim();
    const name = document.getElementById('employee-name').value.trim();
    const email = document.getElementById('employee-email').value.trim();
    const phone = document.getElementById('employee-phone').value.trim();
    const position = document.getElementById('employee-position').value.trim();

    if (!id || !name || !email || !phone || !position) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
    }

    if (!/^\d{10}$/.test(phone)) {
        showToast('Please enter a valid 10-digit phone number.', 'error');
        return;
    }

    if (currentMode === 'add') {
        const response = await fetch(`${API_URL}?action=read&apiKey=${API_KEY}`, { method: 'GET' });
        const result = await response.json();
        if (result.status === 'success' && result.data.some(emp => emp.ID === id)) {
        showToast('ID already exists.', 'error');
        return;
        }
    }

    const employee = { ID: id, Name: name, Email: email, Phone: phone, Position: position, apiKey: API_KEY };
    const action = currentMode === 'add' ? 'insert' : 'edit';
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...employee })
    });

    const result = await response.json();
    if (result.status === 'success') {
        showToast(result.message, 'success');
        populateEmployeeTable();
        closeEmployeeModal();
    } else {
        showToast(result.message, 'error');
    }
    } catch (error) {
    console.error('Error saving employee:', error);
    showToast('Failed to save employee data. Please try again.', 'error');
    } finally {
    toggleLoading(false);
    }
});

async function editEmployee(id) {
    try {
    toggleLoading(true);
    const response = await fetch(`${API_URL}?action=read&apiKey=${API_KEY}`, { method: 'GET' });
    const result = await response.json();
    if (result.status === 'success') {
        const employee = result.data.find(emp => emp.ID === id);
        if (employee) {
        openEmployeeModal('edit', employee);
        } else {
        showToast('Employee not found.', 'error');
        }
    } else {
        showToast(result.message, 'error');
    }
    } catch (error) {
    console.error('Error fetching employee for edit:', error);
    showToast('Failed to load employee data. Please try again.', 'error');
    } finally {
    toggleLoading(false);
    }
}

async function deleteEmployee(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
    try {
        toggleLoading(true);
        const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ID: id, apiKey: API_KEY })
        });
        const result = await response.json();
        if (result.status === 'success') {
        showToast(result.message, 'success');
        populateEmployeeTable();
        } else {
        showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting employee:', error);
        showToast('Failed to delete employee. Please try again.', 'error');
    } finally {
        toggleLoading(false);
    }
    }
}

async function handleSearch(value) {
    try {
    await populateEmployeeTable(value);
    } catch (error) {
    console.error('Error searching employees:', error);
    showToast('Error performing search. Please try again.', 'error');
    }
}

function toggleSubmenu(element) {
    try {
    const submenu = element.nextElementSibling;
    submenu.classList.toggle('hidden');
    } catch (error) {
    console.error('Error toggling submenu:', error);
    }
}

function toggleDropdown() {
    try {
    document.getElementById('dropdown').classList.toggle('hidden');
    } catch (error) {
    console.error('Error toggling dropdown:', error);
    }
}

function handleLogout() {
    try {
    localStorage.removeItem('name');
    window.location.href = 'LoginPage.html';
    } catch (error) {
    console.error('Error logging out:', error);
    showToast('Error logging out. Please try again.', 'error');
    }
}

document.getElementById('profile-item').addEventListener('click', async () => {
    try {
    const modal = document.getElementById('profile-modal');
    const user = JSON.parse(localStorage.getItem('user')) || {};
    if (user.id) {
        const response = await fetch(`${API_URL}?action=read&apiKey=${API_KEY}`, { method: 'GET' });
        const result = await response.json();
        if (result.status === 'success') {
        const employee = result.data.find(emp => emp.ID === user.id);
        if (employee) {
            document.getElementById('modal-user-id').textContent = employee.ID;
            document.getElementById('modal-user-name').textContent = employee.Name;
            document.getElementById('modal-user-email').textContent = employee.Email;
            document.getElementById('modal-user-phone').textContent = employee.Phone;
        } else {
            document.getElementById('modal-user-id').textContent = user.id || 'No ID';
            document.getElementById('modal-user-name').textContent = user.name || 'Guest';
            document.getElementById('modal-user-email').textContent = user.email || 'No email';
            document.getElementById('modal-user-phone').textContent = user.phone || 'No phone number';
        }
        }
    } else {
        document.getElementById('modal-user-id').textContent = 'No ID';
        document.getElementById('modal-user-name').textContent = user.name || 'Guest';
        document.getElementById('modal-user-email').textContent = user.email || 'No email';
        document.getElementById('modal-user-phone').textContent = user.phone || 'No phone number';
    }
    modal.classList.remove('hidden');
    } catch (error) {
    console.error('Error loading profile:', error);
    showToast('Error loading profile data. Please try again.', 'error');
    }
});

document.getElementById('close-modal').addEventListener('click', () => {
    try {
    document.getElementById('profile-modal').classList.add('hidden');
    } catch (error) {
    console.error('Error closing profile modal:', error);
    showToast('Error closing profile modal. Please try again.', 'error');
    }
});

document.querySelectorAll('#sidebar li[data-key]').forEach(item => {
    item.addEventListener('click', () => {
    try {
        const page = item.getAttribute('data-key');
        window.location.href = page;
    } catch (error) {
        console.error('Error navigating:', error);
        showToast('Error navigating to page. Please try again.', 'error');
    }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    try {
    populateEmployeeTable();
    } catch (error) {
    console.error('Error initializing employee table:', error);
    showToast('Failed to initialize employee data. Please try again.', 'error');
    }
});