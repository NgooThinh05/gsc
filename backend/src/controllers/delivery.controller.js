import * as deliveryService from '../services/delivery.service.js';

export async function listDeliveryReadyOrders(req, res, next) {
  try {
    const orders = await deliveryService.listDeliveryReadyOrders();
    return res.json(orders);
  } catch (error) {
    return next(error);
  }
}

export async function createDelivery(req, res, next) {
  try {
    const delivery = await deliveryService.createDelivery(req.user.MaTaiKhoan, req.body);
    return res.status(201).json(delivery);
  } catch (error) {
    return next(error);
  }
}

export async function confirmDelivered(req, res, next) {
  try {
    const delivery = await deliveryService.confirmDelivered(req.params.id);
    return res.json(delivery);
  } catch (error) {
    return next(error);
  }
}

export async function listDeliveries(req, res, next) {
  try {
    const deliveries = await deliveryService.listDeliveries();
    return res.json(deliveries);
  } catch (error) {
    return next(error);
  }
}
