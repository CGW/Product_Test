const API_URL = import.meta.env.VITE_API_URL || '/api';

let authToken = null;
let tenantSlug = null;

export function setAuthToken(token) {
  authToken = token;
}

export function setTenantSlug(slug) {
  tenantSlug = slug;
}

export function getAuthToken() {
  return authToken;
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  if (tenantSlug) {
    headers['X-Tenant-Slug'] = tenantSlug;
  }

  const url = path.startsWith('http') ? path : `${API_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => {
    const headers = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    if (tenantSlug) headers['X-Tenant-Slug'] = tenantSlug;
    return fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    }).then(r => {
      if (!r.ok) throw new Error('Upload failed');
      return r.json();
    });
  },
};
