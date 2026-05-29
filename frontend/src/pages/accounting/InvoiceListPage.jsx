import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';

function calculateActualTotal(order) {
  return order.chiTiet.reduce((sum, detail) => sum + detail.SoLuongGiao * Number(detail.hangHoa.Gia), 0);
}

function getDeliveredSummary(order) {
  const ordered = order.chiTiet.reduce((sum, detail) => sum + detail.SoLuongDat, 0);
  const delivered = order.chiTiet.reduce((sum, detail) => sum + detail.SoLuongGiao, 0);
  return `${delivered}/${ordered}`;
}

export default function InvoiceListPage() {
  const [billableOrders, setBillableOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [message, setMessage] = useState('');

  async function loadData() {
    const [orders, invoiceList] = await Promise.all([
      apiRequest('/invoices/billable-orders'),
      apiRequest('/invoices')
    ]);
    setBillableOrders(orders);
    setInvoices(invoiceList);
  }

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message));
  }, []);

  async function createInvoice(order) {
    setMessage('');

    try {
      await apiRequest('/invoices', {
        method: 'POST',
        body: JSON.stringify({ MaDonHang: order.MaDonHang })
      });
      await loadData();
      setMessage('Lập hóa đơn thành công');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Đơn hàng cần lập hóa đơn</h3>
        <p className="mt-1 text-sm text-slate-500">Danh sách được tổng hợp từ các đơn đã có phiếu giao hàng. Tổng tiền tính theo số lượng thực tế giao.</p>
        {message && <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">{message}</div>}
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Mã đơn</th>
                <th className="p-3">Cơ quan</th>
                <th className="p-3">Trạng thái giao</th>
                <th className="p-3">SL giao/đặt</th>
                <th className="p-3">Tổng tiền thực giao</th>
                <th className="p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {billableOrders.map((order) => (
                <tr key={order.MaDonHang} className="border-t">
                  <td className="p-3 font-medium">#{order.MaDonHang}</td>
                  <td className="p-3">{order.hopDong?.coQuan?.Ten || '-'}</td>
                  <td className="p-3">{order.giaoHangs?.[0]?.TrangThai || '-'}</td>
                  <td className="p-3">{getDeliveredSummary(order)}</td>
                  <td className="p-3">{calculateActualTotal(order).toLocaleString('vi-VN')} đ</td>
                  <td className="p-3">
                    <button type="button" onClick={() => createInvoice(order)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
                      Lập hóa đơn
                    </button>
                  </td>
                </tr>
              ))}
              {billableOrders.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-500" colSpan="6">Không có đơn hàng cần lập hóa đơn</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Danh sách Hóa đơn</h3>
        <p className="mt-1 text-sm text-slate-500">Tổng tiền được tính theo số lượng thực tế đã giao, không lấy tổng tiền gốc của đơn đặt hàng.</p>
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Mã hóa đơn</th>
                <th className="p-3">Mã đơn</th>
                <th className="p-3">Cơ quan</th>
                <th className="p-3">Ngày lập</th>
                <th className="p-3">Tổng tiền</th>
                <th className="p-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.MaHoaDon} className="border-t align-top">
                  <td className="p-3 font-medium">#{invoice.MaHoaDon}</td>
                  <td className="p-3">#{invoice.MaDonHang}</td>
                  <td className="p-3">{invoice.donHang?.hopDong?.coQuan?.Ten || '-'}</td>
                  <td className="p-3">{new Date(invoice.NgayLap).toLocaleDateString('vi-VN')}</td>
                  <td className="p-3">{Number(invoice.TongTien).toLocaleString('vi-VN')} đ</td>
                  <td className="p-3">{invoice.TrangThai}</td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-500" colSpan="6">Chưa có hóa đơn</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-4">
          {invoices.map((invoice) => (
            <div key={`invoice-detail-${invoice.MaHoaDon}`} className="rounded-lg border border-slate-200 p-4">
              <h4 className="font-semibold text-slate-900">Chi tiết hóa đơn #{invoice.MaHoaDon}</h4>
              <div className="mt-3 overflow-hidden rounded-lg border border-slate-100">
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
                    {invoice.donHang?.chiTiet?.map((detail) => (
                      <tr key={`${invoice.MaHoaDon}-${detail.MaHangHoa}`} className="border-t">
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
          ))}
        </div>
      </section>
    </div>
  );
}
