import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ShieldCheck, 
  FileSpreadsheet, 
  Download, 
  Users, 
  Layers, 
  Search, 
  Eye, 
  X,
  Crown
} from 'lucide-react';
import SIHBadge from '../components/SIHBadge';

export default function AdminDashboard({ onSelectTeam, onSuccess }) {
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('teams');

  // Filter & Search states
  const [teamSearch, setTeamSearch] = useState('');
  const [teamHackathon, setTeamHackathon] = useState('All');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDept, setStudentDept] = useState('All');

  // Inspector Modal State
  const [inspectingTeam, setInspectingTeam] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, teamsRes, studentsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/teams'),
        api.get('/admin/students'),
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.stats);
      if (teamsRes.data?.success) setTeams(teamsRes.data.teams || []);
      if (studentsRes.data?.success) setStudents(studentsRes.data.students || []);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      const response = await api.get('/admin/export-excel', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `NBKRIST_SIH_Teams_Roster_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      onSuccess && onSuccess('Excel report downloaded successfully!');
    } catch (err) {
      alert(err.message || 'Failed to download Excel file');
    } finally {
      setExportLoading(false);
    }
  };

  const filteredTeams = teams.filter((t) => {
    const matchesHackathon = teamHackathon === 'All' || t.hackathon?.toLowerCase().includes(teamHackathon.toLowerCase());
    const matchesSearch =
      !teamSearch.trim() ||
      t.teamName?.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.leader?.name?.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.leader?.rollNumber?.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.problemDomain?.toLowerCase().includes(teamSearch.toLowerCase());
    return matchesHackathon && matchesSearch;
  });

  const filteredStudents = students.filter((s) => {
    const matchesDept = studentDept === 'All' || s.department === studentDept;
    const matchesSearch =
      !studentSearch.trim() ||
      s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(studentSearch.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header & Export Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 text-white flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Faculty Coordinator Console
            </span>
            <span className="text-xs text-slate-500">• N.B.K.R.I.S.T. Official Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            SIH & Hackathon Administration
          </h1>
          <p className="text-xs text-slate-500">
            Monitor institutional teams, audit member roll numbers, and generate SIH official Excel rosters
          </p>
        </div>

        {/* Excel Export Button */}
        <button
          onClick={handleExportExcel}
          disabled={exportLoading || teams.length === 0}
          className="self-start md:self-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{exportLoading ? 'Generating Sheet...' : 'Export to Excel (.xlsx)'}</span>
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <p className="text-xl font-bold text-slate-900 font-mono">
              {stats.totalStudents}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Registered Students
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <p className="text-xl font-bold text-slate-900 font-mono">
              {stats.totalTeams}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Total Teams
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <p className="text-xl font-bold text-slate-900 font-mono">
              {stats.sihTeams}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              SIH 2025 Teams
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <p className="text-xl font-bold text-emerald-800 font-mono">
              {stats.openTeams}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Recruiting Teams
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <p className="text-xl font-bold text-slate-900 font-mono">
              {stats.fullTeams}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Full Teams
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <p className="text-xl font-bold text-slate-900 font-mono">
              {stats.totalRequests}
            </p>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Applications
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('teams')}
          className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'teams'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Registered Teams ({teams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'students'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Student Directory ({students.length})</span>
        </button>
      </div>

      {/* Tab 1: Teams Management Table */}
      {activeTab === 'teams' && (
        <div className="space-y-3">
          
          {/* Table Filters */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder="Search team name, leader, or roll no..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
              <label className="font-semibold text-slate-500">Event:</label>
              <select
                value={teamHackathon}
                onChange={(e) => setTeamHackathon(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none"
              >
                <option value="All">All Events</option>
                <option value="sih">Smart India Hackathon (SIH)</option>
                <option value="internal">NBKRIST Internal</option>
              </select>
            </div>
          </div>

          {/* Teams Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Team Name</th>
                    <th className="p-3">Hackathon</th>
                    <th className="p-3">Leader</th>
                    <th className="p-3">Roster</th>
                    <th className="p-3">SIH Compliance</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeams.map((team) => {
                    const membersCount = team.members?.length || 0;
                    const maxMembers = team.requiredMembers || 6;
                    const hasFemale =
                      team.leader?.gender === 'Female' ||
                      team.members?.some((m) => m?.gender === 'Female');
                    const isSIH = team.hackathon?.toLowerCase().includes('sih');

                    return (
                      <tr key={team._id} className="hover:bg-slate-50/60">
                        <td className="p-3">
                          <p className="font-semibold text-slate-900">{team.teamName}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">{team.problemDomain}</p>
                        </td>

                        <td className="p-3 text-slate-600 font-medium">
                          {team.hackathon}
                        </td>

                        <td className="p-3">
                          <span className="font-semibold text-slate-800 block">{team.leader?.name}</span>
                          <span className="font-mono text-[11px] text-slate-500 block">
                            {team.leader?.rollNumber}
                          </span>
                        </td>

                        <td className="p-3">
                          <span className="font-mono font-medium text-slate-800">
                            {membersCount} / {maxMembers}
                          </span>
                        </td>

                        <td className="p-3">
                          {isSIH ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                              hasFemale
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {hasFemale ? 'Female Included' : 'Missing Female'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>

                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                            team.status === 'full'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {team.status}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          <button
                            onClick={() => setInspectingTeam(team)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-medium rounded text-xs transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Students Directory */}
      {activeTab === 'students' && (
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search student name, roll number, email..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
              <label className="font-semibold text-slate-500">Dept:</label>
              <select
                value={studentDept}
                onChange={(e) => setStudentDept(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none"
              >
                <option value="All">All Departments</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="AI&DS">AI & DS</option>
                <option value="IT">IT</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Roll Number</th>
                    <th className="p-3">College Email</th>
                    <th className="p-3">Department & Year</th>
                    <th className="p-3">Gender</th>
                    <th className="p-3">Skills</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((st) => (
                    <tr key={st._id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-semibold text-slate-900">{st.name}</td>
                      <td className="p-3 font-mono text-slate-800 font-semibold">{st.rollNumber}</td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">{st.email}</td>
                      <td className="p-3 text-slate-700">{st.department} • {st.year}</td>
                      <td className="p-3 text-slate-600">{st.gender}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(st.skills || []).map((skill, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-700 border border-slate-200">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Team Inspector Modal */}
      {inspectingTeam && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-lg border border-slate-200 overflow-hidden">
            
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Official Team Audit Record
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {inspectingTeam.teamName}
                </h3>
              </div>
              <button
                onClick={() => setInspectingTeam(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Overview */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Event Target:</span>
                  <strong className="text-slate-900">{inspectingTeam.hackathon}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Problem / Domain:</span>
                  <strong className="text-slate-900">{inspectingTeam.problemDomain}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Capacity Status:</span>
                  <strong className="text-slate-900">{inspectingTeam.members?.length} / {inspectingTeam.requiredMembers} Filled</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">SIH Female Rule:</span>
                  <strong className={
                    inspectingTeam.leader?.gender === 'Female' || inspectingTeam.members?.some(m => m?.gender === 'Female')
                      ? 'text-emerald-800'
                      : 'text-amber-800'
                  }>
                    {inspectingTeam.leader?.gender === 'Female' || inspectingTeam.members?.some(m => m?.gender === 'Female')
                      ? 'Compliant (Female Included)'
                      : 'Non-compliant (Needs Female)'}
                  </strong>
                </div>
              </div>

              {/* Members Table */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Confirmed Members Roster
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 text-[11px] border-b border-slate-200 uppercase">
                      <tr>
                        <th className="p-2.5">Role</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Roll Number</th>
                        <th className="p-2.5">Dept & Year</th>
                        <th className="p-2.5">Gender</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inspectingTeam.members?.map((m) => {
                        const isLeader = m._id?.toString() === inspectingTeam.leader?._id?.toString();
                        return (
                          <tr key={m._id} className="hover:bg-slate-50">
                            <td className="p-2.5">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                isLeader ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {isLeader ? 'Leader' : 'Member'}
                              </span>
                            </td>
                            <td className="p-2.5 font-medium text-slate-900">{m.name}</td>
                            <td className="p-2.5 font-mono text-slate-800 font-semibold">{m.rollNumber}</td>
                            <td className="p-2.5 text-slate-600">{m.department} ({m.year})</td>
                            <td className="p-2.5 text-slate-600">{m.gender}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectingTeam(null)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md text-xs font-semibold"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
