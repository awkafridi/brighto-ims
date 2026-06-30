// Central API client — swap VITE_API_URL in .env to point at your backend
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('ims_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('ims_token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Auth
  login: (username, password) => {
    const form = new URLSearchParams({ username, password });
    return fetch(`${BASE}/auth/login`, { method: 'POST', body: form })
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)));
  },
  me: () => request('/auth/me'),

  // Dashboard
  dashboardStats: (brandId) => request(`/dashboard/stats${brandId && brandId !== 'all' ? `?brand_id=${brandId}` : ''}`),
  monthlySales: (brandId) => request(`/dashboard/monthly-sales${brandId && brandId !== 'all' ? `?brand_id=${brandId}` : ''}`),

  // Brands
  brands: () => request('/inventory/categories').then(() => request('/auth/me').then(() =>
    [{ id: 'brand-brighto', name: 'Brighto', color: '#4f8ef7' }, { id: 'brand-hoshi', name: 'Hoshi', color: '#a78bfa' }]
  )),

  // Inventory
  products: (brandId, categoryId) => {
    const params = new URLSearchParams();
    if (brandId && brandId !== 'all') params.set('brand_id', brandId);
    if (categoryId) params.set('category_id', categoryId);
    return request(`/inventory/products?${params}`);
  },
  createProduct: (data) => request('/inventory/products', { method: 'POST', body: JSON.stringify(data) }),
  productBatches: (productId) => request(`/inventory/products/${productId}/batches`),
  addBatch: (data) => request('/inventory/batches', { method: 'POST', body: JSON.stringify(data) }),
  categories: () => request('/inventory/categories'),

  // Suppliers
  suppliers: () => request('/suppliers/'),
  createSupplier: (data) => request('/suppliers/', { method: 'POST', body: JSON.stringify(data) }),

  // Shopkeepers
  shopkeepers: (search) => request(`/shopkeepers/${search ? `?search=${search}` : ''}`),
  createShopkeeper: (data) => request('/shopkeepers/', { method: 'POST', body: JSON.stringify(data) }),
  shopkeeperLedger: (id) => request(`/shopkeepers/${id}/ledger`),
  recordPayment: (id, data) => request(`/shopkeepers/${id}/payment`, { method: 'POST', body: JSON.stringify(data) }),

  // Invoices
  invoices: (brandId, status) => {
    const params = new URLSearchParams();
    if (brandId && brandId !== 'all') params.set('brand_id', brandId);
    if (status) params.set('status', status);
    return request(`/invoices/?${params}`);
  },
  createInvoice: (data) => request('/invoices/', { method: 'POST', body: JSON.stringify(data) }),
  getInvoice: (id) => request(`/invoices/${id}`),

  // Expenses
  expenses: (brandId) => request(`/expenses/${brandId && brandId !== 'all' ? `?brand_id=${brandId}` : ''}`),
  createExpense: (data) => request('/expenses/', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
};
