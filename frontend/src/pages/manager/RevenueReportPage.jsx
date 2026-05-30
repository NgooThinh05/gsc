import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';

const statusClasses = {
  ChoThanhToan: 'bg-yellow-100 text-yellow-800',
  DaThanhToan: 'bg-green-100 text-green-800',
  QuaHan: 'bg-red-100 text-red-800',
  Huy: 'bg-slate-100 text-slate-700'
};

export default function RevenueReportPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setLoading(true);
    setMessage('');
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const query = params.toString();
      setReport(await apiRequest(`/dashboard/revenue-report${query ? `?${query}` : ''}`));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Tải báo cáo toàn bộ khi vào trang
  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleQuery(event) {
    event.preventDefault();
    loadReport();
  }

  const summary = report?.summary;

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Báo cáo doanh thu</h3>
        <p className="mt-1 text-sm text-slate-500">Truy vấn doanh thu theo khoảng thời gian (theo ngày lập hóa đơn).</p>
        {message && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</div>}
        <form onSubmit={handleQuery} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Từ ngày</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-4 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Đến ngày</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-4 py-2" />
          </div>
          <button disabled={loading} className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white disabled:opacity-60">
            {loading ? 'Đang truy vấn...' : 'Truy vấn'}
          </button>
          {(from || to) && (
            <button type="button" onClick={() => { setFrom(''); setTo(''); }} className="rounded-lg bg-slate-100 px-4 py-2 font-semibold text-slate-700">
              Xóa lọc
            </button>
          )}
        </form>
      </section>

      {summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Số hóa đơn</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{summary.invoiceCount}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Tổng doanh thu</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{summary.totalRevenue.toLocaleString('vi-VN')} đ</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Đã thanh toán</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{summary.paidRevenue.toLocaleString('vi-VN')} đ</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Chờ thanh toán</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{summary.pendingRevenue.toLocaleString('vi-VN')} đ</p>
          </div>
        </div>
      )}

      {report && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h4 className="font-bold text-slate-900">Doanh thu theo cơ quan</h4>
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700"><tr><th className="p-3">Cơ quan</th><th className="p-3">Doanh thu</th></tr></thead>
                <tbody>
                  {report.byAgency.map((row) => (
                    <tr key={row.Ten} className="border-t"><td className="p-3 font-medium">{row.Ten}</td><td className="p-3">{row.TongTien.toLocaleString('vi-VN')} đ</td></tr>
                  ))}
                  {report.byAgency.length === 0 && <tr><td className="p-6 text-center text-slate-500" colSpan="2">Không có dữ liệu</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h4 className="font-bold text-slate-900">Doanh thu theo tháng</h4>
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700"><tr><th className="p-3">Tháng</th><th className="p-3">Doanh thu</th></tr></thead>
                <tbody>
                  {report.byMonth.map((row) => (
                    <tr key={row.Thang} className="border-t"><td className="p-3 font-medium">{row.Thang}</td><td className="p-3">{row.TongTien.toLocaleString('vi-VN')} đ</td></tr>
                  ))}
                  {report.byMonth.length === 0 && <tr><td className="p-6 text-center text-slate-500" colSpan="2">Không có dữ liệu</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {report && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h4 className="font-bold text-slate-900">Chi tiết hóa đơn</h4>
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-3">Mã HĐ</th>
                  <th className="p-3">Mã đơn</th>
                  <th className="p-3">Cơ quan</th>
                  <th className="p-3">Ngày lập</th>
                  <th className="p-3">Tổng tiền</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.MaHoaDon} className="border-t">
                    <td className="p-3 font-medium">#{row.MaHoaDon}</td>
                    <td className="p-3">#{row.MaDonHang}</td>
                    <td className="p-3">{row.coQuan}</td>
                    <td className="p-3">{new Date(row.NgayLap).toLocaleDateString('vi-VN')}</td>
                    <td className="p-3">{row.TongTien.toLocaleString('vi-VN')} đ</td>
                    <td className="p-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[row.TrangThai] || 'bg-slate-100 text-slate-700'}`}>{row.TrangThai}</span>
                    </td>
                  </tr>
                ))}
                {report.rows.length === 0 && <tr><td className="p-6 text-center text-slate-500" colSpan="6">Không có hóa đơn trong khoảng thời gian này</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
