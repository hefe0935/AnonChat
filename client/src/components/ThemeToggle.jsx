import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import themeManager from '../utils/themeManager';

/**
 * Theme Toggle Component
 * Allows user to switch between dark and light mode
 */
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(themeManager.isDark());

  useEffect(() => {
    // Subscribe to theme changes
    const unsubscribe = themeManager.onChange((newTheme) => {
      setIsDark(newTheme === 'dark');
    });

    return unsubscribe;
  }, []);

  const handleToggle = () => {
    themeManager.toggleTheme();
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleToggle}
      className={`
        p-2 rounded-lg transition-all
        ${isDark
          ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400'
          : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
        }
      `}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <motion.span
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-xl"
        >
          ☀️
        </motion.span>
      ) : (
        <motion.span
          initial={{ rotate: 180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-xl"
        >
          🌙
        </motion.span>
      )}
    </motion.button>
  );
}
