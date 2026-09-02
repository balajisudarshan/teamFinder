const mongoose = require('mongoose');

const joinRequestSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple pending requests for the same student and team
joinRequestSchema.index({ team: 1, student: 1, status: 1 });

module.exports = mongoose.model('JoinRequest', joinRequestSchema);
