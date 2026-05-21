/**
 * Certificate Pinning Manager
 * 
 * Features:
 * - Pin signaling server SSL/TLS certificates
 * - Prevent MITM attacks on signaling
 * - Automatic certificate validation
 */

class CertificatePinningManager {
  constructor() {
    this.pinnedCertificates = new Map(); // host -> certificate data
    this.certificateValidationErrors = [];
  }

  /**
   * Add pinned certificate for a host
   */
  pinCertificate(host, publicKeyHash, thumbprint, certData = {}) {
    this.pinnedCertificates.set(host, {
      host,
      publicKeyHash,
      thumbprint,
      pinnedAt: Date.now(),
      certData,
      validations: []
    });

    console.log('[CertificatePinning] Certificate pinned for:', host);
  }

  /**
   * Validate certificate against pinned version
   */
  validateCertificate(host, incomingHash) {
    const pinned = this.pinnedCertificates.get(host);

    if (!pinned) {
      console.warn('[CertificatePinning] No pinned certificate for:', host);
      return {
        valid: false,
        reason: 'no_pinned_certificate',
        severity: 'warning'
      };
    }

    // Compare hashes
    const isValid = pinned.publicKeyHash === incomingHash;

    pinned.validations.push({
      timestamp: Date.now(),
      valid: isValid,
      incomingHash
    });

    if (!isValid) {
      const error = {
        timestamp: Date.now(),
        host,
        reason: 'certificate_mismatch',
        expectedHash: pinned.publicKeyHash,
        receivedHash: incomingHash,
        severity: 'critical'
      };

      this.certificateValidationErrors.push(error);
      console.error('[CertificatePinning] Certificate validation FAILED:', error);

      return {
        valid: false,
        reason: 'certificate_mismatch',
        severity: 'critical',
        message: 'MITM attack suspected or certificate changed'
      };
    }

    return {
      valid: true,
      reason: 'certificate_valid',
      severity: 'none'
    };
  }

  /**
   * Get pinned certificate
   */
  getPinnedCertificate(host) {
    return this.pinnedCertificates.get(host);
  }

  /**
   * Update pinned certificate (only if manually authorized)
   */
  updatePinnedCertificate(host, newHash, authorization = false) {
    if (!authorization) {
      console.warn('[CertificatePinning] Certificate update requires authorization');
      return false;
    }

    const pinned = this.pinnedCertificates.get(host);
    if (!pinned) return false;

    const oldHash = pinned.publicKeyHash;
    pinned.publicKeyHash = newHash;
    pinned.updatedAt = Date.now();

    console.log('[CertificatePinning] Certificate updated for:', host);

    return {
      updated: true,
      host,
      oldHash,
      newHash,
      timestamp: Date.now()
    };
  }

  /**
   * Get validation history
   */
  getValidationHistory(host) {
    const pinned = this.pinnedCertificates.get(host);
    if (!pinned) return null;

    return pinned.validations;
  }

  /**
   * Get validation errors
   */
  getValidationErrors() {
    return this.certificateValidationErrors;
  }

  /**
   * Check for MITM attacks
   */
  detectMITMAttempts() {
    const attempts = this.certificateValidationErrors.filter(
      e => e.severity === 'critical'
    );

    return {
      detected: attempts.length > 0,
      attemptCount: attempts.length,
      attempts: attempts.slice(-10) // Last 10 attempts
    };
  }

  /**
   * Get pinning status
   */
  getStatus() {
    return {
      pinnedHosts: Array.from(this.pinnedCertificates.keys()),
      validationErrorCount: this.certificateValidationErrors.length,
      mitm_detected: this.detectMITMAttempts().detected,
      timestamp: Date.now()
    };
  }

  /**
   * Export pinned certificates (for backup)
   */
  exportPinned() {
    const exported = {};
    for (const [host, data] of this.pinnedCertificates) {
      exported[host] = {
        publicKeyHash: data.publicKeyHash,
        thumbprint: data.thumbprint,
        pinnedAt: data.pinnedAt
      };
    }
    return exported;
  }

  /**
   * Import pinned certificates
   */
  importPinned(certificates) {
    for (const [host, data] of Object.entries(certificates)) {
      this.pinCertificate(
        host,
        data.publicKeyHash,
        data.thumbprint,
        { importedAt: Date.now() }
      );
    }
  }

  /**
   * Clear all pinned certificates
   */
  clearAll() {
    this.pinnedCertificates.clear();
    console.log('[CertificatePinning] All pinned certificates cleared');
  }

  /**
   * Initialize common signaling servers
   */
  initializeDefaults(signalingServers = []) {
    // This should be populated with actual server certificates
    // Example:
    // this.pinCertificate(
    //   'signaling.example.com',
    //   'sha256/abc123def456...',
    //   'thumbprint_value'
    // );

    console.log('[CertificatePinning] Initialized with', signalingServers.length, 'server(s)');
  }
}

export const certificatePinningManager = new CertificatePinningManager();
