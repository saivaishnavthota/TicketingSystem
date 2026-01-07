import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AuthContext } from '../../models/types.js';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY: string = process.env.JWT_EXPIRY || '1h';
const REFRESH_TOKEN_EXPIRY: string = process.env.REFRESH_TOKEN_EXPIRY || '7d';

// Ensure JWT_SECRET is a string
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined');
}

export interface TokenPayload {
  userId: string;
  roles: string[];
  permissions: string[];
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export class AuthService {
  /**
   * Generate access and refresh tokens for a user
   */
  generateTokens(userId: string, roles: string[], permissions: string[]): AuthTokens {
    const accessTokenExpiry = this.calculateExpiry(JWT_EXPIRY);
    const refreshTokenExpiry = this.calculateExpiry(REFRESH_TOKEN_EXPIRY);

    const accessPayload: TokenPayload = {
      userId,
      roles,
      permissions,
      type: 'access'
    };

    const refreshPayload: TokenPayload = {
      userId,
      roles,
      permissions,
      type: 'refresh'
    };

    const accessToken = jwt.sign(accessPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY } as jwt.SignOptions);
    const refreshToken = jwt.sign(refreshPayload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY } as jwt.SignOptions);

    return {
      accessToken,
      refreshToken,
      expiresAt: accessTokenExpiry
    };
  }

  /**
   * Validate a token and return the auth context
   */
  validateToken(token: string): AuthContext {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;

      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      const decoded = jwt.decode(token, { complete: true });
      const expiresAt = decoded?.payload && typeof decoded.payload === 'object' && 'exp' in decoded.payload
        ? new Date((decoded.payload.exp as number) * 1000)
        : new Date(Date.now() + 3600000);

      return {
        userId: payload.userId,
        roles: payload.roles,
        permissions: payload.permissions,
        tokenExpiry: expiresAt
      };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refresh an access token using a refresh token
   */
  refreshAccessToken(refreshToken: string): AuthTokens {
    try {
      const payload = jwt.verify(refreshToken, JWT_SECRET) as TokenPayload;

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return this.generateTokens(payload.userId, payload.roles, payload.permissions);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Hash a password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private calculateExpiry(duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 3600000); // Default 1 hour
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }
}

export const authService = new AuthService();
