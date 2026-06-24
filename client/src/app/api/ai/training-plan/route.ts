import { NextResponse } from 'next/server'

// MongoDB connection and model - inline for API route
import mongoose from 'mongoose'
import { connectDB } from '../../../../../../server/src/config/db'

const TrainingPlanSchema = new mongoose.Schema({
  athleteId: { type: String, required: true, unique: true },
  plan: { type: Object, required: true },
  timestamp: { type: Date, default: Date.now }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TrainingPlanModel: mongoose.Model<any> = mongoose.models.TrainingPlan || mongoose.model('TrainingPlan', TrainingPlanSchema)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      athleteId,
      discipline,
      beltLevel,
      weightCategory,
      trainingGoal,
      daysAvailablePerWeek
    } = body

    // Validate required fields
    if (!athleteId || !discipline || !beltLevel || !weightCategory || !trainingGoal || daysAvailablePerWeek === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Construct prompt for Claude API
    const prompt = `
      Generate a personalized weekly training plan for an athlete with the following profile:
      - Athlete ID: ${athleteId}
      - Discipline: ${discipline} (BJJ/MMA/Karate)
      - Belt Level: ${beltLevel}
      - Weight Category: ${weightCategory}
      - Training Goal: ${trainingGoal}
      - Days Available Per Week: ${daysAvailablePerWeek}

      The plan should include:
      - A week overview string describing the week's focus and objectives
      - An array of 7 day objects (one for each day of the week, Monday through Sunday)
      - For each day: day name, focus area, array of drill names, duration string, and intensity level
      - Additional notes string with recommendations or observations

      Return ONLY valid JSON matching this exact schema, with no additional text, markdown, or preamble:

      {
        "weekOverview": "string",
        "days": [
          {
            "day": "string (e.g., 'Monday')",
            "focus": "string",
            "drills": ["string", "string", ...],
            "duration": "string (e.g., '45 mins')",
            "intensity": "low" | "medium" | "high"
          }
        ],
        "notes": "string"
      }

      Ensure the plan is realistic, progressive, and appropriate for the athlete's level and goals.
      Adjust intensity and volume based on daysAvailablePerWeek.
      `;

    // Call Google GenAI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured in environment variables' },
        { status: 500 }
      );
    }

    let planText = '';
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are an expert martial arts training coach. Generate scientifically sound, progressive training plans. Return ONLY valid JSON as specified in the user's prompt - no additional text, no markdown, no explanations.",
          temperature: 0.7,
        }
      });
      planText = response.text || '';
    } catch (apiError: any) {
      return NextResponse.json(
        { error: `Gemini API error: ${apiError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    if (!planText) {
      throw new Error('Failed to extract text from Gemini API response');
    }

    // Parse and validate the JSON plan
    let plan;
    try {
      planText = planText.replace(/```json/g, '').replace(/```/g, ''); // cleanup any markdown if present
      plan = JSON.parse(planText.trim());
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Failed to parse training plan from AI response - invalid JSON format' },
        { status: 500 }
      );
    }

    // Basic schema validation
    if (typeof plan.weekOverview !== 'string' ||
        !Array.isArray(plan.days) ||
        typeof plan.notes !== 'string') {
      return NextResponse.json(
        { error: 'Invalid plan structure received from AI - missing required fields' },
        { status: 400 }
      );
    }

    // Validate each day in the plan
    for (const day of plan.days) {
      if (!day.day || typeof day.day !== 'string' ||
          !day.focus || typeof day.focus !== 'string' ||
          !Array.isArray(day.drills) ||
          !day.duration || typeof day.duration !== 'string' ||
          !day.intensity || !['low', 'medium', 'high'].includes(day.intensity)) {
        return NextResponse.json(
          { error: 'Invalid day structure in plan' },
          { status: 400 }
        );
      }

      // Validate drills array elements
      for (const drill of day.drills) {
        if (typeof drill !== 'string') {
          return NextResponse.json(
            { error: 'Drill must be a string' },
            { status: 400 }
          );
        }
      }
    }

    // Save to MongoDB with upsert (optional, don't crash if it fails)
    try {
      await connectDB();
      await TrainingPlanModel.findOneAndUpdate(
        { athleteId: athleteId },
        {
          $set: {
            plan: plan,
            timestamp: new Date()
          }
        },
        { upsert: true, new: true }
      );
    } catch (dbError) {
      console.error('[Training Plan API] DB Save failed, but continuing:', dbError);
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('[Training Plan API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate training plan. Please try again.' },
      { status: 500 }
    );
  }
}