import * as warehouseService from '../services/warehouse.service.js';

export async function approveOrder(req, res, next) {
  try {
    const order = await warehouseService.approveOrderForWarehouse(req.params.id, req.body.items);
    return res.json(order);
  } catch (error) {
    return next(error);
  }
}

export async function receiveStock(req, res, next) {
  try {
    const { items, GhiChu } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Danh sách mặt hàng nhập không hợp lệ' });
    }
    const result = await warehouseService.receiveStock(items);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}
