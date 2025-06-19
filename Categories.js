const CATEGORY_APIS = {
    espresso: 'https://script.google.com/macros/s/AKfycbzbEeBBV0tO3QC003lx--Jt-iJa84usx4zAHuzmMUIJ0xFwXyBtAUVNXgtrjofDGVzA/exec',
    iced: 'https://script.google.com/macros/s/AKfycbzjxO5Ge2NMGzYcR2Zzjmpfdw2WJacrMTCEkRXszkdWa7vHEXFQgk8SoGUpluZt2e5qXA/exec',
    non_coffee: 'https://script.google.com/macros/s/AKfycbybZAegH2UA44idH9HKwfrwBZmZiAye04WRFZqJhJ8QILeOs7VxXYvx84yJqllydiNrLA/exec',
    pastries: 'https://script.google.com/macros/s/AKfycbyYMixTHz2VXSpRdw-rV6l0UUvieMWC7GH_fK_dkDFuYYHoglp-J6CRkj_i0Oz7gth6/exec'
};

const CATEGORY_NAMES = {
    espresso: 'Espresso-Based Drinks',
    iced: 'Iced Coffee & Cold Brews',
    non_coffee: 'Non-Coffee Drinks',
    pastries: 'Pastries & Snacks'
};

let allCategories = [];
let currentCategoryType = 'espresso';

function toggleLoading(show) {
    document.getElementById('loading-overlay').classList.toggle('hidden', !show);
}

function showError(message) {
    alert(`Error: ${message}`);
}

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input || '';
    return div.innerHTML;
}

function validateCategoryName(name) {
    if (!name || name.length < 2) {
    return 'Product name must be at least 2 characters long';
    }
    if (name.length > 50) {
    return 'Product name cannot exceed 50 characters';
    }
    return null;
}

async function loadCategories(categoryType) {
    toggleLoading(true);
    try {
    const apiUrl = CATEGORY_APIS[categoryType] || CATEGORY_APIS.espresso;
    const response = await fetch(`${apiUrl}?action=read`);
    const data = await response.json();
    toggleLoading(false);
    if (data.status === 'success' && Array.isArray(data.data)) {
        allCategories = data.data.map(item => ({ ...item, CategoryType: categoryType }));
        renderTable(allCategories);
    } else {
        showError(data.message || 'Invalid data format');
    }
    } catch (error) {
    toggleLoading(false);
    showError('Failed to load products. Please check your connection.');
    console.error('Error loading products:', error);
    }
}

function renderTable(categories) {
    const tableBody = document.getElementById('category-table-body');
    tableBody.innerHTML = '';
    categories.forEach(category => {
    const rowElement = document.createElement('tr');
    rowElement.classList.add('table-row', 'border-t');
    rowElement.setAttribute('data-last-modified', category.LastModified || '');
    rowElement.setAttribute('data-category-type', category.CategoryType || '');
    rowElement.innerHTML = `
        <td class="px-4 py-3 text-gray-800">${sanitizeInput(category.Id) || 'N/A'}</td>
        <th class="px-4 py-3 text-gray-800">
        <img src="${(category['Image URL']) || 'https://via.placeholder.com/50'}" alt="Product Image" class="w-12 h-12 rounded-full shadow-md">
        </th>
        <td class="px-4 py-3 text-gray-800">${sanitizeInput(category.Name) || 'N/A'}</td>
        <td class="px-4 py-3 text-gray-600">${sanitizeInput(category.Description) || 'No description'}</td>
        <td class="px-4 py-3 text-gray-800">${sanitizeInput(CATEGORY_NAMES[category.CategoryType]) || 'N/A'}</td>
        <td class="px-4 py-3">
        <button onclick="openEditModal('${sanitizeInput(category.Id)}', '${sanitizeInput(category.Name)}', '${sanitizeInput(category.Description)}', '${sanitizeInput(category.LastModified)}', '${sanitizeInput(category.CategoryType)}')" class="text-blue-600 hover:text-blue-800 mr-2"><i class="fa-solid fa-edit"></i></button>
        <button onclick="deleteCategory('${sanitizeInput(category.Id)}', '${sanitizeInput(category.CategoryType)}')" class="text-red-600 hover:text-red-800"><i class="fa-solid fa-trash"></i></button>
        </td>
    `;
    tableBody.appendChild(rowElement);
    });
}

document.getElementById('search-input').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const filteredCategories = allCategories.filter(category =>
    (category.Name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query) ||
    (category.Description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query)
    );
    renderTable(filteredCategories);
});

document.getElementById('category-select').addEventListener('change', (e) => {
    currentCategoryType = e.target.value;
    loadCategories(currentCategoryType);
});

document.getElementById('open-category-modal').addEventListener('click', () => {
    document.getElementById('category-id').value = 'Auto-generated';
    document.getElementById('category-type').value = currentCategoryType;
    document.getElementById('add-category-modal').classList.remove('hidden');
});

document.getElementById('close-category-modal').addEventListener('click', () => {
    document.getElementById('add-category-form').reset();
    document.getElementById('add-category-modal').classList.add('hidden');
});

