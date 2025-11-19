import crypto from 'crypto';

export const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const verifyCSRFToken = (token, storedToken) => {
  if (!token || !storedToken) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken)
  );
};
