import jwt from 'jsonwebtoken';

export function getAccessToken(req) {
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const queryToken = typeof req.query?.token === 'string' ? req.query.token : null;

  return headerToken || queryToken;
}

export function authenticateToken(req, res, next) {
  const token = getAccessToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Thiếu access token' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}
