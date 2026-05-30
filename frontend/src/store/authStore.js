import { create } from 'zustand';

// Dùng sessionStorage (theo từng tab) thay vì localStorage:
//  - Đóng tab/trình duyệt -> phiên bị xóa -> tự đăng xuất (3.1)
//  - Mở tab mới -> không thừa hưởng phiên của tab khác -> hiện màn đăng nhập (3.2)
const storedUser = sessionStorage.getItem('gsc_user');

export const useAuthStore = create((set) => ({
  token: sessionStorage.getItem('gsc_token'),
  user: storedUser ? JSON.parse(storedUser) : null,
  login: ({ token, user }) => {
    sessionStorage.setItem('gsc_token', token);
    sessionStorage.setItem('gsc_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    sessionStorage.removeItem('gsc_token');
    sessionStorage.removeItem('gsc_user');
    set({ token: null, user: null });
  }
}));
