/**
 * RBAC Configuration - Role-Based Access Control
 * Defines roles and their permissions for Smart Navigator
 */

// Role definitions
export const ROLES = {
  STUDENT: 'student',
  ORGANIZER: 'organizer',
  ADMIN: 'admin'
};

// Permission definitions
export const PERMISSIONS = {
  // ==================== EVENT PERMISSIONS ====================
  
  // View events - All authenticated users can view events
  EVENT_VIEW: [ROLES.STUDENT, ROLES.ORGANIZER, ROLES.ADMIN],
  
  // Create events - Only organizers and admins
  EVENT_CREATE: [ROLES.ORGANIZER, ROLES.ADMIN],
  
  // Edit own events - Organizers can edit their own, admins can edit any
  EVENT_EDIT_OWN: [ROLES.ORGANIZER, ROLES.ADMIN],
  
  // Edit any event - Only admins
  EVENT_EDIT_ANY: [ROLES.ADMIN],
  
  // Delete own events - Organizers can delete their own, admins can delete any
  EVENT_DELETE_OWN: [ROLES.ORGANIZER, ROLES.ADMIN],
  
  // Delete any event - Only admins
  EVENT_DELETE_ANY: [ROLES.ADMIN],
  
  // Register for events - All authenticated users
  EVENT_REGISTER: [ROLES.STUDENT, ROLES.ORGANIZER, ROLES.ADMIN],
  
  // View event registrations - Event creator and admins
  EVENT_VIEW_REGISTRATIONS: [ROLES.ORGANIZER, ROLES.ADMIN],
  
  // ==================== LOCATION PERMISSIONS ====================
  
  // View locations - All users (public)
  LOCATION_VIEW: [ROLES.STUDENT, ROLES.ORGANIZER, ROLES.ADMIN],
  
  // Create locations - Only admins
  LOCATION_CREATE: [ROLES.ADMIN],
  
  // Edit locations - Only admins
  LOCATION_EDIT: [ROLES.ADMIN],
  
  // Delete locations - Only admins
  LOCATION_DELETE: [ROLES.ADMIN],
  
  // ==================== USER PERMISSIONS ====================
  
  // View all users - Only admins
  USER_VIEW_ALL: [ROLES.ADMIN],
  
  // Edit any user - Only admins
  USER_EDIT_ANY: [ROLES.ADMIN],
  
  // Delete any user - Only admins
  USER_DELETE_ANY: [ROLES.ADMIN],
  
  // Change user roles - Only admins
  USER_CHANGE_ROLE: [ROLES.ADMIN]
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role (student, organizer, admin)
 * @param {string} permission - Permission to check (from PERMISSIONS object)
 * @returns {boolean} - True if role has permission
 */
export const hasPermission = (role, permission) => {
  if (!role || !permission) return false;
  
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  
  return allowedRoles.includes(role);
};

/**
 * Check if a user can perform an action on a resource
 * @param {Object} user - User object with role
 * @param {string} action - Action to perform (VIEW, CREATE, EDIT, DELETE)
 * @param {string} resource - Resource type (EVENT, LOCATION, USER)
 * @param {Object} options - Additional options (e.g., { isOwner: true })
 * @returns {boolean} - True if user can perform action
 */
export const canPerformAction = (user, action, resource, options = {}) => {
  if (!user || !user.role) return false;
  
  const role = user.role;
  const { isOwner } = options;
  
  // Admins can do everything
  if (role === ROLES.ADMIN) return true;
  
  // Construct permission key
  let permissionKey = `${resource}_${action}`;
  
  // Handle ownership-based permissions
  if (isOwner && (action === 'EDIT' || action === 'DELETE')) {
    permissionKey = `${resource}_${action}_OWN`;
  }
  
  return hasPermission(role, permissionKey);
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]} - Array of permission names
 */
export const getRolePermissions = (role) => {
  if (!role) return [];
  
  const permissions = [];
  
  for (const [permission, allowedRoles] of Object.entries(PERMISSIONS)) {
    if (allowedRoles.includes(role)) {
      permissions.push(permission);
    }
  }
  
  return permissions;
};

/**
 * Check if role is higher or equal in hierarchy
 * Hierarchy: ADMIN > ORGANIZER > STUDENT
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {boolean} - True if role1 >= role2
 */
export const isRoleHigherOrEqual = (role1, role2) => {
  const hierarchy = {
    [ROLES.ADMIN]: 3,
    [ROLES.ORGANIZER]: 2,
    [ROLES.STUDENT]: 1
  };
  
  return (hierarchy[role1] || 0) >= (hierarchy[role2] || 0);
};

// Export default object with all utilities
export default {
  ROLES,
  PERMISSIONS,
  hasPermission,
  canPerformAction,
  getRolePermissions,
  isRoleHigherOrEqual
};
