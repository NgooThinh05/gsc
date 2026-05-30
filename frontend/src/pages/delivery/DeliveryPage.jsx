import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import Alert from '../../components/ui/Alert';

export default function DeliveryPage() {
  const [readyOrders, setReadyOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [forms, setForms] = useState({});
  const [alert, setAlert] = useState(null);

  async function loadData() {
    const [orders, deliveryList] = await Promise.all([
      apiRequest('/delivery/ready-orders'),
      apiRequest('/delivery')
    ]);
    setReadyOrders(orders);
    setDeliveries(deliveryList);
  }

  useEffect(() => {
    loadData().catch((error) => setAlert({ msg: error.message, type: 'error' }));
  }, []);

  function updateForm(orderId, field, value) {
    setForms((current) => ({
      ...current,
      [orderId]: {
        NgayGiao: current[orderId]?.NgayGiao || new Date().toISOString().slice(0, 10),
        DonViVanChuyen: current[orderId]?.DonViVanChuyen || '',
        ...current[orderId],
        [field]: value
      }
    }));
  }

  async function createDelivery(order) {
    const form = forms[order.MaDonHang] || {};
    setAlert(null);

    try {
      await apiRequest('/delivery', {
        method: 'POST',
        body: JSON.stringify({
          MaDonHang: order.MaDonHang,
          NgayGiao: form.NgayGiao || new Date().toISOString().slice(0, 10),
          DonViVanChuyen: form.DonViVanChuyen
        })
      });
      await loadData();
      setAlert({ msg: 'Tạo phiếu giao hàng thành công', type: 'success' });
    } catch (error) {
      setAlert({ msg: error.message, type: 'error' });
    }
  }

  async function confirmDelivered(deliveryId) {
    setAlert(null);

    try {
      await apiRequest(`/delivery/${deliveryId}/confirm-delivered`, { method: 'PATCH' });
      await loadData();
      setAlert({ msg: 'Đã xác nhận giao hàng thành công', type: 'success' });
    } catch (error) {
      setAlert({ msg: error.message, type: 'error' });
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Đơn hàng sẵn sàng giao</h3>
        <p className="mt-1 text-sm text-slate-500">Chọn ngày giao và đơn vị vận chuyển để tạo phiếu giao hàng.</p>
        {alert && <Alert variant={alert.type} className="mt-4">{alert.msg}</Alert>}
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Mã đơn</th>
                <th className="p-3">Cơ quan</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">SL giao/đặt</th>
                <th className="p-3">Ngày giao</th>
                <th className="p-3">Đơn vị vận chuyển</th>
                <th className="p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {readyOrders.map((order) => {
                const ordered = order.chiTiet.reduce((sum, detail) => sum + detail.SoLuongDat, 0);
                const delivered = order.chiTiet.reduce((sum, detail) => sum + detail.SoLuongGiao, 0);
                const hasDelivery = order.giaoHangs?.length > 0;
                return (
                  <tr key={order.MaDonHang} className="border-t align-top">
                    <td className="p-3 font-medium">#{order.MaDonHang}</td>
                    <td className="p-3">{order.hopDong?.coQuan?.Ten || '-'}</td>
                    <td className="p-3">{order.TrangThai}</td>
                    <td className="p-3">{delivered}/{ordered}</td>
                    <td className="p-3">
                      <input
                        type="date"
                        className="rounded-lg border px-3 py-2"
                        value={forms[order.MaDonHang]?.NgayGiao || new Date().toISOString().slice(0, 10)}
                        onChange={(event) => updateForm(order.MaDonHang, 'NgayGiao', event.target.value)}
                        disabled={hasDelivery}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        className="rounded-lg border px-3 py-2"
                        placeholder="VD: Viettel Post"
                        value={forms[order.MaDonHang]?.DonViVanChuyen || ''}
                        onChange={(event) => updateForm(order.MaDonHang, 'DonViVanChuyen', event.target.value)}
                        disabled={hasDelivery}
                      />
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => createDelivery(order)}
                        disabled={hasDelivery}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-slate-300"
                      >
                        {hasDelivery ? 'Đã tạo phiếu' : 'Tạo phiếu giao'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {readyOrders.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-500" colSpan="7">Không có đơn hàng sẵn sàng giao</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Phiếu giao hàng</h3>
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Mã phiếu</th>
                <th className="p-3">Mã đơn</th>
                <th className="p-3">Cơ quan</th>
                <th className="p-3">Ngày giao</th>
                <th className="p-3">Đơn vị vận chuyển</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Xác nhận</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((delivery) => (
                <tr key={delivery.MaGiaoHang} className="border-t">
                  <td className="p-3 font-medium">#{delivery.MaGiaoHang}</td>
                  <td className="p-3">#{delivery.MaDonHang}</td>
                  <td className="p-3">{delivery.donHang?.hopDong?.coQuan?.Ten || '-'}</td>
                  <td className="p-3">{new Date(delivery.NgayGiao).toLocaleDateString('vi-VN')}</td>
                  <td className="p-3">{delivery.DonViVanChuyen || '-'}</td>
                  <td className="p-3">{delivery.TrangThai}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => confirmDelivered(delivery.MaGiaoHang)}
                      disabled={delivery.TrangThai === 'DaGiao'}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-slate-300"
                    >
                      {delivery.TrangThai === 'DaGiao' ? 'Đã giao' : 'Xác nhận đã giao'}
                    </button>
                  </td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-slate-500" colSpan="7">Chưa có phiếu giao hàng</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
