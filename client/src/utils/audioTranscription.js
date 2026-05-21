/**
 * Audio Transcription Manager (Local Only - No Server Transmission)
 * 
 * Features:
 * - Client-side speech-to-text
 * - No server transmission
 * - Privacy toggle to disable
 */

class AudioTranscriptionManager {
  constructor() {
    this.isTranscribing = false;
    this.transcriptions = [];
    this.isEnabled = false;
    this.recognition = null;
    this.setupSpeechRecognition();
  }

  /**
   * Setup Web Speech API
   */
  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[AudioTranscription] Speech Recognition API not available');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isTranscribing = true;
      console.log('[AudioTranscription] Started');
    };

    this.recognition.onend = () => {
      this.isTranscribing = false;
      console.log('[AudioTranscription] Stopped');
    };

    this.recognition.onerror = (event) => {
      console.error('[AudioTranscription] Error:', event.error);
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.recordTranscription(finalTranscript, 'final');
      }

      if (interimTranscript) {
        this.onInterimResult?.(interimTranscript);
      }
    };
  }

  /**
   * Start transcribing
   */
  startTranscribing() {
    if (!this.isEnabled) {
      console.warn('[AudioTranscription] Transcription disabled');
      return false;
    }

    if (!this.recognition) {
      console.error('[AudioTranscription] Speech Recognition not available');
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (e) {
      console.error('[AudioTranscription] Start error:', e);
      return false;
    }
  }

  /**
   * Stop transcribing
   */
  stopTranscribing() {
    if (this.recognition) {
      this.recognition.stop();
      return true;
    }
    return false;
  }

  /**
   * Toggle transcription
   */
  toggleTranscription() {
    if (this.isTranscribing) {
      return this.stopTranscribing();
    } else {
      return this.startTranscribing();
    }
  }

  /**
   * Record transcription
   */
  recordTranscription(text, type = 'final') {
    const transcription = {
      timestamp: Date.now(),
      text,
      type,
      localOnly: true // Mark as local-only to prevent transmission
    };

    this.transcriptions.push(transcription);

    // Keep only last 100
    if (this.transcriptions.length > 100) {
      this.transcriptions.shift();
    }

    console.log('[AudioTranscription] Recorded:', transcription);
    this.onTranscription?.(transcription);
  }

  /**
   * Enable/Disable transcription
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled && this.isTranscribing) {
      this.stopTranscribing();
    }
    console.log('[AudioTranscription] Enabled:', enabled);
  }

  /**
   * Set language
   */
  setLanguage(lang) {
    if (this.recognition) {
      this.recognition.lang = lang;
      console.log('[AudioTranscription] Language set to:', lang);
    }
  }

  /**
   * Get transcription history
   */
  getHistory() {
    return this.transcriptions;
  }

  /**
   * Get transcription summary
   */
  getSummary() {
    const finalTranscriptions = this.transcriptions
      .filter(t => t.type === 'final')
      .map(t => t.text)
      .join(' ');

    return finalTranscriptions;
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.transcriptions = [];
  }

  /**
   * Check if available
   */
  isAvailable() {
    return this.recognition !== null;
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      available: this.isAvailable(),
      enabled: this.isEnabled,
      transcribing: this.isTranscribing,
      transcriptionCount: this.transcriptions.length,
      localOnly: true
    };
  }

  /**
   * Set callback for interim results
   */
  onInterimResult = null;

  /**
   * Set callback for transcriptions
   */
  onTranscription = null;
}

export const audioTranscriptionManager = new AudioTranscriptionManager();
