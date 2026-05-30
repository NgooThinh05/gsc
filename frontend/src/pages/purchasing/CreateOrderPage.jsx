import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../api/client';

export default function CreateOrderPage() {
  const [products, setProducts] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [agency, setAgency] = useState(null);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      apiRequest('/products'),
      apiRequest('/contracts'),
      apiRequest('/auth/me')
    ])
      .then(([prods, contractList, me]) => {
        setProducts(prods);
        setContracts(contractList);
        setAgency(me.taiKhoanCoQuan?.coQuan || null);
      })
      .catch((error) => setMessage(error.message));
  }, []);

  const selectedContract = useMemo(
    () => contracts.find((contract) => String(contract.MaHopDong) === String(selectedContractId)),
    [contracts, selectedContractId]
  );

  // Bản đồ hạn mức tiền theo hàng hóa của hợp đồng đang chọn (để hiển thị hướng dẫn)
  const contractLimits = useMemo(() => {
    const map = new Map();
    (selectedContract?.chiTiet || []).forEach((detail) => map.set(detail.MaHangHoa, Number(detail.SoTienToiDa)));
    return map;
  }, [selectedContract]);

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

    if (!selectedContractId) {
      setMessage('Vui lòng chọn hợp đồng');
      return;
    }

    const activeItems = items.filter((i) => i.SoLuongDat > 0);
    if (activeItems.length === 0) {
      setMessage('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    try {
      await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({ MaHopDong: Number(selectedContractId), items: activeItems })
      });
      setItems([]);
      setSelectedContractId('');
      setMessage('Tạo đơn hàng thành công — đơn hợp lệ sẽ tự được duyệt, đơn vi phạm chờ nhân viên hợp đồng xử lý');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Tạo Đơn Hàng</h3>
      <p className="mt-1 text-sm text-slate-500">Chọn hợp đồng của cơ quan rồi nhập số lượng hàng hóa cần đặt.</p>
      {message && <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">{message}</div>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Cơ quan</label>
            <input
              className="mt-1 w-full rounded-lg border bg-slate-100 px-4 py-3 font-medium text-slate-700"
              value={agency ? `${agency.Ten}${agency.DiaChi ? ` — ${agency.DiaChi}` : ''}` : 'Đang tải cơ quan...'}
              readOnly
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Hợp đồng</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3"
              value={selectedContractId}
              onChange={(event) => setSelectedContractId(event.target.value)}
              required
            >
              <option value="">Chọn hợp đồng</option>
              {contracts.map((contract) => (
                <option key={contract.MaHopDong} value={contract.MaHopDong}>
                  HĐ #{contract.MaHopDong} — hết hạn {new Date(contract.NgayHetHan).toLocaleDateString('vi-VN')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3">Hàng hóa</th>
                <th className="p-3">Giá</th>
                <th className="p-3">Hạn mức HĐ</th>
                <th className="p-3">Số lượng đặt</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const inContract = !selectedContract || contractLimits.has(product.MaHangHoa);
                const limit = contractLimits.get(product.MaHangHoa);
                return (
                  <tr key={product.MaHangHoa} className={`border-t ${selectedContract && !inContract ? 'bg-slate-50 text-slate-400' : ''}`}>
                    <td className="p-3 font-medium">{product.Ten}</td>
                    <td className="p-3">{Number(product.Gia).toLocaleString('vi-VN')} đ</td>
                    <td className="p-3">
                      {!selectedContract ? '-' : inContract ? `${limit.toLocaleString('vi-VN')} đ` : 'Ngoài hợp đồng'}
                    </td>
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
                );
              })}
              {products.length === 0 && (
                <tr><td className="p-6 text-center text-slate-500" colSpan="4">Không có hàng hóa</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <button className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700">
          Gửi đơn hàng
        </button>
      </form>
    </section>
  );
}
