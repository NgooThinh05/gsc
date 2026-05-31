import { useEffect, useMemo, useState } from 'react';
import { apiRequest, downloadPdf } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import Alert from '../../components/ui/Alert';

const initialDetail = { MaHangHoa: '', SoTienToiDa: '' };
const defaultContractTerms = [
  'Thanh toán trong vòng 30 ngày kể từ ngày nghiệm thu.',
  'Giao hàng đúng thời hạn, đúng chủng loại và đúng số lượng đã thỏa thuận.',
  'Bảo hành theo chính sách của nhà sản xuất và quy định hiện hành.',
  'Mọi thay đổi về khối lượng, hạn mức hoặc điều kiện thực hiện phải lập phụ lục hợp đồng.'
].map((term) => `- ${term}`).join('\n');

const statusBadge = {
  HieuLuc: 'bg-emerald-100 text-emerald-700',
  TamDung: 'bg-amber-100 text-amber-700',
  HetHan:  'bg-red-100 text-red-700',
};
const statusLabel = { HieuLuc: 'Hiệu lực', TamDung: 'Tạm dừng', HetHan: 'Hết hạn' };

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export default function ContractManagementPage() {
  const user = useAuthStore((s) => s.user);
  const isHopDong = user?.VaiTro === 'NhanVienHopDong';
  const isCoQuan  = user?.VaiTro === 'TaiKhoanCoQuan';
  const canCreate = isHopDong;

  const [agencies,  setAgencies]  = useState([]);
  const [myAgency,  setMyAgency]  = useState(null);
  const [products,  setProducts]  = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loadError, setLoadError] = useState('');

  // modal state
  const [showCreate,     setShowCreate]     = useState(false);
  const [detailContract, setDetailContract] = useState(null);
  const [adjustContract, setAdjustContract] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ NgayHetHan: '', DieuKhoan: '', chiTiet: [] });

  // form
  const [form, setForm] = useState({
    MaCoQuan: '', NgayKy: new Date().toISOString().slice(0, 10),
    NgayHetHan: '', TrangThai: 'HieuLuc',
    TenNguoiKy: '', ChucVuNguoiKy: '',
    DieuKhoan: defaultContractTerms,
    chiTiet: [{ ...initialDetail }],
  });
  const [formAlert, setFormAlert] = useState(null);
  const [loading,   setLoading]   = useState(false);

  // adjust contract
  const [globalAlert, setGlobalAlert] = useState(null);

  const selectedProductIds = useMemo(
    () => new Set(form.chiTiet.map((d) => Number(d.MaHangHoa)).filter(Boolean)),
    [form.chiTiet]
  );

  async function loadData() {
    const [aList, pList, cList] = await Promise.all([
      apiRequest('/users/government-agencies'),
      apiRequest('/products'),
      apiRequest('/contracts'),
    ]);
    setAgencies(aList);
    setProducts(pList);
    setContracts(cList);
    if (isCoQuan) {
      const me = await apiRequest('/auth/me');
      setMyAgency(me.taiKhoanCoQuan?.coQuan || null);
    }
  }

  useEffect(() => {
    loadData().catch((e) => setLoadError(e.message));
  }, []);

  function openCreate() {
    setForm({
      MaCoQuan: '', NgayKy: new Date().toISOString().slice(0, 10),
      NgayHetHan: '', TrangThai: 'HieuLuc',
      TenNguoiKy: '', ChucVuNguoiKy: '',
      DieuKhoan: defaultContractTerms,
      chiTiet: [{ ...initialDetail }],
    });
    setFormAlert(null);
    setShowCreate(true);
  }

  const updateForm   = (k, v) => setForm((c) => ({ ...c, [k]: v }));
  const updateDetail = (i, k, v) =>
    setForm((c) => ({ ...c, chiTiet: c.chiTiet.map((d, idx) => idx === i ? { ...d, [k]: v } : d) }));
  const addRow    = () => setForm((c) => ({ ...c, chiTiet: [...c.chiTiet, { ...initialDetail }] }));
  const removeRow = (i) => setForm((c) => ({ ...c, chiTiet: c.chiTiet.filter((_, idx) => idx !== i) }));

  function validate() {
    if (isHopDong && !form.MaCoQuan)   return 'Vui lòng chọn cơ quan';
    if (!form.NgayKy)                  return 'Vui lòng nhập ngày ký';
    if (!form.NgayHetHan)              return 'Vui lòng nhập ngày hết hạn';
    if (new Date(form.NgayHetHan) <= new Date(form.NgayKy))
      return 'Ngày hết hạn phải sau ngày ký';
    for (let i = 0; i < form.chiTiet.length; i++) {
      if (!form.chiTiet[i].MaHangHoa)
        return `Dòng ${i + 1}: chưa chọn hàng hóa`;
      if (!form.chiTiet[i].SoTienToiDa || Number(form.chiTiet[i].SoTienToiDa) <= 0)
        return `Dòng ${i + 1}: hạn mức tiền phải lớn hơn 0`;
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormAlert(null);
    const err = validate();
    if (err) { setFormAlert({ msg: err, type: 'warning' }); return; }

    setLoading(true);
    try {
      const payload = {
        NgayKy: form.NgayKy, NgayHetHan: form.NgayHetHan,
        TrangThai: form.TrangThai,
        TenNguoiKy: form.TenNguoiKy || null,
        ChucVuNguoiKy: form.ChucVuNguoiKy || null,
        DieuKhoan: form.DieuKhoan || null,
        chiTiet: form.chiTiet.map((d) => ({
          MaHangHoa: Number(d.MaHangHoa),
          SoTienToiDa: Number(d.SoTienToiDa),
        })),
      };
      if (isHopDong) payload.MaCoQuan = form.MaCoQuan;

      await apiRequest('/contracts', { method: 'POST', body: JSON.stringify(payload) });
      setShowCreate(false);
      await loadData();
      setGlobalAlert({ msg: 'Tạo hợp đồng thành công', type: 'success' });
    } catch (error) {
      setFormAlert({ msg: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // removed handleExtend; use adjustContract instead

  function openAdjustModal(contract) {
    setAdjustContract(contract);
    const existingItems = (contract.chiTiet || []).map((d) => ({
      MaHangHoa: String(d.MaHangHoa),
      SoTienToiDa: String(d.SoTienToiDa),
      isExisting: true
    }));
    setAdjustForm({
      NgayHetHan: new Date(contract.NgayHetHan).toISOString().slice(0,10),
      DieuKhoan: contract.DieuKhoan || '',
      chiTiet: existingItems
    });
  }

  const updateAdjustField = (k, v) => setAdjustForm((s) => ({ ...s, [k]: v }));
  const updateAdjustDetail = (i, k, v) => setAdjustForm((s) => ({ ...s, chiTiet: s.chiTiet.map((d, idx) => idx === i ? { ...d, [k]: v } : d) }));
  const addAdjustRow = () => setAdjustForm((s) => ({ ...s, chiTiet: [...s.chiTiet, { MaHangHoa: '', SoTienToiDa: '' }] }));
  const removeAdjustRow = (i) => setAdjustForm((s) => ({ ...s, chiTiet: s.chiTiet.filter((_, idx) => idx !== i) }));

  async function submitAdjust(e) {
    e.preventDefault();
    if (!adjustContract) return;
    const payload = {};
    if (adjustForm.NgayHetHan) payload.NgayHetHan = adjustForm.NgayHetHan;
    payload.DieuKhoan = adjustForm.DieuKhoan || null;
    if (Array.isArray(adjustForm.chiTiet) && adjustForm.chiTiet.length > 0) {
      payload.chiTiet = adjustForm.chiTiet.filter((d) => d.MaHangHoa && d.SoTienToiDa).map((d) => ({ MaHangHoa: Number(d.MaHangHoa), SoTienToiDa: d.SoTienToiDa }));
    }
    try {
      const updatedContract = await apiRequest(`/contracts/${adjustContract.MaHopDong}/adjust`, { method: 'PATCH', body: JSON.stringify(payload) });
      setAdjustContract(null);
      setDetailContract(updatedContract);
      await loadData();
      setGlobalAlert({ msg: 'Cập nhật hợp đồng thành công', type: 'success' });
    } catch (err) {
      setGlobalAlert({ msg: err.message, type: 'error' });
    }
  }

  return (
    <div className="space-y-5">
      {loadError   && <Alert variant="error">{loadError}</Alert>}
      {globalAlert && <Alert variant={globalAlert.type}>{globalAlert.msg}</Alert>}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Quản lý hợp đồng</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {contracts.length} hợp đồng · hợp đồng quá hạn tự cập nhật khi tải trang
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[.98]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Tạo hợp đồng
          </button>
        )}
      </div>

      {/* ── Bảng danh sách ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Mã HĐ</th>
              <th className="px-4 py-3 font-semibold">Cơ quan</th>
              <th className="px-4 py-3 font-semibold">Ngày ký</th>
              <th className="px-4 py-3 font-semibold">Ngày hết hạn</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.MaHopDong} className="border-t hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-700">#{c.MaHopDong}</td>
                <td className="px-4 py-3">{c.coQuan?.Ten || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(c.NgayKy).toLocaleDateString('vi-VN')}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(c.NgayHetHan).toLocaleDateString('vi-VN')}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[c.TrangThai] ?? 'bg-slate-100 text-slate-600'}`}>
                    {statusLabel[c.TrangThai] ?? c.TrangThai}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setDetailContract(c)}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Xem chi tiết
                  </button>
                </td>
              </tr>
            ))}
            {contracts.length === 0 && (
              <tr>
                <td className="px-4 py-12 text-center text-slate-400" colSpan={6}>
                  <svg className="mx-auto mb-3 h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  Chưa có hợp đồng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════
          MODAL TẠO HỢP ĐỒNG
      ══════════════════════════════════════════ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => !loading && setShowCreate(false)}>
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Tạo hợp đồng mới</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {isCoQuan ? 'Hợp đồng sẽ gắn với cơ quan của bạn.' : 'Điền thông tin và chọn hàng hóa kèm hạn mức.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !loading && setShowCreate(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body (scrollable) */}
            <form id="create-contract-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {formAlert && <Alert variant={formAlert.type}>{formAlert.msg}</Alert>}

              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Cơ quan" required>
                  {isCoQuan ? (
                    <input readOnly className={`${inputCls} bg-slate-50 text-slate-600`}
                      value={myAgency ? myAgency.Ten : 'Đang tải...'} />
                  ) : (
                    <select className={inputCls} value={form.MaCoQuan}
                      onChange={(e) => updateForm('MaCoQuan', e.target.value)} required>
                      <option value="">Chọn cơ quan...</option>
                      {agencies.map((a) => (
                        <option key={a.MaCoQuan} value={a.MaCoQuan}>{a.Ten}</option>
                      ))}
                    </select>
                  )}
                </Field>

                <Field label="Trạng thái">
                  <select className={inputCls} value={form.TrangThai}
                    onChange={(e) => updateForm('TrangThai', e.target.value)}>
                    <option value="HieuLuc">Hiệu lực</option>
                    <option value="TamDung">Tạm dừng</option>
                  </select>
                </Field>

                <Field label="Ngày ký" required>
                  <input type="date" className={inputCls} value={form.NgayKy}
                    onChange={(e) => updateForm('NgayKy', e.target.value)} required />
                </Field>

                <Field label="Ngày hết hạn" required>
                  <input type="date" className={inputCls} value={form.NgayHetHan}
                    min={form.NgayKy || undefined}
                    onChange={(e) => updateForm('NgayHetHan', e.target.value)} required />
                </Field>

                <Field label="Người ký hợp đồng">
                  <input className={inputCls} placeholder="Nguyễn Văn A"
                    value={form.TenNguoiKy}
                    onChange={(e) => updateForm('TenNguoiKy', e.target.value)} />
                </Field>

                <Field label="Chức vụ người ký">
                  <input className={inputCls} placeholder="Giám đốc / Trưởng phòng..."
                    value={form.ChucVuNguoiKy}
                    onChange={(e) => updateForm('ChucVuNguoiKy', e.target.value)} />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Điều khoản hợp đồng">
                    <textarea
                      className={`${inputCls} min-h-32 resize-y`}
                      placeholder="Mỗi dòng là một điều khoản, hoặc bấm chèn mẫu bên dưới"
                      value={form.DieuKhoan}
                      onChange={(e) => updateForm('DieuKhoan', e.target.value)}
                      rows={6}
                    />
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">Mỗi dòng sẽ hiển thị thành một bullet trong PDF.</p>
                      <button
                        type="button"
                        onClick={() => updateForm('DieuKhoan', defaultContractTerms)}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        Chèn mẫu điều khoản
                      </button>
                    </div>
                  </Field>
                </div>
              </div>

              {/* Bảng hàng hóa */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Danh sách hàng hóa
                    <span className="ml-1.5 text-xs font-normal text-slate-400">({form.chiTiet.length} dòng)</span>
                  </p>
                  <button type="button" onClick={addRow}
                    className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Thêm dòng
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-3 py-2.5 text-left font-medium w-8">#</th>
                        <th className="px-3 py-2.5 text-left font-medium">Hàng hóa <span className="text-red-400">*</span></th>
                        <th className="px-3 py-2.5 text-left font-medium">Đơn giá</th>
                        <th className="px-3 py-2.5 text-left font-medium">Hạn mức (đ) <span className="text-red-400">*</span></th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.chiTiet.map((detail, i) => {
                        const prod = products.find((p) => String(p.MaHangHoa) === String(detail.MaHangHoa));
                        return (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2 text-slate-400 text-center">{i + 1}</td>
                            <td className="px-3 py-2">
                              <select
                                className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-blue-500"
                                value={detail.MaHangHoa}
                                onChange={(e) => updateDetail(i, 'MaHangHoa', e.target.value)}
                                required
                              >
                                <option value="">Chọn...</option>
                                {products.map((p) => (
                                  <option key={p.MaHangHoa} value={p.MaHangHoa}
                                    disabled={selectedProductIds.has(p.MaHangHoa) && String(p.MaHangHoa) !== String(detail.MaHangHoa)}>
                                    {p.Ten}{selectedProductIds.has(p.MaHangHoa) && String(p.MaHangHoa) !== String(detail.MaHangHoa) ? ' ✓' : ''}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                              {prod ? `${Number(prod.Gia).toLocaleString('vi-VN')} đ` : '—'}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number" min="1" placeholder="VD: 5000000"
                                className="w-36 rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-blue-500"
                                value={detail.SoTienToiDa}
                                onChange={(e) => updateDetail(i, 'SoTienToiDa', e.target.value)}
                                required
                              />
                            </td>
                            <td className="px-2 py-2 text-center">
                              {form.chiTiet.length > 1 ? (
                                <button type="button" onClick={() => removeRow(i)}
                                  className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              ) : <span className="block w-6" />}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </form>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => !loading && setShowCreate(false)}
                disabled={loading}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors">
                Hủy
              </button>
              <button type="submit" form="create-contract-form" disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang tạo...
                  </>
                ) : 'Tạo hợp đồng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL CHI TIẾT HỢP ĐỒNG
      ══════════════════════════════════════════ */}
      {detailContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setDetailContract(null)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            {/* header */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Hợp đồng #{detailContract.MaHopDong}</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  {detailContract.coQuan?.Ten} · {new Date(detailContract.NgayKy).toLocaleDateString('vi-VN')} → {new Date(detailContract.NgayHetHan).toLocaleDateString('vi-VN')}
                </p>
                <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[detailContract.TrangThai] ?? 'bg-slate-100 text-slate-600'}`}>
                  {statusLabel[detailContract.TrangThai] ?? detailContract.TrangThai}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isHopDong && (
                  <button
                    type="button"
                    onClick={() => openAdjustModal(detailContract)}
                    className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-200 transition-colors"
                    title="Chỉnh sửa hợp đồng"
                  >
                    Chỉnh sửa
                  </button>
                )}
                <button type="button" onClick={async () => {
                  try {
                    const token = sessionStorage.getItem('gsc_token');
                    const response = await fetch(`http://localhost:4000/api/contracts/${detailContract.MaHopDong}/pdf`, {
                      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    });
                    if (!response.ok) throw new Error('Tải PDF thất bại');
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  } catch (err) {
                    setGlobalAlert({ type: 'error', message: 'Lỗi: ' + err.message });
                  }
                }}
                  className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors" title="Xem PDF">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </button>
                <button type="button" onClick={() => setDetailContract(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* body */}
            <div className="px-6 py-5">
              {(detailContract.TenNguoiKy || detailContract.ChucVuNguoiKy) && (
                <div className="mb-4 flex gap-6 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                  {detailContract.TenNguoiKy && (
                    <div><p className="text-xs text-slate-400">Người ký</p><p className="font-semibold text-slate-800">{detailContract.TenNguoiKy}</p></div>
                  )}
                  {detailContract.ChucVuNguoiKy && (
                    <div><p className="text-xs text-slate-400">Chức vụ</p><p className="font-semibold text-slate-800">{detailContract.ChucVuNguoiKy}</p></div>
                  )}
                </div>
              )}
              {detailContract.DieuKhoan && (
                <Alert variant="info" className="mb-4">
                  <strong>Điều khoản:</strong>
                  <div className="mt-2 space-y-1">
                    {detailContract.DieuKhoan.split(/\r?\n/).filter(Boolean).map((line, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="mt-[2px] text-slate-500">•</span>
                        <span>{line.replace(/^[-•]\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                </Alert>
              )}
              {isHopDong && adjustContract?.MaHopDong === detailContract.MaHopDong && (
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Chỉnh sửa hợp đồng</h4>
                      <p className="text-xs text-slate-500">Cập nhật ngày hết hạn, điều khoản và hàng hóa ngay tại đây.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdjustContract(null)}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Ẩn form
                    </button>
                  </div>

                  <div className="mb-4 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-700">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Ngày ký gốc</p>
                        <p className="font-semibold text-slate-900">{new Date(detailContract.NgayKy).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Ngày hết hạn hiện tại</p>
                        <p className="font-semibold text-slate-900">{new Date(detailContract.NgayHetHan).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Cơ quan</p>
                        <p className="font-semibold text-slate-900">{detailContract.coQuan?.Ten || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Số loại hàng hóa</p>
                        <p className="font-semibold text-slate-900">
                          {new Set((detailContract.chiTiet || []).map((d) => d.MaHangHoa)).size} loại
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={submitAdjust} className="space-y-5">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Ngày hết hạn mới</label>
                      <input
                        type="date"
                        className={inputCls}
                        value={adjustForm.NgayHetHan}
                        onChange={(e) => updateAdjustField('NgayHetHan', e.target.value)}
                        min={new Date().toISOString().slice(0,10)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Điều khoản hợp đồng</label>
                      <button
                        type="button"
                        onClick={() => updateAdjustField('DieuKhoan', defaultContractTerms)}
                        className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        Chèn mẫu điều khoản
                      </button>
                      <textarea
                        className={`${inputCls} min-h-40 resize-y`}
                        placeholder="Mỗi dòng là một điều khoản"
                        value={adjustForm.DieuKhoan}
                        onChange={(e) => updateAdjustField('DieuKhoan', e.target.value)}
                        rows={8}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">Danh sách hàng hóa</p>
                        <button type="button" onClick={addAdjustRow} className="rounded-lg bg-slate-100 px-2 py-1.5 text-xs">+ Thêm hàng</button>
                      </div>
                      <div className="space-y-3">
                        {adjustForm.chiTiet.map((d, i) => {
                          const prod = products.find((p) => String(p.MaHangHoa) === String(d.MaHangHoa));
                          return (
                            <div key={i} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                              <div className="space-y-3">
                                {d.isExisting ? (
                                  <div>
                                    <div className="text-xs text-slate-500">Hàng hóa hiện có</div>
                                    <div className="text-sm font-semibold text-slate-800">{prod?.Ten || `Hàng #${d.MaHangHoa}`}</div>
                                    <div className="text-xs text-slate-500">{prod && `${Number(prod.Gia).toLocaleString('vi-VN')} đ/1`}</div>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-600">Chọn hàng hóa</label>
                                    <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={d.MaHangHoa || ''}
                                      onChange={(e) => updateAdjustDetail(i, 'MaHangHoa', e.target.value)}>
                                      <option value="">Chọn hàng...</option>
                                      {products.map((p) => (<option key={p.MaHangHoa} value={p.MaHangHoa}>{p.Ten}</option>))}
                                    </select>
                                  </div>
                                )}
                                <div className="space-y-1">
                                  <label className="block text-xs font-medium text-slate-600">Hạn mức (đ)</label>
                                  <input type="number" placeholder="VD: 5000000" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    value={d.SoTienToiDa || ''}
                                    onChange={(e) => updateAdjustDetail(i, 'SoTienToiDa', e.target.value)} />
                                </div>
                                <div className="flex justify-end">
                                  <button type="button" onClick={() => removeAdjustRow(i)} className="rounded-lg px-2 py-1 text-sm text-red-500 hover:bg-red-50 hover:text-red-700">Xóa hàng</button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setAdjustContract(null)} className="rounded-xl border px-4 py-2">Hủy chỉnh sửa</button>
                      <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-white">Cập nhật</button>
                    </div>
                  </form>
                </div>
              )}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Hàng hóa</th>
                      <th className="px-4 py-3 text-left font-semibold">Đơn giá</th>
                      <th className="px-4 py-3 text-right font-semibold">Hạn mức tối đa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailContract.chiTiet?.map((d) => (
                      <tr key={d.MaHangHoa} className="border-t">
                        <td className="px-4 py-3 font-medium">{d.hangHoa?.Ten || `#${d.MaHangHoa}`}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {d.hangHoa ? `${Number(d.hangHoa.Gia).toLocaleString('vi-VN')} đ` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-700">
                          {Number(d.SoTienToiDa).toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    ))}
                    {(!detailContract.chiTiet || detailContract.chiTiet.length === 0) && (
                      <tr><td className="px-4 py-6 text-center text-slate-400" colSpan="3">Không có chi tiết</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
