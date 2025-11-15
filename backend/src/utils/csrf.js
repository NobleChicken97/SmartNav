import crypto from 'crypto';

/**
 * CSRF (Cross-Site Request Forgery) Protection Utilities
 * @fileoverview Simple crypto-based CSRF token generation and verification
 */

/**
 * Generates a CSRF protection token using crypto random bytes
 * @returns {string} A cryptographically secure random token
 * @example
 * const csrfToken = generateCSRFToken();
 * // Include in forms as hidden input or response headers
 */
export const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Verifies a CSRF token for authenticity
 * Note: For stateless verification, tokens should be stored server-side (e.g., in session/Redis)
 * or signed/encrypted. This basic implementation generates random tokens.
 * 
 * @param {string} token - The CSRF token to verify
 * @param {string} storedToken - The stored token to compare against
 * @returns {boolean} True if tokens match
 * @example
 * if (verifyCSRFToken(req.headers['x-csrf-token'], req.session.csrfToken)) {
 *   // Process the request
 * } else {
 *   res.status(403).json({ error: 'Invalid CSRF token' });
 * }
 */
export const verifyCSRFToken = (token, storedToken) => {
  if (!token || !storedToken) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken)
  );
};
