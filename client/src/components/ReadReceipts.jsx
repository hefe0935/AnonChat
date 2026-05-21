import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import readReceiptsManager from '../utils/readReceiptsManager';

/**
 * Read Receipts Display Component
 * Shows message delivery and read status with animation
 */
export default function ReadReceipts({ messageId, className = '' }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    // Update on mount and when receipts change
    const updateStatus = () => {
      setStatus(readReceiptsManager.getStatusString(messageId));
    };

    updateStatus();
    const unsubscribe = readReceiptsManager.onChange(updateStatus);

    return unsubscribe;
  }, [messageId]);

  if (!status) return null;

  const receipt = readReceiptsManager.getReceipt(messageId);
  const icon = readReceiptsManager.getStatusIcon(messageId);

  let bgColor = 'bg-slate-700/20';
  let textColor = 'text-slate-400';

  // Color code by status
  if (receipt?.status === 'read') {
    bgColor = 'bg-blue-500/20';
    textColor = 'text-blue-400';
  } else if (receipt?.status === 'delivered') {
    bgColor = 'bg-slate-600/20';
    textColor = 'text-slate-300';
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        flex items-center gap-1 text-xs
        ${bgColor} ${textColor} px-2 py-1 rounded
        ${className}
      `}
      title={`${status} at ${receipt?.readAt ? new Date(receipt.readAt).toLocaleTimeString() : 'pending'}`}
    >
      <span>{icon}</span>
      <span>{status}</span>
    </motion.div>
  );
}
