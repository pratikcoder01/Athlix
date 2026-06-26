'use client';

import React, { useRef, useEffect } from 'react';

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

interface FrameData {
  frame_index: number;
  timestamp: number;
  landmarks: Landmark[] | null;
  world_landmarks: any[] | null;
  metrics: {
    angles: {
      left_elbow: number;
      right_elbow: number;
      left_knee: number;
      right_knee: number;
      left_hip: number;
      right_hip: number;
      left_shoulder: number;
      right_shoulder: number;
    };
    cog: [number, number, number];
    balance_sway: number;
    velocities: {
      left_wrist: number;
      right_wrist: number;
      left_ankle: number;
      right_ankle: number;
      cog: number;
    };
  };
  stance: string;
  technique: string;
}

interface VideoOverlayProps {
  currentTime: number;
  frames: FrameData[];
  width: number;
  height: number;
  showSkeleton?: boolean;
  showAngles?: boolean;
}

// MediaPipe Pose connections
const POSE_CONNECTIONS = [
  [11, 12], // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 23], [12, 24], [23, 24], // torso
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
  [27, 29], [29, 31], [27, 31], // left foot
  [28, 30], [30, 32], [28, 32]  // right foot
];

export const VideoOverlay: React.FC<VideoOverlayProps> = ({
  currentTime,
  frames,
  width,
  height,
  showSkeleton = true,
  showAngles = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showSkeleton || !frames || frames.length === 0) return;

    // Find the closest frame to currentTime
    let closestFrame = frames[0];
    let minDiff = Math.abs(frames[0].timestamp - currentTime);

    for (let i = 1; i < frames.length; i++) {
      const diff = Math.abs(frames[i].timestamp - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestFrame = frames[i];
      }
    }

    const landmarks = closestFrame.landmarks;
    if (!landmarks) return;

    const metrics = closestFrame.metrics;
    const activeStance = closestFrame.stance;
    const activeTech = closestFrame.technique;

    // Helper to get canvas coordinates
    const getCoords = (lm: Landmark) => {
      return {
        x: lm.x * canvas.width,
        y: lm.y * canvas.height
      };
    };

    // Determine color schemes based on joint correctness
    // We check rules here to highlight incorrect joints in RED
    const flaggedJoints = new Set<number>();
    
    if (metrics && metrics.angles) {
      const { left_knee, right_knee, left_elbow, right_elbow, left_hip, right_hip } = metrics.angles;
      
      // Rule 1: Front Stance knee checks
      if (activeStance.includes("Left Front Stance")) {
        if (left_knee > 125) flaggedJoints.add(25); // Front knee not bent enough
        if (right_knee < 150) flaggedJoints.add(26); // Back knee not straight enough
      } else if (activeStance.includes("Right Front Stance")) {
        if (right_knee > 125) flaggedJoints.add(26);
        if (left_knee < 150) flaggedJoints.add(25);
      }
      
      // Rule 2: Horse Stance knees check
      if (activeStance.includes("Horse Stance")) {
        if (left_knee > 130) flaggedJoints.add(25);
        if (right_knee > 130) flaggedJoints.add(26);
      }

      // Rule 3: Guard drops (wrists below hip)
      if (activeTech === "None" || activeTech === "") {
        const l_wrist_y = landmarks[15].y;
        const r_wrist_y = landmarks[16].y;
        const l_hip_y = landmarks[23].y;
        const r_hip_y = landmarks[24].y;
        
        if (l_wrist_y > l_hip_y) flaggedJoints.add(15);
        if (r_wrist_y > r_hip_y) flaggedJoints.add(16);
      }
    }

    // 1. Draw connections (bones)
    ctx.lineWidth = 4;
    POSE_CONNECTIONS.forEach(([i1, i2]) => {
      const lm1 = landmarks[i1];
      const lm2 = landmarks[i2];
      
      if (lm1.visibility > 0.4 && lm2.visibility > 0.4) {
        const p1 = getCoords(lm1);
        const p2 = getCoords(lm2);
        
        // If either joint is flagged, color the bone red-ish, otherwise neon green
        const isFlagged = flaggedJoints.has(i1) || flaggedJoints.has(i2);
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        
        if (isFlagged) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'; // red-500
          ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
        } else {
          ctx.strokeStyle = 'rgba(0, 255, 148, 0.7)'; // neon-accent
          ctx.shadowColor = 'rgba(0, 255, 148, 0.5)';
        }
        ctx.shadowBlur = 8;
        ctx.stroke();
      }
    });

    // Reset shadow
    ctx.shadowBlur = 0;

    // 2. Draw Joints (nodes)
    landmarks.forEach((lm, index) => {
      // Draw key joints: shoulders, elbows, wrists, hips, knees, ankles, face
      const keyJoints = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
      if (!keyJoints.includes(index) || lm.visibility < 0.4) return;
      
      const p = getCoords(lm);
      const isFlagged = flaggedJoints.has(index);
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, isFlagged ? 8 : 6, 0, 2 * Math.PI);
      
      if (isFlagged) {
        ctx.fillStyle = '#EF4444'; // solid red
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = '#00FF94'; // solid neon green
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.fill();
    });

    // 3. Draw Angles next to joint vertices
    if (showAngles && metrics && metrics.angles) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px monospace';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      
      const angleCoords = [
        { id: 13, val: metrics.angles.left_elbow, label: 'L Elbow' },
        { id: 14, val: metrics.angles.right_elbow, label: 'R Elbow' },
        { id: 25, val: metrics.angles.left_knee, label: 'L Knee' },
        { id: 26, val: metrics.angles.right_knee, label: 'R Knee' }
      ];

      angleCoords.forEach(({ id, val, label }) => {
        const lm = landmarks[id];
        if (lm.visibility > 0.4) {
          const p = getCoords(lm);
          const isFlagged = flaggedJoints.has(id);
          
          ctx.fillStyle = isFlagged ? '#FF6B6B' : '#00FF94';
          ctx.fillText(`${Math.round(val)}°`, p.x + 10, p.y - 5);
        }
      });
      ctx.shadowBlur = 0;
    }

    // 4. Draw Center of Gravity (CoG) and Balance line
    if (metrics && metrics.cog) {
      // CoG is represented relative to body in 3D world coordinates.
      // For normalized rendering, we can approximate CoG center in 2D
      // by averaging hip and shoulder coordinates
      const midHipX = (landmarks[23].x + landmarks[24].x) / 2;
      const midHipY = (landmarks[23].y + landmarks[24].y) / 2;
      
      const cogPx = {
        x: midHipX * canvas.width,
        y: midHipY * canvas.height
      };
      
      // Draw CoG dot (Orange glowing target)
      ctx.beginPath();
      ctx.arc(cogPx.x, cogPx.y, 10, 0, 2 * Math.PI);
      ctx.strokeStyle = '#F59E0B'; // amber-500
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(cogPx.x, cogPx.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      
      // Draw vertical alignment guide (line down to ground/ankles height)
      const ankleY = ((landmarks[27].y + landmarks[28].y) / 2) * canvas.height;
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(cogPx.x, cogPx.y);
      ctx.lineTo(cogPx.x, ankleY);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash
    }

  }, [currentTime, frames, width, height, showSkeleton, showAngles]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
    />
  );
};
