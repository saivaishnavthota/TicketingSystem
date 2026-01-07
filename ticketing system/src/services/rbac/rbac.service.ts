import { rbacRepository } from './rbac.repository.js';
import { Role, Permission, CreateRoleDTO, UpdateRoleDTO, AuthContext } from '../../models/types.js';

export class RBACService {
  /**
   * Assign a role to a user
   */
  async assignRole(userId: string, roleId: string, context: AuthContext): Promise<void> {
    await rbacRepository.assignRole(userId, roleId, context.userId);
  }
  
  /**
   * Remove a role from a user
   */
  async removeRole(userId: string, roleId: string, context: AuthContext): Promise<void> {
    await rbacRepository.removeRole(userId, roleId);
  }
  
  /**
   * Get all permissions for a user (including inherited from role hierarchy)
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const roles = await rbacRepository.getUserRoles(userId);
    const permissionMap = new Map<string, Permission>();
    
    // Collect permissions from all roles including parent roles
    for (const role of roles) {
      await this.collectRolePermissions(role, permissionMap);
    }
    
    return Array.from(permissionMap.values());
  }
  
  /**
   * Check if a user has a specific permission
   */
  async checkPermission(userId: string, permission: string, resource?: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    
    return permissions.some(p => {
      const nameMatch = p.name === permission;
      const resourceMatch = !resource || p.resource === resource || p.resource === '*';
      return nameMatch && resourceMatch;
    });
  }
  
  /**
   * Create a new role
   */
  async createRole(role: CreateRoleDTO, context: AuthContext): Promise<Role> {
    return rbacRepository.createRole(role, context.userId);
  }
  
  /**
   * Update an existing role
   */
  async updateRole(roleId: string, data: UpdateRoleDTO, context: AuthContext): Promise<Role> {
    return rbacRepository.updateRole(roleId, data);
  }
  
  /**
   * Get role by ID
   */
  async getRoleById(roleId: string): Promise<Role | null> {
    return rbacRepository.getRoleById(roleId);
  }
  
  /**
   * Recursively collect permissions from a role and its parent roles
   */
  private async collectRolePermissions(role: Role, permissionMap: Map<string, Permission>): Promise<void> {
    // Add this role's permissions
    for (const permission of role.permissions) {
      permissionMap.set(permission.id, permission);
    }
    
    // Recursively add parent role permissions
    if (role.parentRoleId) {
      const parentRole = await rbacRepository.getRoleById(role.parentRoleId);
      if (parentRole) {
        await this.collectRolePermissions(parentRole, permissionMap);
      }
    }
  }
}

export const rbacService = new RBACService();
