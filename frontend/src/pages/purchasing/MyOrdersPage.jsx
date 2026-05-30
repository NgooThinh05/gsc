import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';

const statusClasses = {
  ChoDuyet: 'bg-yellow-100 text-yellow-800',
  DaDuyet: 'bg-blue-100 text-blue-800',
  SanSangGiao: 'bg-emerald-100 text-emerald-800',
  GiaoMotPhan: 'bg-orange-100 text-orange-800',
  DaGiao: 'bg-green-100 text-green-800',
  Huy: 'bg-red-100 text-red-800'
};

function getFulfillmentText(order) {
  const ordered = order.chiTiet.reduce((sum, detail) => sum + detail.SoLuongDat, 0);
  const delivered = order.chiTiet.reduce((sum, detail) => sum + detail.SoLuongGiao, 0);
  return `${delivered}/${ordered}`;
}

function getPaymentAmount(order) {
  const invoiceTotal = order.hoaDons?.[0]?.TongTien;

  if (invoiceTotal !== undefined) {
    return Number(invoiceTotal);
  }

  return order.chiTiet.reduce((sum, detail) => sum + detail.SoLuongGiao * Number(detail.hangHoa.Gia), 0);
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('ChuyenKhoan');
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiRequest('/orders').then(setOrders).catch((error) => setMessage(error.message));
  }, []);

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Đơn hàng của tôi</h3>
      <p className="mt-1 text-sm text-slate-500">Theo dõi trạng thái duyệt, xuất kho, giao thiếu/giao đủ và hóa đơn của các đơn đã đặt.</p>
      {message && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</div>}

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3">Mã đơn</th>
              <th className="p-3">Ngày đặt</th>
              <th className="p-3">Hợp đồng</th>
              <th className="p-3">Cơ quan</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">SL giao/đặt</th>
              <th className="p-3">Tổng gốc</th>
              <th className="p-3">Giao hàng</th>
              <th className="p-3">Hóa đơn</th>
              <th className="p-3">Thanh toán</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.MaDonHang} className="border-t align-top">
                <td className="p-3 font-medium">#{order.MaDonHang}</td>
                <td className="p-3">{new Date(order.NgayDat).toLocaleDateString('vi-VN')}</td>
                <td className="p-3">#{order.MaHopDong}</td>
                <td className="p-3">{order.hopDong?.coQuan?.Ten || '-'}</td>
                <td className="p-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[order.TrangThai] || 'bg-slate-100 text-slate-700'}`}>
                    {order.TrangThai}
                  </span>
                </td>
                <td className="p-3">{getFulfillmentText(order)}</td>
                <td className="p-3">{Number(order.TongTien).toLocaleString('vi-VN')} đ</td>
                <td className="p-3">{order.giaoHangs?.[0]?.TrangThai || 'Chưa tạo phiếu'}</td>
                <td className="p-3">{order.hoaDons?.[0]?.TrangThai || 'Chưa lập'}</td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => setPaymentOrder(order)}
                    disabled={!order.hoaDons?.[0]}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-slate-300"
                  >
                    Thanh toán
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td className="p-6 text-center text-slate-500" colSpan="10">Bạn chưa có đơn hàng nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {paymentOrder && (
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-lg font-bold text-blue-950">Thanh toán đơn #{paymentOrder.MaDonHang}</h4>
              <p className="mt-1 text-sm text-blue-800">Số tiền cần thanh toán theo hóa đơn/số lượng thực giao.</p>
            </div>
            <button type="button" onClick={() => setPaymentOrder(null)} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-700">Đóng</button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-4">
              <p className="text-sm text-slate-500">Số tiền</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{getPaymentAmount(paymentOrder).toLocaleString('vi-VN')} đ</p>
            </div>
            <div className="rounded-lg bg-white p-4">
              <p className="text-sm text-slate-500">Phương thức</p>
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2">
                <option value="ChuyenKhoan">Chuyển khoản</option>
                <option value="TienMat">Tiền mặt</option>
              </select>
            </div>
            {paymentMethod === 'ChuyenKhoan' && (
              <div className="rounded-lg bg-white p-4">
                <p className="text-sm text-slate-500">Tài khoản ngân hàng</p>
                <p className="mt-1 font-semibold text-slate-900">0123456789</p>
                <p className="text-sm text-slate-600">Ngân hàng Vietcombank - CTY GSC</p>
                <p className="text-sm text-slate-600">Nội dung: DH{paymentOrder.MaDonHang}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <div key={`detail-${order.MaDonHang}`} className="rounded-lg border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-900">Chi tiết đơn #{order.MaDonHang}</h4>
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3">Hàng hóa</th>
                    <th className="p-3">SL đặt</th>
                    <th className="p-3">SL giao</th>
                    <th className="p-3">Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
                  {order.chiTiet.map((detail) => {
                    const shortage = detail.SoLuongGiao < detail.SoLuongDat && !['ChoDuyet', 'DaDuyet'].includes(order.TrangThai);
                    return (
                      <tr key={`${order.MaDonHang}-${detail.MaHangHoa}`} className={`border-t ${shortage ? 'bg-red-50 text-red-800' : ''}`}>
                        <td className="p-3 font-medium">{detail.hangHoa.Ten}</td>
                        <td className="p-3">{detail.SoLuongDat}</td>
                        <td className="p-3">{detail.SoLuongGiao}</td>
                        <td className="p-3">{shortage ? 'Giao thiếu' : detail.SoLuongGiao > 0 ? 'Đã phân bổ' : 'Chờ xử lý kho'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
