const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
    },
    hackathon: {
      type: String,
      required: [true, 'Hackathon name is required'],
      default: 'Smart India Hackathon (SIH)',
      trim: true,
    },
    problemDomain: {
      type: String,
      required: [true, 'Problem statement or domain is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    requiredMembers: {
      type: Number,
      required: [true, 'Required number of members is needed'],
      default: 6,
      min: [2, 'Team must have at least 2 members'],
      max: [10, 'Team cannot exceed 10 members'],
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    skillsNeeded: {
      type: [String],
      default: [],
    },
    requirements: {
      femaleRequired: {
        type: Boolean,
        default: true,
      },
      targetDepartment: {
        type: String,
        default: 'Any',
      },
      targetYear: {
        type: String,
        default: 'Any',
      },
      otherRequirements: {
        type: String,
        default: '',
      },
    },
    status: {
      type: String,
      enum: ['open', 'full', 'completed'],
      default: 'open',
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: '',
      trim: true,
    },
    flaggedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to check if team has at least one female member (SIH requirement)
teamSchema.methods.hasFemaleMember = function () {
  if (!this.populated('members') && !this.populated('leader')) {
    return false;
  }
  const leaderIsFemale = this.leader && this.leader.gender === 'Female';
  if (leaderIsFemale) return true;

  return this.members.some((m) => m && m.gender === 'Female');
};

module.exports = mongoose.model('Team', teamSchema);
