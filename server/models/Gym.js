const mongoose = require('mongoose');

const GymSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Gym name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Gym address is required'],
    },
    discipline: [
      {
        type: String,
        required: true,
      }
    ],
    images: [
      {
        type: String,
      }
    ],
    location: {
      type: String, // City, Region or Lat/Lng coordinate string
      required: [true, 'Gym location description is required'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Gym', GymSchema);
