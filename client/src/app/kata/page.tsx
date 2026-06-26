'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Camera, Play, Pause, ChevronRight, Activity, ArrowLeft,
  RotateCcw, Sparkles, AlertTriangle, Shield, CheckCircle, Zap, Clock,
  ChevronLeft, LayoutDashboard, FileText, BarChart3, HelpCircle, ShieldAlert, Award, Video
} from 'lucide-react';

import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { GlassCard } from '../../components/shared/GlassCard';
import { AnimatedBadge } from '../../components/shared/AnimatedBadge';
import { AnimatedText } from '../../components/shared/AnimatedText';
import { VideoOverlay } from '../../components/kata/VideoOverlay';
import { WebcamRecorder } from '../../components/kata/WebcamRecorder';

import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend
} from 'recharts';

export default function KataAnalyzerPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState<boolean>(false);
  
  // Analysis States
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Playback Control States
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [showAngles, setShowAngles] = useState<boolean>(true);
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 360 });

  // Handle Drag & Drop Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check length/size limit
      if (file.size > 200 * 1024 * 1024) {
        setErrorMsg('Video file size exceeds 200MB limit.');
        return;
      }
      setSelectedFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['mp4', 'mov', 'avi', 'webm'].includes(ext || '')) {
        setErrorMsg('Unsupported format. Please upload MP4, MOV, AVI, or WebM.');
        return;
      }
      setSelectedFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  // Handle Webcam complete
  const handleWebcamComplete = (blob: Blob) => {
    const file = new File([blob], "recorded_kata.webm", { type: "video/webm" });
    setSelectedFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setShowWebcam(false);
    setErrorMsg(null);
  };

  // Start analysis by sending file to FastAPI
  const triggerAnalysis = async () => {
    if (!selectedFile) return;

    setStatus('uploading');
    setProgress(5);
    setProgressMsg('Uploading video to processing pipeline...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start video processing');
      }

      const data = await response.json();
      setTaskId(data.task_id);
      setStatus('processing');
      setProgress(10);
      setProgressMsg('Video uploaded. Beginning frame extraction...');
    } catch (err: any) {
      console.error(err);
      setStatus('failed');
      setErrorMsg(err.message || 'Server connection failed. Make sure the FastAPI service is running.');
    }
  };

  // Poll analysis status
  useEffect(() => {
    if (!taskId || status !== 'processing') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/status/${taskId}`);
        if (!res.ok) throw new Error('Failed to retrieve task status');
        
        const data = await res.json();
        if (data.status === 'completed') {
          setResult(data.result);
          setStatus('completed');
          setProgress(100);
          clearInterval(interval);
        } else if (data.status === 'failed') {
          setStatus('failed');
          setErrorMsg(data.error || 'Pose landmarks analysis failed.');
          clearInterval(interval);
        } else {
          setProgress(data.progress || 10);
          setProgressMsg(data.message || 'Processing body landmarks...');
        }
      } catch (err: any) {
        console.error(err);
        setStatus('failed');
        setErrorMsg('Lost connection to analysis pipeline.');
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [taskId, status]);

  // Video playback timeupdate handler
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Video loaded metadata -> read dimensions
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDimensions({
        width: videoRef.current.clientWidth,
        height: videoRef.current.clientHeight
      });
    }
  };

  // Handle video resize
  useEffect(() => {
    const handleResize = () => {
      handleLoadedMetadata();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Jump to specific time in video
  const jumpToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Slow motion rate control
  const changeSpeed = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  // Frame scrubbing (-1 or +1 frame approximation: ~0.033s at 30fps)
  const stepFrame = (direction: 'prev' | 'next') => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      const frameTime = 1 / (result?.fps || 30);
      const newTime = direction === 'next' 
        ? Math.min(videoRef.current.duration, videoRef.current.currentTime + frameTime)
        : Math.max(0, videoRef.current.currentTime - frameTime);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Reset page state
  const resetAnalyzer = () => {
    setSelectedFile(null);
    setVideoUrl(null);
    setTaskId(null);
    setStatus('idle');
    setProgress(0);
    setProgressMsg('');
    setErrorMsg(null);
    setResult(null);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Generate Recharts Radar data
  const getRadarData = () => {
    if (!result) return [];
    const s = result.scores;
    return [
      { subject: 'Stability', A: s.stability },
      { subject: 'Precision', A: s.precision },
      { subject: 'Power', A: s.power },
      { subject: 'Guard', A: s.guard },
      { subject: 'Timing', A: s.timing },
      { subject: 'Overall', A: s.overall }
    ];
  };

  // Generate Recharts Line data (sampled every 10 frames to avoid lag)
  const getLineData = () => {
    if (!result || !result.frames) return [];
    return result.frames
      .filter((_: any, idx: number) => idx % 8 === 0)
      .map((f: any) => {
        const velocities = f.metrics?.velocities || { left_wrist: 0, right_wrist: 0 };
        const peakSpeed = Math.max(velocities.left_wrist, velocities.right_wrist);
        return {
          time: f.timestamp,
          Speed: peakSpeed,
          Sway: f.metrics?.balance_sway || 0,
          LKnee: f.metrics?.angles?.left_knee || 180,
          RKnee: f.metrics?.angles?.right_knee || 180
        };
      });
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        
        {/* Page Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AnimatedBadge variant="default" className="bg-accent/10 text-accent border-accent/20">
                AI Sports Analytics
              </AnimatedBadge>
              <AnimatedBadge variant="default" className="bg-purple/10 text-purple border-purple/20">
                BETA
              </AnimatedBadge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Karate Kata <span className="text-gradient-accent">Analyzer</span>
            </h1>
            <p className="text-text-secondary mt-1">
              Upload or record your movement patterns. Get frame-by-frame body pose feedback, joint angles, and AI coaching.
            </p>
          </div>

          {status === 'completed' && (
            <button 
              onClick={resetAnalyzer}
              className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-text-primary rounded-xl font-semibold hover:bg-secondary/80 transition-colors border border-border"
            >
              <RotateCcw className="w-4 h-4" />
              Analyze New Video
            </button>
          )}
        </div>

        {/* --- STATE 1: UPLOAD AND RECORD --- */}
        {status === 'idle' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Upload Box */}
            <div className="lg:col-span-2">
              <GlassCard 
                className="h-full flex flex-col items-center justify-center border-dashed border-2 border-border hover:border-accent/40 transition-colors relative min-h-[350px]"
                padding="lg"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  id="video-upload-input" 
                  accept="video/mp4,video/mov,video/avi,video/webm" 
                  onChange={handleFileChange}
                  className="hidden" 
                />
                
                <Upload className="w-12 h-12 text-text-tertiary mb-4 animate-pulse" />
                <h3 className="text-lg font-bold mb-2">Drag and drop your Kata video</h3>
                <p className="text-sm text-text-secondary text-center max-w-sm mb-6">
                  Supports MP4, MOV, AVI, or WebM format. Maximum length 2 minutes.
                </p>

                <label 
                  htmlFor="video-upload-input"
                  className="px-6 py-3 bg-primary text-background rounded-xl font-bold cursor-pointer hover:bg-primary/95 transition-all active:scale-95 text-sm"
                >
                  Select Video File
                </label>
              </GlassCard>
            </div>

            {/* Webcam / Quick Recorder Box */}
            <div>
              <GlassCard className="h-full flex flex-col justify-between" padding="md">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                    <Camera className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Webcam Live Recording</h3>
                  <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                    Record your form directly from your laptop or PC webcam. Athlix will automatically start a 3-second countdown to let you step back into frame.
                  </p>
                  
                  <div className="bg-surface/50 border border-border rounded-xl p-3 flex items-start gap-2.5 mb-6 text-xs text-text-secondary">
                    <Shield className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>Your video stays private and is only processed locally for metrics and scoring extraction.</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowWebcam(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-secondary text-text-primary rounded-xl font-bold border border-border hover:bg-surface transition-all duration-200"
                >
                  <Video className="w-5 h-5 text-accent" />
                  Record via Webcam
                </button>
              </GlassCard>
            </div>

            {/* Selected File Confirmation */}
            {selectedFile && (
              <div className="col-span-1 lg:col-span-3 mt-4">
                <GlassCard className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" padding="sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-text-secondary">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => { setSelectedFile(null); setVideoUrl(null); }}
                      className="px-4 py-2 bg-secondary text-text-primary text-sm font-semibold rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      Clear
                    </button>
                    <button 
                      onClick={triggerAnalysis}
                      className="flex items-center gap-1.5 px-5 py-2 bg-accent text-black text-sm font-bold rounded-lg shadow-glow hover:scale-105 transition-all duration-200"
                    >
                      <Activity className="w-4 h-4" />
                      Run AI Analysis
                    </button>
                  </div>
                </GlassCard>
              </div>
            )}

            {errorMsg && (
              <div className="col-span-1 lg:col-span-3 mt-4">
                <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-danger text-sm">Upload Error</h4>
                    <p className="text-xs text-text-secondary mt-0.5">{errorMsg}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* --- STATE 2: LOADING PROGRESS SCREEN --- */}
        {(status === 'uploading' || status === 'processing') && (
          <GlassCard className="max-w-2xl mx-auto flex flex-col items-center text-center my-12" padding="lg">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-purple/20 border-b-purple animate-spin" style={{ animationDirection: 'reverse' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-accent animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl font-bold mb-2">Analyzing Movement Technique</h3>
            <p className="text-text-secondary text-sm max-w-sm mb-6 leading-relaxed">
              {progressMsg}
            </p>

            {/* Progress Bar Container */}
            <div className="w-full bg-secondary rounded-full h-3 mb-2 overflow-hidden border border-border">
              <motion.div 
                className="bg-gradient-to-r from-accent to-purple h-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between w-full text-xs text-text-tertiary">
              <span>Progress: {progress}%</span>
              <span>Est. remaining: ~{Math.max(5, Math.ceil((100 - progress) * 0.35))}s</span>
            </div>
          </GlassCard>
        )}

        {/* --- STATE 3: ERROR FAILURE --- */}
        {status === 'failed' && (
          <GlassCard className="max-w-lg mx-auto flex flex-col items-center text-center my-12" padding="lg">
            <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
            <h3 className="text-xl font-bold text-danger mb-2">Analysis Failed</h3>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              {errorMsg}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={resetAnalyzer}
                className="px-6 py-2.5 bg-secondary text-text-primary rounded-xl font-bold border border-border hover:bg-surface transition-colors"
              >
                Go Back
              </button>
              {selectedFile && (
                <button 
                  onClick={triggerAnalysis}
                  className="px-6 py-2.5 bg-accent text-black rounded-xl font-bold shadow-glow hover:scale-105 transition-all duration-200"
                >
                  Try Again
                </button>
              )}
            </div>
          </GlassCard>
        )}

        {/* --- STATE 4: COMPLETED PREMIUM DASHBOARD --- */}
        {status === 'completed' && result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Video Player & Scrubbing controls */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <GlassCard className="relative overflow-hidden" padding="none">
                
                {/* Header panel */}
                <div className="flex justify-between items-center bg-surface/50 border-b border-border px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-success" />
                    <span className="font-bold text-sm">Frame Analyzer</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-secondary">
                    <span>{result.width}x{result.height}</span>
                    <span>{result.fps} FPS</span>
                    <span>{result.duration}s</span>
                  </div>
                </div>

                {/* Video Window with Overlay Canvas */}
                <div className="relative bg-black aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={videoUrl || undefined}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    className="w-full h-full object-contain"
                  />
                  <VideoOverlay 
                    currentTime={currentTime}
                    frames={result.frames}
                    width={videoDimensions.width}
                    height={videoDimensions.height}
                    showSkeleton={showSkeleton}
                    showAngles={showAngles}
                  />
                </div>

                {/* Video controls */}
                <div className="p-4 border-t border-border bg-surface/30">
                  <div className="flex flex-col gap-3">
                    
                    {/* Time display & progress bar slider */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono w-10 text-left">
                        {currentTime.toFixed(2)}s
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={result.duration || 1}
                        step={0.01}
                        value={currentTime}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (videoRef.current) videoRef.current.currentTime = val;
                          setCurrentTime(val);
                        }}
                        className="flex-1 accent-accent h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs font-mono w-10 text-right">
                        {result.duration.toFixed(2)}s
                      </span>
                    </div>

                    {/* Button Controls Row */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => stepFrame('prev')}
                          title="Previous Frame"
                          className="p-2 bg-secondary text-text-primary rounded-lg hover:bg-border transition-colors border border-border"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={togglePlayback}
                          className="p-2 bg-accent text-black rounded-lg shadow-glow hover:scale-105 active:scale-95 transition-all"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => stepFrame('next')}
                          title="Next Frame"
                          className="p-2 bg-secondary text-text-primary rounded-lg hover:bg-border transition-colors border border-border"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Display toggle checkboxes */}
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={showSkeleton} 
                            onChange={(e) => setShowSkeleton(e.target.checked)}
                            className="accent-accent" 
                          />
                          Skeleton
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={showAngles} 
                            onChange={(e) => setShowAngles(e.target.checked)}
                            className="accent-accent" 
                          />
                          Joint Angles
                        </label>
                      </div>

                      {/* Playback rate speed selector */}
                      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 border border-border text-xs">
                        {[0.25, 0.5, 1.0].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => changeSpeed(rate)}
                            className={`px-2 py-1 rounded font-bold transition-all ${
                              playbackRate === rate ? 'bg-background text-accent shadow-sm' : 'text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>

                    </div>
                  </div>
                </div>

              </GlassCard>

              {/* Statistics & Totals Panel */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <GlassCard className="flex flex-col items-center justify-center text-center p-4" padding="none">
                  <span className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">Peak Velocity</span>
                  <span className="text-2xl font-black text-accent">{result.stats.peak_velocity} <span className="text-sm font-semibold">m/s</span></span>
                </GlassCard>
                <GlassCard className="flex flex-col items-center justify-center text-center p-4" padding="none">
                  <span className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">Punches</span>
                  <span className="text-2xl font-black text-purple">{result.stats.total_punches}</span>
                </GlassCard>
                <GlassCard className="flex flex-col items-center justify-center text-center p-4" padding="none">
                  <span className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">Kicks</span>
                  <span className="text-2xl font-black text-info">{result.stats.total_kicks}</span>
                </GlassCard>
                <GlassCard className="flex flex-col items-center justify-center text-center p-4" padding="none">
                  <span className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">Blocks</span>
                  <span className="text-2xl font-black text-success">{result.stats.total_blocks}</span>
                </GlassCard>
              </div>

              {/* Stance Timeline & Technique Timeline */}
              <GlassCard className="flex flex-col gap-4" padding="md">
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  Technique Timeline
                </h3>
                
                {/* Horizontal tracks */}
                <div className="flex flex-col gap-4">
                  {/* Techniques Track */}
                  <div>
                    <div className="flex justify-between items-center text-xs text-text-secondary mb-1">
                      <span className="font-bold">Detected Techniques</span>
                      <span>Hover / Click blocks to scrub video</span>
                    </div>
                    <div className="h-6 bg-secondary rounded-lg relative overflow-hidden border border-border">
                      {result.technique_segments.map((seg: any) => {
                        const startPct = (seg.start_time / result.duration) * 100;
                        const widthPct = (seg.duration / result.duration) * 100;
                        return (
                          <div
                            key={seg.id}
                            onClick={() => jumpToTime(seg.start_time)}
                            className="absolute top-0 h-full bg-accent/25 border-l-2 border-r-2 border-accent hover:bg-accent/40 cursor-pointer flex items-center justify-center text-[10px] font-black text-accent truncate px-1 transition-all"
                            style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                            title={`${seg.name} (${seg.start_time}s - ${seg.end_time}s)`}
                          >
                            {seg.name.split(' (')[0]}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stances Track */}
                  <div>
                    <div className="flex justify-between items-center text-xs text-text-secondary mb-1">
                      <span className="font-bold">Detected Stances</span>
                    </div>
                    <div className="h-6 bg-secondary rounded-lg relative overflow-hidden border border-border">
                      {result.stance_segments.map((seg: any) => {
                        const startPct = (seg.start_time / result.duration) * 100;
                        const widthPct = (seg.duration / result.duration) * 100;
                        return (
                          <div
                            key={seg.id}
                            onClick={() => jumpToTime(seg.start_time)}
                            className="absolute top-0 h-full bg-purple/20 border-l-2 border-r-2 border-purple hover:bg-purple/35 cursor-pointer flex items-center justify-center text-[10px] font-black text-purple truncate px-1 transition-all"
                            style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                            title={`${seg.name} (${seg.start_time}s - ${seg.end_time}s)`}
                          >
                            {seg.name.split(' (')[0]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Line charts for Physics Metrics (Speed & Knee Angles) */}
              <GlassCard className="flex flex-col gap-4" padding="md">
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  Physics Metrics over Time
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Chart 1: Speed & Sway */}
                  <div className="bg-surface/30 p-2 border border-border rounded-xl">
                    <p className="text-xs font-bold text-text-secondary mb-2 text-center">Velocity (m/s) & Stability Sway</p>
                    <div className="h-48 text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getLineData()}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="time" tickFormatter={(v) => `${v.toFixed(1)}s`} />
                          <YAxis />
                          <Tooltip labelFormatter={(l) => `Time: ${l.toFixed(2)}s`} />
                          <Legend />
                          <Line type="monotone" dataKey="Speed" stroke="#00E5FF" strokeWidth={2} dot={false} name="Strike Speed" />
                          <Line type="monotone" dataKey="Sway" stroke="#EF4444" strokeWidth={1.5} dot={false} name="Balance Sway" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Knee Angles */}
                  <div className="bg-surface/30 p-2 border border-border rounded-xl">
                    <p className="text-xs font-bold text-text-secondary mb-2 text-center">Knee Joint Angles (degrees)</p>
                    <div className="h-48 text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getLineData()}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="time" tickFormatter={(v) => `${v.toFixed(1)}s`} />
                          <YAxis domain={[60, 180]} />
                          <Tooltip labelFormatter={(l) => `Time: ${l.toFixed(2)}s`} />
                          <Legend />
                          <Line type="monotone" dataKey="LKnee" stroke="#10B981" strokeWidth={1.5} dot={false} name="Left Knee" />
                          <Line type="monotone" dataKey="RKnee" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="Right Knee" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </GlassCard>

            </div>

            {/* RIGHT COLUMN: AI Coaching Report & Performance Radar */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Radar Scores Grid */}
              <GlassCard className="flex flex-col items-center justify-center" padding="md">
                <h3 className="font-extrabold text-lg self-start mb-1 flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  Performance Calibration
                </h3>
                <p className="text-text-secondary text-xs self-start mb-6">
                  Calculated against Olympic level reference data.
                </p>

                {/* Recharts Radar Chart */}
                <div className="w-full h-64 flex items-center justify-center text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData()}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-tertiary)' }} />
                      <Radar name="Performance" dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Score Indicators Grid */}
                <div className="grid grid-cols-3 w-full gap-2 border-t border-border pt-4">
                  <div className="text-center p-2 bg-surface/50 rounded-xl">
                    <p className="text-[10px] font-bold text-text-secondary uppercase">Overall</p>
                    <p className="text-lg font-black text-accent">{result.ai_report.overall_score || result.scores.overall}/100</p>
                  </div>
                  <div className="text-center p-2 bg-surface/50 rounded-xl">
                    <p className="text-[10px] font-bold text-text-secondary uppercase">Technique</p>
                    <p className="text-lg font-black text-purple">{result.ai_report.technique_score || 80}/100</p>
                  </div>
                  <div className="text-center p-2 bg-surface/50 rounded-xl">
                    <p className="text-[10px] font-bold text-text-secondary uppercase">Balance</p>
                    <p className="text-lg font-black text-info">{result.ai_report.balance_score || 85}/100</p>
                  </div>
                </div>
              </GlassCard>

              {/* AI Coaching Report Section */}
              <GlassCard className="flex flex-col gap-6" padding="md">
                
                {/* Header info */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                    <h3 className="font-extrabold text-xl">AI Coach Feedback</h3>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Personalized feedback generated using DeepSeek LLM reasoning.
                  </p>
                </div>

                {/* Recognized Kata banner */}
                <div className="flex items-center justify-between p-3.5 bg-accent/10 border border-accent/20 rounded-xl">
                  <div>
                    <p className="text-xs text-text-secondary font-semibold">Identified Sequence</p>
                    <p className="font-black text-base text-accent">{result.kata_recognition.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-secondary font-semibold">Confidence</p>
                    <p className="font-black text-base text-purple">{(result.kata_recognition.confidence * 100).toFixed(0)}%</p>
                  </div>
                </div>

                {/* Overall Paragraph */}
                <div className="bg-surface/30 p-4 border border-border rounded-2xl text-sm leading-relaxed text-text-secondary">
                  {result.ai_report.overall_feedback}
                </div>

                {/* Strengths List */}
                <div>
                  <h4 className="font-bold text-sm text-success flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                    Strengths Observed
                  </h4>
                  <ul className="space-y-1.5 pl-1.5 text-xs text-text-secondary">
                    {result.ai_report.strengths.map((str: string, index: number) => (
                      <li key={index} className="flex items-start gap-1.5">
                        <span className="text-success shrink-0 mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements List */}
                <div>
                  <h4 className="font-bold text-sm text-danger flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                    Technical Improvements
                  </h4>
                  <ul className="space-y-1.5 pl-1.5 text-xs text-text-secondary">
                    {result.ai_report.improvements.map((imp: string, index: number) => (
                      <li key={index} className="flex items-start gap-1.5">
                        <span className="text-danger shrink-0 mt-0.5">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actionable recommendations */}
                <div className="border-t border-border pt-4">
                  <h4 className="font-bold text-sm text-accent flex items-center gap-2 mb-3">
                    <Zap className="w-4.5 h-4.5 shrink-0" />
                    Actionable Drills & Tips
                  </h4>
                  <div className="flex flex-col gap-2.5">
                    {result.ai_report.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="bg-surface/50 border border-border p-3 rounded-xl flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-[10px] font-black text-accent shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </GlassCard>

            </div>

          </div>
        )}

      </main>

      <Footer />

      {/* Webcam modal */}
      {showWebcam && (
        <WebcamRecorder 
          onRecordComplete={handleWebcamComplete} 
          onClose={() => setShowWebcam(false)} 
        />
      )}
    </div>
  );
}