document.getElementById('cancel-category').addEventListener('click', () => {
    document.getElementById('add-category-form').reset();
    document.getElementById('add-category-modal').classList.add('hidden');
});

document.getElementById('add-category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    toggleLoading(true);
    const categoryType = document.getElementById('category-type').value;
    const name = document.getElementById('category-name').value.trim();
    const description = document.getElementById('category-description').value.trim() || '';

    const validationError = validateCategoryName(name);
    if (validationError) {
    toggleLoading(false);
    showError(validationError);
    return;
    }

    try {
    const apiUrl = CATEGORY_APIS[categoryType];
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'insert', Name: name, Description: description })
    });
    const data = await response.json();
    toggleLoading(false);
    if (data.status === 'success') {
        document.getElementById('add-category-form').reset();
        document.getElementById('add-category-modal').classList.add('hidden');
        await loadCategories(currentCategoryType);
        alert('Product added successfully!');
    } else {
        showError(data.message || 'Failed to add product');
    }
    } catch (error) {
    toggleLoading(false);
    showError('Failed to add product. Please check your connection.');
    console.error('Error adding product:', error);
    }
});

function openEditModal(id, name, description, lastModified, categoryType) {
    document.getElementById('edit-category-id').value = id || 'N/A';
    document.getElementById('edit-category-Image').value = '';
    document.getElementById('edit-category-name').value = name === 'N/A' ? '' : name;
    document.getElementById('edit-category-description').value = description === 'No description' ? '' : description;
    document.getElementById('edit-category-type').value = categoryType || currentCategoryType;
    document.getElementById('edit-category-form').setAttribute('data-last-modified', lastModified || '');
    document.getElementById('edit-category-modal').classList.remove('hidden');
}

document.getElementById('close-edit-category-modal').addEventListener('click', () => {
    document.getElementById('edit-category-form').reset();
    document.getElementById('edit-category-modal').classList.add('hidden');
});

document.getElementById('cancel-edit-category').addEventListener('click', () => {
    document.getElementById('edit-category-form').reset();
    document.getElementById('edit-category-modal').classList.add('hidden');
});

document.getElementById('edit-category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    toggleLoading(true);
    const categoryType = document.getElementById('edit-category-type').value;
    const id = document.getElementById('edit-category-id').value;
    const lastModified = document.getElementById('edit-category-form').getAttribute('data-last-modified');
    const name = document.getElementById('edit-category-name').value.trim();
    const description = document.getElementById('edit-category-description').value.trim() || '';

    const validationError = validateCategoryName(name);
    if (validationError) {
    toggleLoading(false);
    showError(validationError);
    return;
    }

    try {
    const apiUrl = CATEGORY_APIS[categoryType];
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', ID: id, LastModified: lastModified, Name: name, Description: description })
    });
    const data = await response.json();
    toggleLoading(false);
    if (data.status === 'success') {
        document.getElementById('edit-category-form').reset();
        document.getElementById('edit-category-modal').classList.add('hidden');
        await loadCategories(currentCategoryType);
        alert('Product updated successfully!');
    } else {
        showError(data.message || 'Failed to update product');
    }
    } catch (error) {
    toggleLoading(false);
    showError('Failed to update product. Please check your connection.');
    console.error('Error updating product:', error);
    }
});

async function deleteCategory(id, categoryType) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    toggleLoading(true);
    try {
    const apiUrl = CATEGORY_APIS[categoryType];
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', ID: id })
    });
    const data = await response.json();
    toggleLoading(false);
    if (data.status === 'success') {
        await loadCategories(currentCategoryType);
        alert('Product deleted successfully!');
    } else {
        showError(data.message || 'Failed to delete product');
    }
    } catch (error) {
    toggleLoading(false);
    showError('Failed to delete product. Please check your connection.');
    console.error('Error deleting product:', error);
    }
}

function toggleSubmenu(element) {
    const submenu = element.nextElementSibling;
    submenu.classList.toggle('hidden');
}

function toggleDropdown() {
    document.getElementById('dropdown').classList.toggle('hidden');
}

function handleLogout() {
    localStorage.removeItem('name');
    window.location.href = 'LoginPage.html';
}

function setupNavigation() {
    document.querySelectorAll('#menu li[data-key]').forEach(item => {
    item.addEventListener('click', (e) => {
        if (e.target.closest('.submenu') || !item.hasAttribute('data-key')) return;
        const page = item.getAttribute('data-key');
        if (page) {
        window.location.href = page;
        }
    });
    });
}

window.onload = () => {
    document.getElementById('user-name').textContent = localStorage.getItem('name') || 'Guest';
    document.getElementById('modal-user-name').textContent = localStorage.getItem('name') || 'Guest';
    setupNavigation();
    loadCategories(currentCategoryType);
};

document.getElementById('profile-item').addEventListener('click', () => {
    document.getElementById('profile-modal').classList.remove('hidden');
});

document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('profile-modal').classList.add('hidden');
});