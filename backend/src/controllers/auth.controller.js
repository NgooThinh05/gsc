import * as authService from '../services/auth.service.js';

export async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập tài khoản/email và mật khẩu' });
    }

    const result = await authService.login({ identifier, password });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
}
