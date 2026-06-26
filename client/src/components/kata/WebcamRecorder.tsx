'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, Video, Circle, Square, RefreshCw, X } from 'lucide-react';
import { GlassCard } from '../shared/GlassCard';

interface WebcamRecorderProps {
  onRecordComplete: (blob: Blob) => void;
  onClose: () => void;
}

export const WebcamRecorder: React.FC<WebcamRecorderProps> = ({
  onRecordComplete,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState<boolean>(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [countdown, setCountdown] = useState<number>(-1);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Initialize camera stream
  useEffect(() => {
    async function startCamera() {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, frameRate: { ideal: 30 } },
          audio: false // No audio needed for pose tracking
        });
        setStream(userStream);
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
        }
      } catch (err: any) {
        console.error('Error accessing camera:', err);
        setCameraError(
          'Could not access your webcam. Please check browser permissions and try again.'
        );
      }
    }
    
    startCamera();

    return () => {
      // Clean up stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Countdown handler
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(-1);
      startRecording();
    }
  }, [countdown]);

  const triggerCountdown = () => {
    setRecordedChunks([]);
    setCountdown(3); // Start 3 seconds countdown
  };

  const startRecording = () => {
    if (!stream) return;
    
    // Choose format
    let options = { mimeType: 'video/webm;codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/mp4' };
    }

    try {
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const completeBlob = new Blob(chunks, { type: chunks[0]?.type || 'video/webm' });
        onRecordComplete(completeBlob);
      };

      recorder.start(100); // chunk every 100ms
      setRecording(true);
    } catch (err) {
      console.error('MediaRecorder initialization failed:', err);
      setCameraError('Recording failed to initialize. Browser codec unsupported.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-3xl relative overflow-hidden" padding="md">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-surface/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-accent" />
          Record Kata Session
        </h3>

        {cameraError ? (
          <div className="bg-danger/10 border border-danger/20 rounded-xl p-6 text-center">
            <p className="text-danger font-medium mb-4">{cameraError}</p>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-secondary text-text-primary rounded-xl font-semibold hover:bg-secondary/80 transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            
            {/* Video Preview Container */}
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-border">
              
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover scale-x-[-1]" // mirror local preview
              />

              {/* Countdown overlay */}
              {countdown > 0 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center animate-ping">
                    <span className="text-5xl font-extrabold text-accent">{countdown}</span>
                  </div>
                </div>
              )}

              {/* Recording Indicator overlay */}
              {recording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border">
                  <span className="w-3.5 h-3.5 rounded-full bg-danger animate-pulse" />
                  <span className="text-xs font-semibold text-white tracking-widest uppercase">REC</span>
                </div>
              )}
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-center gap-4 mt-2">
              {!recording && countdown === -1 && (
                <button
                  onClick={triggerCountdown}
                  className="flex items-center gap-2 px-6 py-3 bg-accent text-black rounded-xl font-bold shadow-glow hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <Video className="w-5 h-5" />
                  Start Recording
                </button>
              )}

              {recording && (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-6 py-3 bg-danger text-white rounded-xl font-bold hover:bg-danger/90 active:scale-95 transition-all duration-200"
                >
                  <Square className="w-5 h-5" />
                  Stop & Process
                </button>
              )}

              <button
                onClick={onClose}
                className="px-6 py-3 bg-secondary text-text-primary rounded-xl font-semibold hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
            </div>
            
            <p className="text-xs text-text-tertiary text-center">
              Position yourself 8–10 feet back from the camera, ensuring your entire body from head to feet is fully visible.
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
export default WebcamRecorder;
