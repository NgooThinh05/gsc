import { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';

export default function CreateOrderPage() {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiRequest('/products').then(setProducts).catch((error) => setMessage(error.message));
  }, []);

  function updateQuantity(MaHangHoa, SoLuongDat) {
    setItems((current) => {
      const next = current.filter((item) => item.MaHangHoa !== MaHangHoa);
      if (!SoLuongDat) return next;
      return [...next, { MaHangHoa, SoLuongDat: Number(SoLuongDat) }];
    });
  }

  function getQuantity(MaHangHoa) {
    const item = items.find((i) => i.MaHangHoa === MaHangHoa);
    return item ? item.SoLuongDat : 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    const activeItems = items.filter((i) => i.SoLuongDat > 0);
    if (activeItems.length === 0) {
      setMessage('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    try {
      await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({ items: activeItems })
      });
      setItems([]);
      setMessage('Tạo đơn hàng thành công — đang chờ nhân viên hợp đồng duyệt');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Tạo Đơn Hàng</h3>
      <p className="mt-1 text-sm text-slate-500">Chọn hàng hóa và nhập số lượng. Đơn hàng sẽ được nhân viên hợp đồng duyệt sau.</p>
      {message && <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">{message}</div>}
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Hàng hóa</th>
                <th className="p-3">Giá</th>
                <th className="p-3">Số lượng đặt</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.MaHangHoa} className="border-t">
                  <td className="p-3 font-medium">{product.Ten}</td>
                  <td className="p-3">{Number(product.Gia).toLocaleString('vi-VN')} đ</td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="0"
                      value={getQuantity(product.MaHangHoa) || ''}
                      placeholder="0"
                      onChange={(event) => updateQuantity(product.MaHangHoa, event.target.value)}
                      className="w-36 rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td className="p-6 text-center text-slate-500" colSpan="3">Không có hàng hóa</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <button className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 transition-colors">
          Gửi đơn hàng
        </button>
      </form>
    </section>
  );
}
