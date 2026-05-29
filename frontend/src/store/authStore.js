import { create } from 'zustand';

const storedUser = localStorage.getItem('gsc_user');

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('gsc_token'),
  user: storedUser ? JSON.parse(storedUser) : null,
  login: ({ token, user }) => {
    localStorage.setItem('gsc_token', token);
    localStorage.setItem('gsc_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('gsc_token');
    localStorage.removeItem('gsc_user');
    set({ token: null, user: null });
  }
}));
