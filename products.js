const CATEGORY_APIS = {
  espresso: 'https://script.google.com/macros/s/AKfycbzbEeBBV0tO3QC003lx--Jt-iJa84usx4zAHuzmMUIJ0xFwXyBtAUVNXgtrjofDGVzA/exec',
  iced: 'https://script.google.com/macros/s/AKfycbzjxO5Ge2NMGzYcR2Zzjmpfdw2WJacrMTCEkRXszkdWa7vHEXFQgk8SoGUpluZt2e5qXA/exec',
  non_coffee: 'https://script.google.com/macros/s/AKfycbybZAegH2UA44idH9HKwfrwBZmZiAye04WRFZqJhJ8QILeOs7VxXYvx84yJqllydiNrLA/exec',
  pastries: 'https://script.google.com/macros/s/AKfycbyYMixTHz2VXSpRdw-rV6l0UUvieMWC7GH_fK_dkDFuYYHoglp-J6CRkj_i0Oz7gth6/exec'
};

const CATEGORY_NAMES = {
  espresso: 'Products',
  iced: 'Products',
  non_coffee: 'Products',
  pastries: 'Products'
};

let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function toggleLoading(show) {
  document.getElementById('brand-loading').classList.toggle('hidden', !show);
  document.getElementById('brand-error').classList.add('hidden');
  document.getElementById('brand-list').classList.toggle('hidden', show);
}

function showError(message) {
  document.getElementById('brand-loading').classList.add('hidden');
  document.getElementById('brand-error').classList.remove('hidden');
  document.getElementById('brand-error').querySelector('p').textContent = `Failed to load products: ${message}`;
  document.getElementById('brand-list').classList.add('hidden');
}

function showNotification(title, message) {
  let notificationBox = document.getElementById('custom-notification-box');
  if (!notificationBox) {
    notificationBox = document.createElement('div');
    notificationBox.id = 'custom-notification-box';
    notificationBox.className = 'fixed bottom-4 right-4 z-50 w-80 space-y-2';
    document.body.appendChild(notificationBox);
  }

  const icons = {
    Success: 'fas fa-check-circle text-green-500',
    Error: 'fas fa-times-circle text-red-500',
    Info: 'fas fa-info-circle text-blue-500'
  };

  const iconClass = icons[title] || 'fas fa-bell text-gray-500';

  const notification = document.createElement('div');
  notification.className = `
    bg-white rounded-xl shadow-xl p-4 border-l-4
    ${title === 'Error' ? 'border-red-500' : title === 'Success' ? 'border-green-500' : 'border-blue-500'}
    transform transition-all duration-300 animate-fade-in-up
  `.trim();

  notification.innerHTML = `
    <div class="flex gap-3 items-start">
      <i class="${iconClass} text-2xl mt-1"></i>
      <div class="flex-1">
        <h3 class="text-md font-semibold text-gray-900">${title}</h3>
        <p class="text-sm text-gray-700">${message}</p>
      </div>
      <button class="text-gray-400 hover:text-gray-600 text-sm mt-1" onclick="this.closest('div[role=alert]').remove()">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  notification.setAttribute('role', 'alert');

  notificationBox.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => notification.remove(), 300);
  }, 1500);
}

function showConfirmBox(message, onConfirm) {
  let confirmBox = document.getElementById('custom-confirm-box');
  if (!confirmBox) {
    confirmBox = document.createElement('div');
    confirmBox.id = 'custom-confirm-box';
    confirmBox.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4 hidden';
    confirmBox.innerHTML = `
      <div class="bg-white rounded-lg p-6 shadow-xl w-full max-w-sm">
        <h3 class="text-xl font-bold mb-4 text-gray-900">Confirm Action</h3>
        <p id="confirm-box-message" class="text-gray-700 mb-6"></p>
        <div class="flex justify-end gap-3">
          <button id="confirm-box-cancel-btn" class="px-5 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors">
            Cancel
          </button>
          <button id="confirm-box-ok-btn" class="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors">
            Confirm
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmBox);
  }
  confirmBox.querySelector('#confirm-box-message').textContent = message;
  confirmBox.classList.remove('hidden');

  const cancelBtn = confirmBox.querySelector('#confirm-box-cancel-btn');
  const okBtn = confirmBox.querySelector('#confirm-box-ok-btn');

  const newCancelBtn = cancelBtn.cloneNode(true);
  const newOkBtn = okBtn.cloneNode(true);
  cancelBtn.replaceWith(newCancelBtn);
  okBtn.replaceWith(newOkBtn);

  newCancelBtn.addEventListener('click', () => confirmBox.classList.add('hidden'));
  newOkBtn.addEventListener('click', () => {
    confirmBox.classList.add('hidden');
    onConfirm();
  });
}

