import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token
 * @param length - Length of the token in bytes (default: 32)
 * @returns Hex string representation of the token
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a password reset token
 * @returns Secure random token for password reset
 */
export const generatePasswordResetToken = (): string => {
  return generateSecureToken(32);
};

/**
 * Generate an email verification token
 * @returns Secure random token for email verification
 */
export const generateEmailVerificationToken = (): string => {
  return generateSecureToken(32);
};
