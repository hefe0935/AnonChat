import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import voiceMessageRecorder from '../utils/voiceMessageRecorder';

/**
 * Voice Message Recorder Component
 * UI for recording and playing voice messages
 */
export default function VoiceMessageRecorder({ onSendVoiceMessage, disabled = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState('0:00');
  const [remaining, setRemaining] = useState('0:30');
  const [hasRecorded, setHasRecorded] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  const durationInterval = useRef(null);

  useEffect(() => {
    setIsSupported(voiceMessageRecorder.constructor.isSupported());

    if (!isSupported) return;

    // Initialize recorder
    voiceMessageRecorder.init().catch(err => {
      setError('Microphone access denied');
    });

    // Subscribe to recorder changes
    const unsubscribe = voiceMessageRecorder.onChange((event, data) => {
      if (event === 'update') {
        const isRec = voiceMessageRecorder.isRecording;
        setIsRecording(isRec);

        if (isRec && !durationInterval.current) {
          durationInterval.current = setInterval(() => {
            setDuration(voiceMessageRecorder.getFormattedDuration());
            setRemaining(voiceMessageRecorder.getFormattedRemainingTime());
          }, 100);
        } else if (!isRec && durationInterval.current) {
          clearInterval(durationInterval.current);
          durationInterval.current = null;
        }
      } else if (event === 'error') {
        setError(data);
      }
    });

    return () => {
      clearInterval(durationInterval.current);
      unsubscribe();
      voiceMessageRecorder.cleanup();
    };
  }, [isSupported]);

  if (!isSupported) {
    return (
      <div className="text-xs text-slate-400 p-2 bg-slate-800/50 rounded">
        🎙️ Voice recording not supported
      </div>
    );
  }

  const handleStartRecording = async () => {
    setError(null);
    const success = voiceMessageRecorder.start();
    if (!success) {
      setError('Failed to start recording');
    }
  };

  const handleStopRecording = () => {
    voiceMessageRecorder.stop();
    const blob = voiceMessageRecorder.getBlob();
    if (blob) {
      setHasRecorded(true);
      setRecordedBlobUrl(voiceMessageRecorder.getBlobUrl());
    }
  };

  const handleSend = async () => {
    const blob = voiceMessageRecorder.getBlob();
    if (blob) {
      const base64 = await voiceMessageRecorder.getBlobAsBase64();
      onSendVoiceMessage?.({
        data: base64,
        duration: voiceMessageRecorder.getRecordingDuration(),
        size: blob.size
      });
      // Reset
      setHasRecorded(false);
      setRecordedBlobUrl(null);
      setDuration('0:00');
      setRemaining('0:30');
    }
  };

  const handleCancel = () => {
    setHasRecorded(false);
    setRecordedBlobUrl(null);
    setDuration('0:00');
    setRemaining('0:30');
    voiceMessageRecorder.audioChunks = [];
    voiceMessageRecorder.recordedBlob = null;
  };

  // Recording UI
  if (isRecording) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="
          flex items-center gap-3 px-4 py-3
          bg-gradient-to-r from-red-600/20 to-red-600/10
          border border-red-500/50 rounded-lg
        "
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.6 }}
          className="text-2xl text-red-500"
        >
          🎙️
        </motion.div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-red-400">Recording...</p>
          <p className="text-xs text-red-300">{duration} / {remaining}</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleStopRecording}
          className="
            px-4 py-2 rounded-full
            bg-red-600 hover:bg-red-700
            text-white font-bold
            transition-all
          "
        >
          Stop
        </motion.button>
      </motion.div>
    );
  }

  // Playback UI
  if (hasRecorded && recordedBlobUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="
          flex items-center gap-3 px-4 py-3
          bg-gradient-to-r from-blue-600/20 to-blue-600/10
          border border-blue-500/50 rounded-lg
        "
      >
        <span className="text-2xl">🎵</span>

        <VoiceMessagePlayback url={recordedBlobUrl} />

        <div className="flex gap-2 ml-auto">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCancel}
            className="
              px-3 py-2 rounded
              bg-slate-700 hover:bg-slate-600
              text-slate-200 text-sm font-semibold
            "
          >
            Cancel
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            className="
              px-3 py-2 rounded
              bg-blue-600 hover:bg-blue-700
              text-white text-sm font-semibold
            "
          >
            Send
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Default UI
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleStartRecording}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full
        font-semibold transition-all
        ${disabled
          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
        }
      `}
    >
      <span className="text-lg">🎙️</span>
      Record Message
    </motion.button>
  );
}

/**
 * Voice Message Playback Component
 */
function VoiceMessagePlayback({ url }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center gap-2 flex-1">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handlePlayPause}
        className="
          text-xl leading-none
          hover:scale-110 transition-transform
        "
      >
        {isPlaying ? '⏸️' : '▶️'}
      </motion.button>

      <div className="flex-1">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={(e) => {
            if (audioRef.current) {
              audioRef.current.currentTime = Number(e.target.value);
              setCurrentTime(Number(e.target.value));
            }
          }}
          className="w-full h-1 bg-slate-700 rounded cursor-pointer"
        />
      </div>

      <span className="text-xs text-slate-300 min-w-max">
        {Math.floor(currentTime)}s / {Math.floor(duration)}s
      </span>
    </div>
  );
}
