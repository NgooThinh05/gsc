import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';

export default function WarehouseOrderDetailPage() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [deliveryQuantities, setDeliveryQuantities] = useState({});
  const [products, setProducts] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [productForm, setProductForm] = useState({ Ten: '', SoLuongTrongKho: '', Gia: '' });
  const [message, setMessage] = useState('');

  async function loadProducts() {
    setProducts(await apiRequest('/products'));
  }

  async function loadPendingOrders() {
    setPendingOrders(await apiRequest('/orders'));
  }

  async function loadPageData() {
    await Promise.all([loadProducts(), loadPendingOrders()]);
  }

  useEffect(() => {
    loadPageData().catch((error) => setMessage(error.message));
  }, []);

  async function loadOrder(targetOrderId = orderId) {
    setMessage('');
    try {
      const loadedOrder = await apiRequest(`/orders/${targetOrderId}`);
      setOrder(loadedOrder);
      setOrderId(String(loadedOrder.MaDonHang));
      setDeliveryQuantities(Object.fromEntries(
        loadedOrder.chiTiet.map((detail) => [
          detail.MaHangHoa,
          detail.SoLuongGiao || Math.min(detail.SoLuongDat, detail.hangHoa.SoLuongTrongKho)
        ])
      ));
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function approveOrder() {
    setMessage('');
    try {
      const items = order.chiTiet.map((detail) => ({
        MaHangHoa: detail.MaHangHoa,
        SoLuongGiao: Number(deliveryQuantities[detail.MaHangHoa] || 0)
      }));

      setOrder(await apiRequest(`/warehouse/orders/${orderId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ items })
      }));
      await loadPageData();
      setMessage('Đã xác nhận số lượng giao, cập nhật kho và chuyển đơn sang phần giao hàng');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleCreateProduct(event) {
    event.preventDefault();
    setMessage('');

    try {
      await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(productForm)
      });
      setProductForm({ Ten: '', SoLuongTrongKho: '', Gia: '' });
      await loadProducts();
      setMessage('Thêm mặt hàng vào kho thành công');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Thêm mặt hàng kho máy tính</h3>
        <form onSubmit={handleCreateProduct} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            value={productForm.Ten}
            onChange={(event) => setProductForm((current) => ({ ...current, Ten: event.target.value }))}
            placeholder="Tên mặt hàng, ví dụ: RAM 16GB DDR4"
            className="rounded-lg border border-slate-300 px-4 py-3 md:col-span-2"
            required
          />
          <input
            value={productForm.SoLuongTrongKho}
            onChange={(event) => setProductForm((current) => ({ ...current, SoLuongTrongKho: event.target.value }))}
            type="number"
            min="0"
            placeholder="Số lượng"
            className="rounded-lg border border-slate-300 px-4 py-3"
            required
          />
          <input
            value={productForm.Gia}
            onChange={(event) => setProductForm((current) => ({ ...current, Gia: event.target.value }))}
            type="number"
            min="1"
            placeholder="Giá"
            className="rounded-lg border border-slate-300 px-4 py-3"
            required
          />
          <button className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white md:col-span-4">Thêm mặt hàng</button>
        </form>
        {message && <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">{message}</div>}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Danh sách tồn kho</h3>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
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
              {products.map((product) => (
                <tr key={product.MaHangHoa} className="border-t">
                  <td className="p-3">#{product.MaHangHoa}</td>
                  <td className="p-3 font-medium">{product.Ten}</td>
                  <td className="p-3">{product.SoLuongTrongKho}</td>
                  <td className="p-3">{Number(product.Gia).toLocaleString('vi-VN')} đ</td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-500" colSpan="4">Chưa có mặt hàng</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Đơn hàng chờ kho xử lý</h3>
        <p className="mt-1 text-sm text-slate-500">Danh sách các đơn đang ở trạng thái Chờ duyệt để kho kiểm tra tồn và phân bổ số lượng giao.</p>
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
              {pendingOrders.map((pendingOrder) => (
                <tr key={pendingOrder.MaDonHang} className="border-t">
                  <td className="p-3 font-medium">#{pendingOrder.MaDonHang}</td>
                  <td className="p-3">{new Date(pendingOrder.NgayDat).toLocaleDateString('vi-VN')}</td>
                  <td className="p-3">{pendingOrder.hopDong?.coQuan?.Ten || '-'}</td>
                  <td className="p-3">{Number(pendingOrder.TongTien).toLocaleString('vi-VN')} đ</td>
                  <td className="p-3">{pendingOrder.chiTiet?.length || 0}</td>
                  <td className="p-3">
                    <button type="button" onClick={() => loadOrder(pendingOrder.MaDonHang)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
                      Xem xử lý
                    </button>
                  </td>
                </tr>
              ))}
              {pendingOrders.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-500" colSpan="6">Không có đơn hàng chờ kho xử lý</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Chi tiết đơn hàng cho NV Kho</h3>
        <div className="mt-4 flex gap-3">
          <input
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            placeholder="Nhập MaDonHang"
            className="rounded-lg border border-slate-300 px-4 py-3"
          />
          <button onClick={() => loadOrder()} className="rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white">Tải đơn</button>
          <button onClick={approveOrder} className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white">Xác nhận giao</button>
        </div>
        {order && (
          <div className="mt-6">
            <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
              <div className="rounded-lg bg-slate-50 p-4"><b>Mã đơn:</b> {order.MaDonHang}</div>
              <div className="rounded-lg bg-slate-50 p-4"><b>Trạng thái:</b> {order.TrangThai}</div>
              <div className="rounded-lg bg-slate-50 p-4"><b>Tổng gốc:</b> {Number(order.TongTien).toLocaleString('vi-VN')} đ</div>
            </div>
            <table className="w-full overflow-hidden rounded-lg text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-3">Hàng hóa</th>
                  <th className="p-3">SL đặt</th>
                  <th className="p-3">Tồn kho</th>
                  <th className="p-3">Số lượng giao</th>
                  <th className="p-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {order.chiTiet.map((detail) => {
                  const deliveryQuantity = Number(deliveryQuantities[detail.MaHangHoa] || 0);
                  const shortage = deliveryQuantity < detail.SoLuongDat;
                  return (
                    <tr key={detail.MaHangHoa} className={`border-t ${shortage ? 'bg-red-50 text-red-800' : 'bg-white'}`}>
                      <td className="p-3 font-medium">{detail.hangHoa.Ten}</td>
                      <td className="p-3">{detail.SoLuongDat}</td>
                      <td className="p-3">{detail.hangHoa.SoLuongTrongKho}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          max={Math.min(detail.SoLuongDat, detail.hangHoa.SoLuongTrongKho)}
                          value={deliveryQuantities[detail.MaHangHoa] ?? ''}
                          onChange={(event) => setDeliveryQuantities((current) => ({
                            ...current,
                            [detail.MaHangHoa]: event.target.value
                          }))}
                          className="w-32 rounded-lg border border-slate-300 px-3 py-2"
                          disabled={order.TrangThai !== 'ChoDuyet'}
                        />
                      </td>
                      <td className="p-3">{shortage ? 'Giao thiếu' : 'Đủ hàng'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
