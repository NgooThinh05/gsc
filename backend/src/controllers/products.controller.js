import * as productsService from '../services/products.service.js';

export async function listProducts(req, res, next) {
  try {
    const products = await productsService.listProducts();
    return res.json(products);
  } catch (error) {
    return next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const product = await productsService.createProduct(req.body);
    return res.status(201).json(product);
  } catch (error) {
    return next(error);
  }
}
