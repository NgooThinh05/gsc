import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';

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

  useEffect(() => {
    apiRequest('/auth/me').then(setMe).catch((error) => setMessage(error.message));
  }, []);

  const agency = me?.taiKhoanCoQuan?.coQuan;

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Thông tin tài khoản</h3>
        <p className="mt-1 text-sm text-slate-500">Thông tin tài khoản đang đăng nhập.{agency ? ' Tài khoản nhân viên cơ quan gắn với đúng một cơ quan chính phủ.' : ''}</p>
        {message && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</div>}

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
    </div>
  );
}
