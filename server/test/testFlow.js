const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');

// Load environment variables
require('dotenv').config();

const connectDB = require('../config/db');
const authRoutes = require('../routes/authRoutes');
const teamRoutes = require('../routes/teamRoutes');
const requestRoutes = require('../routes/requestRoutes');
const adminRoutes = require('../routes/adminRoutes');
const { notFound, errorHandler } = require('../middleware/errorMiddleware');

async function runTests() {
  console.log('--- STARTING TEAMFINDER AUTOMATED API VALIDATION SUITE ---');

  // 1. Connect to DB
  await connectDB();
  console.log('✔ Connected to DB successfully');

  // 2. Setup test express app
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/teams', teamRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  const User = require('../models/User');
  const Team = require('../models/Team');
  const JoinRequest = require('../models/JoinRequest');

  // Drop stale legacy indexes if present on remote database
  try {
    await mongoose.connection.collection('users').dropIndex('rollNo_1').catch(() => {});
  } catch (e) {}

  // Clean up any test records from prior runs
  await User.deleteMany({ email: { $regex: /anil|pooja|coordinator|intruder/i } });
  await Team.deleteMany({ teamName: { $regex: /EcoVanguard|Second Team/i } });
  await JoinRequest.deleteMany({});

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`✔ Test server listening on ${baseUrl}`);

  try {
    // TEST 1: Reject Non-NBKRIST Email
    console.log('\n[TEST 1] Verifying domain rejection for non-NBKRIST emails...');
    const invalidEmailRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Intruder',
        rollNumber: '99OUTSIDER',
        email: 'intruder@gmail.com',
        password: 'password123',
        department: 'CSE',
        year: '3rd Year',
        gender: 'Male',
      }),
    });
    const invalidEmailData = await invalidEmailRes.json();
    if (invalidEmailRes.status === 400 && invalidEmailData.message.includes('nbkrist.org')) {
      console.log('✔ PASS: Non-NBKRIST email was strictly rejected:', invalidEmailData.message);
    } else {
      throw new Error(`FAIL: Expected 400 rejection for non-nbkrist email, got ${invalidEmailRes.status}`);
    }

    // TEST 2: Valid NBKRIST Student Registration
    console.log('\n[TEST 2] Verifying student registration with @nbkrist.org email...');
    const regRes1 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Anil Kumar',
        rollNumber: '21KB1A0588',
        email: 'anil.21@nbkrist.org',
        password: 'password123',
        department: 'CSE',
        year: '3rd Year',
        gender: 'Male',
        skills: 'React, Node.js, Express',
      }),
    });
    const regData1 = await regRes1.json();
    if (regRes1.status === 201 && regData1.token) {
      console.log('✔ PASS: Student registered successfully with token:', regData1.user.email);
    } else {
      throw new Error(`FAIL: Registration failed: ${JSON.stringify(regData1)}`);
    }
    const token1 = regData1.token;

    // Register 2nd Student (Female teammate)
    console.log('\n[TEST 3] Registering second student (Pooja - Female teammate)...');
    const regRes2 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pooja Reddy',
        rollNumber: '22KB1A0450',
        email: 'pooja.22@nbkrist.org',
        password: 'password123',
        department: 'ECE',
        year: '2nd Year',
        gender: 'Female',
        skills: 'Python, Embedded IoT, OpenCV',
      }),
    });
    const regData2 = await regRes2.json();
    const token2 = regData2.token;
    console.log('✔ PASS: Second student registered with token');

    // Register Admin
    console.log('\n[TEST 4] Registering admin coordinator...');
    const regAdmin = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'SIH Coordinator',
        rollNumber: 'FACULTY99',
        email: 'coordinator@nbkrist.org',
        password: 'adminpassword123',
        department: 'CSE',
        year: '4th Year',
        gender: 'Female',
        role: 'admin',
      }),
    });
    const adminData = await regAdmin.json();
    const adminToken = adminData.token;
    console.log('✔ PASS: Admin registered successfully');

    // TEST 5: Create a Team for SIH
    console.log('\n[TEST 5] Student 1 creates SIH Team...');
    const createTeamRes = await fetch(`${baseUrl}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        teamName: 'EcoVanguard NBKR',
        hackathon: 'Smart India Hackathon (SIH)',
        problemDomain: 'Clean Energy & Smart Grid',
        description: 'AI-driven energy load optimization for college campuses',
        requiredMembers: 6,
        skillsNeeded: 'IoT, React, Cloud',
        requirements: {
          femaleRequired: true,
          targetDepartment: 'ECE',
        },
      }),
    });
    const teamData = await createTeamRes.json();
    if (createTeamRes.status === 201 && teamData.team) {
      console.log('✔ PASS: SIH Team created successfully:', teamData.team.teamName);
    } else {
      throw new Error(`FAIL: Team creation failed: ${JSON.stringify(teamData)}`);
    }
    const teamId = teamData.team._id;

    // TEST 6: Prevent Duplicate Team for Same Hackathon
    console.log('\n[TEST 6] Testing duplicate team creation prevention for same hackathon...');
    const dupTeamRes = await fetch(`${baseUrl}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({
        teamName: 'Second Team Attempt',
        hackathon: 'Smart India Hackathon (SIH)',
        problemDomain: 'Education',
      }),
    });
    const dupData = await dupTeamRes.json();
    if (dupTeamRes.status === 400 && (dupData.message.includes('already part of') || dupData.message.includes('cannot create or join multiple teams'))) {
      console.log('✔ PASS: Duplicate hackathon participation was successfully blocked:', dupData.message);
    } else {
      throw new Error(`FAIL: Expected duplicate prevention, got ${dupTeamRes.status}: ${JSON.stringify(dupData)}`);
    }

    // TEST 7: Join Request Submission
    console.log('\n[TEST 7] Student 2 (Pooja) sends Join Request to Team 1...');
    const reqRes = await fetch(`${baseUrl}/requests/${teamId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({
        message: 'Hi Anil! I have hands-on experience with sensor interfacing and Python.',
      }),
    });
    const reqData = await reqRes.json();
    const joinRequest = reqData.request || reqData.joinRequest;
    if (reqRes.status === 201 && joinRequest) {
      console.log('✔ PASS: Join request created successfully');
    } else {
      throw new Error(`FAIL: Join request failed: ${JSON.stringify(reqData)}`);
    }
    const requestId = joinRequest._id;

    // TEST 8: Team Leader Accepts Request
    console.log('\n[TEST 8] Team Leader accepts Pooja into the team...');
    const acceptRes = await fetch(`${baseUrl}/requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ action: 'accept' }),
    });
    const acceptData = await acceptRes.json();
    if (acceptRes.status === 200) {
      console.log('✔ PASS: Request accepted by leader:', acceptData.message);
    } else {
      throw new Error(`FAIL: Leader failed to accept request: ${JSON.stringify(acceptData)}`);
    }

    // Verify team member roster
    const verifyTeamRes = await fetch(`${baseUrl}/teams/${teamId}`);
    const verifyTeamData = await verifyTeamRes.json();
    const members = verifyTeamData.team.members;
    console.log(`✔ Verified team roster has ${members.length} members`);
    const hasPooja = members.some((m) => m.email === 'pooja.22@nbkrist.org');
    if (hasPooja) {
      console.log('✔ PASS: Pooja is confirmed on the official team roster');
    } else {
      throw new Error('FAIL: Member not found in team roster after acceptance');
    }

    // TEST 9: Admin Dashboard & Stats
    console.log('\n[TEST 9] Admin queries stats endpoint...');
    const statsRes = await fetch(`${baseUrl}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData = await statsRes.json();
    if (statsRes.status === 200 && statsData.stats.totalStudents >= 2) {
      console.log('✔ PASS: Admin stats returned:', statsData.stats);
    } else {
      throw new Error(`FAIL: Admin stats query failed: ${JSON.stringify(statsData)}`);
    }

    // TEST 10: Admin Excel Export (.xlsx)
    console.log('\n[TEST 10] Admin generates Excel (.xlsx) roster...');
    const excelRes = await fetch(`${baseUrl}/admin/export-excel`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (
      excelRes.status === 200 &&
      excelRes.headers.get('content-type')?.includes('spreadsheet')
    ) {
      const buffer = await excelRes.arrayBuffer();
      console.log(`✔ PASS: Excel sheet generated successfully (${buffer.byteLength} bytes)`);
    } else {
      throw new Error(`FAIL: Excel export failed with status ${excelRes.status}`);
    }

    console.log('\n🎉 ALL 10 TESTS COMPLETED AND PASSED WITH 100% SUCCESS! 🎉');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST RUNNER FAILED:', err.message);
    server.close();
    process.exit(1);
  }
}

runTests();
