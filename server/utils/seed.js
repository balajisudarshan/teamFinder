const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const JoinRequest = require('../models/JoinRequest');

const seedInitialData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('ℹ️ Database already has data. Skipping automatic seeding.');
      return;
    }

    console.log('🌱 Empty database detected. Seeding sample NBKRIST students, teams, and admin...');

    // 1. Create Admin
    const admin = await User.create({
      name: 'Dr. K. Srinivas (Admin)',
      rollNumber: 'ADM-NBKR-01',
      email: 'admin@nbkrist.org',
      password: 'adminpassword123',
      department: 'CSE',
      year: '4th Year',
      gender: 'Male',
      skills: ['SIH Coordination', 'Project Evaluation', 'Mentorship'],
      bio: 'NBKRIST Smart India Hackathon SPOC & Student Innovation Coordinator.',
      role: 'admin',
    });

    // 2. Create Students
    const studentData = [
      {
        name: 'Sai Teja Reddy',
        rollNumber: '21KB1A0501',
        email: 'saiteja.21@nbkrist.org',
        password: 'password123',
        department: 'CSE',
        year: '4th Year',
        gender: 'Male',
        skills: ['React', 'Node.js', 'MongoDB', 'REST APIs', 'Tailwind CSS'],
        bio: 'Full Stack MERN Developer passionate about building high-impact civic tech solutions.',
      },
      {
        name: 'Kavya Sharma',
        rollNumber: '21KB1A0542',
        email: 'kavya.21@nbkrist.org',
        password: 'password123',
        department: 'CSE',
        year: '4th Year',
        gender: 'Female',
        skills: ['Python', 'Machine Learning', 'TensorFlow', 'FastAPI', 'Data Science'],
        bio: 'AI/ML enthusiast looking for a team solving smart healthcare or agriculture problems in SIH.',
      },
      {
        name: 'Vikram Varma',
        rollNumber: '22KB1A0412',
        email: 'vikram.22@nbkrist.org',
        password: 'password123',
        department: 'ECE',
        year: '3rd Year',
        gender: 'Male',
        skills: ['IoT', 'Embedded C', 'Arduino', 'Raspberry Pi', 'Sensors'],
        bio: 'Hardware & IoT developer ready to integrate sensors and edge computing for SIH.',
      },
      {
        name: 'Sneha Rao',
        rollNumber: '22KB1A1208',
        email: 'sneha.22@nbkrist.org',
        password: 'password123',
        department: 'AI&DS',
        year: '3rd Year',
        gender: 'Female',
        skills: ['UI/UX Design', 'Figma', 'React', 'Tailwind CSS', 'Next.js'],
        bio: 'Frontend developer & UI/UX designer with hackathon experience.',
      },
      {
        name: 'Harsha Vardhan',
        rollNumber: '22KB1A0589',
        email: 'harsha.22@nbkrist.org',
        password: 'password123',
        department: 'CSE',
        year: '3rd Year',
        gender: 'Male',
        skills: ['Flutter', 'Mobile Dev', 'Firebase', 'Java'],
        bio: 'Cross-platform app developer who loves rapid prototyping.',
      },
      {
        name: 'Ananya Deshmukh',
        rollNumber: '23KB1A0215',
        email: 'ananya.23@nbkrist.org',
        password: 'password123',
        department: 'EEE',
        year: '2nd Year',
        gender: 'Female',
        skills: ['MATLAB', 'Solar Microgrid', 'IoT', 'Python'],
        bio: 'Renewable energy and clean tech researcher aiming for SIH hardware category.',
      },
      {
        name: 'Rohan Kumar',
        rollNumber: '23KB1A0530',
        email: 'rohan.23@nbkrist.org',
        password: 'password123',
        department: 'IT',
        year: '2nd Year',
        gender: 'Male',
        skills: ['Docker', 'AWS', 'Node.js', 'PostgreSQL', 'DevOps'],
        bio: 'Cloud architecture & DevOps specialist looking for ambitious hackathon builders.',
      },
    ];

    const createdStudents = await User.create(studentData);
    const [sai, kavya, vikram, sneha, harsha, ananya, rohan] = createdStudents;

    // 3. Create Sample Teams
    // Team 1: Smart AgriTech NBKR (Leader: Sai Teja, Members: Sai, Kavya, Vikram)
    const team1 = await Team.create({
      teamName: 'Smart AgriTech NBKR',
      hackathon: 'Smart India Hackathon (SIH)',
      problemDomain: 'Agriculture, FoodTech & Rural Development',
      description: 'AI-driven soil moisture analyzer and drone crop surveillance system for farmers.',
      requiredMembers: 6,
      leader: sai._id,
      members: [sai._id, kavya._id, vikram._id],
      skillsNeeded: ['UI/UX Designer', 'Mobile App (Flutter/React Native)', 'Cloud Backend'],
      requirements: {
        femaleRequired: true,
        targetDepartment: 'Any',
        targetYear: 'Any',
        otherRequirements: 'Need 1 Flutter developer and 1 UI/UX designer. SIH mandatory female teammate already onboarded.',
      },
      status: 'open',
    });

    // Team 2: CyberGuard NBKR (Leader: Harsha Vardhan, Member: Harsha)
    const team2 = await Team.create({
      teamName: 'CyberGuard NBKR',
      hackathon: 'Smart India Hackathon (SIH)',
      problemDomain: 'Cybersecurity & Disaster Management',
      description: 'Decentralized secure emergency alert broadcasting network for disaster response.',
      requiredMembers: 6,
      leader: harsha._id,
      members: [harsha._id],
      skillsNeeded: ['React', 'Cryptography', 'Node.js', 'WebSockets', 'Female Member'],
      requirements: {
        femaleRequired: true,
        targetDepartment: 'CSE',
        targetYear: '3rd Year',
        otherRequirements: 'Actively searching for at least one Female member for SIH compliance!',
      },
      status: 'open',
    });

    // 4. Create Sample Join Request
    // Sneha sends request to join team 1
    await JoinRequest.create({
      team: team1._id,
      student: sneha._id,
      message: 'Hi Sai, I am a 3rd year AI&DS student with strong React & Figma skills. I can handle the frontend and design system for the farmer dashboard!',
      status: 'pending',
    });

    console.log('✅ Demo data successfully seeded!');
    console.log('   Admin credentials: admin@nbkrist.org / adminpassword123');
    console.log('   Student demo login: saiteja.21@nbkrist.org / password123');
  } catch (err) {
    console.error('❌ Error during seeding:', err.message);
  }
};

if (require.main === module) {
  require('dotenv').config();
  const connectDB = require('../config/db');
  connectDB().then(async () => {
    try {
      await mongoose.connection.collection('users').dropIndex('rollNo_1').catch(() => {});
    } catch (e) {}
    console.log('Clearing existing records for fresh demo seed...');
    await User.deleteMany({});
    await Team.deleteMany({});
    await JoinRequest.deleteMany({});
    await seedInitialData();
    console.log('🌱 Seeding process complete.');
    process.exit(0);
  });
}

module.exports = { seedInitialData };