function validateProducts(productData) {
  if (!productData || productData.length === 0) {
    console.warn('No products found in response');
    return true;
  }
  const requiredFields = ['Id', 'Name', 'Category', 'Sizes', 'Price', 'Description', 'Brand', 'Image URL'];
  for (let item of productData) {
    for (let field of requiredFields) {
      if (!(field in item)) {
        console.error(`Error: Missing field '${field}' in product '${item.Name || 'Unknown'}'`);
        return false;
      }
      if (field === 'Id' && !Number.isInteger(parseInt(item[field]))) {
        console.error(`Error: Invalid Id format for '${item.Name}'`);
        return false;
      }
      if (field === 'Price' && isNaN(parseFloat(item[field]))) {
        console.error(`Error: Invalid Price format for '${item.Name}'`);
        return false;
      }
    }
  }
  const ids = productData.map(item => item.Id);
  if (ids.length !== new Set(ids).size) {
    console.error('Error: Duplicate IDs found in products');
    return false;
  }
  console.log('Product data validated successfully!');
  return true;
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartBadge() {
  const cartBadge = document.querySelector('#cartBtn span');
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartBadge.textContent = totalItems;
}

function updateCartDisplay() {
  const cartItemsElement = document.getElementById('cartItems');
  const cartSubtotalElement = document.getElementById('cartSubtotal');
  const cartTotalElement = document.getElementById('cartTotal');

  if (cart.length === 0) {
    cartItemsElement.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-8">Your cart is empty</p>';
    cartSubtotalElement.textContent = '$0.00';
    cartTotalElement.textContent = '$0.00';
  } else {
    cartItemsElement.innerHTML = cart.map((item, index) => `
      <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <img src="${item['Image URL']}" alt="${item.Name}" class="w-12 h-12 object-cover rounded-md" onerror="this.src='https://placehold.co/48x48/CCCCCC/333333?text=No+Image'">
          <div>
            <p class="text-gray-800 dark:text-white font-medium">${item.Name}</p>
            <p class="text-gray-500 dark:text-gray-400 text-sm">$${parseFloat(item.Price).toFixed(2)}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button class="decrease-qty-btn text-gray-500 hover:text-gray-700" data-index="${index}">-</button>
          <span class="text-gray-800 dark:text-white">${item.quantity}</span>
          <button class="increase-qty-btn text-gray-500 hover:text-gray-700" data-index="${index}">+</button>
          <button class="remove-item-btn text-red-500 hover:text-red-700" data-index="${index}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `).join('');

    const subtotal = cart.reduce((sum, item) => sum + item.quantity * parseFloat(item.Price), 0);
    cartSubtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    cartTotalElement.textContent = `$${subtotal.toFixed(2)}`;
  }
  updateCartBadge();
}

function addToCart(id) {
  const product = products.find(item => item.Id == id);
  if (!product) {
    showNotification('Error', `Product with ID ${id} not found`);
    return;
  }

  const cartItem = cart.find(item => item.Id == id);
  if (cartItem) {
    cartItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  updateCartDisplay();
  showNotification('Success', `${product.Name} added to cart`);
}

function handleQuantityChange(index, change) {
  if (change === 'increase') {
    cart[index].quantity += 1;
  } else if (change === 'decrease') {
    if (cart[index].quantity > 1) {
      cart[index].quantity -= 1;
    } else {
      cart.splice(index, 1);
    }
  }
  saveCart();
  updateCartDisplay();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartDisplay();
}

function checkoutCart() {
  if (cart.length === 0) {
    showNotification('Error', 'Your cart is empty');
    return;
  }

  showConfirmBox('Are you sure you want to checkout?', () => {
    cart = [];
    saveCart();
    updateCartDisplay();
    closeCartModal();
    showNotification('Success', 'Checkout completed successfully');
  });
}

function printCart() {
  if (cart.length === 0) {
    showNotification('Error', 'Your cart is empty');
    return;
  }

  const printWindow = window.open('', '_blank');

  const cartItemsHtml = cart.map(item => {
    const price = parseFloat(item.Price);
    const total = item.quantity * price;

    return `
      <tr>
        <td>${item.Name}</td>
        <td>${item.quantity}</td>
        <td>$${price.toFixed(2)}</td>
        <td>$${total.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * parseFloat(item.Price), 0);

  printWindow.document.write(`
    <html>
      <head>
        <title>Cart Receipt - Café Code</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 100px 40px 40px;
            background-color: #f9f9f9;
          }
          h1 {
            text-align: center;
            margin-bottom: 40px;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.05);
          }
          th, td {
            border: 1px solid #ccc;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          tfoot td {
            font-weight: bold;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <h1>Café Code Receipt</h1>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${cartItemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align:right;">Subtotal:</td>
              <td>$${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3" style="text-align:right;">Total:</td>
              <td>$${subtotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <div class="footer">Thank you for your purchase at Café Code!</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function checkoutNow() {
  if (cart.length === 0) {
    showNotification('Error', 'Your cart is empty');
    return;
  }

  showConfirmBox('Proceed with immediate checkout?', () => {
    cart = [];
    saveCart();
    updateCartDisplay();
    closeCartModal();
    showNotification('Success', 'Immediate checkout completed. Redirecting to payment...');
  });
}

function renderProducts(productList) {
  const productListElement = document.getElementById('brand-list');
  productListElement.innerHTML = '';
  if (productList.length === 0) {
    productListElement.innerHTML = '<p class="text-center text-gray-600 col-span-4">No products found. Add a product to get started.</p>';
    return;
  }
  productList.forEach(item => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 flex flex-col gap-4 border border-gray-100 hover:border-gray-200';
    card.innerHTML = `
      <div class="relative w-full h-56 rounded-lg overflow-hidden">
        <img src="${item['Image URL']}" alt="${item.Name}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://placehold.co/240x192/CCCCCC/333333?text=No+Image'">
      </div>
      <div class="flex flex-col flex-grow">
        <h3 class="text-xl font-bold text-gray-900 truncate">${item.Name}</h3>
        <div class="mt-2 space-y-1">
          <p class="text-sm text-gray-500"><span class="font-semibold text-gray-700">Sizes:</span> ${item.Sizes || 'N/A'}</p>
          <p class="text-sm text-gray-500"><span class="font-semibold text-gray-700">Price:</span> $${(parseFloat(item.Price) || 0).toFixed(2)}</p>
        </div>
      </div>
      <div class="flex justify-around mt-auto">
        <button class="edit-btn flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800 transition-colors duration-200" data-id="${item.Id}" aria-label="Edit product">
          <i class="fa-solid fa-edit text-base"></i>
        </button>
        <button class="view-btn flex items-center gap-1 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 hover:text-yellow-800 transition-colors duration-200" data-id="${item.Id}" aria-label="View product">
          <i class="fa-solid fa-eye text-base"></i>
        </button>
        <button class="add-to-cart-btn flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 hover:text-green-800 transition-colors duration-200" data-id="${item.Id}" aria-label="Add to cart">
          <i class="fas fa-shopping-cart text-base"></i>
        </button>
        <button class="delete-btn flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 hover:text-red-800 transition-colors duration-200" data-id="${item.Id}" aria-label="Delete product">
          <i class="fa-solid fa-trash-alt text-base"></i>
        </button>
      </div>
    `;
    productListElement.appendChild(card);
  });

  productListElement.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-btn');
    const viewBtn = e.target.closest('.view-btn');
    const deleteBtn = e.target.closest('.delete-btn');
    const addToCartBtn = e.target.closest('.add-to-cart-btn');

    if (editBtn) {
      const id = editBtn.dataset.id;
      console.log(`Edit button clicked for product ID: ${id}`);
      editProduct(id);
    } else if (viewBtn) {
      const id = viewBtn.dataset.id;
      console.log(`View button clicked for product ID: ${id}`);
      viewProduct(id);
    } else if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      console.log(`Delete button clicked for product ID: ${id}`);
      deleteProduct(id);
    } else if (addToCartBtn) {
      const id = addToCartBtn.dataset.id;
      console.log(`Add to cart button clicked for product ID: ${id}`);
      addToCart(id);
    }
  });

  document.getElementById('cartItems').addEventListener('click', (e) => {
    const increaseBtn = e.target.closest('.increase-qty-btn');
    const decreaseBtn = e.target.closest('.decrease-qty-btn');
    const removeBtn = e.target.closest('.remove-item-btn');

    if (increaseBtn) {
      const index = increaseBtn.dataset.index;
      handleQuantityChange(index, 'increase');
    } else if (decreaseBtn) {
      const index = decreaseBtn.dataset.index;
      handleQuantityChange(index, 'decrease');
    } else if (removeBtn) {
      const index = removeBtn.dataset.index;
      removeFromCart(index);
    }
  });
}

function viewProduct(id) {
  console.log(`Viewing product with ID: ${id}`);
  const product = products.find(item => item.Id == id);
  if (product) {
    const modal = document.getElementById('view-product-modal');
    const image = document.getElementById('view-product-image');
    const name = document.getElementById('view-product-name');
    const idElement = document.getElementById('view-product-id');
    const category = document.getElementById('view-product-category');
    const sizes = document.getElementById('view-product-sizes');
    const price = document.getElementById('view-product-price');
    const brand = document.getElementById('view-product-brand');
    const description = document.getElementById('view-product-description');

    image.src = product['Image URL'] || 'https://placehold.co/240x192/CCCCCC/333333?text=No+Image';
    image.alt = product.Name || 'Product Image';
    name.textContent = product.Name || 'N/A';
    idElement.textContent = product.Id || 'N/A';
    category.textContent = product.Category || 'N/A';
    sizes.textContent = product.Sizes || 'N/A';
    price.textContent = `$${(parseFloat(product.Price) || 0).toFixed(2)}`;
    brand.textContent = product.Brand || 'N/A';
    description.textContent = product.Description || 'N/A';

    modal.classList.remove('hidden');
  } else {
    console.error(`Product with ID ${id} not found`);
    showNotification('Error', `Product with ID ${id} not found`);
  }
}

function closeViewProductModal() {
  const modal = document.getElementById('view-product-modal');
  modal.classList.add('hidden');
}

function filterProducts(searchTerm) {
  const filtered = products.filter(item =>
    item.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.Description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.Id.toString().includes(searchTerm) ||
    (item.Category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.Brand || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  renderProducts(filtered);
}

function fetchProducts(category = 'espresso', retryCount = 2) {
  const apiUrl = CATEGORY_APIS[category];
  console.log('Fetching products from:', `${apiUrl}?action=read&dataType=products`);
  toggleLoading(true);
  fetch(`${apiUrl}?action=read&dataType=products`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(result => {
      console.log('API response:', JSON.stringify(result, null, 2));
      toggleLoading(false);
      if (result.status === 'success') {
        products = result.data || [];
        if (validateProducts(products)) {
          renderProducts(products);
          document.getElementById('category-title').textContent = CATEGORY_NAMES[category];
          document.getElementById('category-select').value = category;
        } else {
          showError('Invalid product data format');
        }
      } else {
        console.error('Error fetching products:', result.message || result.data);
        if (retryCount > 0) {
          console.log(`Retrying... (${retryCount} attempts left)`);
          setTimeout(() => fetchProducts(category, retryCount - 1), 2000);
        } else {
          showError(result.message || result.data || 'Unknown error');
        }
      }
    })
    .catch(error => {
      console.error('Fetch error:', error.message);
      toggleLoading(false);
      if (retryCount > 0) {
        console.log(`Retrying... (${retryCount} attempts left)`);
        setTimeout(() => fetchProducts(category, retryCount - 1), 2000);
      } else {
        showError(error.message);
      }
    });
}

function openProductModal(product = null) {
  const modal = document.getElementById('brand-modal');
  const form = document.getElementById('brand-form');
  const title = document.getElementById('brand-modal-title');
  const idInput = document.getElementById('brand-id');
  const nameInput = document.getElementById('brand-name');
  const logoInput = document.getElementById('brand-logo');
  const descriptionInput = document.getElementById('brand-description');
  const categoryInput = document.getElementById('brand-category');
  const sizesInput = document.getElementById('brand-sizes');
  const priceInput = document.getElementById('brand-price');
  const brandInput = document.getElementById('brand-brand');

  console.log('Opening modal for:', product ? `Edit product ID ${product.Id}` : 'Add product');

  form.reset();
  idInput.value = '';
  title.textContent = product ? 'Edit Product' : 'Add Product';

  if (product) {
    idInput.value = product.Id;
    nameInput.value = product.Name || '';
    logoInput.value = product['Image URL'] || '';
    descriptionInput.value = product.Description || '';
    categoryInput.value = product.Category || '';
    sizesInput.value = product.Sizes || '';
    priceInput.value = parseFloat(product.Price) || '';
    brandInput.value = product.Brand || '';
  } else {
    const selectedCategory = document.getElementById('category-select').value;
    categoryInput.value = selectedCategory === 'espresso' ? 'Espresso-Based Drinks' :
                          selectedCategory === 'iced' ? 'Iced Coffee & Cold Brews' :
                          selectedCategory === 'non_coffee' ? 'Non-Coffee Drinks' :
                          'Pastries & Snacks';
  }

  modal.classList.remove('hidden');
}

function closeProductModal() {
  const modal = document.getElementById('brand-modal');
  modal.classList.add('hidden');
}

function handleProductSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('brand-id').value;
  const name = document.getElementById('brand-name').value.trim();
  const logo = document.getElementById('brand-logo').value.trim();
  const description = document.getElementById('brand-description').value.trim();
  const category = document.getElementById('brand-category').value.trim();
  const sizes = document.getElementById('brand-sizes').value.trim();
  const price = parseFloat(document.getElementById('brand-price').value);
  const brandName = document.getElementById('brand-brand').value.trim();
  const selectedCategory = document.getElementById('category-select').value;
  const apiUrl = CATEGORY_APIS[selectedCategory];

  console.log('Submitting product:', { id, name, category, sizes, price, description, brandName, logo });

  if (!name) {
    showNotification('Error', 'Name is required');
    return;
  }

  if (isNaN(price) || price < 0) {
    showNotification('Error', 'Please enter a valid price');
    return;
  }

  if (id && !Number.isInteger(parseInt(id))) {
    showNotification('Error', 'Invalid ID format');
    return;
  }

  const action = id ? 'edit' : 'insert';
  const productData = [
    id || '', // Id (empty for insert, handled by server)
    name,
    category || '',
    sizes || '',
    price || 0,
    description || '',
    brandName || '',
    logo || ''
  ];

  const payload = {
    action: action,
    dataType: 'products',
    values: productData
  };

  console.log('Sending payload to API:', JSON.stringify(payload, null, 2));

  toggleLoading(true);
  fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(result => {
      console.log('API response:', JSON.stringify(result, null, 2));
      toggleLoading(false);
      if (result.status === 'success') {
        closeProductModal();
        fetchProducts(selectedCategory);
        showNotification('Success', `Product ${action === 'insert' ? 'added' : 'updated'} successfully`);
      } else {
        const errorMsg = result.message || result.error || 'Unknown error';
        console.error('API error:', errorMsg);
        showNotification('Error', `Error saving product: ${errorMsg}`);
      }
    })
    .catch(error => {
      console.error('Fetch error:', error);
      toggleLoading(false);
      showNotification('Error', `Error saving product: ${error.message}`);
    });
}

function editProduct(id) {
  console.log(`Editing product with ID: ${id}`);
  const product = products.find(item => item.Id == id);
  if (product) {
    openProductModal(product);
  } else {
    console.error(`Product with ID ${id} not found`);
    showNotification('Error', `Product with ID ${id} not found`);
  }
}

function deleteProduct(id) {
  showConfirmBox('Are you sure you want to delete this product?', () => {
    const selectedCategory = document.getElementById('category-select').value;
    const apiUrl = CATEGORY_APIS[selectedCategory];

    const payload = {
      action: 'delete',
      dataType: 'products',
      id: id
    };

    console.log('Sending delete payload to API:', JSON.stringify(payload, null, 2));

    toggleLoading(true);
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(result => {
        console.log('API response:', JSON.stringify(result, null, 2));
        toggleLoading(false);
        if (result.status === 'success') {
          fetchProducts(selectedCategory);
          showNotification('Success', 'Product deleted successfully');
        } else {
          const errorMsg = result.message || result.error || 'Unknown error';
          console.error('API error:', errorMsg);
          showNotification('Error', `Error deleting product: ${errorMsg}`);
        }
      })
      .catch(error => {
        console.error('Fetch error:', error);
        toggleLoading(false);
        showNotification('Error', `Error deleting product: ${error.message}`);
      });
  });
}

function toggleSubmenu(element) {
  const submenu = element.nextElementSibling;
  if (submenu) {
    submenu.classList.toggle('hidden');
  }
}

function toggleDropdown() {
  const dropdown = document.getElementById('dropdown');
  dropdown.classList.toggle('hidden');
}

function handleLogout() {
  localStorage.removeItem('name');
  window.location.href = 'LoginPage.html';
}

function openCartModal() {
  const cartModal = document.getElementById('cartModal');
  cartModal.classList.remove('opacity-0', 'invisible');
  cartModal.querySelector('div').classList.remove('translate-x-full');
  updateCartDisplay();
}

function closeCartModal() {
  const cartModal = document.getElementById('cartModal');
  cartModal.classList.add('opacity-0', 'invisible');
  cartModal.querySelector('div').classList.add('translate-x-full');
}

document.addEventListener('DOMContentLoaded', () => {
  fetchProducts('espresso');
  updateCartDisplay();

  document.getElementById('category-select').addEventListener('change', (e) => {
    fetchProducts(e.target.value);
  });

  document.getElementById('add-brand-btn').addEventListener('click', () => openProductModal());

  document.getElementById('close-brand-modal').addEventListener('click', closeProductModal);
  document.getElementById('cancel-brand').addEventListener('click', closeProductModal);

  document.getElementById('brand-form').addEventListener('submit', handleProductSubmit);

  const searchInput = document.querySelector('input[placeholder="Search Products"]');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => filterProducts(e.target.value));
  }

  const closeViewModalBtn = document.getElementById('close-view-product-modal');
  if (closeViewModalBtn) {
    closeViewModalBtn.addEventListener('click', closeViewProductModal);
  }

  document.getElementById('cartBtn').addEventListener('click', openCartModal);
  document.getElementById('closeCartBtn').addEventListener('click', closeCartModal);
  document.getElementById('checkoutCartBtn').addEventListener('click', checkoutCart);
  document.getElementById('printCartBtn').addEventListener('click', printCart);
  document.getElementById('checkoutBtn').addEventListener('click', checkoutNow);
});