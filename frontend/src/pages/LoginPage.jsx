import { useState } from 'react';
import { apiRequest } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      login(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">Đăng nhập GSC</h1>
        {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <label className="mt-6 block text-sm font-medium text-slate-700">Tên người dùng hoặc email</label>
        <input
          value={form.identifier}
          onChange={(event) => setForm({ ...form, identifier: event.target.value })}
          className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          required
        />
        <label className="mt-4 block text-sm font-medium text-slate-700">Mật khẩu</label>
        <input
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          required
        />
        <button disabled={loading} className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-60">
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
}
