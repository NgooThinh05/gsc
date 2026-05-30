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

// Gom các trường hồ sơ theo vai trò để gửi lên backend
function buildProfile(form) {
  if (form.VaiTro === 'NhanVienHopDong') {
    return { ChucVu: form.ChucVu, ChungChi: form.ChungChi, HanMucDuyet: form.HanMucDuyet || null };
  }
  if (form.VaiTro === 'NhanVienMuaSamCoQuan') {
    return { MaCoQuan: form.MaCoQuan, BoPhanCongTac: form.BoPhanCongTac };
  }
  if (form.VaiTro === 'NhanVienThanhToan') {
    return { MaSoKeToan: form.MaSoKeToan, HanMucChiTra: form.HanMucChiTra || null };
  }
  if (form.VaiTro === 'NhanVienKho') {
    return { KhuVucQuanLy: form.KhuVucQuanLy, CaLam: form.CaLam };
  }
  return {};
}

// Tạo form phẳng từ một user (để sửa)
function extractFormFromUser(user) {
  return {
    TenNguoiDung: user.TenNguoiDung || '',
    Email: user.Email || '',
    SDT: user.SDT || '',
    MatKhau: '',
    VaiTro: user.VaiTro,
    TrangThai: user.TrangThai,
    ChucVu: user.nhanVienHopDong?.ChucVu || '',
    ChungChi: user.nhanVienHopDong?.ChungChi || '',
    HanMucDuyet: user.nhanVienHopDong?.HanMucDuyet || '',
    MaCoQuan: user.nhanVienMuaSamCoQuan?.MaCoQuan || '',
    BoPhanCongTac: user.nhanVienMuaSamCoQuan?.BoPhanCongTac || '',
    MaSoKeToan: user.nhanVienThanhToan?.MaSoKeToan || '',
    HanMucChiTra: user.nhanVienThanhToan?.HanMucChiTra || '',
    KhuVucQuanLy: user.nhanVienKho?.KhuVucQuanLy || '',
    CaLam: user.nhanVienKho?.CaLam || ''
  };
}

function getProfileSummary(user) {
  if (user.nhanVienHopDong) return `Chức vụ: ${user.nhanVienHopDong.ChucVu}`;
  if (user.nhanVienMuaSamCoQuan) return `Cơ quan: ${user.nhanVienMuaSamCoQuan.coQuan?.Ten || user.nhanVienMuaSamCoQuan.MaCoQuan}`;
  if (user.nhanVienThanhToan) return `Mã kế toán: ${user.nhanVienThanhToan.MaSoKeToan}`;
  if (user.nhanVienKho) return `Kho: ${user.nhanVienKho.KhuVucQuanLy}`;
  return '-';
}

