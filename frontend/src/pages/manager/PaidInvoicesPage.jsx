import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../api/client';
import Alert from '../../components/ui/Alert';

export default function PaidInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    apiRequest('/invoices')
      .then(setInvoices)
      .catch((error) => setErrorMsg(error.message));
  }, []);

  const paid = useMemo(
    () => invoices.filter((invoice) => invoice.TrangThai === 'DaThanhToan'),
    [invoices]
  );

  const totalPaid = useMemo(
    () => paid.reduce((sum, invoice) => sum + Number(invoice.TongTien), 0),
    [paid]
  );

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Số hóa đơn đã thanh toán</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{paid.length}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
          <p className="text-sm text-slate-500">Tổng tiền đã thu</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{totalPaid.toLocaleString('vi-VN')} đ</p>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Hóa đơn đã thanh toán</h3>
        <p className="mt-1 text-sm text-slate-500">Tổng hợp các hóa đơn đã được cơ quan thanh toán, kèm mã giao dịch ngân hàng.</p>
        {errorMsg && <Alert variant="error" className="mt-4">{errorMsg}</Alert>}

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Mã HĐ</th>
                <th className="p-3">Mã đơn</th>
                <th className="p-3">Cơ quan</th>
                <th className="p-3">Phương thức</th>
                <th className="p-3">Mã giao dịch</th>
                <th className="p-3">Ngày thanh toán</th>
                <th className="p-3">Tổng tiền</th>
              </tr>
            </thead>
            <tbody>
              {paid.map((invoice) => (
                <tr key={invoice.MaHoaDon} className="border-t">
                  <td className="p-3 font-medium">#{invoice.MaHoaDon}</td>
                  <td className="p-3">#{invoice.MaDonHang}</td>
                  <td className="p-3">{invoice.donHang?.hopDong?.coQuan?.Ten || '-'}</td>
                  <td className="p-3">{invoice.PhuongThuc === 'TienMat' ? 'Tiền mặt' : 'Chuyển khoản (QR)'}</td>
                  <td className="p-3 font-mono text-xs">{invoice.MaGiaoDich || '-'}</td>
                  <td className="p-3">
                    {invoice.NgayThanhToan ? new Date(invoice.NgayThanhToan).toLocaleString('vi-VN') : '-'}
                  </td>
                  <td className="p-3 font-semibold">{Number(invoice.TongTien).toLocaleString('vi-VN')} đ</td>
                </tr>
              ))}
              {paid.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-500" colSpan="7">Chưa có hóa đơn nào được thanh toán</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
