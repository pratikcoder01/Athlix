import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { Tournament } from '../models/Tournament';
import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { askFeatherlessJSON } from '../utils/anthropic';
import { Types } from 'mongoose';

interface SeedOutput {
  seeds: Array<{
    fighterId: string;
    seed: number;
    rationale: string;
  }>;
}

export const seedTournamentBracket = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { tournamentId } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    if (!tournament.registrations || tournament.registrations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fighters registered for this tournament yet.',
      });
    }

    // Fetch registered users
    const registeredUsers = await User.find({ _id: { $in: tournament.registrations } });
    
    // Fetch profiles to get belt ranks
    const profiles = await Profile.find({ userId: { $in: tournament.registrations } });
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    // Construct simple roster details for Claude
    const roster = registeredUsers.map((u) => {
      const p = profileMap.get(u._id.toString());
      return {
        id: u._id.toString(),
        name: u.name,
        beltRank: p?.beltRank || 'White',
        discipline: p?.discipline || 'BJJ',
      };
    });

    const systemPrompt = `You are a professional tournament organizer. Your goal is to seed fighters fairly within the tournament roster based on their experience and skills.
Ensure top seeds (highly ranked fighters) are distributed such that they do not meet until the final/later rounds.`;

    const userPrompt = `Here is the roster of registered fighters for the tournament "${tournament.title}":
${JSON.stringify(roster, null, 2)}

Provide a seeding order for these fighters.
Respond strictly in JSON format matching this schema:
{
  "seeds": [
    {
      "fighterId": "string (the matching fighter id)",
      "seed": number (1-based index seed rank, e.g. 1, 2, 3...),
      "rationale": "string (a single sentence explaining the seed decision)"
    }
  ]
}`;

    const aiResult = await askFeatherlessJSON<SeedOutput>(systemPrompt, userPrompt);

    // Save seeding rationale/result back to the tournament document
    tournament.brackets = {
      seeds: aiResult.seeds.map((s) => ({
        fighterId: new Types.ObjectId(s.fighterId),
        seed: Number(s.seed),
        rationale: s.rationale,
      })),
      rounds: [], // Initialize/clear rounds
    };
    await tournament.save();

    // Emit real-time bracket update to notify connected clients
    const io = req.app.get('io');
    if (io) {
      io.to(`tournament_${tournament._id}`).emit('bracket_update', {
        tournamentId: tournament._id,
        brackets: tournament.brackets,
        status: tournament.status,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'AI seeding generated successfully',
      seeds: aiResult.seeds,
    });
  } catch (error) {
    next(error);
  }
};

import { TrainingPlanModel } from '../models/TrainingPlan';

interface PlanOutput {
  weekOverview: string;
  days: Array<{
    day: string;
    focus: string;
    drills: string[];
    duration: string;
    intensity: 'low' | 'medium' | 'high';
  }>;
  notes: string;
}

export const generateTrainingPlan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const athleteId = req.user._id;
    const { discipline, trainingGoal, daysAvailablePerWeek, notes: userNotes } = req.body;

    const profile = await Profile.findOne({ userId: athleteId });

    const systemPrompt = `You are a world-class martial arts head coach. Your goal is to design a structured, highly optimized weekly training plan.`;

    const userPrompt = `Create a weekly training plan for:
- Discipline: ${discipline}
- Belt/Skill Level: ${profile?.beltRank || 'Beginner'}
- Training Goal: ${trainingGoal}
- Days Available Per Week: ${daysAvailablePerWeek}
- Additional Athlete Notes: ${userNotes}

Respond strictly in JSON format matching this schema:
{
  "weekOverview": "string (brief overview of focus)",
  "days": [
    {
      "day": "string (e.g. Monday)",
      "focus": "string (technique or focus area)",
      "drills": ["string (specific drill names)"],
      "duration": "string (e.g. 60 mins)",
      "intensity": "low" | "medium" | "high"
    }
  ],
  "notes": "string (any recovery or diet tips)"
}`;

    const plan = await askFeatherlessJSON<PlanOutput>(systemPrompt, userPrompt);

    return res.status(200).json({
      success: true,
      plan,
    });
  } catch (error) {
    next(error);
  }
};

export const saveTrainingPlan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const athleteId = req.user._id;
    const { plan } = req.body;

    if (!plan) {
      return res.status(400).json({ success: false, message: 'Plan body is required' });
    }

    const savedPlan = await TrainingPlanModel.create({
      athleteId,
      weekOverview: plan.weekOverview,
      days: plan.days,
      notes: plan.notes,
    });

    return res.status(201).json({
      success: true,
      message: 'Training plan successfully saved to profile',
      plan: savedPlan,
    });
  } catch (error) {
    next(error);
  }
};

import { CoachProfile } from '../models/CoachProfile';

interface MatchOutput {
  matches: Array<{
    coachId: string;
    matchScore: number;
    reason: string;
  }>;
}

