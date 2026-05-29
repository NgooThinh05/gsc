import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../api/client';

export default function CreateOrderPage() {
  const [contracts, setContracts] = useState([]);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiRequest('/contracts').then(setContracts).catch((error) => setMessage(error.message));
  }, []);

  const selectedContract = useMemo(
    () => contracts.find((contract) => String(contract.MaHopDong) === String(selectedContractId)),
    [contracts, selectedContractId]
  );

  function updateQuantity(MaHangHoa, SoLuongDat) {
    setItems((current) => {
      const next = current.filter((item) => item.MaHangHoa !== MaHangHoa);
      if (!SoLuongDat) return next;
      return [...next, { MaHangHoa, SoLuongDat: Number(SoLuongDat) }];
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    try {
      await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({ MaHopDong: selectedContractId, items })
      });
      setItems([]);
      setMessage('Tạo đơn hàng thành công');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">Tạo Đơn Hàng</h3>
      <p className="mt-1 text-sm text-slate-500">Chỉ được đặt hàng trong giới hạn ChiTietHopDong còn hiệu lực.</p>
      {message && <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">{message}</div>}
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label className="text-sm font-medium text-slate-700">Hợp đồng còn hạn</label>
          <select
            value={selectedContractId}
            onChange={(event) => {
              setSelectedContractId(event.target.value);
              setItems([]);
            }}
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3"
            required
          >
            <option value="">Chọn hợp đồng</option>
            {contracts.map((contract) => (
              <option key={contract.MaHopDong} value={contract.MaHopDong}>
                HD #{contract.MaHopDong} - {contract.coQuan?.Ten}
              </option>
            ))}
          </select>
        </div>
        {selectedContract && (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-3">Hàng hóa</th>
                  <th className="p-3">Tối đa</th>
                  <th className="p-3">Giá</th>
                  <th className="p-3">Số lượng đặt</th>
                </tr>
              </thead>
              <tbody>
                {selectedContract.chiTiet.map((detail) => (
                  <tr key={detail.MaHangHoa} className="border-t">
                    <td className="p-3 font-medium">{detail.hangHoa.Ten}</td>
                    <td className="p-3">{detail.SoLuongToiDa}</td>
                    <td className="p-3">{Number(detail.hangHoa.Gia).toLocaleString('vi-VN')} đ</td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        max={detail.SoLuongToiDa}
                        onChange={(event) => updateQuantity(detail.MaHangHoa, event.target.value)}
                        className="w-36 rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white">Gửi đơn hàng</button>
      </form>
    </section>
  );
}
