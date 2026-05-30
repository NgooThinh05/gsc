import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';

export default function WarehouseReportPage() {
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiRequest('/dashboard/inventory-report').then(setReport).catch((error) => setMessage(error.message));
  }, []);

  const summary = report?.summary;

  function stockBadge(product) {
    if (product.SoLuongTrongKho === 0) return 'bg-red-100 text-red-700';
    if (product.SoLuongTrongKho <= (summary?.lowStockThreshold ?? 10)) return 'bg-amber-100 text-amber-700';
    return 'bg-emerald-100 text-emerald-700';
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Báo cáo kho</h3>
        <p className="mt-1 text-sm text-slate-500">Tổng hợp tồn kho, giá trị tồn và cảnh báo hàng sắp hết.</p>
        {message && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</div>}
      </section>

      {summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Số mặt hàng</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{summary.productCount}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Tổng giá trị tồn</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{summary.totalStockValue.toLocaleString('vi-VN')} đ</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Sắp hết (≤ {summary.lowStockThreshold})</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{summary.lowStock}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Đã hết hàng</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{summary.outOfStock}</p>
          </div>
        </div>
      )}

      {report && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h4 className="font-bold text-slate-900">Chi tiết tồn kho</h4>
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-3">Mã hàng</th>
                  <th className="p-3">Tên hàng hóa</th>
                  <th className="p-3">Tồn kho</th>
                  <th className="p-3">Đơn giá</th>
                  <th className="p-3">Giá trị tồn</th>
                  <th className="p-3">Vị trí</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((product) => (
                  <tr key={product.MaHangHoa} className="border-t">
                    <td className="p-3">#{product.MaHangHoa}</td>
                    <td className="p-3 font-medium">{product.Ten}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stockBadge(product)}`}>{product.SoLuongTrongKho}</span>
                    </td>
                    <td className="p-3">{product.Gia.toLocaleString('vi-VN')} đ</td>
                    <td className="p-3">{product.GiaTriTon.toLocaleString('vi-VN')} đ</td>
                    <td className="p-3">{product.ViTriKho || '-'}</td>
                    <td className="p-3">{product.TrangThai}</td>
                  </tr>
                ))}
                {report.rows.length === 0 && <tr><td className="p-6 text-center text-slate-500" colSpan="7">Chưa có mặt hàng</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
