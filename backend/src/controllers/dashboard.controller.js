import * as dashboardService from '../services/dashboard.service.js';

export async function getDashboardStats(req, res, next) {
  try {
    const stats = await dashboardService.getDashboardStats();
    return res.json(stats);
  } catch (error) {
    return next(error);
  }
}
