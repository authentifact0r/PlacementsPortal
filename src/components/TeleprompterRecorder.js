/**
 * Teleprompter Recorder Component
 * WebRTC video recording with scrolling text overlay
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  VideoOff,
  Play,
  Square,
  RotateCcw,
  Download,
  Eye,
  EyeOff,
  Settings,
  CheckCircle2
} from 'lucide-react';

const TeleprompterRecorder = ({ 
  script, 
  onRecordingComplete,
  maxDuration = 60 
}) => {
  // Video/Camera state
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isPaused, setIsPaused] = useState(false); // TODO: implement pause/resume recording
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);

  // Teleprompter state
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollSpeed, setScrollSpeed] = useState(30); // words per minute
  const [isScrolling, setIsScrolling] = useState(false);
  const [showScript, setShowScript] = useState(true);

  // UI state
  const [recordingTime, setRecordingTime] = useState(0);
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Refs
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const scrollIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const scriptContainerRef = useRef(null);

  // ============================================
  // CAMERA SETUP
  // ============================================

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraError(null);
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Unable to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // ============================================
  // RECORDING CONTROLS
  // ============================================

  const startRecording = () => {
    if (!stream) {
      alert('Camera not ready. Please wait...');
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        chunksRef.current = [];
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      setIsRecording(true);
      setRecordingTime(0);
      
      // Start teleprompter scrolling
      startScrolling();

      // Start recording timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          
          // Auto-stop at max duration
          if (newTime >= maxDuration) {
            stopRecording();
          }
          
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error('Recording start error:', error);
      alert('Failed to start recording: ' + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop scrolling
      stopScrolling();
      
      // Stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingTime(0);
    setScrollPosition(0);
    chunksRef.current = [];
  };

  const saveRecording = () => {
    if (recordedBlob && onRecordingComplete) {
      onRecordingComplete({
        blob: recordedBlob,
        url: recordedUrl,
        duration: recordingTime,
        script: script
      });
    }
  };

  const downloadRecording = () => {
    if (recordedUrl) {
      const a = document.createElement('a');
      a.href = recordedUrl;
      a.download = `pitch_video_${Date.now()}.webm`;
      a.click();
    }
  };

  // ============================================
  // TELEPROMPTER SCROLLING
  // ============================================

  const startScrolling = () => {
    setIsScrolling(true);
    
    // Calculate scroll speed (pixels per second)
    // Based on words per minute setting
    const pixelsPerSecond = (scrollSpeed / 60) * 15; // Rough estimate: 15px per word

    scrollIntervalRef.current = setInterval(() => {
      setScrollPosition(prev => {
        const container = scriptContainerRef.current;
        if (!container) return prev;

        const maxScroll = container.scrollHeight - container.clientHeight;
        const newPosition = prev + pixelsPerSecond / 10; // Update every 100ms

        return newPosition >= maxScroll ? maxScroll : newPosition;
      });
    }, 100);
  };

  const stopScrolling = () => {
    setIsScrolling(false);
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }
  };

  useEffect(() => {
    if (scriptContainerRef.current) {
      scriptContainerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return (recordingTime / maxDuration) * 100;
  };

  // ============================================
  // RENDER
  // ============================================

  if (cameraError) {
    return (
      <div className="bg-slate-900 rounded-2xl p-12 text-center">
        <VideoOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Camera Access Required</h3>
        <p className="text-gray-400 mb-6">{cameraError}</p>
        <button
          onClick={startCamera}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
      {/* Video Preview/Playback */}
      <div className="relative aspect-video bg-black">
        {recordedUrl ? (
          /* Playback Mode */
          <video
            src={recordedUrl}
            controls
            className="w-full h-full"
          />
        ) : (
          /* Recording/Preview Mode */
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${mirrorVideo ? 'scale-x-[-1]' : ''}`}
            />

            {/* Teleprompter Overlay */}
            {showScript && script && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 pointer-events-none"
              >
                {/* Dark gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

                {/* Scrolling script */}
                <div
                  ref={scriptContainerRef}
                  className="absolute inset-0 overflow-hidden px-8 py-12"
                >
                  <div className="max-w-2xl mx-auto">
                    <p className="text-white text-2xl font-medium leading-relaxed whitespace-pre-wrap text-center drop-shadow-lg">
                      {script}
                    </p>
                  </div>
                </div>

                {/* Scroll indicator line */}
                {isScrolling && (
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-500 opacity-50" />
                )}
              </motion.div>
            )}

            {/* Live Indicator */}
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-red-600 rounded-lg shadow-lg"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-3 h-3 bg-white rounded-full"
                  />
                  <span className="text-white font-bold text-sm">LIVE</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timer */}
            <div className="absolute top-4 right-4 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-lg">
              <span className="text-white font-mono text-lg font-bold">
                {formatTime(recordingTime)}
              </span>
              <span className="text-gray-400 text-sm ml-2">/ {formatTime(maxDuration)}</span>
            </div>
          </>
        )}
      </div>

      {/* Progress Bar */}
      {isRecording && (
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800">
          <motion.div
            className="h-full bg-gradient-to-r from-red-600 to-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${getProgressPercentage()}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Controls */}
      <div className="p-6 bg-slate-800">
        {recordedUrl ? (
          /* Post-Recording Controls */
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Recording Complete!</span>
              </div>
              <span className="text-gray-400">
                {formatTime(recordingTime)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={resetRecording}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Re-record
              </button>
              
              <button
                onClick={downloadRecording}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
              >
                <Download className="w-4 h-4" />
                Download
              </button>

              <button
                onClick={saveRecording}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                Save & Upload
              </button>
            </div>
          </div>
        ) : (
          /* Recording Controls */
          <>
            <div className="flex items-center justify-between mb-4">
              {/* Recording Button */}
              <div className="flex items-center gap-3">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={!stream}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-5 h-5" />
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-all animate-pulse"
                  >
                    <Square className="w-5 h-5" />
                    Stop Recording
                  </button>
                )}
              </div>

              {/* Settings Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowScript(!showScript)}
                  className={`p-2 rounded-lg transition-all ${showScript ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                  title="Toggle Teleprompter"
                >
                  {showScript ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t border-gray-700 space-y-4">
                    {/* Scroll Speed Control */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-300">
                          Scroll Speed: {scrollSpeed} WPM
                        </label>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="60"
                        value={scrollSpeed}
                        onChange={(e) => setScrollSpeed(parseInt(e.target.value))}
                        disabled={isRecording}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Slow</span>
                        <span>Fast</span>
                      </div>
                    </div>

                    {/* Mirror Video Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-300">Mirror Video</span>
                      <button
                        onClick={() => setMirrorVideo(!mirrorVideo)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${mirrorVideo ? 'bg-blue-600' : 'bg-gray-600'}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${mirrorVideo ? 'translate-x-6' : ''}`} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};

export default TeleprompterRecorder;
