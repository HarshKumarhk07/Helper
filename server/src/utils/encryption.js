import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// ENCRYPTION_KEY must be exactly 32 bytes (256 bits) for AES-256
// If not set in env, it defaults to a random key (warning: data will be lost on restart if random!)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex') 
  : crypto.randomBytes(32);
const IV_LENGTH = 16; // 128-bit IV for AES GCM

/**
 * Encrypts text using AES-256-GCM.
 * @param {string} text - The text to encrypt.
 * @returns {Object} - An object containing the iv, encryptedData, and authTag (all hex strings)
 */
export function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag,
  };
}

/**
 * Decrypts data encrypted with AES-256-GCM.
 * @param {Object} encryptedObj - An object containing iv, encryptedData, and authTag (as hex strings)
 * @returns {string} - The decrypted text
 */
export function decrypt(encryptedObj) {
  if (!encryptedObj || !encryptedObj.encryptedData || !encryptedObj.iv || !encryptedObj.authTag) return null;
  try {
    const ivBuffer = Buffer.from(encryptedObj.iv, 'hex');
    const authTagBuffer = Buffer.from(encryptedObj.authTag, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, ivBuffer);
    
    decipher.setAuthTag(authTagBuffer);
    
    let decrypted = decipher.update(encryptedObj.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // If auth tag verification fails, it throws here (tampering detected)
    console.error('Decryption failed (tampering detected or wrong key):', error.message);
    return null;
  }
}
