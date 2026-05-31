import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiRequest } from '../../api/client';
import Alert from '../../components/ui/Alert';

const STATUS_LABEL = {
  ChoThanhToan: 'Chờ thanh toán',
  DaThanhToan: 'Đã thanh toán',
  QuaHan: 'Quá hạn',
  Huy: 'Đã hủy'
};

const STATUS_BADGE = {
  ChoThanhToan: 'bg-amber-100 text-amber-700',
  DaThanhToan: 'bg-emerald-100 text-emerald-700',
  QuaHan: 'bg-red-100 text-red-700',
  Huy: 'bg-slate-100 text-slate-500'
};

const PHUONG_THUC_LABEL = {
  ChuyenKhoan: 'Chuyển khoản (QR)',
  TienMat: 'Tiền mặt'
};

// modal = { invoice, step: 'choose' | 'qr' }
export default function PaymentPage() {
  const [invoices, setInvoices] = useState([]);
  const [alert, setAlert] = useState(null);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);

  async function loadInvoices() {
    try {
      setInvoices(await apiRequest('/invoices'));
    } catch (err) {
      setAlert({ type: 'error', msg: err.message });
    }
  }

  useEffect(() => { loadInvoices(); }, []);

  function openPayModal(inv) {
    setModal({ invoice: inv, step: 'choose' });
    setAlert(null);
  }

  function closeModal() {
    if (!busy) setModal(null);
  }

  async function handleSelectCash() {
    setBusy(true);
    try {
      await apiRequest(`/invoices/${modal.invoice.MaHoaDon}/request-cash`, { method: 'PATCH' });
      await loadInvoices();
      setModal(null);
      setAlert({ type: 'success', msg: `Đã đăng ký thanh toán tiền mặt cho hóa đơn #${modal.invoice.MaHoaDon}. Nhân viên hợp đồng sẽ xác nhận sau khi nhận tiền.` });
    } catch (err) {
      setAlert({ type: 'error', msg: err.message });
      setModal(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmQR() {
    setBusy(true);
    try {
      await apiRequest(`/invoices/${modal.invoice.MaHoaDon}/pay`, {
        method: 'POST',
        body: JSON.stringify({ PhuongThuc: 'ChuyenKhoan' })
      });
      await loadInvoices();
      setModal(null);
      setAlert({ type: 'success', msg: 'Thanh toán QR thành công! Hệ thống đã ghi nhận giao dịch.' });
    } catch (err) {
      setAlert({ type: 'error', msg: err.message });
      setModal(null);
    } finally {
      setBusy(false);
    }
  }

  const pending = invoices.filter((inv) => inv.TrangThai === 'ChoThanhToan');
  const rest = invoices.filter((inv) => inv.TrangThai !== 'ChoThanhToan');

  const qrPayload = modal?.invoice
    ? `VIETQR|BANK=VCB|ACC=0123456789|NAME=CTY GSC|AMOUNT=${Number(modal.invoice.TongTien)}|ADDINFO=HD${modal.invoice.MaHoaDon}`
    : '';

  const pendingTotal = pending.reduce((sum, inv) => sum + Number(inv.TongTien), 0);
  const paidCount = rest.filter((inv) => inv.TrangThai === 'DaThanhToan').length;
  const paidTotal = rest.filter((inv) => inv.TrangThai === 'DaThanhToan').reduce((sum, inv) => sum + Number(inv.TongTien), 0);
  const cashWaiting = pending.filter((inv) => inv.PhuongThuc === 'TienMat').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Chờ thanh toán', value: pending.length, color: 'text-amber-600' },
          { label: 'Tổng còn lại (đ)', value: pendingTotal.toLocaleString('vi-VN'), color: 'text-amber-700' },
          { label: `Đã thanh toán (${paidCount})`, value: paidTotal.toLocaleString('vi-VN') + ' đ', color: 'text-emerald-600' },
          { label: 'Chờ xác nhận TM', value: cashWaiting, color: 'text-orange-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {alert && <Alert variant={alert.type}>{alert.msg}</Alert>}

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Hóa đơn chờ thanh toán</h3>
        <p className="mt-1 text-sm text-slate-500">
          Bấm "Thanh toán" để chọn hình thức. QR được xác nhận tự động; tiền mặt cần nhân viên hợp đồng xác nhận.
        </p>

        {pending.length === 0 ? (
          <div className="mt-6 rounded-lg border border-slate-100 py-10 text-center text-slate-400">
            <svg className="mx-auto mb-3 h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
            </svg>
            Không có hóa đơn nào chờ thanh toán
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {pending.map((inv) => {
              const isCashPending = inv.PhuongThuc === 'TienMat';
              return (
                <div key={inv.MaHoaDon} className={`rounded-xl border p-5 ${isCashPending ? 'border-orange-200 bg-orange-50/40' : 'border-amber-200 bg-amber-50/40'}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Hóa đơn <span className="text-blue-600">#{inv.MaHoaDon}</span>
                        {' · '}Đơn hàng <span className="text-slate-700">#{inv.MaDonHang}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Ngày lập: {new Date(inv.NgayLap).toLocaleDateString('vi-VN')}
                        {inv.donHang?.hopDong?.coQuan?.Ten && <>&nbsp;· {inv.donHang.hopDong.coQuan.Ten}</>}
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">{Number(inv.TongTien).toLocaleString('vi-VN')} đ</p>

                      {isCashPending && (
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          Chờ NV hợp đồng xác nhận tiền mặt
                        </span>
                      )}
                    </div>

                    {!isCashPending && (
                      <button
                        type="button"
                        onClick={() => openPayModal(inv)}
                        className="shrink-0 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                        </svg>
                        Thanh toán
                      </button>
                    )}
                  </div>

                  {inv.donHang?.chiTiet?.length > 0 && (
                    <div className="mt-4 overflow-hidden rounded-lg border border-amber-200 bg-white">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium">Mặt hàng</th>
                            <th className="px-3 py-2 text-right font-medium">SL giao</th>
                            <th className="px-3 py-2 text-right font-medium">Đơn giá</th>
                            <th className="px-3 py-2 text-right font-medium">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inv.donHang.chiTiet.map((d) => (
                            <tr key={d.MaHangHoa} className="border-t">
                              <td className="px-3 py-2 font-medium text-slate-800">{d.hangHoa?.Ten || `#${d.MaHangHoa}`}</td>
                              <td className="px-3 py-2 text-right text-slate-600">{d.SoLuongGiao}</td>
                              <td className="px-3 py-2 text-right text-slate-600">{d.hangHoa ? `${Number(d.hangHoa.Gia).toLocaleString('vi-VN')} đ` : '—'}</td>
                              <td className="px-3 py-2 text-right font-semibold text-slate-900">
                                {(d.SoLuongGiao * Number(d.hangHoa?.Gia || 0)).toLocaleString('vi-VN')} đ
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {rest.length > 0 && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Lịch sử hóa đơn</h3>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã HĐ</th>
                  <th className="px-4 py-3 font-semibold">Mã đơn</th>
                  <th className="px-4 py-3 font-semibold">Ngày lập</th>
                  <th className="px-4 py-3 font-semibold">Tổng tiền</th>
                  <th className="px-4 py-3 font-semibold">Ngày TT</th>
                  <th className="px-4 py-3 font-semibold">H.thức</th>
                  <th className="px-4 py-3 font-semibold">Mã GD</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((inv) => (
                  <tr key={inv.MaHoaDon} className="border-t transition-colors hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-semibold text-slate-700">#{inv.MaHoaDon}</td>
                    <td className="px-4 py-3">#{inv.MaDonHang}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(inv.NgayLap).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3 font-semibold">{Number(inv.TongTien).toLocaleString('vi-VN')} đ</td>
                    <td className="px-4 py-3 text-slate-500">{inv.NgayThanhToan ? new Date(inv.NgayThanhToan).toLocaleDateString('vi-VN') : '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{PHUONG_THUC_LABEL[inv.PhuongThuc] || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{inv.MaGiaoDich || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[inv.TrangThai] ?? 'bg-slate-100 text-slate-500'}`}>
                        {STATUS_LABEL[inv.TrangThai] ?? inv.TrangThai}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Payment Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={closeModal}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  {modal.step === 'qr' ? 'Quét mã QR' : 'Chọn hình thức thanh toán'}
                </h4>
                <p className="mt-0.5 text-sm text-slate-500">
                  Hóa đơn <span className="font-semibold text-blue-600">#{modal.invoice.MaHoaDon}</span>
                  {' · '}
                  <span className="font-semibold text-slate-700">{Number(modal.invoice.TongTien).toLocaleString('vi-VN')} đ</span>
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={closeModal}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
              >
                Đóng
              </button>
            </div>

            {/* Step: choose method */}
            {modal.step === 'choose' && (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {/* QR option */}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setModal((m) => ({ ...m, step: 'qr' }))}
                  className="flex flex-col items-center gap-3 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-5 text-center hover:border-blue-400 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-700">Chuyển khoản</p>
                    <p className="mt-0.5 text-xs text-blue-500">Quét mã QR ngân hàng</p>
                  </div>
                </button>

                {/* Cash option */}
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSelectCash}
                  className="flex flex-col items-center gap-3 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-5 text-center hover:border-slate-400 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Tiền mặt</p>
                    <p className="mt-0.5 text-xs text-slate-500">NV hợp đồng xác nhận</p>
                  </div>
                </button>
              </div>
            )}

            {/* Step: QR */}
            {modal.step === 'qr' && (
              <div className="mt-5">
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <QRCodeSVG value={qrPayload} size={180} level="M" marginSize={4} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500">Số tiền</p>
                    <p className="text-lg font-bold text-blue-600">{Number(modal.invoice.TongTien).toLocaleString('vi-VN')} đ</p>
                    <p className="mt-1 text-xs text-slate-500">Nội dung: HD{modal.invoice.MaHoaDon}</p>
                  </div>
                </div>
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setModal((m) => ({ ...m, step: 'choose' }))}
                    className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleConfirmQR}
                    className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {busy ? 'Đang xử lý...' : 'Xác nhận đã quét'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
