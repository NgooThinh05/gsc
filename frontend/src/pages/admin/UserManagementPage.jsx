import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../api/client';
import Alert from '../../components/ui/Alert';

const ROLES = ['Admin', 'QuanLy', 'NhanVienHopDong', 'TaiKhoanCoQuan', 'NhanVienKho'];

const ROLE_LABEL = {
  Admin: 'Nhân viên IT',
  QuanLy: 'Quản lý',
  NhanVienHopDong: 'Nhân viên hợp đồng',
  TaiKhoanCoQuan: 'Tài khoản cơ quan',
  NhanVienKho: 'Nhân viên kho',
};

const ROLE_BADGE = {
  Admin: 'bg-violet-100 text-violet-700',
  QuanLy: 'bg-blue-100 text-blue-700',
  NhanVienHopDong: 'bg-sky-100 text-sky-700',
  TaiKhoanCoQuan: 'bg-amber-100 text-amber-700',
  NhanVienKho: 'bg-emerald-100 text-emerald-700',
};

const initialForm = {
  TenNguoiDung: '',
  Email: '',
  SDT: '',
  MatKhau: '123456',
  VaiTro: 'TaiKhoanCoQuan',
  TrangThai: 'HoatDong',
  MaCoQuan: '',
};

function buildProfile(form) {
  if (form.VaiTro === 'TaiKhoanCoQuan') return { MaCoQuan: form.MaCoQuan };
  return {};
}

function extractFormFromUser(user) {
  return {
    TenNguoiDung: user.TenNguoiDung || '',
    Email: user.Email || '',
    SDT: user.SDT || '',
    MatKhau: '',
    VaiTro: user.VaiTro,
    TrangThai: user.TrangThai,
    MaCoQuan: user.taiKhoanCoQuan?.MaCoQuan || '',
  };
}

