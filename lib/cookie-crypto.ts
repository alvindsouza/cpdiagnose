import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.CF_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('CF_SESSION_SECRET must be at least 32 characters');
  }
  return createHash('sha256').update(secret).digest();
}

/** AES-256-GCM encrypt a CF session cookie for storage in Supabase */
export function encryptCookie(value: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/** Decrypt a CF session cookie retrieved from Supabase */
export function decryptCookie(encrypted: string): string {
  const buf = Buffer.from(encrypted, 'base64');
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const data = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    'utf8'
  );
}

/** True if value looks like an encrypted blob (not a raw CF cookie) */
export function isEncryptedCookie(value: string): boolean {
  if (!value || value.includes('JSESSIONID=')) return false;
  try {
    const buf = Buffer.from(value, 'base64');
    return buf.length > IV_LENGTH + AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}

/** Decrypt if encrypted; pass through legacy plaintext rows */
export function decryptCookieIfNeeded(value: string): string {
  return isEncryptedCookie(value) ? decryptCookie(value) : value;
}
