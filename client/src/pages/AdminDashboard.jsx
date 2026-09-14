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
  Crown,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flag,
  FlagOff,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import SIHBadge from '../components/SIHBadge';

function PaginationBar({ currentPage, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalPages <= 1) return null;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-600">
      <div>
        Showing <span className="font-semibold text-slate-800">{startItem}</span> to{' '}
        <span className="font-semibold text-slate-800">{endItem}</span> of{' '}
        <span className="font-semibold text-slate-800">{totalItems}</span> records
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 font-medium text-xs shadow-2xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>
        <span className="px-2.5 font-medium text-slate-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 font-medium text-xs shadow-2xs"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard({ onSelectTeam, onSuccess, setActivePage }) {
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('teams');

  // Pagination states
  const [teamPage, setTeamPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);
  const [appPage, setAppPage] = useState(1);
  const pageSize = 10;

  // Filter & Search states
  const [teamSearch, setTeamSearch] = useState('');
  const [teamHackathon, setTeamHackathon] = useState('All');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDept, setStudentDept] = useState('All');
  const [appSearch, setAppSearch] = useState('');
  const [appStatus, setAppStatus] = useState('All');

  // Inspector Modal State
  const [inspectingTeam, setInspectingTeam] = useState(null);

  // Flag Modal State
  const [flagModal, setFlagModal] = useState({
    isOpen: false,
    type: 'user', // 'user' or 'team'
    item: null,
    reason: '',
    submitting: false,
  });

  const handleOpenFlagModal = (type, item) => {
    setFlagModal({
      isOpen: true,
      type,
      item,
      reason: '',
      submitting: false,
    });
  };

  const handleConfirmFlag = async () => {
    if (!flagModal.item) return;
    const { type, item, reason } = flagModal;
    const trimmedReason = reason.trim() || 'Flagged by coordinator for verification';

    setFlagModal((prev) => ({ ...prev, submitting: true }));

    try {
      if (type === 'user') {
        const res = await api.put(`/admin/users/${item._id}/flag`, {
          isFlagged: true,
          reason: trimmedReason,
        });
        if (res.data?.success) {
          setStudents((prev) =>
            prev.map((s) => (s._id === item._id ? { ...s, isFlagged: true, flagReason: trimmedReason } : s))
          );
          onSuccess && onSuccess(`Student ${item.name} has been flagged: "${trimmedReason}"`);
        }
      } else {
        const res = await api.put(`/admin/teams/${item._id}/flag`, {
          isFlagged: true,
          reason: trimmedReason,
        });
        if (res.data?.success) {
          setTeams((prev) =>
            prev.map((t) => (t._id === item._id ? { ...t, isFlagged: true, flagReason: trimmedReason } : t))
          );
          if (inspectingTeam && inspectingTeam._id === item._id) {
            setInspectingTeam((prev) => ({ ...prev, isFlagged: true, flagReason: trimmedReason }));
          }
          onSuccess && onSuccess(`Team "${item.teamName}" has been flagged: "${trimmedReason}"`);
        }
      }
      setFlagModal({ isOpen: false, type: 'user', item: null, reason: '', submitting: false });
    } catch (err) {
      alert(err.message || 'Failed to flag item');
      setFlagModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleUnflag = async (type, item) => {
    const confirmText =
      type === 'user'
        ? `Unflag student ${item.name} and restore their account to good standing?`
        : `Unflag team "${item.teamName}" and remove restrictions?`;

    if (!window.confirm(confirmText)) return;

    try {
      if (type === 'user') {
        const res = await api.put(`/admin/users/${item._id}/flag`, { isFlagged: false });
        if (res.data?.success) {
          setStudents((prev) =>
            prev.map((s) => (s._id === item._id ? { ...s, isFlagged: false, flagReason: '' } : s))
          );
          onSuccess && onSuccess(`Student ${item.name} has been unflagged.`);
        }
      } else {
        const res = await api.put(`/admin/teams/${item._id}/flag`, { isFlagged: false });
        if (res.data?.success) {
          setTeams((prev) =>
            prev.map((t) => (t._id === item._id ? { ...t, isFlagged: false, flagReason: '' } : t))
          );
          if (inspectingTeam && inspectingTeam._id === item._id) {
            setInspectingTeam((prev) => ({ ...prev, isFlagged: false, flagReason: '' }));
          }
          onSuccess && onSuccess(`Team "${item.teamName}" has been unflagged.`);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to unflag item');
    }
  };

  const handleDeleteTeam = async (team) => {
    const confirmText = `Are you sure you want to PERMANENTLY DELETE team "${team.teamName}"?\n\nThis will remove the team, free up all member slots, and delete all associated applications. This action cannot be undone.`;
    if (!window.confirm(confirmText)) return;

    try {
      const res = await api.delete(`/admin/teams/${team._id}`);
      if (res.data?.success) {
        setTeams((prev) => prev.filter((t) => t._id !== team._id));
        setApplications((prev) => prev.filter((a) => a.team?._id !== team._id));
        if (inspectingTeam && inspectingTeam._id === team._id) {
          setInspectingTeam(null);
        }
        onSuccess && onSuccess(`Team "${team.teamName}" was permanently deleted.`);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete team');
    }
  };

  const handleDeleteStudent = async (student) => {
    const confirmText = `Are you sure you want to PERMANENTLY DELETE student ${student.name} (${student.rollNumber})?\n\nThis will remove their user account, memberships, and applications from the system. This action cannot be undone.`;
    if (!window.confirm(confirmText)) return;

    try {
      const res = await api.delete(`/admin/users/${student._id}`);
      if (res.data?.success) {
        setStudents((prev) => prev.filter((s) => s._id !== student._id));
        setApplications((prev) => prev.filter((a) => a.student?._id !== student._id));
        onSuccess && onSuccess(`Student ${student.name} was permanently deleted.`);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete student');
    }
  };

  const handleDeleteApplication = async (app) => {
    const confirmText = `Are you sure you want to delete this application record by ${app.student?.name || 'student'} for "${app.team?.teamName || 'team'}"?`;
    if (!window.confirm(confirmText)) return;

    try {
      const res = await api.delete(`/admin/applications/${app._id}`);
      if (res.data?.success) {
        setApplications((prev) => prev.filter((a) => a._id !== app._id));
        onSuccess && onSuccess('Application record deleted.');
      }
    } catch (err) {
      alert(err.message || 'Failed to delete application');
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, teamsRes, studentsRes, applicationsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/teams'),
        api.get('/admin/students'),
        api.get('/admin/applications'),
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.stats);
      if (teamsRes.data?.success) setTeams(teamsRes.data.teams || []);
      if (studentsRes.data?.success) setStudents(studentsRes.data.students || []);
      if (applicationsRes.data?.success) setApplications(applicationsRes.data.applications || []);
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

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = appStatus === 'All' || app.status?.toLowerCase() === appStatus.toLowerCase();
    const query = appSearch.toLowerCase().trim();
    if (!query) return matchesStatus;

    const studentName = app.student?.name?.toLowerCase() || '';
    const rollNumber = app.student?.rollNumber?.toLowerCase() || '';
    const email = app.student?.email?.toLowerCase() || '';
    const teamName = app.team?.teamName?.toLowerCase() || '';
    const leaderName = app.team?.leader?.name?.toLowerCase() || '';
    const domain = app.team?.problemDomain?.toLowerCase() || '';
    const message = app.message?.toLowerCase() || '';

    const matchesSearch =
      studentName.includes(query) ||
      rollNumber.includes(query) ||
      email.includes(query) ||
      teamName.includes(query) ||
      leaderName.includes(query) ||
      domain.includes(query) ||
      message.includes(query);

    return matchesStatus && matchesSearch;
  });

  const totalTeamPages = Math.ceil(filteredTeams.length / pageSize) || 1;
  const paginatedTeams = filteredTeams.slice((teamPage - 1) * pageSize, teamPage * pageSize);

  const totalStudentPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = filteredStudents.slice((studentPage - 1) * pageSize, studentPage * pageSize);

  const totalAppPages = Math.ceil(filteredApplications.length / pageSize) || 1;
  const paginatedApplications = filteredApplications.slice((appPage - 1) * pageSize, appPage * pageSize);

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
              SIH 2026 Teams
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

          <button
            onClick={() => setActiveTab('applications')}
            className={`text-left p-3.5 rounded-lg border transition-all ${
              activeTab === 'applications'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white hover:border-slate-400 border-slate-200 shadow-xs'
            }`}
          >
            <p className={`text-xl font-bold font-mono ${activeTab === 'applications' ? 'text-white' : 'text-slate-900'}`}>
              {stats.totalRequests ?? applications.length}
            </p>
            <p className={`text-[11px] font-medium mt-0.5 flex items-center justify-between ${
              activeTab === 'applications' ? 'text-slate-300' : 'text-slate-500'
            }`}>
              <span>Applications</span>
              <span className="text-[10px] font-semibold">View &rarr;</span>
            </p>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 text-xs">
        <div className="flex gap-2">
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

          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'applications'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Applications ({applications.length})</span>
          </button>
        </div>

        {/* Quick Access to New Roster & Allocation Page */}
        <button
          type="button"
          onClick={() => {
            if (setActivePage) setActivePage('admin-roster');
            else window.location.hash = '#/admin-roster';
          }}
          className="mb-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md font-semibold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          title="Open dedicated User & Team Allocation Directory with Accordion View"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Open User & Team Roster Directory &rarr;</span>
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
                onChange={(e) => {
                  setTeamSearch(e.target.value);
                  setTeamPage(1);
                }}
                placeholder="Search team name, leader, or roll no..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
              <label className="font-semibold text-slate-500">Event:</label>
              <select
                value={teamHackathon}
                onChange={(e) => {
                  setTeamHackathon(e.target.value);
                  setTeamPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none"
              >
                <option value="All">All Events</option>
                <option value="sih">Smart India Hackathon (SIH 2026)</option>
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
                  {filteredTeams.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        No registered teams match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedTeams.map((team) => {
                      const membersCount = team.members?.length || 0;
                      const maxMembers = team.requiredMembers || 6;
                      const hasFemale =
                        team.leader?.gender === 'Female' ||
                        team.members?.some((m) => m?.gender === 'Female');
                      const isSIH = team.hackathon?.toLowerCase().includes('sih');

                      return (
                        <tr key={team._id} className={`hover:bg-slate-50/60 ${team.isFlagged ? 'bg-rose-50/40' : ''}`}>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900">{team.teamName}</p>
                              {team.isFlagged && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                  Flagged
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate max-w-xs">{team.problemDomain}</p>
                            {team.isFlagged && team.flagReason && (
                              <p className="text-[10px] text-rose-700 italic mt-0.5">
                                Reason: "{team.flagReason}"
                              </p>
                            )}
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

                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              {team.isFlagged ? (
                                <button
                                  onClick={() => handleUnflag('team', team)}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold rounded text-xs transition-colors inline-flex items-center gap-1"
                                  title="Unflag and restore team"
                                >
                                  <FlagOff className="w-3 h-3 text-emerald-600" />
                                  <span>Unflag</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenFlagModal('team', team)}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium rounded text-xs transition-colors inline-flex items-center gap-1"
                                  title="Flag fake or spam team"
                                >
                                  <Flag className="w-3 h-3 text-rose-500" />
                                  <span>Flag</span>
                                </button>
                              )}

                              <button
                                onClick={() => setInspectingTeam(team)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-medium rounded text-xs transition-colors inline-flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Inspect</span>
                              </button>

                              <button
                                onClick={() => handleDeleteTeam(team)}
                                className="px-2 py-1 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-600 hover:text-rose-700 font-medium rounded text-xs transition-colors inline-flex items-center gap-1"
                                title="Permanently delete team"
                              >
                                <Trash2 className="w-3 h-3 text-rose-500" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar
              currentPage={teamPage}
              totalPages={totalTeamPages}
              totalItems={filteredTeams.length}
              pageSize={pageSize}
              onPageChange={setTeamPage}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Students Directory */}
      {activeTab === 'students' && (
        <div className="space-y-3">
          
          {/* Banner pointing to User & Team Roster Directory */}
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-950 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-indigo-950">
                  New: User & Team Allocation Directory Available
                </p>
                <p className="text-[11px] text-indigo-700">
                  Display students with their assigned teams, sort by team name and members, or view interactive team accordions with caching and pagination.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (setActivePage) setActivePage('admin-roster');
                else window.location.hash = '#/admin-roster';
              }}
              className="self-start sm:self-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold text-xs transition-colors shrink-0 shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <span>Open Roster Directory &rarr;</span>
            </button>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setStudentPage(1);
                }}
                placeholder="Search student name, roll number, email..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
              <label className="font-semibold text-slate-500">Dept:</label>
              <select
                value={studentDept}
                onChange={(e) => {
                  setStudentDept(e.target.value);
                  setStudentPage(1);
                }}
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
                    <th className="p-3">Account Standing</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-slate-500">
                        No students found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((st) => (
                      <tr key={st._id} className={`hover:bg-slate-50/60 ${st.isFlagged ? 'bg-rose-50/40' : ''}`}>
                        <td className="p-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{st.name}</span>
                            {st.isFlagged && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                Flagged
                              </span>
                            )}
                          </div>
                        </td>
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
                        <td className="p-3">
                          {st.isFlagged ? (
                            <div className="space-y-0.5 max-w-[170px]">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                Restricted
                              </span>
                              {st.flagReason && (
                                <p className="text-[10px] text-rose-700 italic truncate" title={st.flagReason}>
                                  "{st.flagReason}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Good Standing
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {st.isFlagged ? (
                              <button
                                onClick={() => handleUnflag('user', st)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold rounded text-xs transition-colors inline-flex items-center gap-1"
                                title="Unflag student and restore account access"
                              >
                                <FlagOff className="w-3 h-3 text-emerald-600" />
                                <span>Unflag</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenFlagModal('user', st)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium rounded text-xs transition-colors inline-flex items-center gap-1"
                                title="Flag as fake roll number or unverified account"
                              >
                                <Flag className="w-3 h-3 text-rose-500" />
                                <span>Flag Fake</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteStudent(st)}
                              className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-600 hover:text-rose-700 font-medium rounded text-xs transition-colors inline-flex items-center gap-1"
                              title="Permanently delete student account"
                            >
                              <Trash2 className="w-3 h-3 text-rose-500" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar
              currentPage={studentPage}
              totalPages={totalStudentPages}
              totalItems={filteredStudents.length}
              pageSize={pageSize}
              onPageChange={setStudentPage}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Applications Management */}
      {activeTab === 'applications' && (
        <div className="space-y-3">
          
          {/* Controls Bar */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={appSearch}
                onChange={(e) => {
                  setAppSearch(e.target.value);
                  setAppPage(1);
                }}
                placeholder="Search applicant name, roll number, team..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-slate-800"
              />
            </div>

            {/* Quick Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Status:</span>
              <button
                onClick={() => {
                  setAppStatus('All');
                  setAppPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  appStatus === 'All'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                All ({applications.length})
              </button>
              <button
                onClick={() => {
                  setAppStatus('pending');
                  setAppPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                  appStatus === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60'
                }`}
              >
                <Clock className="w-3 h-3" />
                Pending ({applications.filter((a) => a.status === 'pending').length})
              </button>
              <button
                onClick={() => {
                  setAppStatus('accepted');
                  setAppPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                  appStatus === 'accepted'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                Accepted ({applications.filter((a) => a.status === 'accepted').length})
              </button>
              <button
                onClick={() => {
                  setAppStatus('rejected');
                  setAppPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                  appStatus === 'rejected'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/60'
                }`}
              >
                <XCircle className="w-3 h-3" />
                Rejected ({applications.filter((a) => a.status === 'rejected').length})
              </button>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {filteredApplications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No applications found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {appSearch || appStatus !== 'All'
                    ? 'No join requests match your current search or status filter.'
                    : 'No students have applied to join any teams yet.'}
                </p>
                {(appSearch || appStatus !== 'All') && (
                  <button
                    onClick={() => {
                      setAppSearch('');
                      setAppStatus('All');
                    }}
                    className="mt-3 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3">Applicant / Member</th>
                      <th className="p-3">Target Team</th>
                      <th className="p-3">Application Note</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Applied On</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedApplications.map((app) => {
                      const student = app.student;
                      const team = app.team;
                      const status = app.status || 'pending';

                      return (
                        <tr key={app._id} className="hover:bg-slate-50/60 transition-colors">
                          
                          {/* 1. Applicant / Member Details */}
                          <td className="p-3">
                            {student ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-900 text-xs">
                                    {student.name}
                                  </span>
                                  {student.gender && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                      {student.gender}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2">
                                  <span className="font-mono font-semibold text-slate-700">
                                    {student.rollNumber || 'No Roll #'}
                                  </span>
                                  <span>•</span>
                                  <span>{student.department || 'N/A'} ({student.year || 'N/A'})</span>
                                </div>
                                <p className="text-[11px] font-mono text-slate-400">
                                  {student.email}
                                </p>
                                {student.skills && student.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1 max-w-xs">
                                    {student.skills.slice(0, 3).map((skill, i) => (
                                      <span
                                        key={i}
                                        className="text-[9px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 border border-slate-200 font-medium"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                    {student.skills.length > 3 && (
                                      <span className="text-[9px] text-slate-400 self-center">
                                        +{student.skills.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Student profile unavailable</span>
                            )}
                          </td>

                          {/* 2. Target Team Info */}
                          <td className="p-3">
                            {team ? (
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                                  {team.teamName}
                                  {team.hackathon && (
                                    <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                      {team.hackathon}
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">
                                  {team.problemDomain || 'General'}
                                </p>
                                <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                                  <span className="text-slate-400">Lead:</span>
                                  <span className="font-medium text-slate-800">
                                    {team.leader?.name || 'N/A'}
                                  </span>
                                  {team.leader?.rollNumber && (
                                    <span className="font-mono text-[10px] text-slate-400">
                                      ({team.leader.rollNumber})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                  <span>
                                    Roster: <strong className="font-mono text-slate-700">{team.members?.length || 0}/{team.requiredMembers || 6}</strong>
                                  </span>
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-medium capitalize ${
                                    team.status === 'full'
                                      ? 'bg-slate-100 text-slate-600'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {team.status || 'open'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Team details unavailable</span>
                            )}
                          </td>

                          {/* 3. Applicant Message / Pitch */}
                          <td className="p-3 max-w-xs">
                            {app.message ? (
                              <div className="bg-slate-50 p-2 rounded-md border border-slate-200/80 text-[11px] text-slate-700 space-y-1">
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>Applicant Note</span>
                                </div>
                                <p className="italic line-clamp-3 text-slate-600">
                                  "{app.message}"
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">
                                No personal message attached
                              </span>
                            )}
                          </td>

                          {/* 4. Status Badge */}
                          <td className="p-3">
                            {status === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending</span>
                              </span>
                            )}
                            {status === 'accepted' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Accepted</span>
                              </span>
                            )}
                            {status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </td>

                          {/* 5. Applied On Date */}
                          <td className="p-3 text-slate-600 whitespace-nowrap">
                            <span className="block font-medium text-slate-800">
                              {app.createdAt
                                ? new Date(app.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </span>
                            <span className="block text-[11px] text-slate-400 font-mono">
                              {app.createdAt
                                ? new Date(app.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </td>

                          {/* 6. Quick Actions */}
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              {team && (
                                <button
                                  onClick={() => setInspectingTeam(team)}
                                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-medium rounded text-xs transition-colors inline-flex items-center gap-1"
                                  title="Inspect Team Details"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Inspect</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteApplication(app)}
                                className="px-2 py-1 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-600 hover:text-rose-700 font-medium rounded text-xs transition-colors inline-flex items-center gap-1"
                                title="Delete application record"
                              >
                                <Trash2 className="w-3 h-3 text-rose-500" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <PaginationBar
              currentPage={appPage}
              totalPages={totalAppPages}
              totalItems={filteredApplications.length}
              pageSize={pageSize}
              onPageChange={setAppPage}
            />
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
              
              {/* Flag Warning Banner */}
              {inspectingTeam.isFlagged && (
                <div className="bg-rose-50 border border-rose-300 rounded-lg p-3 text-rose-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-rose-800 uppercase tracking-wide">
                        Flagged Fake / Restricted Team
                      </strong>
                      <span className="text-[10px] text-rose-600 font-medium">
                        {inspectingTeam.flaggedAt ? new Date(inspectingTeam.flaggedAt).toLocaleDateString() : 'Active Restriction'}
                      </span>
                    </div>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Reason: <span className="font-semibold">{inspectingTeam.flagReason || 'Flagged by coordinator'}</span>
                    </p>
                    <p className="text-[11px] text-rose-600 mt-1">
                      This team is restricted from accepting new members or receiving applications until unflagged.
                    </p>
                  </div>
                </div>
              )}

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

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {inspectingTeam.isFlagged ? (
                  <button
                    onClick={() => handleUnflag('team', inspectingTeam)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold rounded-md text-xs transition-colors inline-flex items-center gap-1.5"
                    title="Unflag and restore team"
                  >
                    <FlagOff className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Unflag Team</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenFlagModal('team', inspectingTeam)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold rounded-md text-xs transition-colors inline-flex items-center gap-1.5"
                    title="Flag fake or spam team"
                  >
                    <Flag className="w-3.5 h-3.5 text-rose-500" />
                    <span>Flag Team</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteTeam(inspectingTeam)}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 font-semibold rounded-md text-xs transition-colors inline-flex items-center gap-1.5"
                  title="Permanently delete team"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Team</span>
                </button>
              </div>
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

      {/* Flag / Moderation Action Modal */}
      {flagModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden">
            
            <div className="px-5 py-3.5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-100 rounded-lg text-rose-600">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {flagModal.type === 'user' ? 'Flag Student Account' : 'Flag Team Registration'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Coordinator Moderation & Quality Control
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFlagModal({ isOpen: false, type: 'user', item: null, reason: '', submitting: false })}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              {/* Target info card */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Target Entity
                </span>
                <div className="font-semibold text-slate-800 text-sm">
                  {flagModal.type === 'user' ? flagModal.item?.name : flagModal.item?.teamName}
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  {flagModal.type === 'user'
                    ? `Roll No: ${flagModal.item?.rollNumber} • Dept: ${flagModal.item?.department}`
                    : `Hackathon: ${flagModal.item?.hackathon} • Leader: ${flagModal.item?.leader?.name || 'N/A'}`}
                </div>
              </div>

              {/* Consequence warning */}
              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 flex items-start gap-2 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Flagged accounts will immediately see an official warning upon login explaining this reason and won't be able to create teams or submit join requests until unflagged.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block text-[11px]">
                  Quick Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(flagModal.type === 'user'
                    ? [
                        'Fake Roll Number',
                        'Unverified Student Identity',
                        'Misleading Skills / Experience',
                        'Code of Conduct Violation',
                        'Duplicate Account'
                      ]
                    : [
                        'Fake / Spam Team',
                        'Duplicate Registration',
                        'Invalid Hackathon Selection',
                        'Inappropriate Team Name',
                        'Inactive / Ghost Team'
                      ]
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFlagModal((prev) => ({ ...prev, reason: preset }))}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-200 text-[11px] text-slate-600 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason Textarea */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block text-[11px]">
                  Specific Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={flagModal.reason}
                  onChange={(e) => setFlagModal((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explain why this student or team is being flagged (displayed directly to them upon login)..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setFlagModal({ isOpen: false, type: 'user', item: null, reason: '', submitting: false })}
                disabled={flagModal.submitting}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFlag}
                disabled={flagModal.submitting}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flagModal.submitting ? 'Applying Flag...' : 'Confirm & Apply Flag'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
