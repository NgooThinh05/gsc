import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import Alert from '../../components/ui/Alert';

const statusClasses = {
  ChoDuyet: 'bg-yellow-100 text-yellow-800',
  DaDuyet: 'bg-blue-100 text-blue-800',
  SanSangGiao: 'bg-emerald-100 text-emerald-800',
  GiaoMotPhan: 'bg-orange-100 text-orange-800',
  DaGiao: 'bg-green-100 text-green-800',
  Huy: 'bg-red-100 text-red-800',
};

const ORDER_LABEL = {
  ChoDuyet: 'Chờ duyệt', DaDuyet: 'Đã duyệt', SanSangGiao: 'Sẵn sàng giao',
  GiaoMotPhan: 'Giao một phần', DangGiao: 'Đang giao', DaGiao: 'Đã giao', Huy: 'Đã hủy',
};

export default function RejectionLettersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/orders')
      .then((data) => setOrders(data.filter((o) => o.ThuTuChoi?.length > 0)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Thư từ chối đơn hàng</h3>
      <p className="mt-1 text-sm text-slate-500">
        Danh sách các đơn hàng đã bị nhân viên hợp đồng từ chối kèm lí do.
      </p>

      {error && <Alert variant="error" className="mt-4">{error}</Alert>}

      {loading ? (
        <p className="mt-6 text-sm text-slate-400">Đang tải...</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Mã đơn</th>
                <th className="p-3">Ngày đặt</th>
                <th className="p-3">Hợp đồng</th>
                <th className="p-3">Cơ quan</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Tổng tiền</th>
                <th className="p-3">Lí do từ chối</th>
                <th className="p-3">Ngày từ chối</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) =>
                order.ThuTuChoi.map((letter, idx) => (
                  <tr key={`${order.MaDonHang}-${idx}`} className="border-t align-top">
                    {idx === 0 && (
                      <>
                        <td className="p-3 font-medium" rowSpan={order.ThuTuChoi.length}>#{order.MaDonHang}</td>
                        <td className="p-3" rowSpan={order.ThuTuChoi.length}>{new Date(order.NgayDat).toLocaleDateString('vi-VN')}</td>
                        <td className="p-3" rowSpan={order.ThuTuChoi.length}>#{order.MaHopDong}</td>
                        <td className="p-3" rowSpan={order.ThuTuChoi.length}>{order.hopDong?.coQuan?.Ten || '-'}</td>
                        <td className="p-3" rowSpan={order.ThuTuChoi.length}>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[order.TrangThai] || 'bg-slate-100 text-slate-700'}`}>
                            {ORDER_LABEL[order.TrangThai] ?? order.TrangThai}
                          </span>
                        </td>
                        <td className="p-3" rowSpan={order.ThuTuChoi.length}>{Number(order.TongTien).toLocaleString('vi-VN')} đ</td>
                      </>
                    )}
                    <td className="p-3 text-red-700">{letter.LiDo}</td>
                    <td className="p-3 text-slate-500">{new Date(letter.NgayGui).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))
              )}
              {orders.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-500" colSpan="8">Chưa có thư từ chối nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
