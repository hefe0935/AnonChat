/**
 * Socket.io client for signaling
 * Handles room creation, joining, message relay, and WebRTC signaling
 */

import io from 'socket.io-client';

class SignalingClient {
  constructor(serverUrl = 'http://localhost:5000') {
    this.socket = null;
    this.serverUrl = serverUrl;
    this.roomCode = null;
    this.sessionId = null;
    this.isConnected = false;
  }

  /**
   * Connect to signaling server
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('Connected to signaling server');
        this.isConnected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from signaling server');
        this.isConnected = false;
      });
    });
  }

  /**
   * Create a new room and get ephemeral code
   */
  async createRoom(sessionId) {
    return new Promise((resolve, reject) => {
      this.socket.emit('create-room', { sessionId }, (response) => {
        if (response.success) {
          this.roomCode = response.roomCode;
          this.sessionId = sessionId;
          console.log('Room created with code:', this.roomCode);
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to create room'));
        }
      });
    });
  }

  /**
   * Join an existing room by code
   */
  async joinRoom(roomCode, sessionId) {
    return new Promise((resolve, reject) => {
      this.socket.emit('join-room', { roomCode, sessionId }, (response) => {
        if (response.success) {
          this.roomCode = roomCode;
          this.sessionId = sessionId;
          console.log('Joined room:', roomCode);
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to join room'));
        }
      });
    });
  }

  /**
   * Send text message to room
   */
  sendMessage(text) {
    if (this.socket && this.roomCode) {
      this.socket.emit('send-message', {
        roomCode: this.roomCode,
        sessionId: this.sessionId,
        text,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Listen for incoming messages
   */
  onMessage(callback) {
    if (this.socket) {
      this.socket.on('receive-message', callback);
    }
  }

  /**
   * Stop listening for incoming messages
   */
  offMessage(callback) {
    if (this.socket) {
      this.socket.off('receive-message', callback);
    }
  }

  /**
   * Send WebRTC offer
   */
  sendOffer(offer) {
    if (this.socket && this.roomCode) {
      this.socket.emit('offer', {
        roomCode: this.roomCode,
        sessionId: this.sessionId,
        offer,
      });
    }
  }

  /**
   * Listen for incoming offer
   */
  onOffer(callback) {
    if (this.socket) {
      this.socket.on('offer', callback);
    }
  }

  /**
   * Send WebRTC answer
   */
  sendAnswer(answer) {
    if (this.socket && this.roomCode) {
      this.socket.emit('answer', {
        roomCode: this.roomCode,
        sessionId: this.sessionId,
        answer,
      });
    }
  }

  /**
   * Listen for incoming answer
   */
  onAnswer(callback) {
    if (this.socket) {
      this.socket.on('answer', callback);
    }
  }

  /**
   * Send ICE candidate
   */
  sendIceCandidate(candidate) {
    if (this.socket && this.roomCode) {
      this.socket.emit('ice-candidate', {
        roomCode: this.roomCode,
        sessionId: this.sessionId,
        candidate,
      });
    }
  }

  /**
   * Listen for incoming ICE candidates
   */
  onIceCandidate(callback) {
    if (this.socket) {
      this.socket.on('ice-candidate', callback);
    }
  }

  /**
   * Get room participants
   */
  async getParticipants() {
    return new Promise((resolve) => {
      if (this.socket && this.roomCode) {
        this.socket.emit('get-participants', { roomCode: this.roomCode }, resolve);
      } else {
        resolve([]);
      }
    });
  }

  /**
   * Listen for participant presence
   */
  onParticipantJoined(callback) {
    if (this.socket) {
      this.socket.on('participant-joined', callback);
    }
  }

  onParticipantLeft(callback) {
    if (this.socket) {
      this.socket.on('participant-left', callback);
    }
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(isTyping) {
    if (this.socket && this.roomCode) {
      this.socket.emit('typing', {
        roomCode: this.roomCode,
        sessionId: this.sessionId,
        isTyping,
      });
    }
  }

  /**
   * Listen for typing indicators
   */
  onTyping(callback) {
    if (this.socket) {
      this.socket.on('typing', callback);
    }
  }

  /**
   * Stop listening for typing indicators
   */
  offTyping(callback) {
    if (this.socket) {
      this.socket.off('typing', callback);
    }
  }

  /**
   * Submit abuse report to server
   */
  async submitReport(reportData) {
    return new Promise((resolve, reject) => {
      if (this.socket) {
        this.socket.emit('submit-report', reportData, (response) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || 'Failed to submit report'));
          }
        });
      } else {
        reject(new Error('Not connected to server'));
      }
    });
  }

  /**
   * Disconnect from server
   * PRIVACY: Clears all session data
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.roomCode = null;
      this.sessionId = null;
    }
  }
}

export default SignalingClient;
