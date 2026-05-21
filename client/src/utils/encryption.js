/**
 * End-to-End Encryption Module
 * Provides E2E encryption for messages and sensitive data
 * Uses Web Crypto API (SubtleCrypto)
 */

class E2EEncryption {
  constructor() {
    this.crypto = window.crypto.subtle;
    this.keyPair = null;
    this.sharedSecret = null;
  }

  /**
   * Generate AES key for symmetric encryption
   */
  async generateAESKey() {
    return await this.crypto.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate RSA key pair for key exchange
   */
  async generateRSAKeyPair() {
    return await this.crypto.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
    );
  }

  /**
   * Encrypt message with AES-GCM
   */
  async encryptMessage(message, aesKey) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await this.crypto.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      aesKey,
      data
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Return as base64
    return this.arrayBufferToBase64(combined);
  }

  /**
   * Decrypt message with AES-GCM
   */
  async decryptMessage(encryptedMessage, aesKey) {
    const combined = this.base64ToArrayBuffer(encryptedMessage);

    // Extract IV (first 12 bytes)
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decryptedData = await this.crypto.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      aesKey,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  }

  /**
   * Encrypt AES key with RSA public key
   */
  async encryptKeyWithPublicKey(aesKey, publicKey) {
    const wrappedKey = await this.crypto.wrapKey(
      'raw',
      aesKey,
      publicKey,
      'RSA-OAEP'
    );

    return this.arrayBufferToBase64(wrappedKey);
  }

  /**
   * Decrypt AES key with RSA private key
   */
  async decryptKeyWithPrivateKey(encryptedKey, privateKey) {
    const wrappedKey = this.base64ToArrayBuffer(encryptedKey);

    return await this.crypto.unwrapKey(
      'raw',
      wrappedKey,
      privateKey,
      'RSA-OAEP',
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Hash password for authentication
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    const hashBuffer = await this.crypto.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Export public key as JWK for sharing
   */
  async exportPublicKey(publicKey) {
    const jwk = await this.crypto.exportKey('jwk', publicKey);
    return JSON.stringify(jwk);
  }

  /**
   * Import public key from JWK
   */
  async importPublicKey(jwkString) {
    const jwk = JSON.parse(jwkString);
    return await this.crypto.importKey(
      'jwk',
      jwk,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'wrapKey']
    );
  }

  /**
   * Sign data with HMAC
   */
  async signData(data, key) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const signature = await this.crypto.sign(
      {
        name: 'HMAC',
      },
      key,
      dataBuffer
    );

    return this.arrayBufferToBase64(signature);
  }

  /**
   * Verify signed data
   */
  async verifySignature(data, signature, key) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const signatureBuffer = this.base64ToArrayBuffer(signature);

    return await this.crypto.verify(
      {
        name: 'HMAC',
      },
      key,
      signatureBuffer,
      dataBuffer
    );
  }
}

export default new E2EEncryption();
