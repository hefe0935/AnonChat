/**
 * WebRTC Manager: Handles peer connections, local streams, and ICE
 * 
 * PRIVACY: No recording functionality. Media streams are never saved.
 * Uses only memory-based streams that are discarded on disconnect.
 */

class RTCManager {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStreams = new Map();
    this.dataChannels = new Map();
    this.signalingClient = null;
    this.sessionId = null;
    this.roomCode = null;
    this.isInitialized = false;
    this.isNegotiating = false;

    // ICE servers configuration with STUN fallback
    this.iceServers = [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    ];
  }

  /**
   * Set signaling client for ICE candidate relay
   */
  setSignalingClient(signalingClient) {
    this.signalingClient = signalingClient;
  }

  /**
   * Check if call is already active
   */
  isCallActive() {
    return this.peerConnection !== null && this.peerConnection.connectionState === 'connected';
  }

  /**
   * Initialize WebRTC peer connection
   */
  async initializePeerConnection(sessionId, roomCode) {
    if (this.peerConnection) {
      console.log('Peer connection already exists');
      return true;
    }

    this.sessionId = sessionId;
    this.roomCode = roomCode;
    this.isNegotiating = false;

    const peerConnectionConfig = {
      iceServers: this.iceServers,
      iceTransportPolicy: 'all',
    };

    try {
      this.peerConnection = new RTCPeerConnection(peerConnectionConfig);

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate');
          this.signalingClient?.sendIceCandidate(event.candidate);
        }
      };

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        console.log('Received remote stream');
        this.remoteStreams.set(sessionId, event.streams[0]);
        if (this.onRemoteStream) {
          this.onRemoteStream(event.streams[0]);
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection.connectionState;
        console.log('Connection state:', state);
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(state);
        }
      };

      // Handle signaling state changes (for debugging)
      this.peerConnection.onsignalingstatechange = () => {
        console.log('Signaling state:', this.peerConnection.signalingState);
      };

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing peer connection:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Get local media (audio only - voice call)
   */
  async getLocalMedia(constraints = { audio: true, video: false }) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Got local media, adding tracks to peer connection');
      
      // Add tracks to peer connection if it exists
      await this.addLocalTracksToConnection();

      return this.localStream;
    } catch (error) {
      console.error('Error getting local media:', error);
      throw error;
    }
  }

  /**
   * Add local media tracks to peer connection
   * This MUST be called before creating offers/answers
   */
  async addLocalTracksToConnection() {
    if (!this.localStream || !this.peerConnection) {
      console.warn('Cannot add tracks: localStream or peerConnection missing');
      return;
    }

    try {
      const audioTracks = this.localStream.getAudioTracks();
      console.log('Adding', audioTracks.length, 'audio track(s) to peer connection');
      
      audioTracks.forEach((track) => {
        console.log('Adding audio track:', track.label, 'enabled:', track.enabled);
        this.peerConnection.addTrack(track, this.localStream);
      });
      
      console.log('Tracks added successfully');
    } catch (error) {
      console.error('Error adding tracks to peer connection:', error);
      throw error;
    }
  }

  /**
   * Stop local media tracks
   * PRIVACY: Always stops tracks on disconnect
   */
  stopLocalMedia() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }
  }

  /**
   * Create offer for initiating call (audio only)
   */
  async createOffer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      // Check if we have tracks
      const senders = this.peerConnection.getSenders();
      console.log('RTCPeerConnection has', senders.length, 'senders');
      senders.forEach((sender, index) => {
        if (sender.track) {
          console.log(`Sender ${index}:`, sender.track.kind, '- enabled:', sender.track.enabled);
        }
      });

      this.isNegotiating = true;
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });

      await this.peerConnection.setLocalDescription(offer);
      console.log('Offer created and local description set');
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      this.isNegotiating = false;
      throw error;
    }
  }

  /**
   * Handle incoming offer (audio only)
   */
  async handleOffer(offer) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const state = this.peerConnection.signalingState;
      console.log('handleOffer - current state:', state);

      // Check if we have tracks
      const senders = this.peerConnection.getSenders();
      console.log('RTCPeerConnection has', senders.length, 'senders before handling offer');
      senders.forEach((sender, index) => {
        if (sender.track) {
          console.log(`Sender ${index}:`, sender.track.kind, '- enabled:', sender.track.enabled);
        }
      });

      // Set remote description
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('Remote offer description set');

      // Create and set answer
      const answer = await this.peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });

      await this.peerConnection.setLocalDescription(answer);
      console.log('Answer created and local description set');
      return answer;
    } catch (error) {
      console.error('Error handling offer:', error);
      console.error('Signaling state at error:', this.peerConnection?.signalingState);
      throw error;
    }
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(answer) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const state = this.peerConnection.signalingState;
      console.log('handleAnswer - current state:', state);

      // Only set remote description if we're waiting for an answer
      if (state === 'have-local-offer') {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Remote answer description set, state:', this.peerConnection.signalingState);
      } else {
        console.warn('Ignoring answer in state:', state);
      }
    } catch (error) {
      console.error('Error handling answer:', error);
      console.error('State:', this.peerConnection?.signalingState);
      throw error;
    }
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate) {
    try {
      if (candidate && this.peerConnection) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  /**
   * Toggle audio track
   */
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Toggle video track
   */
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Close connection and cleanup
   * PRIVACY: Ensures all streams are stopped
   */
  close() {
    this.stopLocalMedia();

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStreams.clear();
    this.dataChannels.clear();
  }

  /**
   * Get connection stats
   */
  async getStats() {
    if (!this.peerConnection) return null;

    const stats = await this.peerConnection.getStats();
    const result = {
      audio: { inbound: {}, outbound: {} },
      video: { inbound: {}, outbound: {} },
    };

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp') {
        if (report.kind === 'audio') {
          result.audio.inbound = {
            bytesReceived: report.bytesReceived,
            packetsLost: report.packetsLost,
            jitter: report.jitter,
          };
        } else if (report.kind === 'video') {
          result.video.inbound = {
            bytesReceived: report.bytesReceived,
            framesDecoded: report.framesDecoded,
            frameRate: report.framesPerSecond,
          };
        }
      } else if (report.type === 'outbound-rtp') {
        if (report.kind === 'audio') {
          result.audio.outbound = {
            bytesSent: report.bytesSent,
            packetsSent: report.packetsSent,
          };
        } else if (report.kind === 'video') {
          result.video.outbound = {
            bytesSent: report.bytesSent,
            framesSent: report.framesSent,
            frameRate: report.framesPerSecond,
          };
        }
      }
    });

    return result;
  }
}

export default RTCManager;
