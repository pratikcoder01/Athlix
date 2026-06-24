import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { Tournament } from '../models/Tournament';
import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { askClaudeJSON } from '../utils/anthropic';

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

    const aiResult = await askClaudeJSON<SeedOutput>(systemPrompt, userPrompt);

    // Save seeding rationale/result back to the tournament document
    // We will serialize and save it inside tournament.brackets or update brackets JSON
    tournament.brackets = JSON.stringify(aiResult.seeds);
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
