import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import Alert from '../../components/ui/Alert';
import { useOrderUpdates } from '../../lib/useOrderUpdates';

export default function WarehouseOrderDetailPage() {
  const [products, setProducts] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [inventoryOpen, setInventoryOpen] = useState(true);
  const [productForm, setProductForm] = useState({ Ten: '', SoLuongTrongKho: '', Gia: '' });
  const [alert, setAlert] = useState(null);

  // Receive stock form state (multi-row)
  const [receiveRows, setReceiveRows] = useState([{ MaHangHoa: '', SoLuongNhap: '' }]);
  const [receiveAlert, setReceiveAlert] = useState(null);
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);

  // Modal state
  const [modal, setModal] = useState(null); // { order, quantities }
  const [modalAlert, setModalAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadProducts() {
    setProducts(await apiRequest('/products'));
  }

  async function loadPendingOrders() {
    setPendingOrders(await apiRequest('/orders'));
  }

  useEffect(() => {
    Promise.all([loadProducts(), loadPendingOrders()]).catch((err) =>
      setAlert({ msg: err.message, type: 'error' })
    );
  }, []);

  useOrderUpdates(() => {
    loadPendingOrders().catch(() => {});
  });

  async function openModal(orderId) {
    setModalAlert(null);
    try {
      const order = await apiRequest(`/orders/${orderId}`);
      const quantities = Object.fromEntries(
        order.chiTiet.map((d) => [
          d.MaHangHoa,
          d.SoLuongGiao || Math.min(d.SoLuongDat, d.hangHoa.SoLuongTrongKho)
        ])
      );
      setModal({ order, quantities });
    } catch (err) {
      setAlert({ msg: err.message, type: 'error' });
    }
  }

  function closeModal() {
    if (submitting) return;
    setModal(null);
    setModalAlert(null);
  }

  async function handleApprove() {
    setSubmitting(true);
    setModalAlert(null);
    try {
      const items = modal.order.chiTiet.map((d) => ({
        MaHangHoa: d.MaHangHoa,
        SoLuongGiao: Number(modal.quantities[d.MaHangHoa] || 0)
      }));
      await apiRequest(`/warehouse/orders/${modal.order.MaDonHang}/approve`, {
        method: 'POST',
        body: JSON.stringify({ items })
      });
      setModal(null);
      setModalAlert(null);
      await Promise.all([loadProducts(), loadPendingOrders()]);
      setAlert({ msg: `Đơn #${modal.order.MaDonHang} đã được xử lý kho và chuyển sang giao hàng.`, type: 'success' });
    } catch (err) {
      setModalAlert({ msg: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateProduct(event) {
    event.preventDefault();
    setAlert(null);
    try {
      await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(productForm)
      });
      setProductForm({ Ten: '', SoLuongTrongKho: '', Gia: '' });
      await loadProducts();
      setAlert({ msg: 'Thêm mặt hàng vào kho thành công', type: 'success' });
    } catch (err) {
      setAlert({ msg: err.message, type: 'error' });
    }
  }

  // Receive stock helpers
  function addReceiveRow() {
    setReceiveRows((s) => [...s, { MaHangHoa: '', SoLuongNhap: '' }]);
  }
  function removeReceiveRow(index) {
    setReceiveRows((s) => s.filter((_, i) => i !== index));
  }
  function updateReceiveRow(index, patch) {
    setReceiveRows((s) => s.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function handleReceiveSubmit(e) {
    e.preventDefault();
    setReceiveAlert(null);
    // validate
    const items = [];
    for (const r of receiveRows) {
      const MaHangHoa = Number(r.MaHangHoa);
      const SoLuongNhap = Number(r.SoLuongNhap);
      if (!MaHangHoa || !Number.isInteger(SoLuongNhap) || SoLuongNhap <= 0) {
        setReceiveAlert({ msg: 'Vui lòng điền đúng mã hàng và số lượng (>0) cho tất cả dòng', type: 'error' });
        return;
      }
      items.push({ MaHangHoa, SoLuongNhap });
    }

    setReceiveSubmitting(true);
    try {
      const result = await apiRequest('/warehouse/receive', {
        method: 'POST',
        body: JSON.stringify({ items })
      });

      if (result?.errors && result.errors.length > 0) {
        setReceiveAlert({ msg: `Một số dòng không nhập được: ${result.errors.map((e) => e.error).join('; ')}`, type: 'error' });
      } else {
        setReceiveAlert({ msg: 'Nhập hàng thành công', type: 'success' });
        setReceiveRows([{ MaHangHoa: '', SoLuongNhap: '' }]);
      }

      await loadProducts();
    } catch (err) {
      setReceiveAlert({ msg: err.message, type: 'error' });
    } finally {
      setReceiveSubmitting(false);
    }
  }

  const filteredOrders = pendingOrders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return String(o.MaDonHang).includes(q) || (o.hopDong?.coQuan?.Ten || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Thêm mặt hàng */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Thêm mặt hàng kho</h3>
        <form onSubmit={handleCreateProduct} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            value={productForm.Ten}
            onChange={(e) => setProductForm((s) => ({ ...s, Ten: e.target.value }))}
            placeholder="Tên mặt hàng"
            className="rounded-lg border border-slate-300 px-4 py-3 md:col-span-2"
            required
          />
          <input
            value={productForm.SoLuongTrongKho}
            onChange={(e) => setProductForm((s) => ({ ...s, SoLuongTrongKho: e.target.value }))}
            type="number" min="0" placeholder="Số lượng"
            className="rounded-lg border border-slate-300 px-4 py-3"
            required
          />
          <input
            value={productForm.Gia}
            onChange={(e) => setProductForm((s) => ({ ...s, Gia: e.target.value }))}
            type="number" min="1" placeholder="Giá"
            className="rounded-lg border border-slate-300 px-4 py-3"
            required
          />
          <button className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white md:col-span-4">
            Thêm mặt hàng
          </button>
        </form>
        {alert && <Alert variant={alert.type} className="mt-4">{alert.msg}</Alert>}
      </section>

      {/* Nhập hàng (multi-row) */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Nhập hàng vào kho</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addReceiveRow}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              + Thêm dòng
            </button>
          </div>
        </div>

        <form onSubmit={handleReceiveSubmit} className="mt-4">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-3">Mã hàng</th>
                  <th className="p-3">Tên hàng</th>
                  <th className="p-3">Số lượng nhập</th>
                  <th className="p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {receiveRows.map((row, idx) => {
                  const selectedProduct = products.find((p) => Number(p.MaHangHoa) === Number(row.MaHangHoa));
                  return (
                    <tr key={idx} className="border-t">
                      <td className="p-3">
                        <select
                          value={row.MaHangHoa}
                          onChange={(e) => updateReceiveRow(idx, { MaHangHoa: e.target.value })}
                          className="rounded-lg border border-slate-300 px-3 py-2"
                        >
                          <option value="">-- Chọn mã hàng --</option>
                          {products.map((p) => (
                            <option key={p.MaHangHoa} value={p.MaHangHoa}>#{p.MaHangHoa}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 font-medium">{selectedProduct ? selectedProduct.Ten : '-'}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="1"
                          value={row.SoLuongNhap}
                          onChange={(e) => updateReceiveRow(idx, { SoLuongNhap: e.target.value })}
                          className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-center"
                        />
                      </td>
                      <td className="p-3">
                        <button type="button" onClick={() => removeReceiveRow(idx)} className="text-red-600 hover:underline">Xóa</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {receiveAlert && <Alert variant={receiveAlert.type} className="mt-4">{receiveAlert.msg}</Alert>}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={receiveSubmitting}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {receiveSubmitting ? 'Đang nhập...' : 'Xác nhận nhập hàng'}
            </button>
          </div>
        </form>
      </section>

      {/* Tồn kho */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Danh sách tồn kho</h3>
          <button
            onClick={() => setInventoryOpen((s) => !s)}
            className="rounded-full p-2 hover:bg-slate-100"
            title={inventoryOpen ? 'Thu gọn' : 'Mở rộng'}
          >
            <svg className={`h-5 w-5 transform transition-transform ${inventoryOpen ? '' : 'rotate-180'}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l6 6a1 1 0 11-1.414 1.414L10 5.414 4.707 10.707A1 1 0 113.293 9.293l6-6A1 1 0 0110 3z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div
          className="mt-4 overflow-hidden rounded-lg border border-slate-200"
          style={{ transition: 'max-height 260ms ease', maxHeight: inventoryOpen ? '1200px' : 0 }}
        >
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Mã hàng</th>
                <th className="p-3">Tên hàng hóa</th>
                <th className="p-3">Tồn kho</th>
                <th className="p-3">Giá</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.MaHangHoa} className="border-t">
                  <td className="p-3">#{p.MaHangHoa}</td>
                  <td className="p-3 font-medium">{p.Ten}</td>
                  <td className={`p-3 font-semibold ${p.SoLuongTrongKho <= 10 ? 'text-red-600' : 'text-slate-700'}`}>
                    {p.SoLuongTrongKho}
                  </td>
                  <td className="p-3">{Number(p.Gia).toLocaleString('vi-VN')} đ</td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td className="p-6 text-center text-slate-500" colSpan="4">Chưa có mặt hàng</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Đơn chờ xử lý */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Đơn hàng chờ kho xử lý</h3>
            <p className="mt-1 text-sm text-slate-500">
              Danh sách các đơn đang ở trạng thái Chờ duyệt để kho kiểm tra tồn và phân bổ số lượng giao.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã đơn hoặc cơ quan"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              onClick={() => setSearchQuery(searchQuery)}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Tìm
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Mã đơn</th>
                <th className="p-3">Ngày đặt</th>
                <th className="p-3">Cơ quan</th>
                <th className="p-3">Tổng tiền</th>
                <th className="p-3">Số dòng</th>
                <th className="p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.MaDonHang} className="border-t">
                  <td className="p-3 font-medium">#{o.MaDonHang}</td>
                  <td className="p-3">{new Date(o.NgayDat).toLocaleDateString('vi-VN')}</td>
                  <td className="p-3">{o.hopDong?.coQuan?.Ten || '-'}</td>
                  <td className="p-3">{Number(o.TongTien).toLocaleString('vi-VN')} đ</td>
                  <td className="p-3">{o.chiTiet?.length || 0}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => openModal(o.MaDonHang)}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Xem xử lý
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr><td className="p-6 text-center text-slate-500" colSpan="6">Không có đơn hàng chờ kho xử lý</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal xử lý đơn */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  Xử lý kho — Đơn #{modal.order.MaDonHang}
                </h4>
                <p className="mt-0.5 text-sm text-slate-500">
                  {modal.order.hopDong?.coQuan?.Ten || '-'} &middot;{' '}
                  {new Date(modal.order.NgayDat).toLocaleDateString('vi-VN')} &middot;{' '}
                  <span className="font-medium text-slate-700">
                    {Number(modal.order.TongTien).toLocaleString('vi-VN')} đ
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              {/* Cảnh báo thiếu hàng */}
              {modal.order.chiTiet.some((d) => d.SoLuongDat > d.hangHoa.SoLuongTrongKho) && (
                <Alert variant="error" className="mb-4">
                  <strong className="block mb-1">Cảnh báo tồn kho không đủ</strong>
                  <ul className="list-disc pl-4 space-y-0.5 text-sm">
                    {modal.order.chiTiet
                      .filter((d) => d.SoLuongDat > d.hangHoa.SoLuongTrongKho)
                      .map((d) => (
                        <li key={d.MaHangHoa}>
                          <strong>{d.hangHoa.Ten}</strong>: đặt {d.SoLuongDat}, tồn kho chỉ còn{' '}
                          <strong className="text-red-700">{d.hangHoa.SoLuongTrongKho}</strong>
                          {d.hangHoa.SoLuongTrongKho === 0 ? ' — hết hàng' : ' — sẽ giao một phần'}
                        </li>
                      ))}
                  </ul>
                </Alert>
              )}

              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="rounded-tl-lg p-3 text-left">Hàng hóa</th>
                    <th className="p-3 text-center">SL đặt</th>
                    <th className="p-3 text-center">Tồn kho</th>
                    <th className="p-3 text-center">SL giao</th>
                    <th className="rounded-tr-lg p-3 text-left">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {modal.order.chiTiet.map((d) => {
                    const qty = Number(modal.quantities[d.MaHangHoa] || 0);
                    const shortage = qty < d.SoLuongDat;
                    return (
                      <tr key={d.MaHangHoa} className={`border-t ${shortage ? 'bg-red-50' : ''}`}>
                        <td className="p-3 font-medium">{d.hangHoa.Ten}</td>
                        <td className="p-3 text-center">{d.SoLuongDat}</td>
                        <td className={`p-3 text-center font-semibold ${d.hangHoa.SoLuongTrongKho < d.SoLuongDat ? 'text-red-600' : 'text-slate-700'}`}>
                          {d.hangHoa.SoLuongTrongKho}
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={Math.min(d.SoLuongDat, d.hangHoa.SoLuongTrongKho)}
                            value={modal.quantities[d.MaHangHoa] ?? ''}
                            onChange={(e) =>
                              setModal((prev) => ({
                                ...prev,
                                quantities: { ...prev.quantities, [d.MaHangHoa]: e.target.value }
                              }))
                            }
                            disabled={modal.order.TrangThai !== 'DaDuyet'}
                            className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-center"
                          />
                        </td>
                        <td className={`p-3 text-sm ${shortage ? 'font-semibold text-red-600' : 'text-slate-500'}`}>
                          {shortage
                            ? qty === 0
                              ? 'Hết hàng — không giao được'
                              : `Giao thiếu (còn thiếu ${d.SoLuongDat - qty})`
                            : 'Đủ hàng'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {modalAlert && (
                <Alert variant={modalAlert.type} className="mt-4">{modalAlert.msg}</Alert>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <p className="text-xs text-slate-400">
                {modal.order.chiTiet.some((d) => Number(modal.quantities[d.MaHangHoa] || 0) < d.SoLuongDat)
                  ? 'Một số mặt hàng sẽ được giao thiếu — đơn sẽ chuyển sang trạng thái Giao một phần.'
                  : 'Tất cả mặt hàng đủ hàng — đơn sẽ chuyển sang Sẵn sàng giao.'}
              </p>
              <button
                type="button"
                onClick={handleApprove}
                disabled={submitting || modal.order.TrangThai !== 'DaDuyet'}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận giao'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
