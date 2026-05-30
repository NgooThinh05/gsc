import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { apiRequest } from '../../api/client';
import Alert from '../../components/ui/Alert';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ─── Stat card icons ──────────────────────────────────────────────────────────
const icons = {
  orders: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  ),
  lowStock: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  ),
  revenue: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  ),
  stock: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  ),
  value: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  outOfStock: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
};

function StatCard({ label, value, hint, colorClass, iconKey }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
        {icons[iconKey]}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-xl font-bold text-slate-900">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <h4 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      {children}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 animate-pulse">
      <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-2/3 rounded bg-slate-200" />
        <div className="h-5 w-1/2 rounded bg-slate-200" />
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 animate-pulse">
      <div className="mb-5 h-3 w-1/3 rounded bg-slate-200" />
      <div className="h-52 rounded-xl bg-slate-100" />
    </div>
  );
}

const vndShort = (v) =>
  v >= 1_000_000_000
    ? `${(v / 1_000_000_000).toFixed(1)}tỷ`
    : v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}tr`
    : v.toLocaleString('vi-VN');

const CustomTooltipVND = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-lg">
      <p className="mb-1 font-semibold text-slate-700">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {Number(p.value).toLocaleString('vi-VN')} đ
        </p>
      ))}
    </div>
  );
};

const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  return (
    <text
      x={cx + r * Math.cos(-midAngle * R)}
      y={cy + r * Math.sin(-midAngle * R)}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const REFRESH_INTERVAL = 30_000;

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback((isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);

    return Promise.all([
      apiRequest('/dashboard/stats'),
      apiRequest('/dashboard/revenue-report'),
      apiRequest('/dashboard/inventory-report'),
    ])
      .then(([s, r, inv]) => {
        setStats(s);
        setRevenue(r);
        setInventory(inv);
        setLastUpdated(new Date());
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    fetchData(true);
    intervalRef.current = setInterval(() => fetchData(false), REFRESH_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  const invoiceStatusData = revenue
    ? [
        { name: 'Đã thanh toán', value: revenue.summary.paidRevenue },
        { name: 'Chờ thanh toán', value: revenue.summary.pendingRevenue },
        { name: 'Quá hạn', value: revenue.summary.overdueRevenue },
        { name: 'Đã huỷ', value: revenue.summary.cancelledRevenue },
      ].filter((d) => d.value > 0)
    : [];

  const topInventory = inventory
    ? [...inventory.rows]
        .sort((a, b) => b.SoLuongTrongKho - a.SoLuongTrongKho)
        .slice(0, 10)
        .map((r) => ({
          name: r.Ten.length > 18 ? r.Ten.slice(0, 16) + '…' : r.Ten,
          soluong: r.SoLuongTrongKho,
        }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 shadow-md">
        <div>
          <h3 className="text-lg font-bold text-white">Tổng quan hệ thống</h3>
          <p className="mt-0.5 text-sm text-blue-100">
            {lastUpdated
              ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString('vi-VN')} — tự làm mới mỗi 30 giây`
              : 'Số liệu tổng hợp toàn hệ thống mua sắm công.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchData(false)}
          disabled={refreshing || loading}
          className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30 disabled:opacity-60"
        >
          <svg
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          {refreshing ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Main stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Tổng số đơn hàng"
            value={stats.orders.toLocaleString('vi-VN')}
            colorClass="bg-blue-100 text-blue-600"
            iconKey="orders"
          />
          <StatCard
            label="Mặt hàng sắp/đã hết"
            value={stats.lowStockItems}
            hint="Tồn kho ≤ 10"
            colorClass="bg-amber-100 text-amber-600"
            iconKey="lowStock"
          />
          <StatCard
            label="Tổng doanh thu"
            value={`${vndShort(Number(stats.revenue))} đ`}
            hint={Number(stats.revenue).toLocaleString('vi-VN') + ' đ'}
            colorClass="bg-emerald-100 text-emerald-600"
            iconKey="revenue"
          />
        </div>
      )}

      {/* Charts */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SkeletonChart /><SkeletonChart />
          <SkeletonChart /><SkeletonChart />
        </div>
      ) : revenue && inventory && (
        <>
          {/* Row 1 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title="Doanh thu theo tháng">
              {revenue.byMonth.length === 0 ? (
                <p className="py-14 text-center text-sm text-slate-400">Chưa có dữ liệu</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={revenue.byMonth} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="Thang" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={vndShort} tick={{ fontSize: 11 }} width={52} />
                    <Tooltip content={<CustomTooltipVND />} />
                    <Bar dataKey="TongTien" name="Doanh thu" fill="#3b82f6" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            <SectionCard title="Phân bổ trạng thái hóa đơn">
              {invoiceStatusData.length === 0 ? (
                <p className="py-14 text-center text-sm text-slate-400">Chưa có dữ liệu</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={invoiceStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={96}
                      dataKey="value"
                      labelLine={false}
                      label={<PieLabel />}
                    >
                      {invoiceStatusData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, name) => [`${Number(v).toLocaleString('vi-VN')} đ`, name]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SectionCard title="Top cơ quan theo doanh thu">
              {revenue.topAgencies.length === 0 ? (
                <p className="py-14 text-center text-sm text-slate-400">Chưa có dữ liệu</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    layout="vertical"
                    data={revenue.topAgencies.map((a) => ({
                      name: a.Ten.length > 22 ? a.Ten.slice(0, 20) + '…' : a.Ten,
                      TongTien: a.TongTien,
                    }))}
                    margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tickFormatter={vndShort} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltipVND />} />
                    <Bar dataKey="TongTien" name="Doanh thu" fill="#10b981" radius={[0, 5, 5, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            <SectionCard title="Tồn kho top 10 hàng hóa">
              {topInventory.length === 0 ? (
                <p className="py-14 text-center text-sm text-slate-400">Chưa có dữ liệu</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    layout="vertical"
                    data={topInventory}
                    margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [v, 'Số lượng tồn']} />
                    <Bar dataKey="soluong" name="Tồn kho" fill="#f59e0b" radius={[0, 5, 5, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          </div>

          {/* Row 3 — Line chart (chỉ khi có ≥ 2 tháng) */}
          {revenue.byMonth.length > 1 && (
            <SectionCard title="Xu hướng doanh thu theo thời gian">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={revenue.byMonth} margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="Thang" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={vndShort} tick={{ fontSize: 11 }} width={52} />
                  <Tooltip content={<CustomTooltipVND />} />
                  <Line
                    type="monotone"
                    dataKey="TongTien"
                    name="Doanh thu"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#8b5cf6' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </SectionCard>
          )}

          {/* Row 4 — Inventory stat cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Tổng mặt hàng"
              value={inventory.summary.productCount}
              colorClass="bg-slate-100 text-slate-600"
              iconKey="stock"
            />
            <StatCard
              label="Giá trị tồn kho"
              value={`${vndShort(inventory.summary.totalStockValue)} đ`}
              hint={Number(inventory.summary.totalStockValue).toLocaleString('vi-VN') + ' đ'}
              colorClass="bg-blue-100 text-blue-600"
              iconKey="value"
            />
            <StatCard
              label="Hàng sắp hết"
              value={inventory.summary.lowStock}
              hint={`Tồn ≤ ${inventory.summary.lowStockThreshold}`}
              colorClass="bg-amber-100 text-amber-600"
              iconKey="lowStock"
            />
            <StatCard
              label="Hàng hết kho"
              value={inventory.summary.outOfStock}
              colorClass="bg-red-100 text-red-600"
              iconKey="outOfStock"
            />
          </div>
        </>
      )}
    </div>
  );
}
