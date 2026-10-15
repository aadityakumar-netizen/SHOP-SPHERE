import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Sign a new JWT token
 * @param {Object} payload - Data to embed in the token
 * @param {string|number} expiresIn - Expiration time
 * @returns {string} Signed JWT token
 */
export const signToken = (payload, expiresIn = env.JWT_EXPIRES_IN) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn,
  });
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token string
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

export default {
  signToken,
  verifyToken,
};
