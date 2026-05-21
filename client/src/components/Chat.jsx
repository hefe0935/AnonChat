import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../App';

const MESSAGE_EXPIRY_TIME = 5 * 60 * 1000;

export default function Chat({ roomCode, onInitiateCall, onLeaveRoom }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const expiryTimersRef = useRef(new Map());
  const { signalingClient, sessionId } = useContext(AppContext);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!signalingClient) return;
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

      const timer = setTimeout(() => {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        expiryTimersRef.current.delete(messageId);
      }, MESSAGE_EXPIRY_TIME);

      expiryTimersRef.current.set(messageId, timer);
    };

    signalingClient.onMessage(handleMessage);
    return () => {
      signalingClient.offMessage(handleMessage);
      expiryTimersRef.current.forEach((timer) => clearTimeout(timer));
      expiryTimersRef.current.clear();
    };
  }, [signalingClient, sessionId]);

  useEffect(() => {
    if (!signalingClient) return;

    const handleTyping = ({ sessionId: senderId, isTyping }) => {
      if (senderId === sessionId) return;
      if (isTyping) setTypingUsers((prev) => new Set([...prev, senderId]));
      if (!isTyping) {
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(senderId);
          return updated;
        });
      }
    };

    signalingClient.onTyping(handleTyping);
    return () => signalingClient.offTyping(handleTyping);
  }, [signalingClient, sessionId]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    signalingClient?.sendMessage(inputValue);
    setInputValue('');
    signalingClient?.sendTypingIndicator(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    signalingClient?.sendTypingIndicator(Boolean(value.trim()));
  };

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-screen w-full flex flex-col px-3 py-3 md:px-5 md:py-5">
      <div className="h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-black/30 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl flex flex-col">
        <div className="bg-black/25 border-b border-white/10 px-5 py-4 md:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white mb-1">Secure Room</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-mono text-slate-200">Code: {roomCode}</span>
                </div>
                <span className="text-xs text-slate-400">Ephemeral • Auto-delete in 5 min</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onInitiateCall}
                className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold py-2 px-4 rounded-xl transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.79.62 2.64a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6.27 6.27l1.26-1.27a2 2 0 0 1 2.11-.45c.85.29 1.74.5 2.64.62A2 2 0 0 1 22 16.92Z" /></svg>
                Start Call
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onLeaveRoom}
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-xl border border-white/20 transition-colors"
              >
                Leave
              </motion.button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5 space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] md:max-w-md px-4 py-3 rounded-2xl border ${msg.isOwn ? 'bg-amber-300 text-slate-900 rounded-br-md border-amber-200/60' : 'bg-slate-900/70 text-slate-100 rounded-bl-md border-white/10'}`}>
                  <p className="break-words leading-relaxed">{msg.text}</p>
                  <p className={`text-[11px] mt-1 ${msg.isOwn ? 'text-slate-800/70' : 'text-slate-400'}`}>{formatTime(msg.timestamp)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {typingUsers.size > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 items-end">
              <div className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} animate={{ y: [0, -8, 0] }} transition={{ delay: i * 0.1, duration: 0.6, repeat: Infinity }} className="w-2 h-2 bg-slate-400 rounded-full" />
                  ))}
                </div>
              </div>
              <span className="text-xs text-slate-400">Someone is typing...</span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-black/25 border-t border-white/10 px-4 py-4 md:px-6">
          <div className="flex gap-2 items-end">
            <input type="text" value={inputValue} onChange={handleInputChange} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className="flex-1 bg-slate-900/80 border border-white/15 text-white px-4 py-3 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300/60" />
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSendMessage} disabled={!inputValue.trim()} className="bg-amber-300 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-2 px-6 rounded-xl transition-colors">
              Send
            </motion.button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Messages are transient and auto-delete after disconnect • Calls are end-to-end encrypted</p>
        </div>
      </div>
    </div>
  );
}
