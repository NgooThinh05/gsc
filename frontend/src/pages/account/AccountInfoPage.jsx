import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import { getTheme, setTheme } from '../../lib/theme';
import Alert from '../../components/ui/Alert';

function Field({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value || '-'}</p>
    </div>
  );
}

export default function AccountInfoPage() {
  const [me, setMe] = useState(null);
  const [message, setMessage] = useState('');

  const [theme, setThemeState] = useState(getTheme());

  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    apiRequest('/auth/me').then(setMe).catch((error) => setMessage(error.message));
  }, []);

  const agency = me?.taiKhoanCoQuan?.coQuan;

  function chooseTheme(next) {
    setTheme(next);
    setThemeState(next);
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    setPwMessage('');
    setPwError('');

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Mật khẩu mới và xác nhận không khớp');
      return;
    }

    setPwLoading(true);
    try {
      const result = await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword })
      });
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setPwMessage(result.message || 'Đổi mật khẩu thành công');
    } catch (error) {
      setPwError(error.message);
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Thông tin tài khoản</h3>
        <p className="mt-1 text-sm text-slate-500">Thông tin tài khoản đang đăng nhập.{agency ? ' Tài khoản nhân viên cơ quan gắn với đúng một cơ quan chính phủ.' : ''}</p>
        {message && <Alert variant="error" className="mt-4">{message}</Alert>}

        {me && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Mã tài khoản" value={`#${me.MaTaiKhoan}`} />
            <Field label="Tên người dùng" value={me.TenNguoiDung} />
            <Field label="Vai trò" value={me.VaiTro} />
            <Field label="Email" value={me.Email} />
            <Field label="Số điện thoại" value={me.SDT} />
            <Field label="Trạng thái" value={me.TrangThai === 'HoatDong' ? 'Hoạt động' : 'Khóa'} />
          </div>
        )}
      </section>

      {agency && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Cơ quan chủ quản</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Mã cơ quan" value={`#${agency.MaCoQuan}`} />
            <Field label="Tên cơ quan" value={agency.Ten} />
            <Field label="Địa chỉ" value={agency.DiaChi} />
          </div>
        </section>
      )}

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Giao diện</h3>
        <p className="mt-1 text-sm text-slate-500">Chọn chế độ hiển thị sáng hoặc tối (áp dụng cho toàn bộ giao diện).</p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => chooseTheme('light')}
            className={`rounded-lg px-5 py-3 text-sm font-semibold transition ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            ☀️ Sáng
          </button>
          <button
            type="button"
            onClick={() => chooseTheme('dark')}
            className={`rounded-lg px-5 py-3 text-sm font-semibold transition ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            🌙 Tối
          </button>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Đổi mật khẩu</h3>
        <p className="mt-1 text-sm text-slate-500">Nhập mật khẩu cũ và mật khẩu mới (tối thiểu 6 ký tự).</p>
        {pwMessage && <Alert variant="success" className="mt-4">{pwMessage}</Alert>}
        {pwError && <Alert variant="error" className="mt-4">{pwError}</Alert>}
        <form onSubmit={handleChangePassword} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <input
            type="password"
            className="rounded-lg border border-slate-300 px-4 py-3"
            placeholder="Mật khẩu cũ"
            value={pwForm.oldPassword}
            onChange={(e) => setPwForm((c) => ({ ...c, oldPassword: e.target.value }))}
            required
          />
          <input
            type="password"
            className="rounded-lg border border-slate-300 px-4 py-3"
            placeholder="Mật khẩu mới"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((c) => ({ ...c, newPassword: e.target.value }))}
            required
          />
          <input
            type="password"
            className="rounded-lg border border-slate-300 px-4 py-3"
            placeholder="Xác nhận mật khẩu mới"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm((c) => ({ ...c, confirmPassword: e.target.value }))}
            required
          />
          <button disabled={pwLoading} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60 md:col-span-3">
            {pwLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </section>
    </div>
  );
}
