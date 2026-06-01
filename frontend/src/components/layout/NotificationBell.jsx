import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../../api/client';

const POLL_MS = 15000;

const TYPE_CONFIG = {
  TuChoi:     { bg: 'bg-red-100',    icon: 'M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636',    color: 'text-red-600',     label: 'Từ chối' },
  DaDuyet:    { bg: 'bg-green-100',  icon: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',                                          color: 'text-green-600',   label: 'Đã duyệt' },
  DatHang:    { bg: 'bg-purple-100', icon: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z', color: 'text-purple-600', label: 'Đặt hàng' },
  SanSangGiao:{ bg: 'bg-orange-100', icon: 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12', color: 'text-orange-600', label: 'Sẵn sàng giao' },
  DangGiao:   { bg: 'bg-blue-100',   icon: 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12', color: 'text-blue-600',  label: 'Đang giao' },
  HoaDon:     { bg: 'bg-yellow-100', icon: 'M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z', color: 'text-yellow-600', label: 'Hóa đơn' },
  ThanhToan:  { bg: 'bg-emerald-100',icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z', color: 'text-emerald-600', label: 'Thanh toán' },
  ChoKy:      { bg: 'bg-sky-100',    icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10', color: 'text-sky-600',     label: 'Chờ ký' },
  DaKy:       { bg: 'bg-teal-100',   icon: 'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z', color: 'text-teal-600',    label: 'Đã ký' },
};

const DEFAULT_TYPE = { bg: 'bg-slate-100', icon: 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0', color: 'text-slate-500', label: 'Thông báo' };

function NotifIcon({ loai }) {
  const cfg = TYPE_CONFIG[loai] || DEFAULT_TYPE;
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
      <svg className={`h-4 w-4 ${cfg.color}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
      </svg>
    </span>
  );
}

function timeAgo(dateString) {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return new Date(dateString).toLocaleDateString('vi-VN');
}

const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unread', label: 'Chưa đọc' },
  { key: 'ChoKy', label: 'Chờ ký' },
  { key: 'DaKy', label: 'Đã ký' },
  { key: 'TuChoi', label: 'Từ chối' },
  { key: 'DaDuyet', label: 'Duyệt' },
  { key: 'HoaDon', label: 'Hóa đơn' },
  { key: 'ThanhToan', label: 'Thanh toán' },
];

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [detailOrder, setDetailOrder] = useState(null);
  const containerRef = useRef(null);

  const unread = notifications.filter((n) => !n.DaDoc).length;

  async function load() {
    try {
      const data = await apiRequest('/notifications');
      setNotifications(data);
    } catch {
      // thông báo không phải chức năng cốt lõi
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Khi mở panel: tự động đánh dấu tất cả đã đọc trên server
  async function handleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && unread > 0) {
      // Optimistic update ngay lập tức
      setNotifications((prev) => prev.map((n) => ({ ...n, DaDoc: true })));
      try {
        await apiRequest('/notifications/read-all', { method: 'POST' });
      } catch {
        // Nếu lỗi: load lại để đồng bộ
        await load();
      }
    }
  }

  async function deleteOne(e, id) {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.MaThongBao !== id));
    try {
      await apiRequest(`/notifications/${id}`, { method: 'DELETE' });
    } catch {
      await load();
    }
  }

  async function deleteAllReadHandler() {
    setNotifications((prev) => prev.filter((n) => !n.DaDoc));
    try {
      await apiRequest('/notifications/read', { method: 'DELETE' });
    } catch {
      await load();
    }
  }

  async function openNotification(item) {
    setDetailOrder(null);
    if (item.Loai === 'TuChoi' && item.MaDonHang) {
      try {
        const order = await apiRequest(`/orders/${item.MaDonHang}`);
        setDetailOrder(order);
        setOpen(false);
      } catch {
        // bỏ qua
      }
    } else {
      setOpen(false);
    }
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.DaDoc;
    if (filter === 'all') return true;
    return n.Loai === filter;
  });

  const hasRead = notifications.some((n) => n.DaDoc);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
        aria-label="Thông báo"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[26rem] max-w-[92vw] rounded-xl border border-slate-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="font-semibold text-slate-900">
              Thông báo {notifications.length > 0 && <span className="ml-1 text-xs font-normal text-slate-400">({notifications.length})</span>}
            </span>
            {hasRead && (
              <button
                type="button"
                onClick={deleteAllReadHandler}
                className="text-xs font-semibold text-red-500 hover:underline"
              >
                Xóa đã đọc
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 py-2 scrollbar-none">
            {FILTERS.map((f) => {
              const count = f.key === 'all'
                ? notifications.length
                : f.key === 'unread'
                ? notifications.filter((n) => !n.DaDoc).length
                : notifications.filter((n) => n.Loai === f.key).length;
              if (count === 0 && f.key !== 'all' && f.key !== 'unread') return null;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    filter === f.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}{count > 0 && ` (${count})`}
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="max-h-[22rem] overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Không có thông báo</p>
            )}
            {filtered.map((item) => (
              <div
                key={item.MaThongBao}
                className={`group flex items-start gap-3 border-b border-slate-50 px-4 py-3 transition hover:bg-slate-50 ${
                  item.DaDoc ? '' : 'bg-blue-50/50'
                }`}
              >
                <button
                  type="button"
                  className="flex flex-1 items-start gap-3 text-left"
                  onClick={() => openNotification(item)}
                >
                  <NotifIcon loai={item.Loai} />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${item.DaDoc ? 'text-slate-600' : 'font-medium text-slate-800'}`}>
                      {item.NoiDung}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-400">{timeAgo(item.createdAt)}</span>
                  </span>
                  {!item.DaDoc && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                </button>
                {/* Nút xóa */}
                <button
                  type="button"
                  onClick={(e) => deleteOne(e, item.MaThongBao)}
                  className="mt-1 shrink-0 rounded p-1 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  title="Xóa thông báo"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal chi tiết đơn từ chối */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetailOrder(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold">Chi tiết từ chối đơn #{detailOrder.MaDonHang}</h4>
              <button type="button" onClick={() => setDetailOrder(null)} className="text-sm font-semibold text-slate-700">Đóng</button>
            </div>
            <div className="mt-4">
              {detailOrder.ThuTuChoi?.length > 0 ? (
                <>
                  <p className="text-sm text-slate-500">Lí do từ chối:</p>
                  <ul className="mt-2 list-disc pl-6 text-sm text-red-700">
                    {detailOrder.ThuTuChoi.map((t) => <li key={t.MaThuTuChoi}>{t.LiDo}</li>)}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-slate-500">Không có thông tin từ chối chi tiết.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
