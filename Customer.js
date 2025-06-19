const API_URL = 'https://script.google.com/macros/s/AKfycbzVZmrAtxQt6cEnwNyvqRGiya4d8m01w35x0SjHXZR5al0NSq8KP5hDzxFbAv6BF7qF/exec';

function toggleLoading(show) {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.toggle('hidden', !show);
  }
}

async function loadCustomers(filter = '') {
  const tableBody = document.getElementById('customer-table-body');
  if (!tableBody) {
    console.error('Customer table body not found');
    return;
  }
  tableBody.innerHTML = '';
  toggleLoading(true);

  try {
    const response = await fetch(`${API_URL}?action=read`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const result = await response.json();
    console.log('API result:', result);

    if (result.status !== 'success') {
      console.error('Error fetching customers:', result.data);
      alert('Error fetching customers: ' + result.data);
      return;
    }

    const filteredCustomers = result.data.filter(customer => {
      const name = customer.Name ? customer.Name.toLowerCase() : '';
      const email = customer.Email ? customer.Email.toLowerCase() : '';
      return name.includes(filter.toLowerCase()) || email.includes(filter.toLowerCase());
    });

    filteredCustomers.forEach(customer => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="border px-4 py-2">${customer.ID || 'N/A'}</td>
        <td class="border px-4 py-2">${customer.Name || 'N/A'}</td>
        <td class="border px-4 py-2">${customer.Email || 'N/A'}</td>
        <td class="border px-4 py-2">${customer.Phone || 'N/A'}</td>
        <td class="border px-4 py-2">
          <button onclick="editCustomer('${customer.ID}')" class="text-blue-500 hover:text-blue-700 mr-2">
            <i class="fa-solid fa-edit"></i>
          </button>
          <button onclick="deleteCustomer('${customer.ID}')" class="text-red-500 hover:text-red-700">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    if (filteredCustomers.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="px-4 py-2 text-center text-gray-600">No customers found</td></tr>';
    }
  } catch (error) {
    console.error('Error loading customers:', error);
    alert('Failed to load customers: ' + error.message);
  } finally {
    toggleLoading(false);
  }
}

function searchCustomers(query) {
  loadCustomers(query);
}

document.getElementById('add-customer-btn')?.addEventListener('click', () => {
  document.getElementById('modal-title').textContent = 'Add Customer';
  document.getElementById('customer-form').reset();
  document.getElementById('customer-id').value = '';
  document.getElementById('customer-modal').classList.remove('hidden');
});

document.getElementById('close-customer-modal')?.addEventListener('click', () => {
  document.getElementById('customer-modal').classList.add('hidden');
});

document.getElementById('customer-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('customer-id').value;
  const name = document.getElementById('customer-name').value;
  const email = document.getElementById('customer-email').value;
  const phone = document.getElementById('customer-phone').value;

  if (!name || !email) {
    alert('Name and Email are required');
    return;
  }

  const customerData = {
    action: id ? 'edit' : 'insert',
    ID: id || Date.now().toString(),
    Name: name,
    Email: email,
    Phone: phone,
  };

  toggleLoading(true);
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const result = await response.json();
    console.log('API response:', result);
    if (result.status === 'success') {
      loadCustomers();
      document.getElementById('customer-modal').classList.add('hidden');
      alert(id ? 'Customer updated successfully' : 'Customer added successfully');
    } else {
      console.error('Error saving customer:', result.data);
      alert('Error: ' + result.data);
    }
  } catch (error) {
    console.error('Error saving customer:', error);
    alert('Failed to save customer: ' + error.message);
  } finally {
    toggleLoading(false);
  }
});

async function editCustomer(id) {
  toggleLoading(true);
  try {
    const response = await fetch(`${API_URL}?action=read`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const result = await response.json();
    console.log('API result for edit:', result);
    if (result.status !== 'success') {
      console.error('Error fetching customer:', result.data);
      alert('Error fetching customer: ' + result.data);
      return;
    }

    const customer = result.data.find(c => c.ID === id);
    if (customer) {
      document.getElementById('modal-title').textContent = 'Edit Customer';
      document.getElementById('customer-id').value = customer.ID;
      document.getElementById('customer-name').value = customer.Name || '';
      document.getElementById('customer-email').value = customer.Email || '';
      document.getElementById('customer-phone').value = customer.Phone || '';
      document.getElementById('customer-modal').classList.remove('hidden');
    } else {
      alert('Customer not found');
    }
  } catch (error) {
    console.error('Error loading customer for edit:', error);
    alert('Failed to load customer: ' + error.message);
  } finally {
    toggleLoading(false);
  }
}

async function deleteCustomer(id) {
  if (!confirm('Are you sure you want to delete this customer?')) {
    return;
  }

  toggleLoading(true);
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', ID: id })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const result = await response.json();
    console.log('API response for delete:', result);
    if (result.status === 'success') {
      loadCustomers();
      alert('Customer deleted successfully');
    } else {
      console.error('Error deleting customer:', result.data);
      alert('Error: ' + result.data);
    }
  } catch (error) {
    console.error('Error deleting customer:', error);
    alert('Failed to delete customer: ' + error.message);
  } finally {
    toggleLoading(false);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  loadCustomers();
});