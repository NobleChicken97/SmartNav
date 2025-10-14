/**
 * Permission utilities for role-based access control
 */

import { User, Event } from '../types';

// Role constants
export const ROLES = {
  STUDENT: 'student' as const,
  ORGANIZER: 'organizer' as const,
  ADMIN: 'admin' as const
};

export type UserRole = typeof ROLES[keyof typeof ROLES];

/**
 * Check if user has specific role
 */
export const hasRole = (user: User | null, ...roles: UserRole[]): boolean => {
  if (!user) return false;
  return roles.includes(user.role as UserRole);
};

/**
 * Check if user is an admin
 */
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, ROLES.ADMIN);
};

/**
 * Check if user is an organizer or admin
 */
export const isOrganizer = (user: User | null): boolean => {
  return hasRole(user, ROLES.ORGANIZER, ROLES.ADMIN);
};

/**
 * Check if user is a student (default role)
 */
export const isStudent = (user: User | null): boolean => {
  return hasRole(user, ROLES.STUDENT);
};

/**
 * Check if user can create events
 */
export const canCreateEvent = (user: User | null): boolean => {
  return isOrganizer(user);
};

/**
 * Check if user can edit an event
 * User must be the creator or an admin
 */
export const canEditEvent = (user: User | null, event: Event | null): boolean => {
  if (!user || !event) return false;
  
  // Admins can edit any event
  if (isAdmin(user)) return true;
  
  // Organizers can only edit their own events
  if (isOrganizer(user)) {
    const creatorId = typeof event.createdBy === 'string' 
      ? event.createdBy 
      : event.createdBy?._id;
    return creatorId === user._id;
  }
  
  return false;
};

/**
 * Check if user can delete an event
 * Same as edit permissions
 */
export const canDeleteEvent = (user: User | null, event: Event | null): boolean => {
  return canEditEvent(user, event);
};

/**
 * Check if user can register for events
 */
export const canRegisterForEvent = (user: User | null): boolean => {
  return !!user; // All authenticated users can register
};

/**
 * Check if user can manage locations
 * Only admins can create, edit, or delete locations
 */
export const canManageLocations = (user: User | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can manage other users
 * Only admins can view, edit, or delete users
 */
export const canManageUsers = (user: User | null): boolean => {
  return isAdmin(user);
};

/**
 * Check if user can view event registrations
 * Event creator or admin
 */
export const canViewEventRegistrations = (user: User | null, event: Event | null): boolean => {
  if (!user || !event) return false;
  
  // Admins can view all registrations
  if (isAdmin(user)) return true;
  
  // Organizers can view registrations for their own events
  if (isOrganizer(user)) {
    const creatorId = typeof event.createdBy === 'string' 
      ? event.createdBy 
      : event.createdBy?._id;
    return creatorId === user._id;
  }
  
  return false;
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case ROLES.ADMIN:
      return 'Administrator';
    case ROLES.ORGANIZER:
      return 'Event Organizer';
    case ROLES.STUDENT:
      return 'Student';
    default:
      return 'User';
  }
};

/**
 * Get role badge color for UI
 */
export const getRoleBadgeColor = (role: UserRole): string => {
  switch (role) {
    case ROLES.ADMIN:
      return 'bg-red-100 text-red-800';
    case ROLES.ORGANIZER:
      return 'bg-blue-100 text-blue-800';
    case ROLES.STUDENT:
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Role hierarchy for comparison
 * Returns numeric value (higher = more privileges)
 */
export const getRoleLevel = (role: UserRole): number => {
  switch (role) {
    case ROLES.ADMIN:
      return 3;
    case ROLES.ORGANIZER:
      return 2;
    case ROLES.STUDENT:
      return 1;
    default:
      return 0;
  }
};

/**
 * Check if role1 has higher or equal privileges than role2
 */
export const isRoleHigherOrEqual = (role1: UserRole, role2: UserRole): boolean => {
  return getRoleLevel(role1) >= getRoleLevel(role2);
};

export default {
  ROLES,
  hasRole,
  isAdmin,
  isOrganizer,
  isStudent,
  canCreateEvent,
  canEditEvent,
  canDeleteEvent,
  canRegisterForEvent,
  canManageLocations,
  canManageUsers,
  canViewEventRegistrations,
  getRoleDisplayName,
  getRoleBadgeColor,
  getRoleLevel,
  isRoleHigherOrEqual
};
