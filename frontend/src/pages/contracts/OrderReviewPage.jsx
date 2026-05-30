import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import Alert from '../../components/ui/Alert';

const statusClasses = {
  ChoDuyet: 'bg-yellow-100 text-yellow-800',
  DaDuyet: 'bg-blue-100 text-blue-800',
  SanSangGiao: 'bg-emerald-100 text-emerald-800',
  GiaoMotPhan: 'bg-orange-100 text-orange-800',
  DaGiao: 'bg-green-100 text-green-800',
  Huy: 'bg-red-100 text-red-800'
};

// Đơn hàng mà nhân viên hợp đồng còn có thể xác nhận từ chối (tiến trình 2.4)
const REJECTABLE = ['ChoDuyet', 'DaDuyet'];

export default function OrderReviewPage() {
  const [orders, setOrders] = useState([]);
  const [rejectOrder, setRejectOrder] = useState(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadOrders = () =>
    apiRequest('/orders')
      .then(setOrders)
      .catch((err) => setError(err.message));

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleReject(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await apiRequest(`/orders/${rejectOrder.MaDonHang}/reject`, {
        method: 'POST',
        body: JSON.stringify({ LiDo: reason })
      });
      setMessage(`Đã từ chối đơn #${rejectOrder.MaDonHang}.`);
      setRejectOrder(null);
      setReason('');
      await loadOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Duyệt đơn hàng</h3>
      <p className="mt-1 text-sm text-slate-500">
        Theo dõi đơn đặt hàng và xác nhận từ chối đơn vi phạm (sai hợp đồng, vượt số lượng hoặc hạn mức chi phí).
      </p>

      {message && <Alert variant="success" className="mt-4">{message}</Alert>}
      {error && <Alert variant="error" className="mt-4">{error}</Alert>}

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
              <th className="p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const rejection = order.ThuTuChoi?.[0];
              const rejectable = REJECTABLE.includes(order.TrangThai);
              const violation = order.danhGia && !order.danhGia.valid;
              // Chỉ khi có lí do từ chối (đơn vi phạm và còn ở bước duyệt) thì nút mới bấm được
              const canReject = rejectable && violation && !rejection;
              const reasons = rejection ? [rejection.LiDo] : (rejectable && violation ? order.danhGia.reasons : []);
              return (
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
                  <td className="p-3">{Number(order.TongTien).toLocaleString('vi-VN')} đ</td>
                  <td className="p-3 text-red-700">
                    {reasons.length > 0 ? (
                      <ul className="list-disc space-y-1 pl-4">
                        {reasons.map((reasonText, index) => <li key={index}>{reasonText}</li>)}
                      </ul>
                    ) : '-'}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectOrder(order);
                        setReason(order.danhGia?.reasons?.join('; ') || '');
                        setMessage('');
                        setError('');
                      }}
                      disabled={!canReject}
                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      Từ chối
                    </button>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td className="p-6 text-center text-slate-500" colSpan="8">Chưa có đơn hàng nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ====== MODAL TỪ CHỐI ====== */}
      {rejectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !submitting && setRejectOrder(null)}>
          <form onSubmit={handleReject} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-red-950">Từ chối đơn hàng #{rejectOrder.MaDonHang}</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Đơn của <strong>{rejectOrder.hopDong?.coQuan?.Ten || 'Không xác định'}</strong> — {Number(rejectOrder.TongTien).toLocaleString('vi-VN')} đ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRejectOrder(null)}
                disabled={submitting}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>

            {rejectOrder.danhGia?.reasons?.length > 0 && (
              <Alert variant="error" className="mt-4">
                <strong className="block mb-1">Lí do vi phạm:</strong>
                <ul className="list-disc pl-4 space-y-1">
                  {rejectOrder.danhGia.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </Alert>
            )}

            <div className="mt-4">
              <label className="text-sm font-semibold text-slate-700">Soạn thư từ chối</label>
              <p className="text-xs text-slate-400 mb-2">Thư từ chối này sẽ được gửi đến bên mua sắm và lưu vào hệ thống.</p>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                required
                rows={5}
                placeholder="Nhập lí do từ chối chi tiết..."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-400"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectOrder(null)}
                disabled={submitting}
                className="rounded-lg bg-slate-100 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting || !reason.trim()}
                className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
