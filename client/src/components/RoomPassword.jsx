import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Room Password Protection Component
 * Allows setting and validating room passwords
 */
export default function RoomPassword({
  roomCode,
  isCreator,
  onPasswordSet,
  onPasswordValidated,
  authenticated,
}) {
  const [mode, setMode] = useState(isCreator ? 'set' : 'enter'); // 'set' or 'enter'
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSetPassword = () => {
    setError('');

    if (!password.trim()) {
      setError('Password cannot be empty');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    // Hash password for security (simple approach - use bcrypt in production)
    const hashedPassword = btoa(password); // Base64 encoding (not secure - for demo only)
    onPasswordSet(hashedPassword);
    setPassword('');
    setConfirmPassword('');
  };

  const handleValidatePassword = () => {
    setError('');

    if (!password.trim()) {
      setError('Please enter the password');
      return;
    }

    const hashedPassword = btoa(password);
    onPasswordValidated(hashedPassword);
    setPassword('');
  };

  if (authenticated) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-green-500/10 border border-green-500/50 rounded-lg px-4 py-2"
      >
        <p className="text-xs text-green-400">🔓 Room authenticated</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 border border-slate-700 rounded-lg p-4 max-w-sm mx-auto"
    >
      <h3 className="text-white font-bold mb-4 text-center">
        {mode === 'set' ? '🔐 Set Room Password' : '🔓 Enter Room Password'}
      </h3>

      <div className="space-y-3">
        {/* Password Input */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">
            {mode === 'set' ? 'Create Password' : 'Password'}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder={mode === 'set' ? 'Enter password' : 'Enter password'}
              className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white text-sm"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Confirm Password (only for creator) */}
        {mode === 'set' && (
          <div>
            <label className="block text-xs text-slate-400 mb-2">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              placeholder="Confirm password"
              className="w-full bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded"
          >
            {error}
          </motion.p>
        )}

        {/* Password Requirements */}
        <p className="text-xs text-slate-500">
          {mode === 'set'
            ? '✓ Min 4 characters'
            : '✓ Case sensitive'}
        </p>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={
            mode === 'set' ? handleSetPassword : handleValidatePassword
          }
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded transition-colors text-sm"
        >
          {mode === 'set' ? 'Create Password' : 'Verify Password'}
        </motion.button>
      </div>
    </motion.div>
  );
}
