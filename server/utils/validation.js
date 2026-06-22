const { z } = require('zod');

// Registration Payload Validator
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['athlete', 'coach', 'admin']).default('athlete'),
  discipline: z.enum(['Karate', 'BJJ', 'Judo', 'Muay Thai', 'Taekwondo', 'Boxing', 'MMA']).default('BJJ'),
  beltRank: z.string().default('White'),
});

// Login Payload Validator
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Post Feed Payload Validator
const postSchema = z.object({
  caption: z.string().min(1, 'Post caption cannot be empty'),
  mediaUrl: z.string().optional().default(''),
});

// Coaching Session Payload Validator
const bookingSchema = z.object({
  coachId: z.string().min(1, 'Coach ID is required'),
  date: z.string().min(1, 'Date is required'),
  slot: z.string().min(1, 'Timeslot is required'),
});

// Tournament Setup Payload Validator
const tournamentSchema = z.object({
  title: z.string().min(1, 'Tournament title is required'),
  discipline: z.string().min(1, 'Discipline is required'),
  location: z.string().min(1, 'Location is required'),
  date: z.string().min(1, 'Event date is required'),
});

// Express validation helper middleware
const validateBody = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }
};

module.exports = {
  registerSchema,
  loginSchema,
  postSchema,
  bookingSchema,
  tournamentSchema,
  validateBody,
};
