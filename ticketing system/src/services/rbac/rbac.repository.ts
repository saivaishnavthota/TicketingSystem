import { query, getClient } from '../../db/connection.js';
import { Role, Permission, UserRole, CreateRoleDTO, UpdateRoleDTO } from '../../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export class RBACRepository {
  // Role operations
  async createRole(data: CreateRoleDTO, createdBy: string): Promise<Role> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      const roleId = uuidv4();
      const roleResult = await client.query(
        `INSERT INTO roles (id, name, description, parent_role_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [roleId, data.name, data.description, data.parentRoleId || null]
      );
      
      // Associate permissions with role
      for (const permissionId of data.permissionIds) {
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
          [roleId, permissionId]
        );
      }
      
      await client.query('COMMIT');
      
      const permissions = await this.getRolePermissions(roleId);
      
      return {
        id: roleResult.rows[0].id,
        name: roleResult.rows[0].name,
        description: roleResult.rows[0].description,
        permissions,
        parentRoleId: roleResult.rows[0].parent_role_id,
        createdAt: roleResult.rows[0].created_at,
        updatedAt: roleResult.rows[0].updated_at
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async getRoleById(roleId: string): Promise<Role | null> {
    const result = await query(
      'SELECT * FROM roles WHERE id = $1',
      [roleId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const permissions = await this.getRolePermissions(roleId);
    
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      permissions,
      parentRoleId: result.rows[0].parent_role_id,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
  }
  
  async updateRole(roleId: string, data: UpdateRoleDTO): Promise<Role> {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      if (data.parentRoleId !== undefined) {
        updates.push(`parent_role_id = $${paramIndex++}`);
        values.push(data.parentRoleId);
      }
      
      updates.push(`updated_at = NOW()`);
      values.push(roleId);
      
      await client.query(
        `UPDATE roles SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
      
      // Update permissions if provided
      if (data.permissionIds) {
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
        for (const permissionId of data.permissionIds) {
          await client.query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
            [roleId, permissionId]
          );
        }
      }
      
      await client.query('COMMIT');
      
      const role = await this.getRoleById(roleId);
      if (!role) {
        throw new Error('Role not found after update');
      }
      return role;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const result = await query(
      `SELECT p.* FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1`,
      [roleId]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      resource: row.resource,
      actions: row.actions
    }));
  }
  
  // User role operations
  async assignRole(userId: string, roleId: string, assignedBy: string): Promise<void> {
    await query(
      `INSERT INTO user_roles (user_id, role_id, assigned_at, assigned_by)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId, assignedBy]
    );
  }
  
  async removeRole(userId: string, roleId: string): Promise<void> {
    await query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );
  }
  
  async getUserRoles(userId: string): Promise<Role[]> {
    const result = await query(
      `SELECT r.* FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [userId]
    );
    
    const roles: Role[] = [];
    for (const row of result.rows) {
      const permissions = await this.getRolePermissions(row.id);
      roles.push({
        id: row.id,
        name: row.name,
        description: row.description,
        permissions,
        parentRoleId: row.parent_role_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    }
    
    return roles;
  }
  
  // Permission operations
  async createPermission(name: string, resource: string, actions: string[]): Promise<Permission> {
    const permissionId = uuidv4();
    const result = await query(
      `INSERT INTO permissions (id, name, resource, actions, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [permissionId, name, resource, actions]
    );
    
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      resource: result.rows[0].resource,
      actions: result.rows[0].actions
    };
  }
  
  async getPermissionById(permissionId: string): Promise<Permission | null> {
    const result = await query(
      'SELECT * FROM permissions WHERE id = $1',
      [permissionId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      resource: result.rows[0].resource,
      actions: result.rows[0].actions
    };
  }
}

export const rbacRepository = new RBACRepository();
