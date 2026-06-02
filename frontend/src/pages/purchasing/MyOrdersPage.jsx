import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiRequest } from '../../api/client';
import Alert from '../../components/ui/Alert';
import { useOrderUpdates } from '../../lib/useOrderUpdates';

const statusClasses = {
  ChoDuyet:    'bg-yellow-100 text-yellow-800',
  DaDuyet:     'bg-blue-100 text-blue-800',
  SanSangGiao: 'bg-emerald-100 text-emerald-800',
  GiaoMotPhan: 'bg-orange-100 text-orange-800',
  DangGiao:    'bg-sky-100 text-sky-800',
  DaGiao:      'bg-green-100 text-green-800',
  Huy:         'bg-red-100 text-red-800'
};

const ORDER_LABEL = {
  ChoDuyet: 'Chờ duyệt', DaDuyet: 'Đã duyệt', SanSangGiao: 'Sẵn sàng giao',
  GiaoMotPhan: 'Giao một phần', DangGiao: 'Đang giao', DaGiao: 'Đã giao', Huy: 'Đã hủy'
};
const DELIVERY_LABEL = {
  DangDongGoi: 'Đang đóng gói', DangGiao: 'Đang giao', DaGiao: 'Đã giao', ThatBai: 'Thất bại'
};
const INVOICE_LABEL = {
  ChoThanhToan: 'Chờ thanh toán', DaThanhToan: 'Đã thanh toán', QuaHan: 'Quá hạn', Huy: 'Đã hủy'
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
  const [paymentOrderId, setPaymentOrderId] = useState(null);
  const paymentOrder = orders.find((o) => o.MaDonHang === paymentOrderId) || null;
  const [paymentMethod, setPaymentMethod] = useState('ChuyenKhoan');
  const [payStatus, setPayStatus] = useState('idle'); // idle | waiting | paid | error
  const [payResult, setPayResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      order.MaDonHang.toString().includes(searchTerm) ||
      (order.MaHopDong && order.MaHopDong.toString().includes(searchTerm)) ||
      (order.hopDong?.coQuan?.Ten || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.chiTiet.some((detail) =>
        detail.hangHoa.Ten.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus = selectedStatus === 'All' || order.TrangThai === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  function loadOrders() {
    return apiRequest('/orders').then(setOrders);
  }

  useEffect(() => {
    loadOrders().catch((error) => setErrorMsg(error.message));
  }, []);

  useOrderUpdates(() => {
    loadOrders().catch((error) => setErrorMsg(error.message));
  });

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
      if (invoice.PhuongThuc === 'TienMat') {
        setPayStatus('cash_requested');
      } else {
        setPayStatus('idle');
      }
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
    const invoice = order.hoaDons?.[0];
    if (invoice && invoice.PhuongThuc === 'TienMat' && invoice.TrangThai === 'ChoThanhToan') {
      setPaymentMethod('TienMat');
      setPayStatus('cash_requested');
    } else {
      setPaymentMethod('ChuyenKhoan');
      setPayStatus('idle');
    }
    setPaymentOrderId(order.MaDonHang);
  }

  async function requestCashPayment(order) {
    const invoice = order.hoaDons?.[0];
    if (!invoice) return;

    setPayStatus('waiting');
    setErrorMsg('');
    try {
      await apiRequest(`/invoices/${invoice.MaHoaDon}/request-cash`, {
        method: 'PATCH'
      });
      setPayStatus('cash_requested');
      await loadOrders();
    } catch (error) {
      setPayStatus('error');
      setErrorMsg(error.message);
    }
  }

  function closePayment() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPaymentOrderId(null);
    setPayStatus('idle');
    setPayResult(null);
  }

  const paymentInvoice = paymentOrder?.hoaDons?.[0];
  const paymentAmount = paymentOrder ? getPaymentAmount(paymentOrder) : 0;
  // Nội dung QR "giả" mô phỏng chuẩn VietQR (ngân hàng quét sẽ đọc được các trường này).
  const qrPayload = paymentOrder
    ? `VIETQR|BANK=VCB|ACC=0123456789|NAME=CTY GSC|AMOUNT=${paymentAmount}|ADDINFO=DH${paymentOrder.MaDonHang}-HD${paymentInvoice?.MaHoaDon ?? ''}`
    : '';

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.TrangThai === 'ChoDuyet').length,
    active: orders.filter((o) => ['DaDuyet','SanSangGiao','GiaoMotPhan','DangGiao'].includes(o.TrangThai)).length,
    done: orders.filter((o) => o.TrangThai === 'DaGiao').length,
    unpaid: orders.filter((o) => o.hoaDons?.some((inv) => inv.TrangThai === 'ChoThanhToan')).length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Tổng đơn', value: stats.total, color: 'text-slate-900' },
          { label: 'Chờ duyệt', value: stats.pending, color: 'text-amber-600' },
          { label: 'Đang xử lý', value: stats.active, color: 'text-blue-600' },
          { label: 'Đã giao', value: stats.done, color: 'text-emerald-600' },
          { label: 'Chờ thanh toán', value: stats.unpaid, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Đơn hàng của tôi</h3>
      <p className="mt-1 text-sm text-slate-500">Theo dõi trạng thái duyệt, xuất kho, giao thiếu/giao đủ và hóa đơn của các đơn đã đặt.</p>
      {errorMsg && <Alert variant="error" className="mt-4">{errorMsg}</Alert>}

      {/* Tìm kiếm và Lọc trạng thái */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm theo mã đơn, mã hợp đồng, tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-10 text-sm placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-slate-700 whitespace-nowrap">Trạng thái:</label>
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          >
            <option value="All">Tất cả trạng thái</option>
            {Object.entries(ORDER_LABEL).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3">Mã đơn</th>
              <th className="p-3">Ngày đặt</th>
              <th className="p-3">Hợp đồng</th>
              <th className="p-3">Cơ quan</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Lí do từ chối</th>
              <th className="p-3">SL giao/đặt</th>
              <th className="p-3">Tổng gốc</th>
              <th className="p-3">Giao hàng</th>
              <th className="p-3">Hóa đơn</th>
              <th className="p-3">Thanh toán</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
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
                      {ORDER_LABEL[order.TrangThai] ?? order.TrangThai}
                    </span>
                  </td>

                  <td className="p-3 text-sm text-red-700">
                    {order.TrangThai === 'Huy' && order.ThuTuChoi && order.ThuTuChoi.length > 0 ? (
                      <ul className="list-disc pl-4">
                        {order.ThuTuChoi.map((t) => <li key={t.MaThuTuChoi}>{t.LiDo}</li>)}
                      </ul>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="p-3">{getFulfillmentText(order)}</td>
                  <td className="p-3">{Number(order.TongTien).toLocaleString('vi-VN')} đ</td>
                  <td className="p-3">{order.giaoHangs?.[0]?.TrangThai ? (DELIVERY_LABEL[order.giaoHangs[0].TrangThai] ?? order.giaoHangs[0].TrangThai) : 'Chưa tạo phiếu'}</td>
                  <td className="p-3">{invoice?.TrangThai ? (INVOICE_LABEL[invoice.TrangThai] ?? invoice.TrangThai) : 'Chưa lập'}</td>
                  <td className="p-3">
                    {paid ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                        Đã thanh toán
                      </span>
                    ) : invoice?.PhuongThuc === 'TienMat' ? (
                      <button
                        type="button"
                        onClick={() => openPayment(order)}
                        className="rounded-lg bg-orange-500 hover:bg-orange-600 px-3 py-2 text-xs font-semibold text-white transition-colors"
                      >
                        Chờ xác nhận TM
                      </button>
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
            {filteredOrders.length === 0 && (
              <tr>
                <td className="p-6 text-center text-slate-500" colSpan="11">
                  {orders.length === 0 ? 'Bạn chưa có đơn hàng nào' : 'Không tìm thấy đơn hàng phù hợp'}
                </td>
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
                disabled={payStatus === 'paid' || payStatus === 'cash_requested' || paymentInvoice?.PhuongThuc === 'TienMat'}
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
                <p className="mt-3 text-lg font-bold text-green-700">Đã thanh toán thành công</p>
                <p className="mt-1 text-sm text-slate-600">
                  Phương thức: <span className="font-semibold text-slate-900">{paymentMethod === 'TienMat' ? 'Tiền mặt' : 'Chuyển khoản (QR)'}</span>
                </p>
                {payResult?.MaGiaoDich && (
                  <p className="text-sm text-slate-600">
                    Mã giao dịch: <span className="font-mono font-semibold text-slate-900">{payResult.MaGiaoDich}</span>
                  </p>
                )}
                <p className="text-sm text-slate-500 mt-2">
                  Hóa đơn đã được xác nhận thanh toán thành công trên hệ thống.
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
            ) : payStatus === 'cash_requested' ? (
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                  <svg className="h-8 w-8 text-orange-600 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="mt-3 text-lg font-bold text-orange-700">Đã đăng ký thanh toán tiền mặt</p>
                <p className="mt-1 text-sm text-slate-600">
                  Đang chờ Nhân viên Hợp đồng kiểm tra thực tế và xác nhận đã nhận số tiền: <span className="font-semibold text-slate-900">{paymentAmount.toLocaleString('vi-VN')} đ</span>.
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  (Vui lòng bàn giao tiền mặt trực tiếp cho nhân viên của GSC để hoàn tất thanh toán).
                </p>
              </div>
            ) : payStatus === 'waiting' ? (
              <div className="flex flex-col items-center text-center py-4">
                <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                <p className="mt-3 text-sm text-blue-700">Đang gửi yêu cầu đăng ký...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <p className="text-sm text-slate-600 mb-3">Bạn đã chọn thanh toán bằng Tiền mặt. Vui lòng bấm đăng ký để hệ thống lưu hồ sơ đối soát.</p>
                <button
                  type="button"
                  onClick={() => requestCashPayment(paymentOrder)}
                  className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition-all shadow-sm active:scale-95"
                >
                  Yêu cầu thanh toán tiền mặt
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {filteredOrders.map((order) => (
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
    </div>
  );
}
