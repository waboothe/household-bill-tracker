// Thin fetch wrapper around the FastAPI backend.
//
// Same-origin in production (nginx proxies /api/* to the API service).
// In dev, Vite's `server.proxy` (see vite.config.js) forwards /api/* to
// http://localhost:8000. Either way, the frontend just talks to "/api".
//
// Every helper returns the parsed JSON (or null for 204). On non-2xx we
// throw — callers decide how to surface errors.

const BASE = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`API ${options.method || 'GET'} ${path} failed: ${response.status} ${body}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  listBills: () => request('/bills'),
  createBill: (bill) => request('/bills', { method: 'POST', body: JSON.stringify(bill) }),
  updateBill: (id, patch) =>
    request(`/bills/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  deleteBill: (id) =>
    request(`/bills/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  setVariableAmount: (id, monthKey, value) =>
    request(
      `/bills/${encodeURIComponent(id)}/variable-amounts/${encodeURIComponent(monthKey)}`,
      { method: 'PUT', body: JSON.stringify({ value }) },
    ),
  togglePaid: (id, monthKey) =>
    request(
      `/bills/${encodeURIComponent(id)}/paid/${encodeURIComponent(monthKey)}`,
      { method: 'POST' },
    ),
  getSettings: () => request('/settings'),
  updateSettings: (settings) =>
    request('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
};
