import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import messageSearchManager from '../utils/messageSearchManager';

/**
 * Message Search Component
 * UI for searching chat history with filters
 */
export default function MessageSearch({ onSelectMessage }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [filter, setFilter] = useState('all'); // all, text, file, voice
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setStats(messageSearchManager.getStats());
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);

    if (query.trim().length === 0) {
      setResults([]);
      setShowResults(false);
      return;
    }

    let searchResults = messageSearchManager.search(query);

    // Apply type filter
    if (filter !== 'all') {
      searchResults = searchResults.filter(msg => msg.type === filter);
    }

    setResults(searchResults);
    setShowResults(true);
  };

  const handleSelectResult = (message) => {
    onSelectMessage?.(message);
    setShowResults(false);
    setSearchQuery('');
  };

  return (
    <div className="w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setShowResults(searchQuery.length > 0)}
          className="
            w-full px-4 py-2 rounded-lg
            bg-slate-700 border border-slate-600
            text-slate-100 placeholder-slate-500
            focus:border-blue-500 focus:outline-none
            transition-all
          "
        />
        <span className="absolute right-3 top-2.5 text-slate-400">🔍</span>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mt-2 flex-wrap">
        {['all', 'text', 'file', 'voice'].map(type => (
          <motion.button
            key={type}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setFilter(type);
              if (searchQuery) handleSearch(searchQuery);
            }}
            className={`
              px-3 py-1 rounded text-xs font-semibold
              transition-all
              ${filter === type
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }
            `}
          >
            {type === 'all' ? '📄 All' : type === 'text' ? '💬 Text' : type === 'file' ? '📁 Files' : '🎙️ Voice'}
          </motion.button>
        ))}
      </div>

      {/* Results Count & Stats */}
      {stats && (
        <div className="mt-2 text-xs text-slate-400">
          Searching {stats.totalMessages} messages
        </div>
      )}

      {/* Results Dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="
              absolute top-full mt-1 left-0 right-0
              bg-slate-800 border border-slate-700 rounded-lg
              shadow-xl z-50 max-h-96 overflow-y-auto
            "
          >
            {results.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                {searchQuery ? 'No messages found' : 'Search to begin'}
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {results.map((message, index) => (
                  <motion.button
                    key={`${message.id}-${index}`}
                    whileHover={{ backgroundColor: 'rgb(51, 65, 85)' }}
                    onClick={() => handleSelectResult(message)}
                    className="
                      w-full text-left p-3 transition-colors
                      hover:bg-slate-700 focus:outline-none
                    "
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg mt-1">
                        {message.type === 'file' ? '📁' : message.type === 'voice' ? '🎙️' : '💬'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-semibold text-blue-400">
                            {message.sender}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-100 line-clamp-2">
                          {message.snippet || message.text}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Results Footer */}
            {results.length > 0 && (
              <div className="p-3 text-center text-xs text-slate-400 bg-slate-900/50">
                Showing {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
