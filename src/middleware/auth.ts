import type { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  isGuest?: boolean;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Support deterministic E2E browser verification against PostgreSQL in non-production
  const e2eHeader = req.headers['x-e2e-google-user'];
  if (process.env.NODE_ENV !== 'production' && typeof e2eHeader === 'string' && e2eHeader.trim()) {
    try {
      const parsed = JSON.parse(e2eHeader) as {
        uid?: string;
        email?: string;
        name?: string;
        picture?: string;
      };
      if (parsed && typeof parsed.uid === 'string' && parsed.uid.trim()) {
        req.user = {
          uid: parsed.uid.trim(),
          email: parsed.email || '',
          name: parsed.name || '',
          picture: parsed.picture || '',
        } as unknown as DecodedIdToken;
        req.isGuest = false;
        await getOrCreateUser(
          req.user.uid,
          req.user.email || '',
          req.user.name,
          req.user.picture
        );
        return next();
      }
    } catch {
      // fall through to standard Firebase ID token verification
    }
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    req.isGuest = false;
    await getOrCreateUser(
      decodedToken.uid,
      decodedToken.email || '',
      decodedToken.name,
      decodedToken.picture
    );
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Invalid or expired authentication session' });
  }
};

/**
 * Explicit optionalAuth middleware for guest-accessible AI & entitlement endpoints:
 * - Verifies Firebase Bearer token when supplied (assigning authenticated user tier & quotas)
 * - Explicitly marks unauthenticated callers as guest (Free Explorer tier + guest rate quotas)
 * - Never trusts client-supplied tier claims or bypasses verification on malformed tokens
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const e2eHeader = req.headers['x-e2e-google-user'];
  if (process.env.NODE_ENV !== 'production' && typeof e2eHeader === 'string' && e2eHeader.trim()) {
    try {
      const parsed = JSON.parse(e2eHeader) as {
        uid?: string;
        email?: string;
        name?: string;
        picture?: string;
      };
      if (parsed && typeof parsed.uid === 'string' && parsed.uid.trim()) {
        req.user = {
          uid: parsed.uid.trim(),
          email: parsed.email || '',
          name: parsed.name || '',
          picture: parsed.picture || '',
        } as unknown as DecodedIdToken;
        req.isGuest = false;
        await getOrCreateUser(
          req.user.uid,
          req.user.email || '',
          req.user.name,
          req.user.picture
        );
        return next();
      }
    } catch {
      // fall through to bearer check
    }
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;
      req.isGuest = false;
      await getOrCreateUser(
        decodedToken.uid,
        decodedToken.email || '',
        decodedToken.name,
        decodedToken.picture
      );
      return next();
    } catch {
      // Expired/invalid token falls back safely to guest Free Explorer scope
      req.user = undefined;
      req.isGuest = true;
      return next();
    }
  }

  req.user = undefined;
  req.isGuest = true;
  next();
};
