export const ROLES = {
  STUDENT: 'student',
  ORGANIZER: 'organizer',
  ADMIN: 'admin'
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Administrator privileges required.'
    });
  }
  
  next();
};

export const requireOrganizerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (req.user.role !== ROLES.ORGANIZER && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Only organizers and admins can perform this action.'
    });
  }
  
  next();
};
