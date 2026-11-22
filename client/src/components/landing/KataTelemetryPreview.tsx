'use client';

import { useId, useState } from 'react';

type Point = { x: number; y: number };
type Pose = Record<'head' | 'leftShoulder' | 'rightShoulder' | 'leftElbow' | 'rightElbow' | 'leftWrist' | 'rightWrist' | 'leftHip' | 'rightHip' | 'leftKnee' | 'rightKnee' | 'leftAnkle' | 'rightAnkle', Point>;
type Sample = 'guard' | 'stance';

const samples: Record<Sample, { label: string; pose: Pose }> = {
  guard: {
    label: 'Guard sample',
    pose: {
      head: { x: 180, y: 37 },
      leftShoulder: { x: 151, y: 78 }, rightShoulder: { x: 209, y: 78 },
      leftElbow: { x: 128, y: 116 }, rightElbow: { x: 232, y: 116 },
      leftWrist: { x: 165, y: 106 }, rightWrist: { x: 195, y: 106 },
      leftHip: { x: 160, y: 152 }, rightHip: { x: 200, y: 152 },
      leftKnee: { x: 144, y: 202 }, rightKnee: { x: 216, y: 202 },
      leftAnkle: { x: 133, y: 250 }, rightAnkle: { x: 227, y: 250 },
    },
  },
  stance: {
    label: 'Stance sample',
    pose: {
      head: { x: 180, y: 37 },
      leftShoulder: { x: 151, y: 78 }, rightShoulder: { x: 209, y: 78 },
      leftElbow: { x: 108, y: 111 }, rightElbow: { x: 231, y: 116 },
      leftWrist: { x: 64, y: 110 }, rightWrist: { x: 204, y: 124 },
      leftHip: { x: 158, y: 148 }, rightHip: { x: 202, y: 148 },
      leftKnee: { x: 112, y: 184 }, rightKnee: { x: 235, y: 201 },
      leftAnkle: { x: 128, y: 250 }, rightAnkle: { x: 280, y: 250 },
    },
  },
};

const weights = [
  { label: 'Stability', value: 0.25, opacity: 0.9 },
  { label: 'Precision', value: 0.25, opacity: 0.75 },
  { label: 'Symmetry', value: 0.20, opacity: 0.6 },
  { label: 'Guard', value: 0.15, opacity: 0.45 },
  { label: 'Velocity', value: 0.15, opacity: 0.3 },
] as const;

function angleAt(start: Point, joint: Point, end: Point): number {
  const first = { x: start.x - joint.x, y: start.y - joint.y };
  const second = { x: end.x - joint.x, y: end.y - joint.y };
  const length = Math.hypot(first.x, first.y) * Math.hypot(second.x, second.y);
  if (length === 0) return 0;
  const cosine = Math.max(-1, Math.min(1, (first.x * second.x + first.y * second.y) / length));
  return Math.acos(cosine) * 180 / Math.PI;
}

function angleArc(start: Point, joint: Point, end: Point, radius: number): string {
  const first = Math.atan2(start.y - joint.y, start.x - joint.x);
  const second = Math.atan2(end.y - joint.y, end.x - joint.x);
  const difference = Math.atan2(Math.sin(second - first), Math.cos(second - first));
  const from = { x: joint.x + Math.cos(first) * radius, y: joint.y + Math.sin(first) * radius };
  const to = { x: joint.x + Math.cos(first + difference) * radius, y: joint.y + Math.sin(first + difference) * radius };
  // Bound SVG serialization to sub-pixel precision across Node/browser math.
  return `M ${from.x.toFixed(3)} ${from.y.toFixed(3)} A ${radius} ${radius} 0 0 ${difference > 0 ? 1 : 0} ${to.x.toFixed(3)} ${to.y.toFixed(3)}`;
}

