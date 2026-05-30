import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../../api/client';

const POLL_MS = 15000;

function timeAgo(dateString) {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return new Date(dateString).toLocaleDateString('vi-VN');
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const unread = notifications.filter((item) => !item.DaDoc).length;

  async function load() {
    try {
      const data = await apiRequest('/notifications');
      setNotifications(data);
    } catch {
      // im lặng: thông báo không phải chức năng cốt lõi
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function markRead(item) {
    if (item.DaDoc) return;
    setNotifications((prev) => prev.map((n) => (n.MaThongBao === item.MaThongBao ? { ...n, DaDoc: true } : n)));
    try {
      await apiRequest(`/notifications/${item.MaThongBao}/read`, { method: 'POST' });
    } catch {
      // bỏ qua
    }
  }

  async function markAll() {
    setNotifications((prev) => prev.map((n) => ({ ...n, DaDoc: true })));
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
    } catch {
      // bỏ qua
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
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
        <div className="absolute right-0 z-20 mt-2 w-96 max-w-[90vw] rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="font-semibold text-slate-900">Thông báo</span>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-xs font-semibold text-blue-600 hover:underline">
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500">Chưa có thông báo</p>
            )}
            {notifications.map((item) => (
              <button
                key={item.MaThongBao}
                type="button"
                onClick={() => markRead(item)}
                className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${
                  item.DaDoc ? '' : 'bg-blue-50/60'
                }`}
              >
                {!item.DaDoc && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                <span className={item.DaDoc ? 'pl-5' : ''}>
                  <span className="block text-sm text-slate-800">{item.NoiDung}</span>
                  <span className="mt-1 block text-xs text-slate-400">{timeAgo(item.createdAt)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
