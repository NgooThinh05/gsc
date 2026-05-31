import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import Alert from '../../components/ui/Alert';
import { useAuthStore } from '../../store/authStore';

const INVOICE_STATUS_LABEL = {
  ChoThanhToan: 'Chờ thanh toán',
  DaThanhToan: 'Đã thanh toán',
  QuaHan: 'Quá hạn',
  Huy: 'Đã hủy'
};

const INVOICE_STATUS_BADGE = {
  ChoThanhToan: 'bg-amber-100 text-amber-700',
  DaThanhToan: 'bg-emerald-100 text-emerald-700',
  QuaHan: 'bg-red-100 text-red-700',
  Huy: 'bg-slate-100 text-slate-500'
};

const PHUONG_THUC_LABEL = { ChuyenKhoan: 'Chuyển khoản (QR)', TienMat: 'Tiền mặt' };

export default function InvoiceListPage() {
  const user = useAuthStore((s) => s.user);
  const isHopDong = user?.VaiTro === 'NhanVienHopDong';

  const [invoices, setInvoices] = useState([]);
  const [alert, setAlert] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [confirming, setConfirming] = useState(null);

  async function loadData() {
    const invoiceList = await apiRequest('/invoices');
    setInvoices(invoiceList);
  }

  useEffect(() => {
    loadData().catch((error) => setAlert({ msg: error.message, type: 'error' }));
  }, []);

  async function confirmCash(invoice) {
    setConfirming(invoice.MaHoaDon);
    setAlert(null);
    try {
      await apiRequest(`/invoices/${invoice.MaHoaDon}/pay`, {
        method: 'POST',
        body: JSON.stringify({ PhuongThuc: 'TienMat' })
      });
      await loadData();
      setAlert({ msg: `Đã xác nhận nhận tiền mặt cho hóa đơn #${invoice.MaHoaDon}.`, type: 'success' });
    } catch (err) {
      setAlert({ msg: err.message, type: 'error' });
    } finally {
      setConfirming(null);
    }
  }

  const pendingCount = invoices.filter((inv) => inv.TrangThai === 'ChoThanhToan').length;
  const paidRevenue = invoices.filter((inv) => inv.TrangThai === 'DaThanhToan').reduce((sum, inv) => sum + Number(inv.TongTien), 0);
  const cashPendingCount = invoices.filter((inv) => inv.TrangThai === 'ChoThanhToan' && inv.PhuongThuc === 'TienMat').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Tổng hóa đơn', value: invoices.length, color: 'text-slate-900' },
          { label: 'Chờ thanh toán', value: pendingCount, color: 'text-amber-600' },
          { label: 'Đã thu (đ)', value: paidRevenue.toLocaleString('vi-VN'), color: 'text-emerald-600' },
          { label: 'Chờ xác nhận TM', value: cashPendingCount, color: 'text-orange-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Danh sách Hóa đơn</h3>
        <p className="mt-1 text-sm text-slate-500">
          Hóa đơn được lập tự động khi xác nhận giao hàng thành công. Tổng tiền tính theo số lượng thực tế đã giao.
        </p>
        {alert && <Alert variant={alert.type} className="mt-4">{alert.msg}</Alert>}
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Mã hóa đơn</th>
                <th className="p-3">Mã đơn</th>
                <th className="p-3">Cơ quan</th>
                <th className="p-3">Ngày lập</th>
                <th className="p-3">Tổng tiền</th>
                <th className="p-3">H.thức TT</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const isCashPending = isHopDong
                  && invoice.TrangThai === 'ChoThanhToan'
                  && invoice.PhuongThuc === 'TienMat';
                return (
                  <tr key={invoice.MaHoaDon} className={`border-t align-top ${isCashPending ? 'bg-orange-50' : ''}`}>
                    <td className="p-3 font-medium">#{invoice.MaHoaDon}</td>
                    <td className="p-3">#{invoice.MaDonHang}</td>
                    <td className="p-3">{invoice.donHang?.hopDong?.coQuan?.Ten || '-'}</td>
                    <td className="p-3">{new Date(invoice.NgayLap).toLocaleDateString('vi-VN')}</td>
                    <td className="p-3">{Number(invoice.TongTien).toLocaleString('vi-VN')} đ</td>
                    <td className="p-3">
                      {invoice.PhuongThuc ? (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${invoice.PhuongThuc === 'TienMat' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {PHUONG_THUC_LABEL[invoice.PhuongThuc] || invoice.PhuongThuc}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${INVOICE_STATUS_BADGE[invoice.TrangThai] ?? 'bg-slate-100 text-slate-500'}`}>
                        {INVOICE_STATUS_LABEL[invoice.TrangThai] ?? invoice.TrangThai}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(invoice)}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Xem chi tiết
                        </button>
                        {isCashPending && (
                          <button
                            type="button"
                            disabled={confirming === invoice.MaHoaDon}
                            onClick={() => confirmCash(invoice)}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-slate-300"
                          >
                            {confirming === invoice.MaHoaDon ? 'Đang xử lý...' : 'Xác nhận đã nhận tiền'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-500" colSpan="8">Chưa có hóa đơn</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSelectedInvoice(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900">Chi tiết hóa đơn #{selectedInvoice.MaHoaDon}</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Đơn hàng #{selectedInvoice.MaDonHang} · {selectedInvoice.donHang?.hopDong?.coQuan?.Ten || '-'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Ngày lập</p>
                <p className="mt-1 font-semibold text-slate-900">{new Date(selectedInvoice.NgayLap).toLocaleDateString('vi-VN')}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Tổng tiền</p>
                <p className="mt-1 font-semibold text-slate-900">{Number(selectedInvoice.TongTien).toLocaleString('vi-VN')} đ</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Trạng thái</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {INVOICE_STATUS_LABEL[selectedInvoice.TrangThai] ?? selectedInvoice.TrangThai}
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3">Mặt hàng</th>
                    <th className="p-3">SL giao</th>
                    <th className="p-3">Đơn giá</th>
                    <th className="p-3">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.donHang?.chiTiet?.map((detail) => (
                    <tr key={`${selectedInvoice.MaHoaDon}-${detail.MaHangHoa}`} className="border-t">
                      <td className="p-3 font-medium">{detail.hangHoa.Ten}</td>
                      <td className="p-3">{detail.SoLuongGiao}</td>
                      <td className="p-3">{Number(detail.hangHoa.Gia).toLocaleString('vi-VN')} đ</td>
                      <td className="p-3">{(detail.SoLuongGiao * Number(detail.hangHoa.Gia)).toLocaleString('vi-VN')} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
