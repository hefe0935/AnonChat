/**
 * Utility: Generate ephemeral codes and session tokens
 * 
 * PRIVACY: Each room/session gets a unique 8-character code
 * Codes are single-use and expire after session ends or 24 hours
 */

/**
 * Generate a random 8-character alphanumeric code
 * Uses cryptographically secure random generation
 */
export function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const randomValues = new Uint8Array(8);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < 8; i++) {
    code += chars[randomValues[i] % chars.length];
  }
  
  return code;
}

/**
 * Generate a unique session ID for the current user
 * Used locally to identify messages, ephemeral only
 */
export function generateSessionId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique call ID for the WebRTC session
 */
export function generateCallId() {
  return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a hash of text for abuse reporting
 * Uses SHA256 for consistent hashing
 */
export async function hashForReport(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate room code format
 */
export function isValidRoomCode(code) {
  return /^[A-Z0-9]{8}$/.test(code);
}