export default function KataTelemetryPreview() {
  const id = useId();
  const [sample, setSample] = useState<Sample>('guard');
  const { label, pose } = samples[sample];
  const readings = [
    { label: 'Elbow', start: pose.leftShoulder, joint: pose.leftElbow, end: pose.leftWrist },
    { label: 'Knee', start: pose.leftHip, joint: pose.leftKnee, end: pose.leftAnkle },
    { label: 'Hip', start: pose.leftShoulder, joint: pose.leftHip, end: pose.leftKnee },
  ];
  const points = (...joints: Point[]) => joints.map(joint => `${joint.x},${joint.y}`).join(' ');

  return (
    <section aria-labelledby={`${id}-heading`} className="overflow-hidden rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id={`${id}-heading`} className="font-mono text-[11px] font-medium leading-relaxed tracking-[0.08em] text-text-primary">
          KATA POSE HEURISTIC <span className="block text-text-secondary">· 2D MONOCULAR</span>
        </h2>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1.5 font-mono text-[10px] tracking-[0.06em] text-text-secondary">
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
          EXPERIMENTAL
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-text-secondary">Illustrative sample · no video processed</p>

      <div role="group" aria-label="Illustrative pose sample" className="mt-4 grid grid-cols-2 gap-1 rounded-md border border-border bg-background p-1">
        {(Object.keys(samples) as Sample[]).map(value => (
          <button
            key={value}
            type="button"
            aria-pressed={sample === value}
            onClick={() => setSample(value)}
            className={`min-h-11 rounded-sm border px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${sample === value ? 'border-border bg-surface text-text-primary' : 'border-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary'}`}
          >
            {samples[value].label}
          </button>
        ))}
      </div>

      <div className="relative mt-4 grid overflow-hidden rounded-md border border-border bg-background sm:grid-cols-[minmax(0,1fr)_6rem]">
        <svg role="img" aria-labelledby={`${id}-pose-title ${id}-pose-description`} viewBox="0 0 360 280" className="block h-52 w-full sm:h-60">
          <title id={`${id}-pose-title`}>{label + ': illustrative two-dimensional pose'}</title>
          <desc id={`${id}-pose-description`}>A sample skeleton with highlighted left elbow, knee and hip angles. Values below are calculated from this illustration, not a video or athlete assessment.</desc>
          <g aria-hidden="true" className="text-text-secondary" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1">
            {[48, 96, 144, 192, 240, 288, 336].map(x => <line key={`x-${x}`} x1={x} y1="0" x2={x} y2="280" />)}
            {[40, 88, 136, 184, 232].map(y => <line key={`y-${y}`} x1="0" y1={y} x2="360" y2={y} />)}
          </g>
          <g aria-hidden="true" className="text-text-secondary" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <line x1="40" y1="260" x2="320" y2="260" strokeOpacity="0.35" strokeWidth="1" />
            <line x1="180" y1="63" x2="180" y2="254" strokeOpacity="0.3" strokeDasharray="3 6" strokeWidth="1" />
            <circle cx={pose.head.x} cy={pose.head.y} r="17" strokeWidth="2.5" />
            <line x1="180" y1="54" x2="180" y2="78" strokeWidth="2.5" />
            <polyline points={points(pose.leftShoulder, pose.rightShoulder, pose.rightHip, pose.leftHip, pose.leftShoulder)} strokeWidth="2.5" />
            <polyline points={points(pose.leftShoulder, pose.leftElbow, pose.leftWrist)} strokeWidth="3" />
            <polyline points={points(pose.rightShoulder, pose.rightElbow, pose.rightWrist)} strokeWidth="3" />
            <polyline points={points(pose.leftHip, pose.leftKnee, pose.leftAnkle)} strokeWidth="3" />
            <polyline points={points(pose.rightHip, pose.rightKnee, pose.rightAnkle)} strokeWidth="3" />
            {Object.entries(pose).filter(([key]) => key !== 'head').map(([key, joint]) => (
              <circle key={key} cx={joint.x} cy={joint.y} r="3" className="fill-background" strokeWidth="1.5" />
            ))}
          </g>
          <g aria-hidden="true" className="text-accent" fill="currentColor" stroke="currentColor">
            {readings.map(reading => (
              <g key={reading.label}>
                <path d={angleArc(reading.start, reading.joint, reading.end, 15)} fill="none" strokeWidth="1.5" />
                <circle cx={reading.joint.x} cy={reading.joint.y} r="4" strokeWidth="0" />
              </g>
            ))}
          </g>
          <text aria-hidden="true" x="16" y="22" className="fill-current font-mono text-[9px] tracking-[0.12em] text-text-secondary">2D / SAMPLE</text>
        </svg>
        <div aria-live="polite" aria-atomic="true" className="border-t border-border p-3 sm:border-l sm:border-t-0 sm:py-4">
          <p className="font-mono text-[9px] leading-relaxed tracking-[0.06em] text-text-secondary">SAMPLE ANGLES / LEFT</p>
          <dl className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-1 sm:gap-4">
            {readings.map(reading => (
              <div key={reading.label} className="min-w-0">
                <dt className="text-[11px] text-text-secondary">{reading.label}</dt>
                <dd className="mt-0.5 font-mono text-xl font-medium tabular-nums text-accent">
                  {angleAt(reading.start, reading.joint, reading.end).toFixed(1)}<span className="ml-0.5 text-xs">°</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-4">
        <p className="font-mono text-[10px] tracking-[0.08em] text-text-secondary">HEURISTIC BASE WEIGHTS</p>
        <div aria-hidden="true" className="mt-2 flex h-1.5 gap-1 text-text-secondary">
          {weights.map(weight => <span key={weight.label} className="bg-current" style={{ flex: weight.value, opacity: weight.opacity }} />)}
        </div>
        <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-text-secondary">
          {weights.map(weight => (
            <div key={weight.label} className="flex gap-1.5 whitespace-nowrap">
              <dt>{weight.label}</dt><dd className="font-mono font-medium tabular-nums text-text-primary">{weight.value.toFixed(2)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-text-secondary">
        Heuristic estimate only — not a validated measure of skill.
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">
        Only observed components contribute; weights are renormalized. Unobserved precision or guard remains unscored.
      </p>
    </section>
  );
}
