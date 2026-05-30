import * as warehouseService from '../services/warehouse.service.js';

export async function approveOrder(req, res, next) {
  try {
    const order = await warehouseService.approveOrderForWarehouse(req.params.id, req.body.items);
    return res.json(order);
  } catch (error) {
    return next(error);
  }
}
