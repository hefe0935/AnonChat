import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../App';

// Auto-delete message after 5 minutes
const MESSAGE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

export default function Chat({ roomCode, onInitiateCall, onLeaveRoom }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const expiryTimersRef = useRef(new Map());
  const { signalingClient, sessionId } = useContext(AppContext);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (signalingClient) {
      const handleMessage = ({ message, sessionId: senderId, timestamp }) => {
        const messageId = Date.now();
        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
            text: message,
            sender: senderId,
            timestamp,
            isOwn: senderId === sessionId,
            expiresAt: Date.now() + MESSAGE_EXPIRY_TIME,
          },
        ]);

        // Set auto-delete timer for this message
        const timer = setTimeout(() => {
          setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
          expiryTimersRef.current.delete(messageId);
        }, MESSAGE_EXPIRY_TIME);

        expiryTimersRef.current.set(messageId, timer);
      };

      signalingClient.onMessage(handleMessage);

      // Cleanup: Remove listener and timers when component unmounts
      return () => {
        signalingClient.offMessage(handleMessage);
        expiryTimersRef.current.forEach((timer) => clearTimeout(timer));
        expiryTimersRef.current.clear();
      };
    }
  }, [signalingClient, sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    signalingClient?.sendMessage(inputValue);
    setInputValue('');
    
    // Stop typing indicator when message sent
    signalingClient?.sendTypingIndicator(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Send typing indicator
    if (value.trim()) {
      signalingClient?.sendTypingIndicator(true);
    } else {
      signalingClient?.sendTypingIndicator(false);
    }
  };

  // Setup typing indicator listener
  useEffect(() => {
    if (signalingClient) {
      const handleTyping = ({ sessionId: senderId, isTyping }) => {
        if (senderId !== sessionId) {
          if (isTyping) {
            setTypingUsers((prev) => new Set([...prev, senderId]));
          } else {
            setTypingUsers((prev) => {
              const updated = new Set(prev);
              updated.delete(senderId);
              return updated;
            });
          }
        }
      };

      signalingClient.onTyping(handleTyping);

      return () => {
        signalingClient.offTyping(handleTyping);
      };
    }
  }, [signalingClient, sessionId]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Chat Session
            </h2>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-mono text-blue-100">
                  Code: {roomCode}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                🗑️ Ephemeral • Auto-delete in 5 min
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onInitiateCall}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              📞 Start Call
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLeaveRoom}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Leave
            </motion.button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-xl ${
                  msg.isOwn
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-slate-700 text-slate-100 rounded-bl-none'
                }`}
              >
                <p className="break-words">{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.isOwn ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 items-end"
          >
            <div className="bg-slate-700 rounded-xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ delay: i * 0.1, duration: 0.6, repeat: Infinity }}
                    className="w-2 h-2 bg-slate-400 rounded-full"
                  />
                ))}
              </div>
            </div>
            <span className="text-xs text-slate-400">Someone is typing...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-black/30 backdrop-blur border-t border-white/10 px-6 py-4">
        <div className="flex gap-2 items-end">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-slate-700 border border-slate-600 text-white px-4 py-3 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Send
          </motion.button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          💬 Messages are not saved and auto-delete after disconnect • 🔐 All calls encrypted
        </p>
      </div>
    </div>
  );
}
