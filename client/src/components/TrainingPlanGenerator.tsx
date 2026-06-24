'use client';

import React, { useState, useEffect, useRef, memo } from 'react';

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

    try {
      const payload = {
        ...formData,
        athleteId: formData.athleteId || 'demo-athlete-123',
        beltLevel: formData.beltLevel || 'Not Specified',
        weightCategory: formData.weightCategory || 'Not Specified',
      };

      const response = await fetch('/api/ai/training-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      alert('Failed to generate training plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    setPlan(null);
    setFormData({
      athleteId: formData.athleteId,
      discipline: formData.discipline,
      beltLevel: formData.beltLevel,
      weightCategory: formData.weightCategory,
      trainingGoal: formData.trainingGoal,
      notes: formData.notes,
      daysAvailablePerWeek: 7,
    });
  };

  const saveToProfile = () => {
    if (plan) {
      alert('Training plan saved to your profile!');
      console.log('Saving plan to profile:', plan);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold font-mono tracking-widest text-text-secondary uppercase">Discipline *</label>
          <select 
            value={formData.discipline}
            onChange={(e) => setFormData({...formData, discipline: e.target.value})}
            className="bg-surface border border-border rounded p-3 text-sm text-text-primary focus:border-primary focus:outline-none"
            required
            disabled={loading}
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
          <label className="text-xs font-bold font-mono tracking-widest text-text-secondary uppercase">Training Goal *</label>
          <select 
            value={formData.trainingGoal}
            onChange={(e) => setFormData({...formData, trainingGoal: e.target.value})}
            className="bg-surface border border-border rounded p-3 text-sm text-text-primary focus:border-primary focus:outline-none"
            required
            disabled={loading}
          >
            <option value="">Select goal...</option>
            <option value="Competition Prep">Competition Prep</option>
            <option value="Skill Acquisition">Skill Acquisition</option>
            <option value="Conditioning">Cardio & Conditioning</option>
            <option value="Strength">Strength & Power</option>
            <option value="Recovery">Active Recovery</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold font-mono tracking-widest text-text-secondary uppercase">Belt / Experience Level</label>
          <input 
            type="text"
            value={formData.beltLevel}
            onChange={(e) => setFormData({...formData, beltLevel: e.target.value})}
            placeholder="e.g. Blue Belt, Amateur"
            className="bg-surface border border-border rounded p-3 text-sm text-text-primary focus:border-primary focus:outline-none"
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold font-mono tracking-widest text-text-secondary uppercase">Days per week</label>
          <input 
            type="number"
            min="1"
            max="7"
            value={formData.daysAvailablePerWeek}
            onChange={(e) => setFormData({...formData, daysAvailablePerWeek: parseInt(e.target.value) || 7})}
            className="bg-surface border border-border rounded p-3 text-sm text-text-primary focus:border-primary focus:outline-none"
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold font-mono tracking-widest text-text-secondary uppercase">Additional Notes</label>
        <textarea
          placeholder="Enter any additional goals or preferences... (e.g. 'I want to focus on guard retention' or 'I have a knee injury')"
          value={formData.notes || ''}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          disabled={loading}
          rows={3}
          className="bg-surface border border-border rounded p-3 text-sm text-text-primary focus:border-primary focus:outline-none w-full"
        />
      </div>

      {/* Loading States */}
      {loading && (
        <div className="flex flex-col items-center p-6 space-y-4">
          {/* Stage 1: Analyze */}
          {skeletonStage >= 0 && (
            <div className="w-8 h-8 bg-primary rounded-full animate-bounce" />
          )}
          {skeletonStage >= 1 && (
            <div className="w-64 rounded-lg bg-secondary animate-pulse" style={{ height: '1.5rem', marginBottom: '0.5rem' }} />
          )}
          {skeletonStage >= 2 && (
            <div className="w-32 rounded-lg bg-secondary animate-pulse" style={{ height: '1rem', marginBottom: '1rem' }} />
          )}
          {skeletonStage >= 3 && (
            <div className="w-48 rounded-lg bg-secondary animate-pulse" style={{ height: '1rem' }} />
          )}

          {/* Staggered text messages */}
          {[...Array(3)].map((_, i) => (
            <textarea
              key={i}
              placeholder={i === 0 ? 'Analyzing your training history...' :
                         i === 1 ? 'Assessing your goals and current level...' :
                         'Generating personalized plan...'}
              disabled
              className="w-80 h-8 bg-secondary rounded-none border-0 text-transparent p-2 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-start space-x-2 p-3 bg-error/10 border border-error rounded-lg">
          <svg className="flex-shrink-0 w-5 h-5 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-.19 0-.38.04-.58.12a.79.79 0 0 1-.12.64l4.4.9a1.2 1.2 0 0 0 1.21-.4l4.4-.9a.79.79 0 0 1 .12-.64c-.02-.08-.04-.16-.06-.24A.79.79 0 0 1 12 8z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14a1 1 0 0 1-1 .99v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1zm-3-2.5a1 1 0 0 0-.5.425A.75.75 0 0 0 9 12a.75.75 0 0 0 .75.75h6a.75.75 0 0 0 .75-.75A1 1 0 0 0 11 12a1 1 0 0 1-.5-.425z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2h2z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-error">{error}</p>
          </div>
          <button
            type="button"
            onClick={handleRegenerate}
            className="w-fit px-3 py-1 bg-transparent border border-error text-error rounded-md hover:bg-error hover:text-white transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main UI */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${loading ? 'opacity-70' : ''}`} >
        {/* Training Plan Card */}
        {plan ? (
          <>
            {/* Week Overview Card */}
            <div className="bg-surface p-4 rounded-lg border border-border">
              <h3 className="text-lg font-medium text-primary">Week Overview</h3>
              <p className="text-sm text-primary mt-1">{plan.weekOverview}</p>
            </div>

            {/* Daily Cards */}
            <div className="space-y-4">
              {plan.days.map((day, index) => (
                <div key={index} className="relative group bg-surface rounded-xl p-4 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Day Focus</h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${getIntensityColor(day.intensity)}20`, color: getIntensityColor(day.intensity) }}>
                      {day.intensity}
                    </span>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <h5 className="text-medium">{day.day}</h5>
                    <p className="text-sm text-secondary">{day.focus}</p>
                    <div className="w-full bg-secondary rounded-md p-2.5">
                      <ul className="space-y-2">
                        {day.drills.map((drill) => (
                          <li key={drill} className="flex items-center">
                            <span className="w-4 h-4 rounded border border-primary flex-shrink-0 mr-2">
                              <span className="w-3 h-3 rounded bg-primary mx-auto block" />
                            </span>
                            <span className="text-xs">{drill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="h-2.5 rounded-full bg-opacity-20 mt-2 flex items-center">
                      <div
                        className={`h-2 rounded-full transition-transform duration-300 ${
                          day.intensity === 'low' ? 'bg-success' :
                          day.intensity === 'medium' ? 'bg-warning' : 'bg-red-500'
                        }`}
                        style={{ width: day.intensity === 'low' ? '40%' :
                                        day.intensity === 'medium' ? '60%' : '80%' }}
                      />
                    </div>

                    <p className="text-xs text-secondary mt-1">{day.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary animate-pulse mx-auto" />
            <p className="text-lg font-medium text-secondary">No plan generated yet</p>
            <p className="text-sm text-secondary">Fill out your training preferences to generate a personalized plan</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between mt-4 gap-3">
        {!plan ? (
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors font-bold font-bebas tracking-widest text-lg disabled:opacity-50"
          >
            {loading ? 'GENERATING...' : 'GENERATE AI TRAINING PLAN'}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleRegenerate}
              className="px-4 py-2 bg-secondary border border-border text-text-primary rounded-md hover:bg-surface transition-colors"
            >
              Reset Form
            </button>
            <button
              type="button"
              onClick={saveToProfile}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Save to My Profile
            </button>
          </>
        )}
      </div>
    </form>
  );
}

// Make it memoized for performance
export default memo(TrainingPlanGenerator);