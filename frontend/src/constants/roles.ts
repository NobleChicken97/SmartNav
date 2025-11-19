/**
 * User role constants
 * Should match backend role definitions
 */
export const ROLES = {
  STUDENT: 'student',
  ORGANIZER: 'organizer',
  ADMIN: 'admin',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
