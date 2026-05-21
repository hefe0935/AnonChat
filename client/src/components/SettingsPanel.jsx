import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { zenModeManager } from '../utils/zenMode';

export default function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'current');
  const [guiMode, setGuiMode] = useState(() => localStorage.getItem('app-gui-mode') || 'classic');
  const [zenModeEnabled, setZenModeEnabled] = useState(false);

  useEffect(() => {
    // Apply theme to document
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    // Apply GUI mode
    applyGuiMode(guiMode);
  }, [guiMode]);

  const applyTheme = (selectedTheme) => {
    const root = document.documentElement;
    
    switch (selectedTheme) {
      case 'dark':
        root.classList.remove('light-theme', 'current-theme', 'beta-theme');
        root.classList.add('dark-theme');
        localStorage.setItem('app-theme', 'dark');
        document.body.style.backgroundColor = '#0f172a';
        document.body.style.color = '#e2e8f0';
        break;
      case 'light':
        root.classList.remove('dark-theme', 'current-theme', 'beta-theme');
        root.classList.add('light-theme');
        localStorage.setItem('app-theme', 'light');
        document.body.style.backgroundColor = '#f1f5f9';
        document.body.style.color = '#1e293b';
        break;
      case 'beta':
        root.classList.remove('dark-theme', 'light-theme', 'current-theme');
        root.classList.add('beta-theme');
        localStorage.setItem('app-theme', 'beta');
        document.body.style.backgroundColor = '#1a1a2e';
        document.body.style.color = '#00d4ff';
        applyBetaGUI();
        break;
      default: // 'current'
        root.classList.remove('dark-theme', 'light-theme', 'beta-theme');
        root.classList.add('current-theme');
        localStorage.setItem('app-theme', 'current');
        document.body.style.backgroundColor = '#0f172a';
        document.body.style.color = '#e2e8f0';
    }
  };

  const applyGuiMode = (mode) => {
    localStorage.setItem('app-gui-mode', mode);
    
    if (mode === 'beta') {
      applyBetaGUI();
    } else {
      removeAllGuiOverrides();
    }
  };

  const applyBetaGUI = () => {
    // Create style element for beta GUI
    const styleId = 'beta-gui-styles';
    let styleEl = document.getElementById(styleId);
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        /* Beta GUI - Cyberpunk/Neon Style */
        * {
          --beta-primary: #00d4ff;
          --beta-secondary: #ff006e;
          --beta-accent: #00f5ff;
          --beta-dark: #1a1a2e;
          --beta-darker: #0f0f1e;
        }

        body.beta-gui {
          background: linear-gradient(135deg, var(--beta-dark) 0%, var(--beta-darker) 100%);
          color: var(--beta-primary);
          font-family: 'Courier New', monospace;
          overflow-x: hidden;
        }

        body.beta-gui button {
          background: linear-gradient(135deg, var(--beta-primary), var(--beta-accent));
          color: var(--beta-darker);
          border: 2px solid var(--beta-primary);
          border-radius: 0;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
          transition: all 0.3s ease;
        }

        body.beta-gui button:hover {
          box-shadow: 0 0 30px rgba(0, 212, 255, 0.8), inset 0 0 20px rgba(255, 0, 110, 0.2);
          transform: scale(1.05);
        }

        body.beta-gui input,
        body.beta-gui textarea,
        body.beta-gui select {
          background: var(--beta-darker);
          color: var(--beta-primary);
          border: 2px solid var(--beta-primary);
          border-radius: 0;
          padding: 10px;
          font-family: 'Courier New', monospace;
          box-shadow: inset 0 0 10px rgba(0, 212, 255, 0.2);
        }

        body.beta-gui input::placeholder {
          color: var(--beta-primary);
          opacity: 0.5;
        }

        body.beta-gui input:focus,
        body.beta-gui textarea:focus,
        body.beta-gui select:focus {
          outline: none;
          box-shadow: inset 0 0 10px rgba(0, 212, 255, 0.4), 0 0 20px rgba(0, 212, 255, 0.6);
        }

        body.beta-gui .card,
        body.beta-gui .panel,
        body.beta-gui [class*="panel"],
        body.beta-gui [class*="card"] {
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, rgba(255, 0, 110, 0.05) 100%);
          border: 2px solid var(--beta-primary);
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.3), inset 0 0 20px rgba(0, 212, 255, 0.05);
        }

        body.beta-gui h1,
        body.beta-gui h2,
        body.beta-gui h3,
        body.beta-gui h4,
        body.beta-gui h5,
        body.beta-gui h6 {
          color: var(--beta-accent);
          text-shadow: 0 0 10px var(--beta-primary);
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        body.beta-gui .tab,
        body.beta-gui [role="tab"] {
          background: var(--beta-darker);
          color: var(--beta-primary);
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
        }

        body.beta-gui .tab:hover,
        body.beta-gui [role="tab"]:hover {
          border-bottom-color: var(--beta-secondary);
          box-shadow: 0 -5px 20px rgba(255, 0, 110, 0.3);
        }

        body.beta-gui .tab.active,
        body.beta-gui [role="tab"][aria-selected="true"] {
          border-bottom-color: var(--beta-primary);
          box-shadow: 0 -5px 20px rgba(0, 212, 255, 0.5);
        }

        body.beta-gui .scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--beta-primary) var(--beta-darker);
        }

        body.beta-gui ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        body.beta-gui ::-webkit-scrollbar-track {
          background: var(--beta-darker);
        }

        body.beta-gui ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, var(--beta-primary), var(--beta-secondary));
          border-radius: 0;
          box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
        }

        body.beta-gui ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, var(--beta-accent), var(--beta-primary));
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.8);
        }

        /* Glitch effect for beta mode */
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }

        body.beta-gui button {
          animation: none;
        }

        body.beta-gui button:active {
          animation: glitch 0.3s ease;
        }

        /* Neon pulse effect */
        @keyframes neon-pulse {
          0%, 100% {
            box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
          }
          50% {
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.8), 0 0 30px rgba(255, 0, 110, 0.5);
          }
        }

        body.beta-gui .notification,
        body.beta-gui [class*="alert"] {
          animation: neon-pulse 2s ease-in-out infinite;
        }
      `;
      document.head.appendChild(styleEl);
    }
    
    document.body.classList.add('beta-gui');
  };

  const removeAllGuiOverrides = () => {
    document.body.classList.remove('beta-gui');
  };

  const toggleZenMode = () => {
    if (!zenModeEnabled) {
      zenModeManager.enableZenMode();
      setZenModeEnabled(true);
    } else {
      zenModeManager.disableZenMode();
      setZenModeEnabled(false);
    }
  };

  return (
    <motion.div className="relative inline-block">
      {/* Settings Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 10 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
        title="Settings"
      >
        ⚙️
      </motion.button>

      {/* Settings Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            className="absolute top-14 left-0 bg-slate-900 border border-purple-500/30 rounded-lg shadow-2xl w-80 mt-2 z-50"
          >
            {/* Header */}
            <div className="border-b border-purple-500/20 px-4 py-3 bg-slate-800/50">
              <h2 className="text-lg font-bold text-purple-300 flex items-center gap-2">
                ⚙️ Settings
              </h2>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-semibold text-purple-300 mb-2">
                  🎨 Theme
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'current', label: 'Current', icon: '🌙' },
                    { id: 'dark', label: 'Dark', icon: '⚫' },
                    { id: 'light', label: 'Light', icon: '⚪' },
                    { id: 'beta', label: 'Beta', icon: '🔮' },
                  ].map((themeOption) => (
                    <motion.button
                      key={themeOption.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTheme(themeOption.id)}
                      className={`py-2 px-3 rounded transition-all text-sm font-semibold ${
                        theme === themeOption.id
                          ? 'bg-purple-600 text-white shadow-lg border-2 border-purple-400'
                          : 'bg-slate-800 text-slate-300 border-2 border-slate-700 hover:border-purple-500'
                      }`}
                    >
                      {themeOption.icon} {themeOption.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* GUI Mode Selection */}
              <div>
                <label className="block text-sm font-semibold text-purple-300 mb-2">
                  🎮 GUI Mode
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'classic', label: 'Classic Interface', desc: 'Standard clean UI' },
                    { id: 'beta', label: 'Beta Interface', desc: 'Cyberpunk neon style' },
                  ].map((guiOption) => (
                    <motion.button
                      key={guiOption.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setGuiMode(guiOption.id)}
                      className={`w-full py-2 px-3 rounded transition-all text-left ${
                        guiMode === guiOption.id
                          ? 'bg-indigo-600 text-white shadow-lg border-2 border-indigo-400'
                          : 'bg-slate-800 text-slate-300 border-2 border-slate-700 hover:border-indigo-500'
                      }`}
                    >
                      <div className="font-semibold">{guiOption.label}</div>
                      <div className="text-xs opacity-75">{guiOption.desc}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Zen Mode Toggle */}
              <div className="border-t border-purple-500/20 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleZenMode}
                  className={`w-full py-3 px-3 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 ${
                    zenModeEnabled
                      ? 'bg-green-600/20 text-green-300 border-2 border-green-500/50'
                      : 'bg-slate-800 text-slate-300 border-2 border-slate-700 hover:border-green-500'
                  }`}
                >
                  <span className="text-lg">{zenModeEnabled ? '🧘✓' : '🧘'}</span>
                  Zen Mode {zenModeEnabled ? '(Active)' : '(Inactive)'}
                </motion.button>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Press Z to toggle • Minimalist distraction-free interface
                </p>
              </div>

              {/* Info */}
              <div className="border-t border-purple-500/20 pt-4">
                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  💡 Settings are saved automatically to your browser
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-purple-500/20 px-4 py-2 bg-slate-800/30">
              <p className="text-xs text-slate-500 text-center">
                Press ⚙️ or ESC to close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
