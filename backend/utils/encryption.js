const crypto = require('crypto');

/**
 * Encryption utility using AES-256-GCM
 * 
 * How it works:
 * 1. AES-256-GCM is a symmetric encryption algorithm (same key for encrypt/decrypt)
 * 2. GCM (Galois/Counter Mode) provides both encryption and authentication
 * 3. Each encryption uses a unique IV (Initialization Vector) to prevent pattern analysis
 * 4. The IV is stored alongside the encrypted data and needed for decryption
 * 5. An authentication tag ensures data integrity (detects tampering)
 * 
 * Security benefits:
 * - 256-bit key = extremely strong encryption (2^256 possible keys)
 * - Unique IV per encryption = same plaintext produces different ciphertext each time
 * - Authentication tag = detects if encrypted data was modified
 * - Industry standard = used by TLS, VPNs, and secure messaging apps
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES
const SALT_LENGTH = 64; // 64 bytes for key derivation
const TAG_LENGTH = 16; // 16 bytes for GCM auth tag
const KEY_LENGTH = 32; // 32 bytes = 256 bits for AES-256

// Get or generate encryption key from environment
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY not set in environment variables');
  }
  // Convert hex string to buffer
  return Buffer.from(key, 'hex');
}

/**
 * Encrypts data using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted data in format: iv:tag:encrypted (hex encoded)
 */
function encrypt(text) {
  if (!text) return text;
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:tag:encrypted (all hex encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data encrypted with AES-256-GCM
 * @param {string} encryptedData - Data in format: iv:tag:encrypted (hex encoded)
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedData) {
  if (!encryptedData) return encryptedData;
  
  // If data is not a string, return as-is (old unencrypted data)
  if (typeof encryptedData !== 'string') {
    return encryptedData;
  }
  
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      // Data not encrypted, return as-is
      return encryptedData;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // If decryption fails, return original data (might not be encrypted)
    return encryptedData;
  }
}

/**
 * Encrypts an object's sensitive fields
 * @param {object} obj - Object to encrypt
 * @param {string[]} fields - Array of field names to encrypt
 * @returns {object} - Object with encrypted fields
 */
function encryptObject(obj, fields) {
  if (!obj || !fields || fields.length === 0) return obj;
  
  const encrypted = { ...obj };
  fields.forEach(field => {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field]);
    } else if (encrypted[field] && typeof encrypted[field] === 'object') {
      // Encrypt nested objects/arrays (like chat history)
      encrypted[field] = encrypt(JSON.stringify(encrypted[field]));
    }
  });
  
  return encrypted;
}

/**
 * Decrypts an object's sensitive fields
 * @param {object} obj - Object to decrypt
 * @param {string[]} fields - Array of field names to decrypt
 * @returns {object} - Object with decrypted fields
 */
function decryptObject(obj, fields) {
  if (!obj || !fields || fields.length === 0) return obj;
  
  const decrypted = { ...obj };
  fields.forEach(field => {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      const decryptedValue = decrypt(decrypted[field]);
      // Try to parse as JSON in case it was an object/array
      try {
        decrypted[field] = JSON.parse(decryptedValue);
      } catch {
        decrypted[field] = decryptedValue;
      }
    }
  });
  
  return decrypted;
}

/**
 * Generates a secure random encryption key (for initial setup)
 * @returns {string} - 64-character hex string (32 bytes = 256 bits)
 */
function generateKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

module.exports = {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  generateKey,
};
