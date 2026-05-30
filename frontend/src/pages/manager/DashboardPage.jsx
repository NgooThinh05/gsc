import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';

function StatCard({ label, value, hint, color }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiRequest('/dashboard/stats').then(setStats).catch((error) => setMessage(error.message));
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Tổng quan hệ thống</h3>
        <p className="mt-1 text-sm text-slate-500">Số liệu tổng hợp toàn hệ thống mua sắm công.</p>
        {message && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</div>}
      </section>

      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Tổng số đơn hàng" value={stats.orders} color="text-blue-600" />
          <StatCard label="Mặt hàng sắp/đã hết" value={stats.lowStockItems} hint="Tồn kho ≤ 10" color="text-amber-600" />
          <StatCard label="Tổng doanh thu (hóa đơn)" value={`${Number(stats.revenue).toLocaleString('vi-VN')} đ`} color="text-emerald-600" />
        </div>
      )}
    </div>
  );
}
