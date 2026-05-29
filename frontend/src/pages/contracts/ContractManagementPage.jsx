import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../api/client';

const initialDetail = { MaHangHoa: '', SoLuongToiDa: '', SoTienToiDa: '' };

export default function ContractManagementPage() {
  const [agencies, setAgencies] = useState([]);
  const [products, setProducts] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [form, setForm] = useState({
    MaCoQuan: '',
    NgayKy: new Date().toISOString().slice(0, 10),
    NgayHetHan: '',
    TrangThai: 'HieuLuc',
    chiTiet: [{ ...initialDetail }]
  });
  const [extendDates, setExtendDates] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedProductIds = useMemo(
    () => new Set(form.chiTiet.map((detail) => Number(detail.MaHangHoa)).filter(Boolean)),
    [form.chiTiet]
  );

  async function loadData() {
    const [agencyList, productList, contractList] = await Promise.all([
      apiRequest('/users/government-agencies'),
      apiRequest('/products'),
      apiRequest('/contracts')
    ]);
    setAgencies(agencyList);
    setProducts(productList);
    setContracts(contractList);
  }

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message));
  }, []);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateDetail(index, field, value) {
    setForm((current) => ({
      ...current,
      chiTiet: current.chiTiet.map((detail, detailIndex) => (
        detailIndex === index ? { ...detail, [field]: value } : detail
      ))
    }));
  }

  function addDetailRow() {
    setForm((current) => ({ ...current, chiTiet: [...current.chiTiet, { ...initialDetail }] }));
  }

  function removeDetailRow(index) {
    setForm((current) => ({
      ...current,
      chiTiet: current.chiTiet.length === 1 ? current.chiTiet : current.chiTiet.filter((_, detailIndex) => detailIndex !== index)
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const chiTiet = form.chiTiet.map((detail) => ({
        MaHangHoa: Number(detail.MaHangHoa),
        SoLuongToiDa: Number(detail.SoLuongToiDa),
        SoTienToiDa: Number(detail.SoTienToiDa)
      }));

      await apiRequest('/contracts', {
        method: 'POST',
        body: JSON.stringify({
          MaCoQuan: Number(form.MaCoQuan),
          NgayKy: form.NgayKy,
          NgayHetHan: form.NgayHetHan,
          TrangThai: form.TrangThai,
          chiTiet
        })
      });

      setForm({
        MaCoQuan: '',
        NgayKy: new Date().toISOString().slice(0, 10),
        NgayHetHan: '',
        TrangThai: 'HieuLuc',
        chiTiet: [{ ...initialDetail }]
      });
      await loadData();
      setMessage('Tạo hợp đồng thành công');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExtendContract(contractId) {
    const NgayHetHan = extendDates[contractId];

    if (!NgayHetHan) {
      setMessage('Vui lòng chọn ngày hết hạn mới');
      return;
    }

    setMessage('');

    try {
      await apiRequest(`/contracts/${contractId}/extend`, {
        method: 'PATCH',
        body: JSON.stringify({ NgayHetHan })
      });
      setExtendDates((current) => ({ ...current, [contractId]: '' }));
      await loadData();
      setMessage('Gia hạn hợp đồng thành công');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Tạo hợp đồng mới</h3>
        <p className="mt-1 text-sm text-slate-500">Chỉ nhân viên hợp đồng được tạo hợp đồng và chi tiết giới hạn đặt hàng.</p>
        {message && <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">{message}</div>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <select className="rounded-lg border px-4 py-3" value={form.MaCoQuan} onChange={(e) => updateForm('MaCoQuan', e.target.value)} required>
              <option value="">Chọn cơ quan</option>
              {agencies.map((agency) => <option key={agency.MaCoQuan} value={agency.MaCoQuan}>{agency.Ten}</option>)}
            </select>
            <input className="rounded-lg border px-4 py-3" type="date" value={form.NgayKy} onChange={(e) => updateForm('NgayKy', e.target.value)} required />
            <input className="rounded-lg border px-4 py-3" type="date" value={form.NgayHetHan} onChange={(e) => updateForm('NgayHetHan', e.target.value)} required />
            <select className="rounded-lg border px-4 py-3" value={form.TrangThai} onChange={(e) => updateForm('TrangThai', e.target.value)}>
              <option value="HieuLuc">Hiệu lực</option>
              <option value="TamDung">Tạm dừng</option>
              <option value="HetHan">Hết hạn</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-3">Hàng hóa</th>
                  <th className="p-3">Giá hiện tại</th>
                  <th className="p-3">Số lượng tối đa</th>
                  <th className="p-3">Số tiền tối đa</th>
                  <th className="p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {form.chiTiet.map((detail, index) => {
                  const selectedProduct = products.find((product) => String(product.MaHangHoa) === String(detail.MaHangHoa));
                  return (
                    <tr key={index} className="border-t">
                      <td className="p-3">
                        <select className="w-full rounded-lg border px-3 py-2" value={detail.MaHangHoa} onChange={(e) => updateDetail(index, 'MaHangHoa', e.target.value)} required>
                          <option value="">Chọn hàng hóa</option>
                          {products.map((product) => (
                            <option key={product.MaHangHoa} value={product.MaHangHoa} disabled={selectedProductIds.has(product.MaHangHoa) && String(product.MaHangHoa) !== String(detail.MaHangHoa)}>
                              {product.Ten}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">{selectedProduct ? `${Number(selectedProduct.Gia).toLocaleString('vi-VN')} đ` : '-'}</td>
                      <td className="p-3">
                        <input className="w-36 rounded-lg border px-3 py-2" type="number" min="1" value={detail.SoLuongToiDa} onChange={(e) => updateDetail(index, 'SoLuongToiDa', e.target.value)} required />
                      </td>
                      <td className="p-3">
                        <input className="w-44 rounded-lg border px-3 py-2" type="number" min="1" value={detail.SoTienToiDa} onChange={(e) => updateDetail(index, 'SoTienToiDa', e.target.value)} required />
                      </td>
                      <td className="p-3">
                        <button type="button" onClick={() => removeDetailRow(index)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white">Xóa dòng</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={addDetailRow} className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white">Thêm dòng hàng hóa</button>
            <button disabled={loading} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60">
              {loading ? 'Đang tạo...' : 'Tạo hợp đồng'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Danh sách hợp đồng</h3>
        <p className="mt-1 text-sm text-slate-500">Hợp đồng quá ngày hết hạn sẽ tự chuyển sang trạng thái Hết hạn khi tải danh sách.</p>
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Mã HĐ</th>
                <th className="p-3">Cơ quan</th>
                <th className="p-3">Ngày ký</th>
                <th className="p-3">Ngày hết hạn</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Số dòng</th>
                <th className="p-3">Gia hạn</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.MaHopDong} className="border-t">
                  <td className="p-3 font-medium">#{contract.MaHopDong}</td>
                  <td className="p-3">{contract.coQuan?.Ten}</td>
                  <td className="p-3">{new Date(contract.NgayKy).toLocaleDateString('vi-VN')}</td>
                  <td className="p-3">{new Date(contract.NgayHetHan).toLocaleDateString('vi-VN')}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${contract.TrangThai === 'HetHan' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {contract.TrangThai}
                    </span>
                  </td>
                  <td className="p-3">{contract.chiTiet?.length || 0}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <input
                        type="date"
                        className="rounded-lg border px-3 py-2"
                        value={extendDates[contract.MaHopDong] || ''}
                        onChange={(e) => setExtendDates((current) => ({ ...current, [contract.MaHopDong]: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => handleExtendContract(contract.MaHopDong)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Gia hạn
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {contracts.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-500" colSpan="7">Chưa có hợp đồng</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
