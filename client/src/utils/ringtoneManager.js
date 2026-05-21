/**
 * Audio Ringtone Manager
 * Plays ringtone sound on incoming calls
 */

class RingtoneManager {
  constructor() {
    this.audioContext = null;
    this.oscillators = [];
    this.isPlaying = false;
  }

  /**
   * Initialize Web Audio API
   */
  initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Generate ringtone using Web Audio API
   * Creates a classic phone ringtone pattern
   */
  playRingtone() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      const audioCtx = this.initAudioContext();

      // Resume audio context if suspended (required by browsers)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      // Create the ringtone pattern
      this.playRingtonePattern(audioCtx);
    } catch (err) {
      console.error('Error playing ringtone:', err);
      this.isPlaying = false;
    }
  }

  /**
   * Play ringtone pattern (two-tone, repeating)
   */
  playRingtonePattern(audioCtx) {
    const now = audioCtx.currentTime;
    const pattern = [
      { freq: 800, duration: 0.2, delay: 0 },
      { freq: 0, duration: 0.1, delay: 0.2 },
      { freq: 800, duration: 0.2, delay: 0.3 },
      { freq: 0, duration: 0.5, delay: 0.5 },
      { freq: 640, duration: 0.2, delay: 1.0 },
      { freq: 0, duration: 0.1, delay: 1.2 },
      { freq: 640, duration: 0.2, delay: 1.3 },
      { freq: 0, duration: 0.5, delay: 1.5 },
    ];

    // Repeat pattern 3 times (about 6 seconds)
    for (let repeat = 0; repeat < 3; repeat++) {
      pattern.forEach((note) => {
        const startTime = now + note.delay + (repeat * 2.0);
        const endTime = startTime + note.duration;

        if (note.freq > 0) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc.frequency.value = note.freq;
          osc.type = 'sine';

          gain.gain.setValueAtTime(0.3, startTime);
          gain.gain.setValueAtTime(0.3, endTime - 0.05);
          gain.gain.setValueAtTime(0, endTime);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start(startTime);
          osc.stop(endTime);

          this.oscillators.push(osc);
        }
      });
    }

    // Stop after pattern completes
    setTimeout(() => {
      this.stopRingtone();
    }, 6000);
  }

  /**
   * Stop the ringtone
   */
  stopRingtone() {
    try {
      this.oscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch (e) {
          // Already stopped
        }
      });
      this.oscillators = [];
      this.isPlaying = false;
    } catch (err) {
      console.error('Error stopping ringtone:', err);
    }
  }

  /**
   * Play vibration pattern using Vibration API
   */
  playVibration() {
    if (navigator.vibrate) {
      // Pattern: 200ms vibrate, 100ms pause, repeat
      navigator.vibrate([200, 100, 200, 100, 200, 100, 200, 100]);
    }
  }

  /**
   * Play full ringtone with vibration
   */
  ring() {
    this.playRingtone();
    this.playVibration();
  }
}

export default new RingtoneManager();
