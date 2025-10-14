/**
 * UserService - API client for user management
 */

import { apiClient } from './apiClient';
import { User } from '../types';

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'student' | 'organizer' | 'admin';
}

export class UserService {
  /**
   * Get all users (admin only)
   */
  static async getAllUsers(): Promise<User[]> {
    const response = await apiClient.get<{ success: boolean; data: { users: User[] } }>('/users');
    return response.data.users;
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  }

  /**
   * Update user (admin or self)
   */
  static async updateUser(id: string, data: UpdateUserData): Promise<User> {
    return apiClient.put<User>(`/users/${id}`, data);
  }

  /**
   * Delete user (admin only)
   */
  static async deleteUser(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  }

  /**
   * Change user role (admin only)
   */
  static async changeUserRole(id: string, role: 'student' | 'organizer' | 'admin'): Promise<User> {
    return apiClient.put<User>(`/users/${id}`, { role });
  }
}

export default UserService;
