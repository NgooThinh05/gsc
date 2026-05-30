import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import Alert from '../../components/ui/Alert';

const statusClasses = {
  ChoThanhToan: 'bg-yellow-100 text-yellow-800',
  DaThanhToan: 'bg-green-100 text-green-800',
  QuaHan: 'bg-red-100 text-red-800',
  Huy: 'bg-slate-100 text-slate-700'
};

export default function RevenueReportPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [agencies, setAgencies] = useState([]);
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (agencyId) params.set('agencyId', agencyId);
      const query = params.toString();
      setReport(await apiRequest(`/dashboard/revenue-report${query ? `?${query}` : ''}`));
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Tải báo cáo toàn bộ và danh sách cơ quan khi vào trang
  useEffect(() => {
    loadReport();
    apiRequest('/dashboard/agencies')
      .then(setAgencies)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleQuery(event) {
    event.preventDefault();
    loadReport();
  }

  function exportCSV() {
    if (!report) return;

    const headers = ['Mã hóa đơn,Mã đơn hàng,Cơ quan,Ngày lập,Tổng tiền,Trạng thái'];
    const rows = report.rows.map((r) =>
      [
        r.MaHoaDon,
        r.MaDonHang,
        `"${r.coQuan}"`,
        new Date(r.NgayLap).toLocaleDateString('vi-VN'),
        r.TongTien,
        r.TrangThai
      ].join(',')
    );

    const csvContent = [...headers, ...rows].join('\n');
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao_cao_doanh_thu_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const summary = report?.summary;

  return (
    <div className="space-y-6">
      {/* Filter section */}
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Báo cáo doanh thu</h3>
            <p className="mt-1 text-sm text-slate-500">Truy vấn doanh thu theo khoảng thời gian và cơ quan.</p>
          </div>
          <button
            type="button"
            onClick={exportCSV}
            disabled={!report}
            className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white disabled:opacity-60 hover:bg-emerald-700 transition-colors"
          >
            Xuất CSV
          </button>
        </div>
        {errorMsg && <Alert variant="error" className="mt-4">{errorMsg}</Alert>}
        <form onSubmit={handleQuery} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Từ ngày</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-300 px-4 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Đến ngày</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-300 px-4 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Cơ quan</label>
            <select
              value={agencyId}
              onChange={(e) => setAgencyId(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-300 px-4 py-2"
            >
              <option value="">Tất cả cơ quan</option>
              {agencies.map((a) => (
                <option key={a.MaCoQuan} value={a.MaCoQuan}>{a.Ten}</option>
              ))}
            </select>
          </div>
          <button
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white disabled:opacity-60 hover:bg-blue-700 transition-colors"
          >
            {loading ? 'Đang truy vấn...' : 'Truy vấn'}
          </button>
          {(from || to || agencyId) && (
            <button
              type="button"
              onClick={() => { setFrom(''); setTo(''); setAgencyId(''); }}
              className="rounded-lg bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Xóa lọc
            </button>
          )}
        </form>
      </section>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Hóa đơn quá hạn</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{summary.overdueInvoiceCount}</p>
            <p className="mt-1 text-xs text-slate-400">{summary.overdueRevenue.toLocaleString('vi-VN')} đ</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Hóa đơn đã hủy</p>
            <p className="mt-1 text-2xl font-bold text-slate-500">{summary.cancelledInvoiceCount}</p>
            <p className="mt-1 text-xs text-slate-400">{summary.cancelledRevenue.toLocaleString('vi-VN')} đ</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Thanh toán đúng hạn</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{summary.onTimePaymentRate}%</p>
            <p className="mt-1 text-xs text-slate-400">{summary.paidOnTimeCount} hóa đơn</p>
          </div>
        </div>
      )}

      {/* Chart: Monthly revenue bar chart */}
      {report?.byMonth && report.byMonth.length > 0 && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h4 className="mb-4 font-bold text-slate-900">Biểu đồ doanh thu theo tháng</h4>
          <div className="space-y-2">
            {(() => {
              const maxRevenue = Math.max(...report.byMonth.map(r => r.TongTien));
              return report.byMonth.map((row) => (
                <div key={row.Thang} className="flex items-center gap-3">
                  <span className="w-16 text-right text-sm font-medium text-slate-600">{row.Thang}</span>
                  <div className="flex-1 h-7 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{
                        width: maxRevenue > 0 ? `${(row.TongTien / maxRevenue) * 100}%` : '0%',
                        minWidth: row.TongTien > 0 ? '2.5rem' : undefined
                      }}
                    />
                  </div>
                  <span className="w-36 text-right text-sm font-semibold text-slate-700">
                    {row.TongTien.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              ));
            })()}
          </div>
        </section>
      )}

      {/* Three analysis tables */}
      {report && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h4 className="font-bold text-slate-900">Doanh thu theo cơ quan</h4>
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-3">Cơ quan</th>
                    <th className="p-3 text-right">Số HĐ</th>
                    <th className="p-3 text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byAgency.map((row) => (
                    <tr key={row.Ten} className="border-t">
                      <td className="p-3 font-medium">{row.Ten}</td>
                      <td className="p-3 text-right text-slate-600">{row.SoLuongHoaDon}</td>
                      <td className="p-3 text-right">{row.TongTien.toLocaleString('vi-VN')} đ</td>
                    </tr>
                  ))}
                  {report.byAgency.length === 0 && (
                    <tr><td className="p-6 text-center text-slate-500" colSpan="3">Không có dữ liệu</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h4 className="font-bold text-slate-900">Doanh thu theo hợp đồng</h4>
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-3">Hợp đồng</th>
                    <th className="p-3 text-right">Số HĐ</th>
                    <th className="p-3 text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byContract.map((row) => (
                    <tr key={row.MaHopDong ?? 'khac'} className="border-t">
                      <td className="p-3 font-medium">{row.TenHopDong}</td>
                      <td className="p-3 text-right text-slate-600">{row.SoLuongHoaDon}</td>
                      <td className="p-3 text-right">{row.TongTien.toLocaleString('vi-VN')} đ</td>
                    </tr>
                  ))}
                  {report.byContract.length === 0 && (
                    <tr><td className="p-6 text-center text-slate-500" colSpan="3">Không có dữ liệu</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h4 className="font-bold text-slate-900">Doanh thu theo tháng</h4>
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-3">Tháng</th>
                    <th className="p-3 text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byMonth.map((row) => (
                    <tr key={row.Thang} className="border-t">
                      <td className="p-3 font-medium">{row.Thang}</td>
                      <td className="p-3 text-right">{row.TongTien.toLocaleString('vi-VN')} đ</td>
                    </tr>
                  ))}
                  {report.byMonth.length === 0 && (
                    <tr><td className="p-6 text-center text-slate-500" colSpan="2">Không có dữ liệu</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Top 5 Agencies */}
      {report?.topAgencies && report.topAgencies.length > 0 && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h4 className="font-bold text-slate-900">Top 5 cơ quan doanh thu cao nhất</h4>
          <div className="mt-4 space-y-4">
            {report.topAgencies.map((row, index) => {
              const maxAmount = report.topAgencies[0].TongTien;
              return (
                <div key={row.Ten}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-slate-400' :
                        index === 2 ? 'bg-amber-700' : 'bg-slate-300'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{row.Ten}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{row.TongTien.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                      style={{ width: maxAmount > 0 ? `${(row.TongTien / maxAmount) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Invoice detail table */}
      {report && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h4 className="font-bold text-slate-900">Chi tiết hóa đơn</h4>
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-3">Mã HĐ</th>
                  <th className="p-3">Mã đơn</th>
                  <th className="p-3">Cơ quan</th>
                  <th className="p-3">Ngày lập</th>
                  <th className="p-3 text-right">Tổng tiền</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.MaHoaDon} className="border-t hover:bg-slate-50">
                    <td className="p-3 font-medium">#{row.MaHoaDon}</td>
                    <td className="p-3">#{row.MaDonHang}</td>
                    <td className="p-3">{row.coQuan}</td>
                    <td className="p-3">{new Date(row.NgayLap).toLocaleDateString('vi-VN')}</td>
                    <td className="p-3 text-right">{row.TongTien.toLocaleString('vi-VN')} đ</td>
                    <td className="p-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[row.TrangThai] || 'bg-slate-100 text-slate-700'}`}>
                        {row.TrangThai === 'ChoThanhToan' && 'Chờ thanh toán'}
                        {row.TrangThai === 'DaThanhToan' && 'Đã thanh toán'}
                        {row.TrangThai === 'QuaHan' && 'Quá hạn'}
                        {row.TrangThai === 'Huy' && 'Đã hủy'}
                        {!['ChoThanhToan', 'DaThanhToan', 'QuaHan', 'Huy'].includes(row.TrangThai) && row.TrangThai}
                      </span>
                    </td>
                  </tr>
                ))}
                {report.rows.length === 0 && (
                  <tr><td className="p-6 text-center text-slate-500" colSpan="6">Không có hóa đơn trong khoảng thời gian này</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
