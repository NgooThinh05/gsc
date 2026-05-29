import * as contractsService from '../services/contracts.service.js';

export async function createContract(req, res, next) {
  try {
    const contract = await contractsService.createContract(req.user.MaTaiKhoan, req.body);
    return res.status(201).json(contract);
  } catch (error) {
    return next(error);
  }
}

export async function listActiveContracts(req, res, next) {
  try {
    const contracts = await contractsService.listActiveContracts(req.user);
    return res.json(contracts);
  } catch (error) {
    return next(error);
  }
}

export async function extendContract(req, res, next) {
  try {
    const contract = await contractsService.extendContract(req.params.id, req.body);
    return res.json(contract);
  } catch (error) {
    return next(error);
  }
}
