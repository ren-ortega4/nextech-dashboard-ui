import { create } from 'zustand';

// ── Auth store ──────────────────────────────────────────────────────
export const useAuth = create((set) => ({
  token: localStorage.getItem('nit_token') ?? null,
  user:  JSON.parse(localStorage.getItem('nit_user') ?? 'null'),

  setSession: (token, user) => {
    localStorage.setItem('nit_token', token);
    localStorage.setItem('nit_user', JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('nit_token');
    localStorage.removeItem('nit_user');
    set({ token: null, user: null });
  },
}));

// ── Selección de facturas (bulk actions) ────────────────────────────
export const useSelection = create((set, get) => ({
  selectedIds: new Set(),

  toggle: (id) => {
    const s = new Set(get().selectedIds);
    s.has(id) ? s.delete(id) : s.add(id);
    set({ selectedIds: s });
  },

  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
  clear:     ()    => set({ selectedIds: new Set() }),
}));

// ── Toast notifications ─────────────────────────────────────────────
export const useToast = create((set) => ({
  toast: null,

  show: (message, type = 'success') => {
    set({ toast: { message, type, id: Date.now() } });
    setTimeout(() => set({ toast: null }), 3500);
  },

  hide: () => set({ toast: null }),
}));
