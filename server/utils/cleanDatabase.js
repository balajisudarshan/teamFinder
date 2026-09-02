const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Team = require('../models/Team');
const JoinRequest = require('../models/JoinRequest');

const cleanDatabase = async () => {
  try {
    console.log('--- CLEANING DATABASE FOR PRODUCTION ---');
    await connectDB();

    // 1. Delete all teams and join requests
    const deletedTeams = await Team.deleteMany({});
    const deletedRequests = await JoinRequest.deleteMany({});
    console.log(`✔ Removed all dummy teams (${deletedTeams.deletedCount} teams removed)`);
    console.log(`✔ Removed all dummy join requests (${deletedRequests.deletedCount} requests removed)`);

    // 2. Remove dummy students
    const deletedStudents = await User.deleteMany({ role: 'student' });
    console.log(`✔ Removed all dummy student accounts (${deletedStudents.deletedCount} students removed)`);

    // 3. Setup single clean Coordinator / Admin account if none exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@nbkrist.org';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@NBKRIST2025!';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'Faculty SIH Coordinator',
        rollNumber: 'NBKR-ADMIN-01',
        email: adminEmail,
        password: adminPassword,
        department: 'CSE',
        year: '4th Year',
        gender: 'Male',
        skills: ['SIH Nodal Review', 'Student Evaluation', 'Institutional Administration'],
        bio: 'Official Coordinator for Smart India Hackathon & Innovation Cell at NBKRIST.',
        role: 'admin',
      });
      console.log(`✔ Created official Administrator account: ${adminEmail}`);
    } else {
      console.log(`✔ Preserved existing Administrator account: ${adminEmail}`);
    }

    console.log('\n✅ Database is now 100% clean and ready for production use!');
    console.log(`   Admin Login: ${adminEmail}`);
    console.log('   All dummy students, teams, and requests have been purged.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to clean database:', err.message);
    process.exit(1);
  }
};

cleanDatabase();
