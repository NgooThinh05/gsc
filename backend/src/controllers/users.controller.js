import * as usersService from '../services/users.service.js';

export async function listUsers(req, res, next) {
  try {
    const users = await usersService.listUsers(req.query.search);
    return res.json(users);
  } catch (error) {
    return next(error);
  }
}

export async function createUser(req, res, next) {
  try {
    const user = await usersService.createUser(req.body);
    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const user = await usersService.updateUser(req.params.id, req.body, req.user.MaTaiKhoan);
    return res.json(user);
  } catch (error) {
    return next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const result = await usersService.deleteUser(req.params.id, req.user.MaTaiKhoan);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function listGovernmentAgencies(req, res, next) {
  try {
    const agencies = await usersService.listGovernmentAgencies();
    return res.json(agencies);
  } catch (error) {
    return next(error);
  }
}

export async function createGovernmentAgency(req, res, next) {
  try {
    const agency = await usersService.createGovernmentAgency(req.body);
    return res.status(201).json(agency);
  } catch (error) {
    return next(error);
  }
}
