import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../api/client';

const roles = ['Admin', 'QuanLy', 'NhanVienHopDong', 'NhanVienMuaSamCoQuan', 'NhanVienThanhToan', 'NhanVienKho'];

const initialForm = {
  TenNguoiDung: '',
  Email: '',
  SDT: '',
  MatKhau: '123456',
  VaiTro: 'NhanVienMuaSamCoQuan',
  TrangThai: 'HoatDong',
  ChucVu: '',
  ChungChi: '',
  HanMucDuyet: '',
  MaCoQuan: '',
  BoPhanCongTac: '',
  MaSoKeToan: '',
  HanMucChiTra: '',
  KhuVucQuanLy: '',
  CaLam: ''
};

function getProfileSummary(user) {
  if (user.nhanVienHopDong) return `Chức vụ: ${user.nhanVienHopDong.ChucVu}`;
  if (user.nhanVienMuaSamCoQuan) return `Cơ quan: ${user.nhanVienMuaSamCoQuan.coQuan?.Ten || user.nhanVienMuaSamCoQuan.MaCoQuan}`;
  if (user.nhanVienThanhToan) return `Mã kế toán: ${user.nhanVienThanhToan.MaSoKeToan}`;
  if (user.nhanVienKho) return `Kho: ${user.nhanVienKho.KhuVucQuanLy}`;
  return '-';
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [agencyForm, setAgencyForm] = useState({ Ten: '', DiaChi: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [agencyLoading, setAgencyLoading] = useState(false);

  const profile = useMemo(() => {
    if (form.VaiTro === 'NhanVienHopDong') {
      return {
        ChucVu: form.ChucVu,
        ChungChi: form.ChungChi,
        HanMucDuyet: form.HanMucDuyet || null
      };
    }

    if (form.VaiTro === 'NhanVienMuaSamCoQuan') {
      return {
        MaCoQuan: form.MaCoQuan,
        BoPhanCongTac: form.BoPhanCongTac
      };
    }

    if (form.VaiTro === 'NhanVienThanhToan') {
      return {
        MaSoKeToan: form.MaSoKeToan,
        HanMucChiTra: form.HanMucChiTra || null
      };
    }

    if (form.VaiTro === 'NhanVienKho') {
      return {
        KhuVucQuanLy: form.KhuVucQuanLy,
        CaLam: form.CaLam
      };
    }

    return {};
  }, [form]);

  async function loadData() {
    const [userList, agencyList] = await Promise.all([
      apiRequest('/users'),
      apiRequest('/users/government-agencies')
    ]);
    setUsers(userList);
    setAgencies(agencyList);
  }

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message));
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          TenNguoiDung: form.TenNguoiDung,
          Email: form.Email,
          SDT: form.SDT,
          MatKhau: form.MatKhau,
          VaiTro: form.VaiTro,
          TrangThai: form.TrangThai,
          profile
        })
      });
      setForm(initialForm);
      await loadData();
      setMessage('Tạo tài khoản thành công');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAgency(event) {
    event.preventDefault();
    setMessage('');
    setAgencyLoading(true);

    try {
      await apiRequest('/users/government-agencies', {
        method: 'POST',
        body: JSON.stringify(agencyForm)
      });
      setAgencyForm({ Ten: '', DiaChi: '' });
      await loadData();
      setMessage('Thêm cơ quan thành công');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAgencyLoading(false);
    }
  }

  async function handleDeleteUser(user) {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa tài khoản ${user.TenNguoiDung}?`);

    if (!confirmed) return;

    setMessage('');

    try {
      await apiRequest(`/users/${user.MaTaiKhoan}`, { method: 'DELETE' });
      await loadData();
      setMessage('Xóa tài khoản thành công');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Thêm cơ quan chính phủ</h3>
        {message && <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">{message}</div>}
        <form onSubmit={handleCreateAgency} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <input
            className="rounded-lg border px-4 py-3"
            placeholder="Tên cơ quan"
            value={agencyForm.Ten}
            onChange={(e) => setAgencyForm((current) => ({ ...current, Ten: e.target.value }))}
            required
          />
          <input
            className="rounded-lg border px-4 py-3"
            placeholder="Địa chỉ"
            value={agencyForm.DiaChi}
            onChange={(e) => setAgencyForm((current) => ({ ...current, DiaChi: e.target.value }))}
            required
          />
          <button disabled={agencyLoading} className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-60">
            {agencyLoading ? 'Đang thêm...' : 'Thêm cơ quan'}
          </button>
        </form>
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Mã cơ quan</th>
                <th className="p-3">Tên cơ quan</th>
                <th className="p-3">Địa chỉ</th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((agency) => (
                <tr key={agency.MaCoQuan} className="border-t">
                  <td className="p-3">#{agency.MaCoQuan}</td>
                  <td className="p-3 font-medium">{agency.Ten}</td>
                  <td className="p-3">{agency.DiaChi}</td>
                </tr>
              ))}
              {agencies.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-500" colSpan="3">Chưa có cơ quan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Tạo tài khoản người dùng</h3>
        {message && <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">{message}</div>}
        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <input className="rounded-lg border px-4 py-3" placeholder="Tên người dùng" value={form.TenNguoiDung} onChange={(e) => updateField('TenNguoiDung', e.target.value)} required />
          <input className="rounded-lg border px-4 py-3" placeholder="Email" type="email" value={form.Email} onChange={(e) => updateField('Email', e.target.value)} required />
          <input className="rounded-lg border px-4 py-3" placeholder="Số điện thoại" value={form.SDT} onChange={(e) => updateField('SDT', e.target.value)} />
          <input className="rounded-lg border px-4 py-3" placeholder="Mật khẩu" value={form.MatKhau} onChange={(e) => updateField('MatKhau', e.target.value)} required />
          <select className="rounded-lg border px-4 py-3" value={form.VaiTro} onChange={(e) => updateField('VaiTro', e.target.value)}>
            {roles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <select className="rounded-lg border px-4 py-3" value={form.TrangThai} onChange={(e) => updateField('TrangThai', e.target.value)}>
            <option value="HoatDong">Hoạt động</option>
            <option value="Khoa">Khóa</option>
          </select>

          {form.VaiTro === 'NhanVienHopDong' && (
            <>
              <input className="rounded-lg border px-4 py-3" placeholder="Chức vụ" value={form.ChucVu} onChange={(e) => updateField('ChucVu', e.target.value)} />
              <input className="rounded-lg border px-4 py-3" placeholder="Chứng chỉ" value={form.ChungChi} onChange={(e) => updateField('ChungChi', e.target.value)} />
              <input className="rounded-lg border px-4 py-3" placeholder="Hạn mức duyệt" type="number" value={form.HanMucDuyet} onChange={(e) => updateField('HanMucDuyet', e.target.value)} />
            </>
          )}

          {form.VaiTro === 'NhanVienMuaSamCoQuan' && (
            <>
              <select className="rounded-lg border px-4 py-3" value={form.MaCoQuan} onChange={(e) => updateField('MaCoQuan', e.target.value)} required>
                <option value="">Chọn cơ quan</option>
                {agencies.map((agency) => <option key={agency.MaCoQuan} value={agency.MaCoQuan}>{agency.Ten}</option>)}
              </select>
              <input className="rounded-lg border px-4 py-3 md:col-span-2" placeholder="Bộ phận công tác" value={form.BoPhanCongTac} onChange={(e) => updateField('BoPhanCongTac', e.target.value)} />
            </>
          )}

          {form.VaiTro === 'NhanVienThanhToan' && (
            <>
              <input className="rounded-lg border px-4 py-3" placeholder="Mã số kế toán" value={form.MaSoKeToan} onChange={(e) => updateField('MaSoKeToan', e.target.value)} />
              <input className="rounded-lg border px-4 py-3" placeholder="Hạn mức chi trả" type="number" value={form.HanMucChiTra} onChange={(e) => updateField('HanMucChiTra', e.target.value)} />
            </>
          )}

          {form.VaiTro === 'NhanVienKho' && (
            <>
              <input className="rounded-lg border px-4 py-3" placeholder="Khu vực quản lý" value={form.KhuVucQuanLy} onChange={(e) => updateField('KhuVucQuanLy', e.target.value)} />
              <input className="rounded-lg border px-4 py-3" placeholder="Ca làm" value={form.CaLam} onChange={(e) => updateField('CaLam', e.target.value)} />
            </>
          )}

          <button disabled={loading} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60 md:col-span-3">
            {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </form>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Danh sách người dùng trong database</h3>
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Mã TK</th>
                <th className="p-3">Tên người dùng</th>
                <th className="p-3">Email</th>
                <th className="p-3">SĐT</th>
                <th className="p-3">Vai trò</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Thông tin phụ</th>
                <th className="p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.MaTaiKhoan} className="border-t">
                  <td className="p-3">#{user.MaTaiKhoan}</td>
                  <td className="p-3 font-medium">{user.TenNguoiDung}</td>
                  <td className="p-3">{user.Email}</td>
                  <td className="p-3">{user.SDT || '-'}</td>
                  <td className="p-3">{user.VaiTro}</td>
                  <td className="p-3">{user.TrangThai}</td>
                  <td className="p-3">{getProfileSummary(user)}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user)}
                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-500" colSpan="8">Chưa có người dùng</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
