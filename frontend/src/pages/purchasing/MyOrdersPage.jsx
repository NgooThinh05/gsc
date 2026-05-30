import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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

// Thời gian "ngân hàng" tự xác nhận sau khi quét QR (mô phỏng).
const AUTO_CONFIRM_MS = 5000;

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
  const [payStatus, setPayStatus] = useState('idle'); // idle | waiting | paid | error
  const [payResult, setPayResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef(null);

  function loadOrders() {
    return apiRequest('/orders').then(setOrders);
  }

  useEffect(() => {
    loadOrders().catch((error) => setErrorMsg(error.message));
  }, []);

  async function runPayment(order, method) {
    const invoice = order.hoaDons?.[0];
    if (!invoice) return;

    try {
      const updated = await apiRequest(`/invoices/${invoice.MaHoaDon}/pay`, {
        method: 'POST',
        body: JSON.stringify({ PhuongThuc: method })
      });
      setPayResult(updated);
      setPayStatus('paid');
      await loadOrders();
    } catch (error) {
      setPayStatus('error');
      setErrorMsg(error.message);
    }
  }

  // Khi mở thanh toán bằng QR: hiện QR rồi tự động xác nhận sau vài giây.
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!paymentOrder) return undefined;

    const invoice = paymentOrder.hoaDons?.[0];
    if (!invoice) return undefined;

    if (invoice.TrangThai === 'DaThanhToan') {
      setPayResult(invoice);
      setPayStatus('paid');
      return undefined;
    }

    setPayResult(null);

    if (paymentMethod !== 'ChuyenKhoan') {
      setPayStatus('idle');
      return undefined;
    }

    setPayStatus('waiting');
    timerRef.current = setTimeout(() => {
      runPayment(paymentOrder, paymentMethod);
    }, AUTO_CONFIRM_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentOrder, paymentMethod]);

  function openPayment(order) {
    setErrorMsg('');
    setPaymentMethod('ChuyenKhoan');
    setPaymentOrder(order);
  }

  function closePayment() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPaymentOrder(null);
    setPayStatus('idle');
    setPayResult(null);
  }

  const paymentInvoice = paymentOrder?.hoaDons?.[0];
  const paymentAmount = paymentOrder ? getPaymentAmount(paymentOrder) : 0;
  // Nội dung QR "giả" mô phỏng chuẩn VietQR (ngân hàng quét sẽ đọc được các trường này).
  const qrPayload = paymentOrder
    ? `VIETQR|BANK=VCB|ACC=0123456789|NAME=CTY GSC|AMOUNT=${paymentAmount}|ADDINFO=DH${paymentOrder.MaDonHang}-HD${paymentInvoice?.MaHoaDon ?? ''}`
    : '';

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Đơn hàng của tôi</h3>
      <p className="mt-1 text-sm text-slate-500">Theo dõi trạng thái duyệt, xuất kho, giao thiếu/giao đủ và hóa đơn của các đơn đã đặt.</p>
      {errorMsg && <Alert variant="error" className="mt-4">{errorMsg}</Alert>}

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
            {orders.map((order) => {
              const invoice = order.hoaDons?.[0];
              const paid = invoice?.TrangThai === 'DaThanhToan';
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
                  <td className="p-3">{getFulfillmentText(order)}</td>
                  <td className="p-3">{Number(order.TongTien).toLocaleString('vi-VN')} đ</td>
                  <td className="p-3">{order.giaoHangs?.[0]?.TrangThai || 'Chưa tạo phiếu'}</td>
                  <td className="p-3">{invoice?.TrangThai || 'Chưa lập'}</td>
                  <td className="p-3">
                    {paid ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                        Đã thanh toán
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openPayment(order)}
                        disabled={!invoice}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-slate-300"
                      >
                        Thanh toán
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
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
            <button type="button" onClick={closePayment} className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-700">Đóng</button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-4">
              <p className="text-sm text-slate-500">Số tiền</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{paymentAmount.toLocaleString('vi-VN')} đ</p>
            </div>
            <div className="rounded-lg bg-white p-4">
              <p className="text-sm text-slate-500">Phương thức</p>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                disabled={payStatus === 'paid'}
                className="mt-2 w-full rounded-lg border px-3 py-2"
              >
                <option value="ChuyenKhoan">Chuyển khoản (QR)</option>
                <option value="TienMat">Tiền mặt</option>
              </select>
            </div>
            <div className="rounded-lg bg-white p-4">
              <p className="text-sm text-slate-500">Tài khoản ngân hàng</p>
              <p className="mt-1 font-semibold text-slate-900">0123456789</p>
              <p className="text-sm text-slate-600">Ngân hàng Vietcombank - CTY GSC</p>
              <p className="text-sm text-slate-600">Nội dung: DH{paymentOrder.MaDonHang}</p>
            </div>
          </div>

          {/* Khu vực mã QR + trạng thái thanh toán */}
          <div className="mt-4 rounded-lg bg-white p-5">
            {payStatus === 'paid' ? (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p className="mt-3 text-lg font-bold text-green-700">Thanh toán thành công</p>
                <p className="mt-1 text-sm text-slate-600">
                  Mã giao dịch: <span className="font-mono font-semibold text-slate-900">{payResult?.MaGiaoDich}</span>
                </p>
                <p className="text-sm text-slate-500">
                  Đã gửi thông báo tới nhân viên mua sắm, nhân viên hợp đồng và quản lý.
                </p>
              </div>
            ) : paymentMethod === 'ChuyenKhoan' ? (
              <div className="flex flex-col items-center text-center">
                <div className="rounded-xl border border-slate-200 p-3">
                  <QRCodeSVG value={qrPayload} size={180} level="M" includeMargin />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-700">Quét mã QR bằng app ngân hàng để thanh toán</p>
                {payStatus === 'waiting' && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-blue-700">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    Đang chờ ngân hàng xác nhận giao dịch...
                  </p>
                )}
                {payStatus === 'error' && (
                  <button
                    type="button"
                    onClick={() => runPayment(paymentOrder, paymentMethod)}
                    className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Thử lại
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <p className="text-sm text-slate-600">Xác nhận đã nhận tiền mặt để hoàn tất hóa đơn.</p>
                <button
                  type="button"
                  onClick={() => runPayment(paymentOrder, paymentMethod)}
                  className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Xác nhận đã thanh toán
                </button>
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
