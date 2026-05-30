import * as dashboardService from '../services/dashboard.service.js';

export async function getDashboardStats(req, res, next) {
  try {
    const stats = await dashboardService.getDashboardStats();
    return res.json(stats);
  } catch (error) {
    return next(error);
  }
}

export async function getRevenueReport(req, res, next) {
  try {
    const report = await dashboardService.getRevenueReport({
      from: req.query.from,
      to: req.query.to,
      agencyId: req.query.agencyId
    });
    return res.json(report);
  } catch (error) {
    return next(error);
  }
}

export async function getAgencies(req, res, next) {
  try {
    const agencies = await dashboardService.getAgencies();
    return res.json(agencies);
  } catch (error) {
    return next(error);
  }
}

export async function getInventoryReport(req, res, next) {
  try {
    const report = await dashboardService.getInventoryReport();
    return res.json(report);
  } catch (error) {
    return next(error);
  }
}