export const matchCoach = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { query, location } = req.body;

    // Retrieve athlete's location from profile if not explicitly passed in body
    let athleteLocation = location;
    if (!athleteLocation && req.user) {
      const athleteProfile = await Profile.findOne({ userId: req.user._id });
      if (athleteProfile && athleteProfile.location) {
        athleteLocation = athleteProfile.location;
      }
    }

    // 1. Fetch active coaches
    const activeCoaches = await User.find({ role: 'coach', isActive: true });
    const coachIds = activeCoaches.map((c) => c._id);

    const coachProfiles = await CoachProfile.find({ userId: { $in: coachIds } });
    const generalProfiles = await Profile.find({ userId: { $in: coachIds } });

    const coachProfilesMap = new Map(coachProfiles.map((p) => [p.userId.toString(), p]));
    const generalProfilesMap = new Map(generalProfiles.map((p) => [p.userId.toString(), p]));

    // Match profiles to users
    const coachesData = activeCoaches.map((u) => {
      const cp = coachProfilesMap.get(u._id.toString());
      const p = generalProfilesMap.get(u._id.toString());
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email || '',
        discipline: p?.discipline || 'BJJ',
        beltRank: p?.beltRank || 'White',
        location: p?.location || '',
        experienceYears: cp?.experienceYears || 0,
        pricingPerHour: cp?.pricingPerHour || 0,
        certifications: cp?.certifications || [],
        rating: cp?.ratings || 5.0,
        availability: cp?.availability || [],
      };
    });

    // 2. Perform basic keyword-based pre-filtering to limit dataset sent to AI
    const lowerQuery = query.toLowerCase();
    const filteredCoaches = coachesData.filter((c) => {
      // Discipline check: if query mentions a discipline, does the coach teach it?
      const disciplines = ['bjj', 'jiu-jitsu', 'mma', 'muay thai', 'boxing', 'wrestling', 'judo', 'karate', 'taekwondo'];
      const queryDisciplines = disciplines.filter(d => lowerQuery.includes(d));
      
      let disciplineMatches = true;
      if (queryDisciplines.length > 0) {
        disciplineMatches = queryDisciplines.some(qd => {
          const coachDiscipline = c.discipline.toLowerCase();
          const certsString = c.certifications.join(' ').toLowerCase();
          return coachDiscipline.includes(qd) || certsString.includes(qd) || 
                 (qd === 'jiu-jitsu' && coachDiscipline.includes('bjj')) ||
                 (qd === 'bjj' && coachDiscipline.includes('jiu-jitsu'));
        });
      }

      // Location check: if query or athleteLocation specifies a location, does the coach match or does query match?
      let locationMatches = true;
      if (athleteLocation || lowerQuery.includes('near') || lowerQuery.includes('in ')) {
        const coachLoc = c.location.toLowerCase();
        const searchLoc = athleteLocation ? athleteLocation.toLowerCase() : '';
        if (searchLoc && coachLoc.includes(searchLoc)) {
          locationMatches = true;
        } else if (coachLoc && lowerQuery.includes(coachLoc)) {
          locationMatches = true;
        } else {
          locationMatches = coachLoc ? false : true;
        }
      }

      // Pricing check
      let pricingMatches = true;
      if (lowerQuery.includes('under') || lowerQuery.includes('$') || lowerQuery.includes('cheap') || lowerQuery.includes('budget')) {
        const prices = lowerQuery.match(/\d+/);
        if (prices) {
          const maxPrice = parseInt(prices[0], 10);
          pricingMatches = c.pricingPerHour <= maxPrice;
        }
      }

      const keywordMatches = c.name.toLowerCase().includes(lowerQuery) || 
                            c.certifications.some(cert => cert.toLowerCase().includes(lowerQuery));

      return (disciplineMatches && locationMatches && pricingMatches) || keywordMatches;
    });

    // If fewer than 3 match the pre-filtering database constraints, skip AI call
    if (filteredCoaches.length < 3) {
      return res.status(200).json({
        success: true,
        skipAI: true,
        message: 'Broaden your search criteria to discover more matches.',
        coaches: [],
      });
    }

    // 3. Ask Claude to rank the top 5 matches
    const systemPrompt = `You are an elite combat sports matchmaker. Your job is to rank the suitability of combat sports coaches based on a user's specific training requirements and constraints (such as discipline, budget, location, and experience).`;

    const userPrompt = `A student is searching for a coach with this requirement:
"${query}"
Fighter's Location: "${athleteLocation || 'Not provided'}"

Here is the roster of available coaches:
${JSON.stringify(filteredCoaches, null, 2)}

Select and rank the top 5 best-fit coaches. Give each a suitability matchScore (integer from 0 to 100) and a brief one-sentence reason why.
Respond strictly in JSON format matching this schema:
{
  "matches": [
    {
      "coachId": "string (matching coach id)",
      "matchScore": number (0-100),
      "reason": "string (one sentence explanation of the match fit)"
    }
  ]
}`;

    const aiResult = await askFeatherlessJSON<MatchOutput>(systemPrompt, userPrompt);

    // Merge AI recommendations with full profile details
    const finalMatches = aiResult.matches
      .map((m) => {
        const fullCoach = coachesData.find((c) => c.id === m.coachId);
        if (!fullCoach) return null;
        return {
          ...fullCoach,
          matchScore: m.matchScore,
          reason: m.reason,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      skipAI: false,
      coaches: finalMatches,
    });
  } catch (error) {
    next(error);
  }
};


