import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';
const ITERATIONS = 10000;
const KEY_LEN = 64;
const DIGEST = 'sha512';
export function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
    return { hash, salt };
}
export function verifyPassword(password, hash, salt) {
    const computedHash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
    const hashBuf = Buffer.from(hash, 'hex');
    const computedBuf = Buffer.from(computedHash, 'hex');
    if (hashBuf.length !== computedBuf.length) {
        return false;
    }
    return timingSafeEqual(hashBuf, computedBuf);
}
export function generateSessionToken() {
    return randomBytes(32).toString('hex');
}
