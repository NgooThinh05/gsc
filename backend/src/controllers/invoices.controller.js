import * as invoicesService from '../services/invoices.service.js';

export async function requestCashPayment(req, res, next) {
  try {
    const invoice = await invoicesService.requestCashPayment(req.params.invoiceId, req.user.MaTaiKhoan);
    return res.json(invoice);
  } catch (error) {
    return next(error);
  }
}

export async function createInvoice(req, res, next) {
  try {
    const invoice = await invoicesService.createInvoice(req.body);
    return res.status(201).json(invoice);
  } catch (error) {
    return next(error);
  }
}

export async function listBillableOrders(req, res, next) {
  try {
    const orders = await invoicesService.listBillableOrders();
    return res.json(orders);
  } catch (error) {
    return next(error);
  }
}

export async function listInvoices(req, res, next) {
  try {
    const invoices = await invoicesService.listInvoices(req.user);
    return res.json(invoices);
  } catch (error) {
    return next(error);
  }
}

export async function payInvoice(req, res, next) {
  try {
    const invoice = await invoicesService.payInvoice(req.params.invoiceId, req.user.MaTaiKhoan, {
      ...req.body,
      requireOwner: req.user.VaiTro === 'TaiKhoanCoQuan'
    });
    return res.json(invoice);
  } catch (error) {
    return next(error);
  }
}

