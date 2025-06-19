const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw_Fu5pv814sGjNJlK2GWvmzzxyKkvuAExvX018imL2tImbYH4EbSA63knQKyp2sEkg/exec';
let allBrands = [];

function toggleLoading(show) {
  document.getElementById('loading-overlay').classList.toggle('hidden', !show);
}

function showError(message) {
  alert(`Error: ${message}`);
}

function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

function loadBrands() {
  toggleLoading(true);
  fetch(`${WEB_APP_URL}?action=${encodeURIComponent('read')}`)
    .then(response => response.json())
    .then(data => {
      toggleLoading(false);
      if (data.status === 'success' && Array.isArray(data.data)) {
        allBrands = data.data;
        renderTable(allBrands);
      } else {
        showError(data.message || 'Invalid data format');
      }
    })
    .catch(error => {
      toggleLoading(false);
      showError('Failed to load brands. Please check your connection.');
      console.error('Error loading brands:', error);
    });
}

function renderTable(brands) {
  const tableBody = document.getElementById('brand-table-body');
  tableBody.innerHTML = '';
  brands.forEach(brand => {
    const rowElement = document.createElement('tr');
    rowElement.classList.add('table-row', 'border-t');
    rowElement.setAttribute('data-last-modified', brand.LastModified || '');
    rowElement.innerHTML = `
      <td class="px-4 py-3 text-gray-800">${sanitizeInput(brand.ID) || 'N/A'}</td>
      <td class="px-4 py-3">
        <img src="${sanitizeInput(brand.Logo) || 'https://github.com/Phang-Viphath/Image/blob/main/Brand/brand%20name.png?raw=true'}" alt="Brand Logo" class="w-10 h-10 rounded-full" onerror="this.src='https://github.com/Phang-Viphath/Image/blob/main/Brand/brand%20name.png?raw=true'">
      </td>
      <td class="px-4 py-3 text-gray-800">${sanitizeInput(brand['Brand Name']) || 'N/A'}</td>
      <td class="px-4 py-3 text-gray-600">${sanitizeInput(brand.Description) || 'No description'}</td>
      <td class="px-4 py-3">
        <button onclick="openEditModal('${brand.ID || ''}', '${brand.Logo || ''}', '${brand['Brand Name'] || ''}', '${brand.Description || ''}', '${brand.LastModified || ''}')" class="text-blue-600 hover:text-blue-800 mr-2"><i class="fa-solid fa-edit"></i></button>
        <button onclick="deleteBrand('${brand.ID || ''}')" class="text-red-600 hover:text-red-800"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tableBody.appendChild(rowElement);
  });
}

// Search Filter
document.getElementById('search-input').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filteredBrands = allBrands.filter(brand =>
    (brand['Brand Name'] || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query) ||
    (brand.Description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query)
  );
  renderTable(filteredBrands);
});

// Add Brand Modal
document.getElementById('open-brand-modal').addEventListener('click', () => {
  document.getElementById('brand-id').value = 'Auto-generated';
  document.getElementById('add-brand-modal').classList.remove('hidden');
});

document.getElementById('close-brand-modal').addEventListener('click', () => {
  document.getElementById('add-brand-form').reset();
  document.getElementById('add-brand-modal').classList.add('hidden');
});

document.getElementById('cancel-brand').addEventListener('click', () => {
  document.getElementById('add-brand-form').reset();
  document.getElementById('add-brand-modal').classList.add('hidden');
});

document.getElementById('add-brand-form').addEventListener('submit', (e) => {
  e.preventDefault();
  toggleLoading(true);
  const BrandName = document.getElementById('brand-name').value.trim();
  const Logo = document.getElementById('brand-logo').value.trim() || '';
  const Description = document.getElementById('brand-description').value.trim() || '';

  if (!BrandName) {
    toggleLoading(false);
    showError('Brand Name is required');
    return;
  }
  if (Logo && !isValidUrl(Logo)) {
    toggleLoading(false);
    showError('Invalid Logo URL');
    return;
  }

  fetch(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'insert', Logo, 'Brand Name': BrandName, Description })
  })
    .then(response => response.json())
    .then(data => {
      toggleLoading(false);
      if (data.status === 'success') {
        document.getElementById('add-brand-form').reset();
        document.getElementById('add-brand-modal').classList.add('hidden');
        loadBrands();
        alert('Brand added successfully!');
      } else {
        showError(data.message);
      }
    })
    .catch(error => {
      toggleLoading(false);
      showError('Failed to add brand. Please check your connection.');
      console.error('Error adding brand:', error);
    });
});

// Edit Brand Modal
function openEditModal(ID, Logo, BrandName, Description, LastModified) {
  document.getElementById('edit-brand-id').value = ID;
  document.getElementById('edit-brand-name').value = BrandName === 'N/A' ? '' : BrandName;
  document.getElementById('edit-brand-logo').value = Logo === 'https://github.com/Phang-Viphath/Image/blob/main/Brand/brand%20name.png?raw=true' ? '' : Logo;
  document.getElementById('edit-brand-description').value = Description === 'No description' ? '' : Description;
  document.getElementById('edit-brand-form').setAttribute('data-last-modified', LastModified);
  document.getElementById('edit-brand-modal').classList.remove('hidden');
}

document.getElementById('close-edit-brand-modal').addEventListener('click', () => {
  document.getElementById('edit-brand-form').reset();
  document.getElementById('edit-brand-modal').classList.add('hidden');
});

document.getElementById('cancel-edit-brand').addEventListener('click', () => {
  document.getElementById('edit-brand-form').reset();
  document.getElementById('edit-brand-modal').classList.add('hidden');
});

document.getElementById('edit-brand-form').addEventListener('submit', (e) => {
  e.preventDefault();
  toggleLoading(true);
  const ID = document.getElementById('edit-brand-id').value;
  const lastModified = document.getElementById('edit-brand-form').getAttribute('data-last-modified');
  const BrandName = document.getElementById('edit-brand-name').value.trim();
  const Logo = document.getElementById('edit-brand-logo').value.trim() || '';
  const Description = document.getElementById('edit-brand-description').value.trim() || '';

  if (!BrandName) {
    toggleLoading(false);
    showError('Brand Name is required');
    return;
  }
  if (Logo && !isValidUrl(Logo)) {
    toggleLoading(false);
    showError('Invalid Logo URL');
    return;
  }

  fetch(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'edit', ID, lastModified, Logo, 'Brand Name': BrandName, Description })
  })
    .then(response => response.json())
    .then(data => {
      toggleLoading(false);
      if (data.status === 'success') {
        document.getElementById('edit-brand-form').reset();
        document.getElementById('edit-brand-modal').classList.add('hidden');
        loadBrands();
        alert('Brand updated successfully!');
      } else {
        showError(data.message);
      }
    })
    .catch(error => {
      toggleLoading(false);
      showError('Failed to update brand. Please check your connection.');
      console.error('Error updating brand:', error);
    });
});

function deleteBrand(ID) {
  if (confirm('Are you sure you want to delete this brand?')) {
    toggleLoading(true);
    fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', ID })
    })
      .then(response => response.json())
      .then(data => {
        toggleLoading(false);
        if (data.status === 'success') {
          loadBrands();
          alert('Brand deleted successfully!');
        } else {
          showError(data.message);
        }
      })
      .catch(error => {
        toggleLoading(false);
        showError('Failed to delete brand. Please check your connection.');
        console.error('Error deleting brand:', error);
      });
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

document.getElementById('profile-item').addEventListener('click', () => {
  document.getElementById('modal-user-name').textContent = localStorage.getItem('name') || 'Guest';
  document.getElementById('profile-modal').classList.remove('hidden');
});

document.getElementById('close-modal').addEventListener('click', () => {
  document.getElementById('profile-modal').classList.add('hidden');
});

document.querySelectorAll('#menu li[data-key]').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.getAttribute('data-key');
    if (page) {
      window.location.href = page;
    }
  });
});

window.onload = () => {
  document.getElementById('user-name').textContent = localStorage.getItem('name') || 'Guest';
  loadBrands();
};