import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { zenModeManager } from '../utils/zenMode';

const Icon = ({ type, className = 'w-4 h-4' }) => {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  switch (type) {
    case 'settings':
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 1-3 0 1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 1 0-3 1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 1 3 0 1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c0 .38.13.74.38 1a1.65 1.65 0 0 1 0 3c-.25.26-.38.62-.38 1Z" /></svg>;
    case 'moon':
      return <svg {...common}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>;
    case 'sun':
      return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>;
    case 'spark':
      return <svg {...common}><path d="m12 3 2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3Z" /></svg>;
    case 'leaf':
      return <svg {...common}><path d="M21 3c-7 0-13 5-13 12 0 3 2 6 5 6s6-2 6-5c0-4-3-7-7-7" /></svg>;
    case 'check':
      return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
    default:
      return null;
  }
};

export default function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'current');
  const [zenModeEnabled, setZenModeEnabled] = useState(() => zenModeManager.getStatus().isZenMode);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    setZenModeEnabled(zenModeManager.getStatus().isZenMode || document.body.classList.contains('zen-mode'));
  }, [isOpen]);

  const applyTheme = (selectedTheme) => {
    const root = document.documentElement;
    switch (selectedTheme) {
      case 'dark':
        root.classList.remove('light-theme', 'current-theme');
        root.classList.add('dark-theme');
        localStorage.setItem('app-theme', 'dark');
        document.body.style.backgroundColor = '#0f1520';
        document.body.style.color = '#e2e8f0';
        break;
      case 'light':
        root.classList.remove('dark-theme', 'current-theme');
        root.classList.add('light-theme');
        localStorage.setItem('app-theme', 'light');
        document.body.style.backgroundColor = '#edf1f7';
        document.body.style.color = '#152238';
        break;
      default:
        root.classList.remove('dark-theme', 'light-theme');
        root.classList.add('current-theme');
        localStorage.setItem('app-theme', 'current');
        document.body.style.backgroundColor = '#0f1520';
        document.body.style.color = '#e2e8f0';
    }
  };

  const toggleZenMode = () => {
    const nextState = !zenModeManager.getStatus().isZenMode;
    if (nextState) zenModeManager.enableZenMode();
    if (!nextState) zenModeManager.disableZenMode();
    setZenModeEnabled(nextState);
  };

  return (
    <motion.div className="relative inline-block">
      <motion.button whileHover={{ scale: 1.06, rotate: 8 }} whileTap={{ scale: 0.94 }} onClick={() => setIsOpen(!isOpen)} className="bg-black/35 text-slate-100 rounded-full p-3 shadow-lg border border-white/20 hover:bg-black/50 transition-colors" title="Settings">
        <Icon type="settings" className="w-5 h-5" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.92, x: -20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.92, x: -20 }} className="absolute top-14 left-0 bg-slate-950/95 border border-white/15 rounded-2xl shadow-2xl w-80 mt-2 z-50 overflow-hidden">
            <div className="border-b border-white/10 px-4 py-3 bg-white/5">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><Icon type="settings" className="w-5 h-5" /> Settings</h2>
            </div>

            <div className="p-4 space-y-5 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-xs uppercase tracking-[0.16em] text-slate-400 mb-2 flex items-center gap-2"><Icon type="spark" /> Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'current', label: 'Default', icon: 'spark' },
                    { id: 'dark', label: 'Dark', icon: 'moon' },
                    { id: 'light', label: 'Light', icon: 'sun' },
                  ].map((themeOption) => (
                    <motion.button key={themeOption.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setTheme(themeOption.id)} className={`py-2 px-3 rounded-lg transition-all text-sm font-semibold border ${theme === themeOption.id ? 'bg-amber-300 text-slate-900 border-amber-200' : 'bg-white/5 text-slate-300 border-white/15 hover:border-white/30'}`}>
                      <span className="inline-flex items-center gap-1.5"><Icon type={themeOption.icon} />{themeOption.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={toggleZenMode} className={`w-full py-3 px-3 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 border ${zenModeEnabled ? 'bg-emerald-400/20 text-emerald-200 border-emerald-300/50' : 'bg-white/5 text-slate-300 border-white/15 hover:border-emerald-300/40'}`}>
                  <Icon type={zenModeEnabled ? 'check' : 'leaf'} className="w-5 h-5" />
                  Zen Mode {zenModeEnabled ? '(Active)' : '(Inactive)'}
                </motion.button>
                <p className="text-xs text-slate-500 mt-2 text-center">Press Z to toggle minimal interface mode</p>
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-slate-500 text-center leading-relaxed">Settings are saved in your local browser storage</p>
              </div>
            </div>

            <div className="border-t border-white/10 px-4 py-2 bg-white/5">
              <p className="text-xs text-slate-500 text-center">Press settings again or ESC to close</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
