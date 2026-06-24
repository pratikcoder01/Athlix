'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import MagneticButton from './shared/MagneticButton';

/*
  Component: TrainingPlanGenerator
  Purpose: Generate personalized weekly training plans using AI
  Features:
  - Form with discipline, goal, days/week selection
  - Loading skeleton states
  - AI-generated plan display
  - Intensity color coding
  - Save to profile functionality
*/

type PlanDay = {
  day: string
  focus: string
  drills: string[]
  duration: string
  intensity: 'low' | 'medium' | 'high'
};

type TrainingPlan = {
  weekOverview: string
  days: PlanDay[]
  notes: string
};

function TrainingPlanGenerator() {
    const [formData, setFormData] = useState({
    athleteId: '',
    discipline: '',
    beltLevel: '',
    weightCategory: '',
    trainingGoal: '',
    notes: '',
    daysAvailablePerWeek: 7,
  });
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skeletonStage, setSkeletonStage] = useState(0);
  const skeletonTimer = useRef<number>(0);

  const getIntensityColor = (intensity: 'low' | 'medium' | 'high'): string => {
    const colors = {
      low: '#FF5A3D',
      medium: '#FF8B68',
      high: '#FF5A3D',
    };
    return colors[intensity] || '#ff6b35';
  };

  const generateDrills = (count: number): string[] => {
    const drills = [
      'Shadow Sparring - 3 rounds',
      'Heavy Bag Work - 5 minutes',
      'Footwork Drills - 10 minutes',
      'Technical Drill - 15 minutes',
      'Live Sparring - 3 rounds',
      'Conditioning Circuits',
      'Stretching & Mobility',
      'Breathing Exercises',
      'Video Review Session',
    ];
    return drills.slice(0, count);
  };

  const incrementSkeletonStage = () => {
    if (skeletonStage < 3) {
      setSkeletonStage(skeletonStage + 1);
      skeletonTimer.current = window.setTimeout(incrementSkeletonStage, 1500);
    } else {
      clearTimeout(skeletonTimer.current);
    }
  };

  useEffect(() => {
    skeletonTimer.current = window.setTimeout(incrementSkeletonStage, 1500);
    return () => clearTimeout(skeletonTimer.current);
  }, [skeletonStage]);

  const handleFormSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!formData.discipline || !formData.trainingGoal) {
      alert('Please fill in all required fields (Discipline and Training Goal)');
      return;
    }

    setLoading(true);
    setError(null);
    setSkeletonStage(0);

    try {
      const token = localStorage.getItem('athlix-auth')
        ? JSON.parse(localStorage.getItem('athlix-auth')!).state.token
        : '';
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const payload = {
        discipline: formData.discipline,
        trainingGoal: formData.trainingGoal,
        daysAvailablePerWeek: formData.daysAvailablePerWeek,
        notes: formData.notes,
      };

      const response = await fetch(`${API_URL}/api/ai/training-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to generate training plan');
      }

      const data = await response.json();
      setPlan(data.plan);
    } catch (err) {
      console.error('Error generating plan:', err);
      setError('Failed to generate training plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    setPlan(null);
    setFormData({
      athleteId: formData.athleteId,
      discipline: '',
      beltLevel: '',
      weightCategory: '',
      trainingGoal: '',
      notes: '',
      daysAvailablePerWeek: 7,
    });
  };

  const saveToProfile = async () => {
    if (!plan) return;
    try {
      const token = localStorage.getItem('athlix-auth')
        ? JSON.parse(localStorage.getItem('athlix-auth')!).state.token
        : '';
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const response = await fetch(`${API_URL}/api/ai/save-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });

      if (response.ok) {
        alert('Training plan saved to your profile!');
      } else {
        alert('Failed to save training plan.');
      }
    } catch (err) {
      console.error('Error saving plan:', err);
      alert('Failed to save training plan.');
    }
  };

  const [checkedDrills, setCheckedDrills] = useState<Record<string, boolean>>({});

  const toggleDrill = (dayIndex: number, drillIndex: number) => {
    const key = `${dayIndex}-${drillIndex}`;
    setCheckedDrills((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getIntensityDot = (intensity: 'low' | 'medium' | 'high') => {
    switch (intensity) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-amber-500';
      case 'high':
        return 'bg-red-500';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className="bg-secondary border border-border rounded-sm p-6 sm:p-8 relative overflow-hidden shadow-xl">
      <div className="absolute inset-0 bracket-dots pointer-events-none opacity-40" />
      
      <div className="relative z-10 mb-6 border-b border-border/40 pb-4">
        <h3 className="text-lg font-display font-black uppercase tracking-wide">AI TRAINING PLAN GENERATOR</h3>
        <p className="text-text-secondary text-xs mt-1">Get custom drill recommendations based on your discipline, rank, and weekly capacity.</p>
      </div>

      {!plan && !loading ? (
        <form onSubmit={handleFormSubmit} className="relative z-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold font-mono tracking-widest text-text-secondary uppercase">Discipline *</label>
              <select
                value={formData.discipline}
                onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                className="w-full bg-surface border border-border rounded-sm p-3 text-xs text-text-primary focus:outline-none focus:border-primary transition-all font-sans"
                required
              >
                <option value="">Select discipline...</option>
                <option value="BJJ">Brazilian Jiu-Jitsu</option>
                <option value="MMA">MMA</option>
                <option value="Muay Thai">Muay Thai</option>
                <option value="Boxing">Boxing</option>
                <option value="Wrestling">Wrestling</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold font-mono tracking-widest text-text-secondary uppercase">Training Goal *</label>
              <select
                value={formData.trainingGoal}
                onChange={(e) => setFormData({ ...formData, trainingGoal: e.target.value })}
                className="w-full bg-surface border border-border rounded-sm p-3 text-xs text-text-primary focus:outline-none focus:border-primary transition-all font-sans"
                required
              >
                <option value="">Select goal...</option>
                <option value="Competition Prep">Competition Prep</option>
                <option value="General Fitness">General Fitness</option>
                <option value="Belt Promotion">Belt Promotion</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold font-mono tracking-widest text-text-secondary uppercase">Days Available Per Week</label>
              <input
                type="number"
                min="1"
                max="7"
                value={formData.daysAvailablePerWeek}
                onChange={(e) => setFormData({ ...formData, daysAvailablePerWeek: parseInt(e.target.value) || 7 })}
                className="w-full bg-surface border border-border rounded-sm p-3 text-xs text-text-primary focus:outline-none focus:border-primary transition-all font-sans font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold font-mono tracking-widest text-text-secondary uppercase">Additional Notes</label>
            <textarea
              placeholder="e.g. Focus on guard retention, recovering from left shoulder strain..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full bg-surface border border-border rounded-sm p-3 text-xs text-text-primary focus:outline-none focus:border-primary transition-all font-sans resize-none"
            />
          </div>

          <MagneticButton type="submit" className="w-full bg-primary hover:bg-opacity-95 text-white py-3.5 rounded-sm font-bold font-mono tracking-wider text-xs uppercase shadow-md">
            Generate AI Training Plan
          </MagneticButton>
        </form>
      ) : null}

      {/* Loading Skeleton View */}
      {loading && (
        <div className="relative z-10 flex flex-col items-center py-12 text-center">
          <div className="w-10 h-10 border-4 border-t-primary border-border rounded-full animate-spin mb-6" />
          <h4 className="text-sm font-display font-black tracking-wider uppercase mb-2">
            {skeletonStage === 0 ? 'Analyzing your training history...' :
             skeletonStage === 1 ? 'Assessing your goals and current level...' :
             'Building your week...'}
          </h4>
          <p className="text-text-secondary text-xs max-w-xs leading-relaxed">
            Claude is compiling drills tailored to your belt rank and schedule.
          </p>
        </div>
      )}

      {/* Generated Plan View */}
      {plan && !loading ? (
        <div className="relative z-10 space-y-6">
          {/* Week Overview */}
          <div className="bg-surface border border-border/60 p-4 rounded-sm">
            <h4 className="text-xs font-mono font-bold tracking-widest text-primary uppercase mb-2">WEEK OVERVIEW</h4>
            <p className="text-text-secondary text-xs leading-relaxed font-sans">{plan.weekOverview}</p>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.days.map((day, dIdx) => (
              <div key={dIdx} className="bg-surface border border-border p-4 rounded-sm flex flex-col justify-between h-72">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-mono font-bold text-text-secondary uppercase">{day.day}</span>
                    <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-text-primary uppercase">
                      <span className={`h-2.5 w-2.5 rounded-full ${getIntensityDot(day.intensity)}`} />
                      {day.intensity} INTENSITY
                    </span>
                  </div>
                  
                  <h5 className="text-xs font-display font-black uppercase tracking-wider text-text-primary mb-2">{day.focus}</h5>
                  
                  {/* Checklist Drills */}
                  <ul className="space-y-1.5 overflow-y-auto max-h-36 pr-1 font-sans text-[11px] text-text-secondary">
                    {day.drills.map((drill, drillIdx) => {
                      const isChecked = !!checkedDrills[`${dIdx}-${drillIdx}`];
                      return (
                        <li key={drillIdx} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleDrill(dIdx, drillIdx)}
                            className="mt-0.5 accent-primary h-3.5 w-3.5 border-border rounded-sm bg-surface cursor-pointer"
                          />
                          <span className={isChecked ? 'line-through text-text-tertiary' : ''}>{drill}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                
                <div className="border-t border-border/40 pt-2.5 mt-3 text-[9px] font-mono font-bold text-text-secondary">
                  DURATION: {day.duration.toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          {plan.notes && (
            <div className="bg-surface border border-border/60 p-4 rounded-sm">
              <h4 className="text-xs font-mono font-bold tracking-widest text-text-secondary uppercase mb-2">COACH'S CORNER NOTES</h4>
              <p className="text-text-secondary text-xs leading-relaxed font-sans">{plan.notes}</p>
            </div>
          )}

          {/* Plan Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-border/40">
            <button
              onClick={handleRegenerate}
              className="text-xs font-bold font-mono tracking-wider text-text-secondary hover:text-text-primary transition-colors uppercase cursor-pointer"
            >
              Reset Form
            </button>
            <MagneticButton onClick={saveToProfile} className="bg-primary hover:bg-opacity-95 text-white py-2.5 px-6 rounded-sm text-xs font-mono font-bold tracking-wider uppercase">
              Save to Profile
            </MagneticButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default memo(TrainingPlanGenerator);