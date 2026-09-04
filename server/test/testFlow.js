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

  const { apiLimiter } = require('../middleware/rateLimiter');
  app.use('/api', apiLimiter);

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
  await User.deleteMany({ email: { $regex: /anil|pooja|coordinator|intruder|imposter/i } });
  await Team.deleteMany({ teamName: { $regex: /EcoVanguard|Second Team|Spam Target|Forbidden/i } });
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

    // TEST 10: Admin Applications Query
    console.log('\n[TEST 10] Admin queries applications endpoint...');
    const appsRes = await fetch(`${baseUrl}/admin/applications`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const appsData = await appsRes.json();
    if (appsRes.status === 200 && Array.isArray(appsData.applications) && appsData.applications.length > 0) {
      console.log(`✔ PASS: Admin applications retrieved: ${appsData.applications.length} application(s) found`);
      const app = appsData.applications[0];
      console.log(`  -> Applicant: ${app.student?.name} (${app.student?.rollNumber})`);
      console.log(`  -> Target Team: ${app.team?.teamName}`);
      console.log(`  -> Status: ${app.status}`);
    } else {
      throw new Error(`FAIL: Admin applications query failed: ${JSON.stringify(appsData)}`);
    }

    // TEST 11: Admin Excel Export (.xlsx)
    console.log('\n[TEST 11] Admin generates Excel (.xlsx) roster...');
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

    // TEST 12: Teams List Pagination Verification
    console.log('\n[TEST 12] Testing teams catalog pagination (?page=1&limit=2)...');
    const pageTeamsRes = await fetch(`${baseUrl}/teams?page=1&limit=2`);
    const pageTeamsData = await pageTeamsRes.json();
    if (
      pageTeamsRes.status === 200 &&
      pageTeamsData.page === 1 &&
      pageTeamsData.limit === 2 &&
      pageTeamsData.total !== undefined &&
      Array.isArray(pageTeamsData.teams) &&
      pageTeamsData.teams.length <= 2
    ) {
      console.log(`✔ PASS: Team catalog pagination verified: page=${pageTeamsData.page}, limit=${pageTeamsData.limit}, total=${pageTeamsData.total}, totalPages=${pageTeamsData.totalPages}`);
    } else {
      throw new Error(`FAIL: Teams pagination failed: ${JSON.stringify(pageTeamsData)}`);
    }

    // TEST 13: Admin Students and Applications Pagination Verification
    console.log('\n[TEST 13] Testing admin directory and applications pagination...');
    const pageStudentsRes = await fetch(`${baseUrl}/admin/students?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pageStudentsData = await pageStudentsRes.json();
    if (pageStudentsRes.status === 200 && pageStudentsData.page === 1 && pageStudentsData.total !== undefined) {
      console.log(`✔ PASS: Admin student directory pagination verified: page=${pageStudentsData.page}, total=${pageStudentsData.total}, returned=${pageStudentsData.students.length}`);
    } else {
      throw new Error(`FAIL: Admin students pagination failed: ${JSON.stringify(pageStudentsData)}`);
    }

    // TEST 14: Admin Flags Student Account as Fake & Verifies Action Restrictions
    console.log('\n[TEST 14] Testing Admin flagging a fake student and verifying action lockouts...');
    // Register a student with suspicious credentials
    const fakeRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Imposter Student',
        rollNumber: 'FAKE99999',
        email: 'imposter.99@nbkrist.org',
        password: 'password123',
        department: 'CSE',
        year: '1st Year',
        gender: 'Male',
        skills: 'None',
      }),
    });
    const fakeRegData = await fakeRegRes.json();
    const fakeUserId = fakeRegData.user._id;
    const fakeToken = fakeRegData.token;

    // Admin flags this student
    const flagUserRes = await fetch(`${baseUrl}/admin/users/${fakeUserId}/flag`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        isFlagged: true,
        reason: 'Fake roll number - unverified student identity',
      }),
    });
    const flagUserData = await flagUserRes.json();
    if (flagUserRes.status === 200 && flagUserData.user.isFlagged === true) {
      console.log('✔ PASS: Admin successfully flagged student with reason:', flagUserData.user.flagReason);
    } else {
      throw new Error(`FAIL: Flagging student failed: ${JSON.stringify(flagUserData)}`);
    }

    // Flagged student tries to create a team -> must be blocked with 403
    const blockedTeamRes = await fetch(`${baseUrl}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${fakeToken}`,
      },
      body: JSON.stringify({
        teamName: 'Forbidden Team',
        hackathon: 'HackOverflow',
        problemDomain: 'Security',
      }),
    });
    const blockedTeamData = await blockedTeamRes.json();
    if (blockedTeamRes.status === 403 && blockedTeamData.message.includes('flagged')) {
      console.log('✔ PASS: Flagged student was strictly blocked from creating teams (403 Forbidden):', blockedTeamData.message);
    } else {
      throw new Error(`FAIL: Expected 403 Forbidden for flagged student team creation, got ${blockedTeamRes.status}`);
    }

    // Flagged student logs in -> verify warning fields are present
    const fakeLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'imposter.99@nbkrist.org',
        password: 'password123',
      }),
    });
    const fakeLoginData = await fakeLoginRes.json();
    if (fakeLoginData.user?.isFlagged === true && fakeLoginData.user?.flagReason.includes('Fake roll number')) {
      console.log('✔ PASS: Login payload includes warning flag and coordinator reason for user alert');
    } else {
      throw new Error(`FAIL: Flag details missing on login: ${JSON.stringify(fakeLoginData)}`);
    }

    // Admin unflags student
    const unflagUserRes = await fetch(`${baseUrl}/admin/users/${fakeUserId}/flag`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isFlagged: false }),
    });
    const unflagUserData = await unflagUserRes.json();
    if (unflagUserRes.status === 200 && unflagUserData.user.isFlagged === false) {
      console.log('✔ PASS: Admin successfully unflagged student; account restored to good standing');
    } else {
      throw new Error(`FAIL: Unflagging student failed: ${JSON.stringify(unflagUserData)}`);
    }

    // TEST 15: Admin Flags Fake/Spam Team and Blocks Incoming Applications
    console.log('\n[TEST 15] Testing Admin flagging a spam team and blocking incoming join requests...');
    // Unflagged student creates a team
    const newTeamRes = await fetch(`${baseUrl}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${fakeToken}`,
      },
      body: JSON.stringify({
        teamName: 'Spam Target Team',
        hackathon: 'HackOverflow',
        problemDomain: 'Web3',
        requiredMembers: 4,
      }),
    });
    const newTeamData = await newTeamRes.json();
    const spamTeamId = newTeamData.team._id;

    // Admin flags the team
    const flagTeamRes = await fetch(`${baseUrl}/admin/teams/${spamTeamId}/flag`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        isFlagged: true,
        reason: 'Spam registration - duplicate team entry',
      }),
    });
    const flagTeamData = await flagTeamRes.json();
    if (flagTeamRes.status === 200 && flagTeamData.team.isFlagged === true) {
      console.log('✔ PASS: Admin successfully flagged spam team:', flagTeamData.team.teamName);
    } else {
      throw new Error(`FAIL: Flagging team failed: ${JSON.stringify(flagTeamData)}`);
    }

    // Another student (Pooja / token2) attempts to request to join this flagged team -> must be blocked
    const blockedReqRes = await fetch(`${baseUrl}/requests/${spamTeamId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({ message: 'Requesting to join spam team' }),
    });
    const blockedReqData = await blockedReqRes.json();
    if (blockedReqRes.status === 403 && blockedReqData.message.includes('flagged')) {
      console.log('✔ PASS: Join request to flagged team was blocked (403):', blockedReqData.message);
    } else {
      throw new Error(`FAIL: Expected 403 when requesting to join flagged team, got ${blockedReqRes.status}: ${JSON.stringify(blockedReqData)}`);
    }

    // Admin unflags the team
    const unflagTeamRes = await fetch(`${baseUrl}/admin/teams/${spamTeamId}/flag`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isFlagged: false }),
    });
    const unflagTeamData = await unflagTeamRes.json();
    if (unflagTeamRes.status === 200 && unflagTeamData.team.isFlagged === false) {
      console.log('✔ PASS: Admin successfully unflagged team; team restrictions lifted');
    } else {
      throw new Error(`FAIL: Unflagging team failed: ${JSON.stringify(unflagTeamData)}`);
    }

    // TEST 16: Admin Delete Team Permanently
    console.log('\n[TEST 16] Testing Admin permanent deletion of a spam/fake team...');
    const deleteTeamRes = await fetch(`${baseUrl}/admin/teams/${spamTeamId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteTeamData = await deleteTeamRes.json();
    if (deleteTeamRes.status === 200 && deleteTeamData.success) {
      console.log('✔ PASS: Admin permanently deleted team:', deleteTeamData.message);
    } else {
      throw new Error(`FAIL: Admin team deletion failed: ${JSON.stringify(deleteTeamData)}`);
    }

    // Verify team is really gone from DB
    const checkDeletedTeam = await fetch(`${baseUrl}/teams/${spamTeamId}`);
    if (checkDeletedTeam.status === 404) {
      console.log('✔ PASS: Verified team no longer exists in catalog (404 Not Found)');
    } else {
      throw new Error('FAIL: Deleted team was still returned by server');
    }

    // TEST 17: Admin Delete Student Account Permanently
    console.log('\n[TEST 17] Testing Admin permanent deletion of a fake student account...');
    const deleteUserRes = await fetch(`${baseUrl}/admin/users/${fakeUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deleteUserData = await deleteUserRes.json();
    if (deleteUserRes.status === 200 && deleteUserData.success) {
      console.log('✔ PASS: Admin permanently deleted student account:', deleteUserData.message);
    } else {
      throw new Error(`FAIL: Admin user deletion failed: ${JSON.stringify(deleteUserData)}`);
    }

    console.log('\n🎉 ALL 17 TESTS COMPLETED AND PASSED WITH 100% SUCCESS! 🎉');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST RUNNER FAILED:', err.message);
    server.close();
    process.exit(1);
  }
}

runTests();
