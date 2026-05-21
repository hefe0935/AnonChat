/**
 * Voice Message Recorder Manager
 * Records audio clips and manages playback
 * Privacy-respecting: Audio not stored, only transmitted
 */

class VoiceMessageRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordingStartTime = null;
    this.recordedBlob = null;
    this.listeners = new Set();
    this.maxDuration = 30 * 1000; // 30 seconds max
    this.recordingTimer = null;
  }

  /**
   * Initialize recorder (request microphone permission)
   * @returns {Promise<boolean>} Success status
   */
  async init() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.recordedBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.isRecording = false;
        this.notify();
      };

      return true;
    } catch (error) {
      console.error('Microphone access error:', error);
      this.notify('error', error.message);
      return false;
    }
  }

  /**
   * Start recording
   * @returns {boolean} Success status
   */
  start() {
    if (!this.mediaRecorder) return false;

    try {
      this.audioChunks = [];
      this.recordedBlob = null;
      this.isRecording = true;
      this.recordingStartTime = Date.now();

      this.mediaRecorder.start();

      // Auto-stop after max duration
      this.recordingTimer = setTimeout(() => {
        this.stop();
      }, this.maxDuration);

      this.notify();
      return true;
    } catch (error) {
      console.error('Recording start error:', error);
      return false;
    }
  }

  /**
   * Stop recording
   * @returns {Blob|null} Recorded audio blob
   */
  stop() {
    if (!this.isRecording || !this.mediaRecorder) return null;

    clearTimeout(this.recordingTimer);
    this.mediaRecorder.stop();

    return this.recordedBlob;
  }

  /**
   * Get recording duration
   * @returns {number} Duration in milliseconds
   */
  getRecordingDuration() {
    if (!this.isRecording) return 0;
    return Date.now() - this.recordingStartTime;
  }

  /**
   * Get remaining time
   * @returns {number} Remaining milliseconds
   */
  getRemainingTime() {
    const duration = this.getRecordingDuration();
    return Math.max(0, this.maxDuration - duration);
  }

  /**
   * Format duration for display
   * @returns {string} Formatted time string (MM:SS)
   */
  getFormattedDuration() {
    const duration = Math.floor(this.getRecordingDuration() / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Format remaining time for display
   * @returns {string} Formatted time string (MM:SS)
   */
  getFormattedRemainingTime() {
    const remaining = Math.floor(this.getRemainingTime() / 1000);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get recorded blob
   * @returns {Blob|null} Audio blob or null
   */
  getBlob() {
    return this.recordedBlob;
  }

  /**
   * Get blob as data URL for playback
   * @returns {string} Data URL or empty string
   */
  getBlobUrl() {
    if (!this.recordedBlob) return '';
    return URL.createObjectURL(this.recordedBlob);
  }

  /**
   * Get blob as Base64 for transmission
   * @returns {Promise<string>} Base64 encoded audio
   */
  async getBlobAsBase64() {
    if (!this.recordedBlob) return '';

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result.split(',')[1]); // Remove data:audio/webm;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(this.recordedBlob);
    });
  }

  /**
   * Playback a voice message
   * @param {Blob|string} source - Blob or base64 string
   * @returns {HTMLAudioElement} Audio element
   */
  createPlaybackElement(source) {
    const audio = new Audio();

    if (typeof source === 'string') {
      // Base64 string
      audio.src = `data:audio/webm;base64,${source}`;
    } else {
      // Blob
      audio.src = URL.createObjectURL(source);
    }

    return audio;
  }

  /**
   * Check if recording is supported
   * @returns {boolean} Support status
   */
  static isSupported() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder
    );
  }

  /**
   * Subscribe to recorder events
   * @param {Function} callback - Called on state changes
   * @returns {Function} Unsubscribe function
   */
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify listeners
   * @param {string} event - Event type
   * @param {*} data - Event data
   */
  notify(event = 'update', data = null) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Voice recorder listener error:', error);
      }
    });
  }

  /**
   * Cleanup (stop stream, free resources)
   */
  cleanup() {
    if (this.mediaRecorder) {
      if (this.isRecording) {
        this.stop();
      }
      // Stop all tracks in the stream
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    clearTimeout(this.recordingTimer);
  }

  /**
   * Get debug info
   */
  getDebugInfo() {
    return {
      isRecording: this.isRecording,
      duration: this.getFormattedDuration(),
      remaining: this.getFormattedRemainingTime(),
      hasBlobRecorded: !!this.recordedBlob,
      blobSize: this.recordedBlob?.size || 0,
      maxDuration: `${this.maxDuration / 1000}s`
    };
  }
}

// Export singleton instance
export default new VoiceMessageRecorder();
