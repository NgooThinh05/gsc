import * as ordersService from '../services/orders.service.js';

export async function createOrder(req, res, next) {
  try {
    const order = await ordersService.createOrder(req.user, req.body);
    return res.status(201).json(order);
  } catch (error) {
    return next(error);
  }
}

export async function listOrders(req, res, next) {
  try {
    const orders = await ordersService.listOrders(req.user);
    return res.json(orders);
  } catch (error) {
    return next(error);
  }
}

export async function getOrder(req, res, next) {
  try {
    const order = await ordersService.getOrder(req.params.id);
    return res.json(order);
  } catch (error) {
    return next(error);
  }
}

// Tiến trình 2.4 - Nhân viên hợp đồng xác nhận từ chối đơn hàng (kèm lí do)
export async function rejectOrder(req, res, next) {
  try {
    const order = await ordersService.rejectOrder(
      req.user.MaTaiKhoan,
      req.params.orderId,
      req.body.LiDo
    );
    return res.json(order);
  } catch (error) {
    return next(error);
  }
}