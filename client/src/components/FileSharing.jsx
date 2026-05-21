import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * File Sharing Component
 * Allows users to share files during calls
 */
export default function FileSharing({ fileShareManager, onFileSent, onFileReceived }) {
  const [transfers, setTransfers] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of files) {
      if (file.size > 100 * 1024 * 1024) {
        alert('File size exceeds 100MB limit');
        continue;
      }

      // Start transfer
      const transferId = Date.now().toString();
      setTransfers((prev) => [
        ...prev,
        {
          id: transferId,
          name: file.name,
          size: file.size,
          percent: 0,
          status: 'sending',
          direction: 'send',
        },
      ]);

      // Setup progress callback
      const originalProgress = fileShareManager.onProgress;
      fileShareManager.onProgress = (progress) => {
        setTransfers((prev) =>
          prev.map((t) =>
            t.id === transferId
              ? { ...t, percent: Math.round(progress.percent) }
              : t
          )
        );
      };

      const success = await fileShareManager.sendFile(file);

      fileShareManager.onProgress = originalProgress;

      setTransfers((prev) =>
        prev.map((t) =>
          t.id === transferId
            ? { ...t, status: success ? 'completed' : 'failed' }
            : t
        )
      );

      if (success && onFileSent) {
        onFileSent(file.name);
      }

      // Remove completed transfer after 3 seconds
      setTimeout(() => {
        setTransfers((prev) => prev.filter((t) => t.id !== transferId));
      }, 3000);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* File Share Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        disabled={!fileShareManager?.isReady()}
        className="w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        📁 Share File
      </motion.button>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="*/*"
      />

      {/* Transfer Progress */}
      {transfers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 bg-black/30 p-3 rounded-lg"
        >
          {transfers.map((transfer) => (
            <div key={transfer.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 truncate">{transfer.name}</span>
                <span className={`text-xs font-mono ${
                  transfer.status === 'completed'
                    ? 'text-green-400'
                    : transfer.status === 'failed'
                    ? 'text-red-400'
                    : 'text-blue-400'
                }`}>
                  {transfer.percent}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${transfer.percent}%` }}
                  className={`h-full ${
                    transfer.status === 'completed'
                      ? 'bg-green-500'
                      : transfer.status === 'failed'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                />
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
