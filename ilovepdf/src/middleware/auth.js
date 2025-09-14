const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function verifyTokenFromCookies(req) {
  const token = req.cookies && req.cookies.token;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const payload = verifyTokenFromCookies(req);
  if (!payload) {
    return res.redirect('/login');
  }
  req.user = payload;
  return next();
}

function attachUserIfAny(req, res, next) {
  const payload = verifyTokenFromCookies(req);
  if (payload) {
    req.user = payload;
  }
  next();
}

module.exports = { requireAuth, attachUserIfAny, JWT_SECRET };

