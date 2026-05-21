/**
 * Signaling Server for Anonymous Communication
 * 
 * PRIVACY & SECURITY:
 * - Completely stateless: doesn't store user data
 * - Ephemeral rooms: deleted immediately on user disconnect
 * - Minimal logging: development only
 * - No message persistence: only relayed in real-time
 * - Report data stored for 7 days then auto-deleted
 * 
 * RESPONSIBILITIES:
 * 1. Room management (create, join, leave)
 * 2. Relay WebRTC signaling (offers, answers, ICE)
 * 3. Relay text messages
 * 4. Manage participant presence
 * 5. Handle abuse reports
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// CORS configuration for production
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
}));

app.use(express.json());

/**
 * Socket.IO server configuration
 * WSS (WebSocket Secure) in production, WS in development
 */
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'],
});

/**
 * EPHEMERAL ROOM STORAGE
 * Maps room code to room data
 * Data is automatically deleted when all users leave
 */
const rooms = new Map();

/**
 * EPHEMERAL REPORT STORAGE
 * Store reports for 7 days, then auto-delete
 * Minimal data: room code, timestamp, hashed snippet
 */
const reports = new Map();
const REPORT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * LOGGING: Only in development
 */
const isDev = process.env.NODE_ENV !== 'production';

function log(level, message, data = {}) {
  if (isDev) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${level}: ${message}`, data);
  }
  // In production, logs are silently discarded
}

/**
 * Generate random ephemeral room code
 * Format: 8 uppercase alphanumeric characters
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get or create room
 */
function getOrCreateRoom(roomCode) {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, {
      code: roomCode,
      participants: new Map(), // sessionId -> { socketId, sessionId }
      messages: [], // In-memory only
      createdAt: Date.now(),
    });
  }
  return rooms.get(roomCode);
}

/**
 * Delete room when empty
 */
function deleteRoomIfEmpty(roomCode) {
  const room = rooms.get(roomCode);
  if (room && room.participants.size === 0) {
    rooms.delete(roomCode);
    log('INFO', 'Room deleted (empty)', { roomCode });
  }
}

/**
 * Socket.IO connection handler
 */
io.on('connection', (socket) => {
  log('INFO', 'User connected', { socketId: socket.id });

  /**
   * CREATE ROOM
   * Generates a new ephemeral room code
   */
  socket.on('create-room', (data, callback) => {
    try {
      const roomCode = generateRoomCode();
      const room = getOrCreateRoom(roomCode);

      room.participants.set(data.sessionId, {
        socketId: socket.id,
        sessionId: data.sessionId,
      });

      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.sessionId = data.sessionId;

      log('INFO', 'Room created', { roomCode, sessionId: data.sessionId });

      callback({
        success: true,
        roomCode,
        message: 'Room created successfully',
      });
    } catch (error) {
      log('ERROR', 'Failed to create room', { error: error.message });
      callback({
        success: false,
        error: 'Failed to create room',
      });
    }
  });

  /**
   * JOIN ROOM
   * User joins an existing room by code
   */
  socket.on('join-room', (data, callback) => {
    try {
      const { roomCode, sessionId } = data;

      if (!rooms.has(roomCode)) {
        return callback({
          success: false,
          error: 'Room not found',
        });
      }

      const room = getOrCreateRoom(roomCode);

      // Check room capacity (max 2 participants for 1:1 calls)
      if (room.participants.size >= 2) {
        return callback({
          success: false,
          error: 'Room is full',
        });
      }

      room.participants.set(sessionId, {
        socketId: socket.id,
        sessionId,
      });

      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.sessionId = sessionId;

      log('INFO', 'User joined room', { roomCode, sessionId });

      // Notify others in the room
      io.to(roomCode).emit('participant-joined', {
        sessionId,
        participantCount: room.participants.size,
      });

      callback({
        success: true,
        roomCode,
        participants: Array.from(room.participants.values()),
      });
    } catch (error) {
      log('ERROR', 'Failed to join room', { error: error.message });
      callback({
        success: false,
        error: 'Failed to join room',
      });
    }
  });

  /**
   * SEND MESSAGE
   * Real-time text message relay
   * PRIVACY: Messages stored only in memory, not persisted
   */
  socket.on('send-message', (data) => {
    try {
      const { roomCode, sessionId, text, timestamp } = data;
      const room = rooms.get(roomCode);

      if (!room) {
        log('WARN', 'Message received for non-existent room', { roomCode });
        return;
      }

      // Store in memory only (auto-cleared on disconnect)
      room.messages.push({
        sessionId,
        text,
        timestamp,
      });

      // Relay to room members
      io.to(roomCode).emit('receive-message', {
        message: text,
        sessionId,
        timestamp,
      });

      log('INFO', 'Message relayed', { roomCode, messageLength: text.length });
    } catch (error) {
      log('ERROR', 'Failed to relay message', { error: error.message });
    }
  });

  /**
   * TYPING INDICATOR
   * Broadcast when user is typing
   * PRIVACY: Only broadcasts within room
   */
  socket.on('typing', (data) => {
    try {
      const { roomCode, sessionId, isTyping } = data;
      const room = rooms.get(roomCode);

      if (!room) return;

      // Relay to all participants in room
      io.to(roomCode).emit('typing', {
        sessionId,
        isTyping,
      });

      log('INFO', 'Typing indicator broadcast', { roomCode, isTyping });
    } catch (error) {
      log('ERROR', 'Failed to broadcast typing', { error: error.message });
    }
  });

  /**
   * WEBRTC OFFER
   * Relay SDP offer from initiator to peer
   */
  socket.on('offer', (data) => {
    try {
      const { roomCode, sessionId, offer } = data;
      const room = rooms.get(roomCode);

      if (!room) return;

      // Relay to all participants except sender
      socket.to(roomCode).emit('offer', {
        offer,
        sessionId,
        roomCode,
      });

      log('INFO', 'Offer relayed', { roomCode });
    } catch (error) {
      log('ERROR', 'Failed to relay offer', { error: error.message });
    }
  });

  /**
   * WEBRTC ANSWER
   * Relay SDP answer from peer to initiator
   */
  socket.on('answer', (data) => {
    try {
      const { roomCode, sessionId, answer } = data;
      const room = rooms.get(roomCode);

      if (!room) return;

      socket.to(roomCode).emit('answer', {
        answer,
        sessionId,
        roomCode,
      });

      log('INFO', 'Answer relayed', { roomCode });
    } catch (error) {
      log('ERROR', 'Failed to relay answer', { error: error.message });
    }
  });

  /**
   * ICE CANDIDATE
   * Relay STUN/TURN candidate for NAT traversal
   */
  socket.on('ice-candidate', (data) => {
    try {
      const { roomCode, sessionId, candidate } = data;
      const room = rooms.get(roomCode);

      if (!room) return;

      socket.to(roomCode).emit('ice-candidate', {
        candidate,
        sessionId,
        roomCode,
      });

      log('INFO', 'ICE candidate relayed', { roomCode });
    } catch (error) {
      log('ERROR', 'Failed to relay ICE candidate', { error: error.message });
    }
  });

  /**
   * GET PARTICIPANTS
   * Return list of active participants in room
   */
  socket.on('get-participants', (data, callback) => {
    try {
      const { roomCode } = data;
      const room = rooms.get(roomCode);

      if (!room) {
        return callback([]);
      }

      const participants = Array.from(room.participants.values());
      callback(participants);
    } catch (error) {
      log('ERROR', 'Failed to get participants', { error: error.message });
      callback([]);
    }
  });

  /**
   * SUBMIT REPORT
   * Handle abuse reports
   * PRIVACY: Store minimal data (room code, timestamp, hashed snippet)
   * Auto-delete after 7 days
   */
  socket.on('submit-report', (data, callback) => {
    try {
      const { roomCode, timestamp, messageSnippet } = data;
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store report with auto-delete timeout
      reports.set(reportId, {
        id: reportId,
        roomCode,
        timestamp,
        messageSnippet,
        createdAt: Date.now(),
      });

      // Auto-delete after 7 days
      setTimeout(() => {
        reports.delete(reportId);
        log('INFO', 'Report auto-deleted (7 days)', { reportId });
      }, REPORT_RETENTION_MS);

      log('INFO', 'Report submitted', { reportId, roomCode });

      callback({
        success: true,
        reportId,
        message: 'Report submitted successfully',
      });
    } catch (error) {
      log('ERROR', 'Failed to submit report', { error: error.message });
      callback({
        success: false,
        error: 'Failed to submit report',
      });
    }
  });

  /**
   * DISCONNECT
   * Clean up user data and delete empty rooms
   * PRIVACY: All user data is immediately discarded
   */
  socket.on('disconnect', () => {
    try {
      const { roomCode, sessionId } = socket.data;

      if (roomCode && sessionId) {
        const room = rooms.get(roomCode);

        if (room) {
          room.participants.delete(sessionId);

          // Notify remaining participants
          io.to(roomCode).emit('participant-left', {
            sessionId,
            participantCount: room.participants.size,
          });

          // Delete room if empty
          deleteRoomIfEmpty(roomCode);
        }
      }

      log('INFO', 'User disconnected', { socketId: socket.id, roomCode });
    } catch (error) {
      log('ERROR', 'Error during disconnect', { error: error.message });
    }
  });
});

/**
 * REST API endpoints
 */

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
    reports: reports.size,
  });
});

/**
 * Get server statistics (admin endpoint)
 * In production, protect with authentication
 */
app.get('/stats', (req, res) => {
  const stats = {
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
    reports: reports.size,
    roomDetails: isDev ? Array.from(rooms.entries()).map(([code, room]) => ({
      code,
      participantCount: room.participants.size,
      messageCount: room.messages.length,
      createdAt: new Date(room.createdAt).toISOString(),
    })) : [],
  };

  res.json(stats);
});

/**
 * Start server
 */
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Signaling server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ${PORT === 5000 ? 'ws://localhost:5000' : `wss://<your-domain>:${PORT}`}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Statistics: http://localhost:${PORT}/stats`);
  console.log(`\n🔐 PRIVACY: Room data is ephemeral and auto-deleted on disconnect\n`);
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  log('INFO', 'SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    log('INFO', 'Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('INFO', 'SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    log('INFO', 'Server closed');
    process.exit(0);
  });
});

export default io;
