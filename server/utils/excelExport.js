const XLSX = require('xlsx');

/**
 * Generate Excel workbook containing Team records and Student Member breakdown
 * @param {Array} teams Populated team documents
 */
const generateTeamsExcelBuffer = (teams) => {
  // Sheet 1: Teams Summary Sheet
  const teamRows = teams.map((team, index) => {
    const leader = team.leader || {};
    const members = team.members || [];

    // Filter out leader if in members, or list all members
    const memberNames = members.map((m) => m.name).join(', ');
    const memberRollNos = members.map((m) => m.rollNumber).join(', ');
    const memberDepts = [...new Set(members.map((m) => m.department))].join(', ');
    const memberYears = [...new Set(members.map((m) => m.year))].join(', ');
    const memberGenders = members.map((m) => `${m.name} (${m.gender})`).join(', ');

    const hasFemale = members.some((m) => m.gender === 'Female') || leader.gender === 'Female';
    const isSIHReady = (team.hackathon.toLowerCase().includes('sih') || team.hackathon.toLowerCase().includes('smart india'))
      ? (members.length === 6 && hasFemale ? 'YES (Complete)' : `NO (${members.length}/6 members, Female: ${hasFemale ? 'Yes' : 'Missing'})`)
      : (members.length >= team.requiredMembers ? 'Complete' : `In Progress (${members.length}/${team.requiredMembers})`);

    const requirementsStr = [
      team.requirements?.femaleRequired ? 'Female member required' : 'No gender restriction',
      team.requirements?.targetDepartment && team.requirements?.targetDepartment !== 'Any' ? `Dept: ${team.requirements.targetDepartment}` : null,
      team.requirements?.targetYear && team.requirements?.targetYear !== 'Any' ? `Year: ${team.requirements.targetYear}` : null,
      team.requirements?.otherRequirements || null,
    ].filter(Boolean).join('; ');

    return {
      'S.No': index + 1,
      'Team Name': team.teamName,
      'Hackathon': team.hackathon,
      'Problem / Domain': team.problemDomain,
      'Status': team.status.toUpperCase(),
      'Team Size': `${members.length} / ${team.requiredMembers}`,
      'Leader Name': leader.name || 'N/A',
      'Leader Roll No': leader.rollNumber || 'N/A',
      'Leader Email': leader.email || 'N/A',
      'Leader Dept': leader.department || 'N/A',
      'Leader Year': leader.year || 'N/A',
      'Leader Gender': leader.gender || 'N/A',
      'All Member Names': memberNames,
      'All Member Roll Nos': memberRollNos,
      'Departments': memberDepts,
      'Years': memberYears,
      'Genders': memberGenders,
      'Skills Needed': (team.skillsNeeded || []).join(', '),
      'Team Requirements': requirementsStr || 'None',
      'SIH Ready': isSIHReady,
      'Created Date': new Date(team.createdAt).toLocaleDateString('en-IN'),
    };
  });

  // Sheet 2: Detailed Roster by Student Member
  const memberRows = [];
  let studentCounter = 1;

  teams.forEach((team) => {
    (team.members || []).forEach((member) => {
      const isLeader = team.leader && (team.leader._id.toString() === member._id.toString() || team.leader.rollNumber === member.rollNumber);
      memberRows.push({
        'S.No': studentCounter++,
        'Team Name': team.teamName,
        'Hackathon': team.hackathon,
        'Role': isLeader ? 'Team Leader' : 'Team Member',
        'Student Name': member.name,
        'Roll Number': member.rollNumber,
        'Email': member.email,
        'Department': member.department,
        'Year': member.year,
        'Gender': member.gender,
        'Skills': (member.skills || []).join(', '),
      });
    });
  });

  const workbook = XLSX.utils.book_new();

  // Add Teams Summary Sheet
  const teamsWorksheet = XLSX.utils.json_to_sheet(teamRows);
  
  // Set automatic column widths
  const colWidths = [
    { wch: 6 },  // S.No
    { wch: 22 }, // Team Name
    { wch: 24 }, // Hackathon
    { wch: 24 }, // Problem/Domain
    { wch: 12 }, // Status
    { wch: 12 }, // Team Size
    { wch: 20 }, // Leader Name
    { wch: 16 }, // Leader Roll No
    { wch: 26 }, // Leader Email
    { wch: 14 }, // Leader Dept
    { wch: 14 }, // Leader Year
    { wch: 14 }, // Leader Gender
    { wch: 35 }, // Member Names
    { wch: 35 }, // Member Roll Nos
    { wch: 20 }, // Depts
    { wch: 18 }, // Years
    { wch: 30 }, // Genders
    { wch: 25 }, // Skills Needed
    { wch: 35 }, // Team Requirements
    { wch: 20 }, // SIH Ready
    { wch: 14 }, // Created Date
  ];
  teamsWorksheet['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(workbook, teamsWorksheet, 'Teams Overview');

  // Add Member Directory Sheet
  if (memberRows.length > 0) {
    const memberWorksheet = XLSX.utils.json_to_sheet(memberRows);
    memberWorksheet['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 24 },
      { wch: 15 },
      { wch: 22 },
      { wch: 16 },
      { wch: 26 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(workbook, memberWorksheet, 'Student Members Roster');
  }

  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return excelBuffer;
};

module.exports = { generateTeamsExcelBuffer };
