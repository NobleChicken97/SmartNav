import { verifyIdToken, getFirebaseFirestore } from '../utils/firebaseAdmin.js';

const extractIdToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

export const authenticateFirebase = async (req, res, next) => {
  try {
    const idToken = extractIdToken(req);

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decodedToken = await verifyIdToken(idToken);
    const db = getFirebaseFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      req.user = {
        uid: decodedToken.uid,
        _id: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0],
        role: decodedToken.role || 'user',
        emailVerified: decodedToken.email_verified
      };
    } else {
      const userData = userDoc.data();
      req.user = {
        uid: decodedToken.uid,
        _id: decodedToken.uid,
        email: decodedToken.email,
        name: userData.name || decodedToken.name,
        role: userData.role || 'user',
        interests: userData.interests || [],
        emailVerified: decodedToken.email_verified,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };
    }

    next();
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ success: false, message: 'Token revoked.' });
    }
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    
    res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

export const optionalFirebaseAuth = async (req, res, next) => {
  try {
    const idToken = extractIdToken(req);
    if (!idToken) return next();

    const decodedToken = await verifyIdToken(idToken);
    const db = getFirebaseFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      req.user = {
        uid: decodedToken.uid,
        _id: decodedToken.uid,
        email: decodedToken.email,
        name: userData.name || decodedToken.name,
        role: userData.role || 'user',
        interests: userData.interests || [],
        emailVerified: decodedToken.email_verified
      };
    }
    next();
  } catch (error) {
    next();
  }
};
