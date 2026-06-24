const mongoose = require('mongoose');

const TrainingPlanSchema = new mongoose.Schema({
  athleteId: {
    type: String,
    required: true,
    unique: true
  },
  plan: {
    type: Object,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TrainingPlan', TrainingPlanSchema);