import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const getTokenFromRequest = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }

  if (req.headers['x-auth-token']) {
    return req.headers['x-auth-token'];
  }

  return null;
};

export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.verify(token, secret);
};

export const protect = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ message: 'Authentication token is required' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists. Please login again.' });
    }

    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== (user.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Session expired. Please login again.' });
    }

    req.user = user;
    next();
  } catch (error) {
    const status = error.message === 'JWT_SECRET is not configured' ? 500 : 401;
    return res.status(status).json({
      message: status === 500 ? 'Server authentication is not configured' : 'Invalid or expired token',
    });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};
