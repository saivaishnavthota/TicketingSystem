import { v4 as uuidv4 } from 'uuid';
import type { AuthContext } from '../../models/types.js';

export function createMockAuthContext(overrides?: Partial<AuthContext>): AuthContext {
  return {
    userId: uuidv4(),
    roles: ['user'],
    permissions: ['read'],
    tokenExpiry: new Date(Date.now() + 3600000),
    ...overrides
  };
}

export function createMockUser(overrides?: any) {
  return {
    id: uuidv4(),
    username: `user_${Math.random().toString(36).substring(7)}`,
    email: `user_${Math.random().toString(36).substring(7)}@example.com`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