// Các trường hồ sơ phụ thuộc vai trò, dùng chung cho form tạo & sửa
function RoleProfileFields({ form, onChange, agencies }) {
  if (form.VaiTro === 'NhanVienHopDong') {
    return (
      <>
        <input className="rounded-lg border px-4 py-3" placeholder="Chức vụ" value={form.ChucVu} onChange={(e) => onChange('ChucVu', e.target.value)} />
        <input className="rounded-lg border px-4 py-3" placeholder="Chứng chỉ" value={form.ChungChi} onChange={(e) => onChange('ChungChi', e.target.value)} />
        <input className="rounded-lg border px-4 py-3" placeholder="Hạn mức duyệt" type="number" value={form.HanMucDuyet} onChange={(e) => onChange('HanMucDuyet', e.target.value)} />
      </>
    );
  }
  if (form.VaiTro === 'NhanVienMuaSamCoQuan') {
    return (
      <>
        <select className="rounded-lg border px-4 py-3" value={form.MaCoQuan} onChange={(e) => onChange('MaCoQuan', e.target.value)} required>
          <option value="">Chọn cơ quan</option>
          {agencies.map((agency) => <option key={agency.MaCoQuan} value={agency.MaCoQuan}>{agency.Ten}</option>)}
        </select>
        <input className="rounded-lg border px-4 py-3 md:col-span-2" placeholder="Bộ phận công tác" value={form.BoPhanCongTac} onChange={(e) => onChange('BoPhanCongTac', e.target.value)} />
      </>
    );
  }
  if (form.VaiTro === 'NhanVienThanhToan') {
    return (
      <>
        <input className="rounded-lg border px-4 py-3" placeholder="Mã số kế toán" value={form.MaSoKeToan} onChange={(e) => onChange('MaSoKeToan', e.target.value)} />
        <input className="rounded-lg border px-4 py-3" placeholder="Hạn mức chi trả" type="number" value={form.HanMucChiTra} onChange={(e) => onChange('HanMucChiTra', e.target.value)} />
      </>
    );
  }
  if (form.VaiTro === 'NhanVienKho') {
    return (
      <>
        <input className="rounded-lg border px-4 py-3" placeholder="Khu vực quản lý" value={form.KhuVucQuanLy} onChange={(e) => onChange('KhuVucQuanLy', e.target.value)} />
        <input className="rounded-lg border px-4 py-3" placeholder="Ca làm" value={form.CaLam} onChange={(e) => onChange('CaLam', e.target.value)} />
      </>
    );
  }
  return null;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [agencyForm, setAgencyForm] = useState({ Ten: '', DiaChi: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [agencyLoading, setAgencyLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [editLoading, setEditLoading] = useState(false);

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

  // 7.5 - Tra cứu người dùng theo tên / email / SĐT / vai trò
  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((user) =>
      [user.TenNguoiDung, user.Email, user.SDT, user.VaiTro]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [users, search]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEditField(field, value) {
    setEditForm((current) => ({ ...current, [field]: value }));
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
          profile: buildProfile(form)
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

  function openEdit(user) {
    setEditUser(user);
    setEditForm(extractFormFromUser(user));
    setMessage('');
  }

  // 7.3 sửa thông tin + 7.4 cập nhật vai trò
  async function handleEditSubmit(event) {
    event.preventDefault();
    setEditLoading(true);
    setMessage('');

    try {
      const payload = {
        TenNguoiDung: editForm.TenNguoiDung,
        Email: editForm.Email,
        SDT: editForm.SDT,
        VaiTro: editForm.VaiTro,
        TrangThai: editForm.TrangThai,
        profile: buildProfile(editForm)
      };
      if (editForm.MatKhau) payload.MatKhau = editForm.MatKhau;

      await apiRequest(`/users/${editUser.MaTaiKhoan}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      setEditUser(null);
      await loadData();
      setMessage('Cập nhật tài khoản thành công');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setEditLoading(false);
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

          <RoleProfileFields form={form} onChange={updateField} agencies={agencies} />

          <button disabled={loading} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60 md:col-span-3">
            {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </form>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">Danh sách người dùng trong database</h3>
          <input
            className="w-72 rounded-lg border border-slate-300 px-4 py-2 text-sm"
            placeholder="Tra cứu theo tên, email, SĐT, vai trò..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
              {filteredUsers.map((user) => (
                <tr key={user.MaTaiKhoan} className="border-t">
                  <td className="p-3">#{user.MaTaiKhoan}</td>
                  <td className="p-3 font-medium">{user.TenNguoiDung}</td>
                  <td className="p-3">{user.Email}</td>
                  <td className="p-3">{user.SDT || '-'}</td>
                  <td className="p-3">{user.VaiTro}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.TrangThai === 'HoatDong' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {user.TrangThai}
                    </span>
                  </td>
                  <td className="p-3">{getProfileSummary(user)}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user)}
                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-500" colSpan="8">Không có người dùng phù hợp</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleEditSubmit} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Sửa tài khoản #{editUser.MaTaiKhoan}</h3>
                <p className="mt-1 text-sm text-slate-500">Cập nhật thông tin, vai trò và trạng thái. Để trống mật khẩu nếu không đổi.</p>
              </div>
              <button type="button" onClick={() => setEditUser(null)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">Đóng</button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <input className="rounded-lg border px-4 py-3" placeholder="Tên người dùng" value={editForm.TenNguoiDung} onChange={(e) => updateEditField('TenNguoiDung', e.target.value)} required />
              <input className="rounded-lg border px-4 py-3" placeholder="Email" type="email" value={editForm.Email} onChange={(e) => updateEditField('Email', e.target.value)} required />
              <input className="rounded-lg border px-4 py-3" placeholder="Số điện thoại" value={editForm.SDT} onChange={(e) => updateEditField('SDT', e.target.value)} />
              <input className="rounded-lg border px-4 py-3" placeholder="Mật khẩu mới (tùy chọn)" value={editForm.MatKhau} onChange={(e) => updateEditField('MatKhau', e.target.value)} />
              <select className="rounded-lg border px-4 py-3" value={editForm.VaiTro} onChange={(e) => updateEditField('VaiTro', e.target.value)}>
                {roles.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              <select className="rounded-lg border px-4 py-3" value={editForm.TrangThai} onChange={(e) => updateEditField('TrangThai', e.target.value)}>
                <option value="HoatDong">Hoạt động</option>
                <option value="Khoa">Khóa</option>
              </select>

              <RoleProfileFields form={editForm} onChange={updateEditField} agencies={agencies} />
            </div>

            {editForm.VaiTro !== editUser.VaiTro && (
              <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                Đổi vai trò từ <b>{editUser.VaiTro}</b> sang <b>{editForm.VaiTro}</b>: hồ sơ vai trò cũ sẽ được thay bằng hồ sơ vai trò mới.
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditUser(null)} className="rounded-lg bg-slate-100 px-5 py-3 font-semibold text-slate-700">Hủy</button>
              <button disabled={editLoading} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60">
                {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
