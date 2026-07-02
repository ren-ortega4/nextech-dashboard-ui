import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8080' : '');

// ── Instancia axios con JWT automático ─────────────────────────────
const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('nit_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const url = err.config?.url ?? '';
      const isAuthEndpoint = url.includes('/auth/');
      if (!isAuthEndpoint) {
        localStorage.removeItem('nit_token');
        localStorage.removeItem('nit_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ────────────────────────────────────────────────────────────
export const login         = (data) => api.post('/api/v1/auth/login',    data).then(r => r.data);
export const register      = (data) => api.post('/api/v1/auth/register', data).then(r => r.data);
export const forgotPassword = (email) => api.post('/api/v1/auth/forgot-password', { email }).then(r => r.data);
export const resetPassword  = (token, password) => api.post('/api/v1/auth/reset-password', { token, password }).then(r => r.data);

// ── Facturas ────────────────────────────────────────────────────────
export const fetchStats    = (source) => api.get('/api/v1/facturas/stats', { params: source ? { source } : {} }).then(r => r.data);

export const fetchInvoices = (params) =>
  api.get('/api/v1/facturas', { params }).then(r => r.data);

export const fetchInvoicesBySource = (source, params) =>
  api.get('/api/v1/facturas', { params: { ...params, source } }).then(r => r.data);

export const fetchInvoice  = (id)   => api.get(`/api/v1/facturas/${id}`).then(r => r.data);

export const updateInvoice = (id, body) =>
  api.patch(`/api/v1/facturas/${id}`, body).then(r => r.data);

export const bulkUpdate    = (ids, nitStatus) =>
  api.patch('/api/v1/facturas/bulk', { ids, nitStatus }).then(r => r.data);

// ── Retiro (archivos) ───────────────────────────────────────────────
export const uploadRetiro  = (id, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post(`/api/v1/facturas/${id}/retiro`, fd).then(r => r.data);
};

export const deleteRetiro  = (id, fileId) =>
  api.delete(`/api/v1/facturas/${id}/retiro/${fileId}`).then(r => r.data);
