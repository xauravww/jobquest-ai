import { NaukriService } from '@/services/NaukriService';
import NaukriCredential from '@/models/NaukriCredential';
import NaukriSession from '@/models/NaukriSession';

export interface NaukriTokens {
  authorization: string;
  cookies: string;
}

interface CachedSession {
  tokens: NaukriTokens;
  cachedAt: number;
}

// A captured browser session is considered fresh for 12 hours.
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
// Password login fallback cache is short (30 min) because tokens are short-lived.
const LOGIN_TTL_MS = 30 * 60 * 1000;

const sessionCache = new Map<string, CachedSession>();

export function invalidateSession(userId: string) {
  sessionCache.delete(userId);
}

async function freshLogin(userId: string): Promise<NaukriTokens> {
  const cred = await NaukriCredential.findOne({ userId });
  if (!cred) {
    throw new Error(
      'NO_NAUKRI_CREDENTIALS: capture a session from the extension (or store Naukri credentials in Agent settings)'
    );
  }

  const naukriService = new NaukriService();
  try {
    const tokens = await naukriService.login(cred.naukriEmail, cred.naukriPassword);
    cred.lastLoginAt = new Date();
    cred.lastLoginOk = true;
    await cred.save();
    sessionCache.set(userId, { tokens, cachedAt: Date.now() });
    return tokens;
  } catch (err: any) {
    cred.lastLoginAt = new Date();
    cred.lastLoginOk = false;
    await cred.save();
    throw new Error(`NAUKRI_LOGIN_FAILED: ${err?.message || 'unknown error'}`);
  }
}

/**
 * Prefers the live session captured from the browser extension.
 * Falls back to stored credentials (password login) if no session is
 * available or the captured session is stale.
 */
export async function getTokens(userId: string): Promise<NaukriTokens> {
  const cached = sessionCache.get(userId);
  if (cached && Date.now() - cached.cachedAt < SESSION_TTL_MS) {
    return cached.tokens;
  }

  // 1. Look for an extension-captured session
  const captured = await NaukriSession.findOne({ userId });
  if (captured?.authorization && captured?.cookies) {
    const tokens = { authorization: captured.authorization, cookies: captured.cookies };
    captured.lastUsedAt = new Date();
    await captured.save().catch(() => {});
    sessionCache.set(userId, { tokens, cachedAt: Date.now() });
    return tokens;
  }

  // 2. Fallback to stored credentials
  return freshLogin(userId);
}

/** Removes the captured session for a user (e.g. on logout / expired 401). */
export async function clearCapturedSession(userId: string) {
  invalidateSession(userId);
  await NaukriSession.deleteOne({ userId });
}

/** Wraps any Naukri API call with automatic 401 → re-auth → single retry. */
export async function withFreshTokens<T>(
  userId: string,
  fn: (tokens: NaukriTokens) => Promise<T>
): Promise<T> {
  try {
    const tokens = await getTokens(userId);
    return await fn(tokens);
  } catch (err: any) {
    if (err?.status === 401 || err?.message?.includes('401')) {
      invalidateSession(userId);
      // A 401 means the captured session went stale — drop it so the next
      // call won't reuse the dead session, then fall back to login.
      await NaukriSession.deleteOne({ userId }).catch(() => {});
      const tokens = await freshLogin(userId);
      return await fn(tokens);
    }
    throw err;
  }
}