function getProfileSummary(user) {
  if (user.taiKhoanCoQuan) return user.taiKhoanCoQuan.coQuan?.Ten || `Cơ quan #${user.taiKhoanCoQuan.MaCoQuan}`;
  if (user.nhanVienHopDong) return 'Nhân viên hợp đồng';
  if (user.quanLy) return 'Quản lý';
  if (user.nhanVienKho) return 'Nhân viên kho';
  return '-';
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function UserFormFields({ form, onChange, agencies, takenAgencies, currentMaCoQuan, isEdit }) {
  const availableAgencies = agencies.filter(
    (a) => !takenAgencies.has(a.MaCoQuan) || a.MaCoQuan === currentMaCoQuan
  );

  return (
    <>
      <Field label="Tên người dùng">
        <input
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nguyễn Văn A"
          value={form.TenNguoiDung}
          onChange={(e) => onChange('TenNguoiDung', e.target.value)}
          required
        />
      </Field>
      <Field label="Email">
        <input
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="email"
          placeholder="email@example.com"
          value={form.Email}
          onChange={(e) => onChange('Email', e.target.value)}
          required
        />
      </Field>
      <Field label="Số điện thoại">
        <input
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0912345678"
          value={form.SDT}
          onChange={(e) => onChange('SDT', e.target.value)}
        />
      </Field>
      <Field label={isEdit ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}>
        <input
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="password"
          placeholder={isEdit ? '••••••••' : 'Tối thiểu 6 ký tự'}
          value={form.MatKhau}
          onChange={(e) => onChange('MatKhau', e.target.value)}
          required={!isEdit}
          minLength={form.MatKhau ? 6 : undefined}
        />
      </Field>
      <Field label="Vai trò">
        <select
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.VaiTro}
          onChange={(e) => onChange('VaiTro', e.target.value)}
        >
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>)}
        </select>
      </Field>
      <Field label="Trạng thái">
        <select
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.TrangThai}
          onChange={(e) => onChange('TrangThai', e.target.value)}
        >
          <option value="HoatDong">Hoạt động</option>
          <option value="Khoa">Khóa</option>
        </select>
      </Field>
      {form.VaiTro === 'TaiKhoanCoQuan' && (
        <Field label={`Cơ quan (${availableAgencies.length} còn trống)`}>
          <select
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
            value={form.MaCoQuan}
            onChange={(e) => onChange('MaCoQuan', e.target.value)}
            required
          >
            <option value="">-- Chọn cơ quan --</option>
            {availableAgencies.map((a) => (
              <option key={a.MaCoQuan} value={a.MaCoQuan}>#{a.MaCoQuan} — {a.Ten}</option>
            ))}
          </select>
        </Field>
      )}
    </>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [alert, setAlert] = useState(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(initialForm);
  const [createLoading, setCreateLoading] = useState(false);
  const [createAlert, setCreateAlert] = useState(null);

  // Edit modal
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [editLoading, setEditLoading] = useState(false);
  const [editAlert, setEditAlert] = useState(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Agency panel
  const [agencyForm, setAgencyForm] = useState({ MaCoQuan: '', Ten: '', DiaChi: '' });
  const [agencyLoading, setAgencyLoading] = useState(false);

  async function loadData() {
    const [userList, agencyList] = await Promise.all([
      apiRequest('/users'),
      apiRequest('/users/government-agencies'),
    ]);
    setUsers(userList);
    setAgencies(agencyList);
  }

  useEffect(() => {
    loadData().catch((err) => setAlert({ msg: err.message, type: 'error' }));
  }, []);

  const filteredUsers = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return users.filter((u) => {
      if (filterRole && u.VaiTro !== filterRole) return false;
      if (filterStatus && u.TrangThai !== filterStatus) return false;
      if (kw && ![u.TenNguoiDung, u.Email, u.SDT].filter(Boolean).some((v) => String(v).toLowerCase().includes(kw))) return false;
      return true;
    });
  }, [users, search, filterRole, filterStatus]);

  const takenAgencies = useMemo(() => {
    const taken = new Set();
    for (const u of users) {
      if (u.taiKhoanCoQuan?.MaCoQuan) taken.add(u.taiKhoanCoQuan.MaCoQuan);
    }
    return taken;
  }, [users]);

  // ——— CREATE ———
  function openCreate() {
    setCreateForm(initialForm);
    setCreateAlert(null);
    setShowCreate(true);
  }

  function validateForm(form, isEdit) {
    if (!form.TenNguoiDung.trim()) return 'Vui lòng nhập tên người dùng';
    if (!form.Email.trim()) return 'Vui lòng nhập email';
    if (!isEdit && !form.MatKhau) return 'Vui lòng nhập mật khẩu';
    if (form.MatKhau && form.MatKhau.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
    if (form.VaiTro === 'TaiKhoanCoQuan' && !form.MaCoQuan) return 'Vui lòng chọn cơ quan';
    return null;
  }

  async function handleCreate(e) {
    e.preventDefault();
    const err = validateForm(createForm, false);
    if (err) { setCreateAlert({ msg: err, type: 'error' }); return; }

    setCreateAlert(null);
    setCreateLoading(true);
    try {
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          TenNguoiDung: createForm.TenNguoiDung,
          Email: createForm.Email,
          SDT: createForm.SDT,
          MatKhau: createForm.MatKhau,
          VaiTro: createForm.VaiTro,
          TrangThai: createForm.TrangThai,
          profile: buildProfile(createForm),
        }),
      });
      setShowCreate(false);
      await loadData();
      setAlert({ msg: `Đã tạo tài khoản cho "${createForm.TenNguoiDung}" thành công`, type: 'success' });
    } catch (error) {
      setCreateAlert({ msg: error.message, type: 'error' });
    } finally {
      setCreateLoading(false);
    }
  }

  // ——— EDIT ———
  function openEdit(user) {
    setEditUser(user);
    setEditForm(extractFormFromUser(user));
    setEditAlert(null);
  }

  async function handleEdit(e) {
    e.preventDefault();
    const err = validateForm(editForm, true);
    if (err) { setEditAlert({ msg: err, type: 'error' }); return; }

    setEditAlert(null);
    setEditLoading(true);
    try {
      const payload = {
        TenNguoiDung: editForm.TenNguoiDung,
        Email: editForm.Email,
        SDT: editForm.SDT,
        VaiTro: editForm.VaiTro,
        TrangThai: editForm.TrangThai,
        profile: buildProfile(editForm),
      };
      if (editForm.MatKhau) payload.MatKhau = editForm.MatKhau;

      await apiRequest(`/users/${editUser.MaTaiKhoan}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setEditUser(null);
      await loadData();
      setAlert({ msg: `Đã cập nhật tài khoản "${editForm.TenNguoiDung}" thành công`, type: 'success' });
    } catch (error) {
      setEditAlert({ msg: error.message, type: 'error' });
    } finally {
      setEditLoading(false);
    }
  }

  // ——— DELETE ———
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await apiRequest(`/users/${deleteTarget.MaTaiKhoan}`, { method: 'DELETE' });
      setDeleteTarget(null);
      await loadData();
      setAlert({ msg: `Đã xóa tài khoản "${deleteTarget.TenNguoiDung}"`, type: 'success' });
    } catch (error) {
      setAlert({ msg: error.message, type: 'error' });
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  // ——— AGENCY ———
  async function handleCreateAgency(e) {
    e.preventDefault();
    setAgencyLoading(true);
    try {
      await apiRequest('/users/government-agencies', {
        method: 'POST',
        body: JSON.stringify(agencyForm),
      });
      setAgencyForm({ MaCoQuan: '', Ten: '', DiaChi: '' });
      await loadData();
      setAlert({ msg: `Đã thêm cơ quan "${agencyForm.Ten}" thành công`, type: 'success' });
    } catch (error) {
      setAlert({ msg: error.message, type: 'error' });
    } finally {
      setAgencyLoading(false);
    }
  }

  // ——— RENDER ———
  return (
    <div className="space-y-6">
      {alert && <Alert variant={alert.type} className="mb-2">{alert.msg}</Alert>}

      {/* ====== DANH SÁCH NGƯỜI DÙNG ====== */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Quản lý người dùng</h3>
            <p className="mt-0.5 text-sm text-slate-500">{filteredUsers.length} tài khoản</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                className="w-52 rounded-lg border border-slate-300 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tìm theo tên, email, SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả vai trò</option>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r] ?? r}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="HoatDong">Hoạt động</option>
              <option value="Khoa">Khóa</option>
            </select>
            {(search || filterRole || filterStatus) && (
              <button
                type="button"
                onClick={() => { setSearch(''); setFilterRole(''); setFilterStatus(''); }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
              >
                Xóa bộ lọc
              </button>
            )}
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Tạo tài khoản
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 font-semibold">Mã NV</th>
                <th className="p-3 font-semibold">Tên người dùng</th>
                <th className="p-3 font-semibold">Email</th>
                <th className="p-3 font-semibold">SĐT</th>
                <th className="p-3 font-semibold">Vai trò</th>
                <th className="p-3 font-semibold">Trạng thái</th>
                <th className="p-3 font-semibold">Thông tin</th>
                <th className="p-3 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.MaTaiKhoan} className="border-t hover:bg-slate-50">
                  <td className="p-3 text-slate-500">#{user.MaTaiKhoan}</td>
                  <td className="p-3 font-semibold text-slate-900">{user.TenNguoiDung}</td>
                  <td className="p-3 text-slate-600">{user.Email}</td>
                  <td className="p-3 text-slate-500">{user.SDT || '—'}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE[user.VaiTro] ?? 'bg-slate-100 text-slate-700'}`}>
                      {ROLE_LABEL[user.VaiTro] ?? user.VaiTro}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.TrangThai === 'HoatDong' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {user.TrangThai === 'HoatDong' ? 'Hoạt động' : 'Khóa'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{getProfileSummary(user)}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(user)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-slate-400" colSpan="8">
                    {users.length === 0 ? 'Chưa có tài khoản nào' : 'Không tìm thấy kết quả phù hợp'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ====== QUẢN LÝ CƠ QUAN ====== */}
      <details className="rounded-xl bg-white shadow-sm">
        <summary className="cursor-pointer select-none rounded-xl px-6 py-4 text-base font-bold text-slate-900 hover:bg-slate-50">
          Quản lý cơ quan chính phủ ({agencies.length})
        </summary>
        <div className="border-t border-slate-100 p-6">
          <p className="mb-4 text-sm font-semibold text-slate-700">Thêm cơ quan mới</p>
          <form onSubmit={handleCreateAgency} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="Mã cơ quan (tuỳ chọn)">
              <input
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Tự động"
                type="number"
                min="1"
                value={agencyForm.MaCoQuan}
                onChange={(e) => setAgencyForm((c) => ({ ...c, MaCoQuan: e.target.value }))}
              />
            </Field>
            <Field label="Tên cơ quan">
              <input
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Bộ Tài chính"
                value={agencyForm.Ten}
                onChange={(e) => setAgencyForm((c) => ({ ...c, Ten: e.target.value }))}
                required
              />
            </Field>
            <Field label="Địa chỉ">
              <input
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="28 Trần Hưng Đạo, Hà Nội"
                value={agencyForm.DiaChi}
                onChange={(e) => setAgencyForm((c) => ({ ...c, DiaChi: e.target.value }))}
                required
              />
            </Field>
            <div className="flex items-end">
              <button
                disabled={agencyLoading}
                className="w-full rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {agencyLoading ? 'Đang thêm...' : 'Thêm cơ quan'}
              </button>
            </div>
          </form>
          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3 font-semibold">Mã</th>
                  <th className="p-3 font-semibold">Tên cơ quan</th>
                  <th className="p-3 font-semibold">Địa chỉ</th>
                  <th className="p-3 font-semibold">Tài khoản</th>
                </tr>
              </thead>
              <tbody>
                {agencies.map((a) => (
                  <tr key={a.MaCoQuan} className="border-t">
                    <td className="p-3 text-slate-500">#{a.MaCoQuan}</td>
                    <td className="p-3 font-medium">{a.Ten}</td>
                    <td className="p-3 text-slate-500">{a.DiaChi || '—'}</td>
                    <td className="p-3">
                      {takenAgencies.has(a.MaCoQuan)
                        ? <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Đã có TK</span>
                        : <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-400">Chưa có</span>
                      }
                    </td>
                  </tr>
                ))}
                {agencies.length === 0 && (
                  <tr><td className="p-6 text-center text-slate-400" colSpan="4">Chưa có cơ quan</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </details>

      {/* ====== MODAL TẠO TÀI KHOẢN ====== */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !createLoading) setShowCreate(false); }}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Tạo tài khoản người dùng</h3>
                <p className="mt-0.5 text-sm text-slate-500">Điền đầy đủ thông tin và chọn vai trò cho tài khoản mới.</p>
              </div>
              <button
                type="button"
                disabled={createLoading}
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {createAlert && <Alert variant={createAlert.type} className="mb-4">{createAlert.msg}</Alert>}
              <form id="create-user-form" onSubmit={handleCreate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <UserFormFields form={createForm} onChange={(f, v) => setCreateForm((c) => ({ ...c, [f]: v }))} agencies={agencies} takenAgencies={takenAgencies} currentMaCoQuan={null} isEdit={false} />
              </form>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                disabled={createLoading}
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="create-user-form"
                disabled={createLoading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {createLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {createLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL SỬA TÀI KHOẢN ====== */}
      {editUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !editLoading) setEditUser(null); }}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Sửa tài khoản #{editUser.MaTaiKhoan}</h3>
                <p className="mt-0.5 text-sm text-slate-500">Cập nhật thông tin, vai trò, trạng thái. Để trống mật khẩu nếu không đổi.</p>
              </div>
              <button
                type="button"
                disabled={editLoading}
                onClick={() => setEditUser(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {editAlert && <Alert variant={editAlert.type} className="mb-4">{editAlert.msg}</Alert>}
              <form id="edit-user-form" onSubmit={handleEdit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <UserFormFields form={editForm} onChange={(f, v) => setEditForm((c) => ({ ...c, [f]: v }))} agencies={agencies} takenAgencies={takenAgencies} currentMaCoQuan={editUser?.taiKhoanCoQuan?.MaCoQuan ?? null} isEdit />
              </form>
              {editForm.VaiTro !== editUser.VaiTro && (
                <Alert variant="warning" className="mt-4">
                  Đổi vai trò từ <b>{ROLE_LABEL[editUser.VaiTro] ?? editUser.VaiTro}</b> sang <b>{ROLE_LABEL[editForm.VaiTro] ?? editForm.VaiTro}</b>: hồ sơ vai trò cũ sẽ được thay thế.
                </Alert>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                disabled={editLoading}
                onClick={() => setEditUser(null)}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="edit-user-form"
                disabled={editLoading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {editLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL XÁC NHẬN XÓA ====== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h4 className="mt-4 text-base font-bold text-slate-900">Xóa tài khoản này?</h4>
            <p className="mt-2 text-sm text-slate-500">
              Tài khoản <span className="font-semibold text-slate-700">{deleteTarget.TenNguoiDung}</span> ({deleteTarget.Email}) sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDelete}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {deleteLoading ? 'Đang xóa...' : 'Xóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
