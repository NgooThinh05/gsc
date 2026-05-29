import * as ordersService from '../services/orders.service.js';

export async function createOrder(req, res, next) {
  try {
    const order = await ordersService.createOrder(req.user.MaTaiKhoan, req.body);
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

export const closeOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        // Logic đóng đơn hàng của bạn ở đây...
        
        res.status(200).json({ message: 'Đóng đơn hàng thành công!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};