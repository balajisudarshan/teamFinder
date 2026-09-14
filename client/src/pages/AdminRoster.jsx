import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import {
  Users,
  Layers,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Crown,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Filter,
  Eye,
  X,
  Mail,
  Sparkles,
  ExternalLink,
  Flag,
  FlagOff,
  UserX,
  UserCheck,
  Award,
  Layers3,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import SIHBadge from '../components/SIHBadge';

const CACHE_KEY = 'nbkrist_admin_roster_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function PaginationBar({ currentPage, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange }) {
  if (totalItems === 0) return null;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-white px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 rounded-b-xl shadow-2xs">
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="font-semibold text-slate-900">{startItem}</strong> to{' '}
          <strong className="font-semibold text-slate-900">{endItem}</strong> of{' '}
          <strong className="font-semibold text-slate-900">{totalItems}</strong> records
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
            <span className="text-slate-400 text-[11px]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-700 focus:outline-none focus:border-slate-800"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 font-medium text-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>

        <div className="hidden sm:flex items-center gap-1 px-1">
          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span key={`ell-${idx}`} className="px-1.5 text-slate-400">...</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                  currentPage === p
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <span className="sm:hidden px-2 font-medium text-slate-700">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1 font-medium text-xs"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function AdminRoster({ onSelectTeam, onSuccess, setActivePage }) {
  // Data states
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [cachedTime, setCachedTime] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);

  // View Mode: 'teams' (Team-wise Accordion) vs 'users' (Users List)
  const [viewMode, setViewMode] = useState('teams');

  // Accordion open/close state (Set of team IDs)
  const [expandedTeams, setExpandedTeams] = useState(new Set());
  const [isUnassignedExpanded, setIsUnassignedExpanded] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [allocationFilter, setAllocationFilter] = useState('All'); // 'All' | 'assigned' | 'unassigned'
  const [hackathonFilter, setHackathonFilter] = useState('All'); // 'All' | 'sih' | 'internal'

  // Sorting state
  // For teams: 'team-asc' | 'team-desc' | 'members-desc' | 'members-asc' | 'status-recruiting' | 'status-full'
  // For users: 'name-asc' | 'name-desc' | 'roll-asc' | 'team-asc' | 'team-desc' | 'unassigned-first' | 'dept-asc'
  const [teamSort, setTeamSort] = useState('team-asc');
  const [userSort, setUserSort] = useState('team-asc');

  // Pagination states
  const [teamPage, setTeamPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [inspectingTeam, setInspectingTeam] = useState(null);
  const [flagModal, setFlagModal] = useState({
    isOpen: false,
    user: null,
    reason: '',
    submitting: false,
  });

  // Load from sessionStorage cache or fetch live data
  const loadRosterData = async (forceRefresh = false) => {
    if (!forceRefresh) {
      try {
        const cachedRaw = sessionStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          const age = Date.now() - (parsed.timestamp || 0);
          if (age < CACHE_TTL && parsed.teams && parsed.students) {
            setTeams(parsed.teams);
            setStudents(parsed.students);
            setStats(parsed.stats);
            setCachedTime(new Date(parsed.timestamp));
            setIsFromCache(true);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Cache parse error:', e);
      }
    }

    if (forceRefresh) {
      setSyncing(true);
    } else {
      setLoading(true);
    }

    try {
      const url = forceRefresh ? '/admin/roster?refresh=true' : '/admin/roster';
      const res = await api.get(url);

      if (res.data?.success) {
        const payload = {
          stats: res.data.stats,
          teams: res.data.teams || [],
          students: res.data.students || [],
          timestamp: Date.now(),
        };

        setTeams(payload.teams);
        setStudents(payload.students);
        setStats(payload.stats);
        setCachedTime(new Date(payload.timestamp));
        setIsFromCache(false);

        // Store in sessionStorage
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
        } catch (e) {
          console.warn('Unable to write to sessionStorage:', e);
        }

        if (forceRefresh && onSuccess) {
          onSuccess('Roster synchronized with live database!');
        }
      }
    } catch (err) {
      console.error('Error fetching admin roster:', err);
      alert(err.message || 'Failed to fetch roster data');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadRosterData(false);
  }, []);

  // Accordion Toggles
  const toggleTeamAccordion = (teamId) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const expandAllTeams = () => {
    const allIds = new Set(teams.map((t) => t._id));
    setExpandedTeams(allIds);
    setIsUnassignedExpanded(true);
  };

  const collapseAllTeams = () => {
    setExpandedTeams(new Set());
    setIsUnassignedExpanded(false);
  };

  // Flag / Unflag user handlers
  const handleOpenFlagModal = (user) => {
    setFlagModal({
      isOpen: true,
      user,
      reason: '',
      submitting: false,
    });
  };

  const handleConfirmFlag = async () => {
    if (!flagModal.user) return;
    const { user, reason } = flagModal;
    const trimmed = reason.trim() || 'Flagged by coordinator for verification';
    setFlagModal((prev) => ({ ...prev, submitting: true }));

    try {
      const res = await api.put(`/admin/users/${user._id}/flag`, {
        isFlagged: true,
        reason: trimmed,
      });

      if (res.data?.success) {
        setStudents((prev) =>
          prev.map((s) => (s._id === user._id ? { ...s, isFlagged: true, flagReason: trimmed } : s))
        );
        // Clear cache
        sessionStorage.removeItem(CACHE_KEY);
        onSuccess && onSuccess(`Student ${user.name} flagged: "${trimmed}"`);
      }
      setFlagModal({ isOpen: false, user: null, reason: '', submitting: false });
    } catch (err) {
      alert(err.message || 'Failed to flag student');
      setFlagModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleUnflag = async (user) => {
    if (!window.confirm(`Unflag student ${user.name} and restore account to good standing?`)) return;

    try {
      const res = await api.put(`/admin/users/${user._id}/flag`, { isFlagged: false });
      if (res.data?.success) {
        setStudents((prev) =>
          prev.map((s) => (s._id === user._id ? { ...s, isFlagged: false, flagReason: '' } : s))
        );
        // Clear cache
        sessionStorage.removeItem(CACHE_KEY);
        onSuccess && onSuccess(`Student ${user.name} unflagged.`);
      }
    } catch (err) {
      alert(err.message || 'Failed to unflag student');
    }
  };

  // Filtered & Sorted Teams
  const filteredTeams = useMemo(() => {
    let list = [...teams];

    // Filter by hackathon
    if (hackathonFilter !== 'All') {
      list = list.filter((t) => (t.hackathon || '').toLowerCase().includes(hackathonFilter.toLowerCase()));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const teamName = (t.teamName || '').toLowerCase();
        const domain = (t.problemDomain || '').toLowerCase();
        const leadName = (t.leader?.name || '').toLowerCase();
        const leadRoll = (t.leader?.rollNumber || '').toLowerCase();
        const memberMatch = (t.members || []).some(
          (m) =>
            (m?.name || '').toLowerCase().includes(q) ||
            (m?.rollNumber || '').toLowerCase().includes(q) ||
            (m?.department || '').toLowerCase().includes(q)
        );
        return teamName.includes(q) || domain.includes(q) || leadName.includes(q) || leadRoll.includes(q) || memberMatch;
      });
    }

    // Sort teams
    list.sort((a, b) => {
      if (teamSort === 'team-asc') return (a.teamName || '').localeCompare(b.teamName || '');
      if (teamSort === 'team-desc') return (b.teamName || '').localeCompare(a.teamName || '');
      if (teamSort === 'members-desc') return (b.members?.length || 0) - (a.members?.length || 0);
      if (teamSort === 'members-asc') return (a.members?.length || 0) - (b.members?.length || 0);
      if (teamSort === 'status-recruiting') {
        const aFull = (a.members?.length || 0) >= (a.requiredMembers || 6);
        const bFull = (b.members?.length || 0) >= (b.requiredMembers || 6);
        return aFull === bFull ? 0 : aFull ? 1 : -1;
      }
      if (teamSort === 'status-full') {
        const aFull = (a.members?.length || 0) >= (a.requiredMembers || 6);
        const bFull = (b.members?.length || 0) >= (b.requiredMembers || 6);
        return aFull === bFull ? 0 : aFull ? -1 : 1;
      }
      return 0;
    });

    return list;
  }, [teams, hackathonFilter, searchQuery, teamSort]);

  // Filtered & Sorted Students
  const filteredStudents = useMemo(() => {
    let list = [...students];

    // Filter by department
    if (departmentFilter !== 'All') {
      list = list.filter((s) => s.department === departmentFilter);
    }

    // Filter by allocation
    if (allocationFilter === 'assigned') {
      list = list.filter((s) => s.isAssigned);
    } else if (allocationFilter === 'unassigned') {
      list = list.filter((s) => !s.isAssigned);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => {
        const name = (s.name || '').toLowerCase();
        const roll = (s.rollNumber || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const dept = (s.department || '').toLowerCase();
        const teamName = (s.teamName || '').toLowerCase();
        const skills = (s.skills || []).join(' ').toLowerCase();
        return name.includes(q) || roll.includes(q) || email.includes(q) || dept.includes(q) || teamName.includes(q) || skills.includes(q);
      });
    }

    // Sort students
    list.sort((a, b) => {
      if (userSort === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (userSort === 'name-desc') return (b.name || '').localeCompare(a.name || '');
      if (userSort === 'roll-asc') return (a.rollNumber || '').localeCompare(b.rollNumber || '');
      if (userSort === 'dept-asc') return (a.department || '').localeCompare(b.department || '');
      if (userSort === 'team-asc') {
        if (!a.isAssigned && !b.isAssigned) return 0;
        if (!a.isAssigned) return 1; // unassigned to the bottom
        if (!b.isAssigned) return -1;
        return (a.teamName || '').localeCompare(b.teamName || '');
      }
      if (userSort === 'team-desc') {
        if (!a.isAssigned && !b.isAssigned) return 0;
        if (!a.isAssigned) return 1;
        if (!b.isAssigned) return -1;
        return (b.teamName || '').localeCompare(a.teamName || '');
      }
      if (userSort === 'unassigned-first') {
        if (a.isAssigned === b.isAssigned) return (a.name || '').localeCompare(b.name || '');
        return a.isAssigned ? 1 : -1;
      }
      return 0;
    });

    return list;
  }, [students, departmentFilter, allocationFilter, searchQuery, userSort]);

  // Unassigned students list for separate accordion or quick reference
  const unassignedStudentsList = useMemo(() => {
    return students.filter((s) => !s.isAssigned);
  }, [students]);

  // Paginated Slices
  const totalTeamPages = Math.ceil(filteredTeams.length / pageSize) || 1;
  const paginatedTeams = useMemo(() => {
    const start = (teamPage - 1) * pageSize;
    return filteredTeams.slice(start, start + pageSize);
  }, [filteredTeams, teamPage, pageSize]);

  const totalUserPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (userPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, userPage, pageSize]);

  // Department options
  const departments = ['All', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI&DS', 'IT', 'OTHER'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-900 text-white flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Faculty Coordinator Portal
            </span>
            <span className="text-xs text-slate-500 font-medium">NBKRIST Smart India Hackathon (SIH 2026)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-2.5">
            <span>User & Team Allocation Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
            Cross-reference all enrolled NBKRIST students with their team assignments, inspect team member rosters via interactive accordions, and track unassigned students.
          </p>
        </div>

        {/* Action Buttons: Cache status, Refresh, and Link to Dashboard */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {cachedTime && (
            <div
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 flex items-center gap-1.5"
              title={`Cache timestamp: ${cachedTime.toLocaleTimeString()}`}
            >
              <span className={`w-2 h-2 rounded-full ${isFromCache ? 'bg-amber-400' : 'bg-emerald-500'}`} />
              <span>{isFromCache ? 'Cached' : 'Live'}: {cachedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}

          <button
            onClick={() => loadRosterData(true)}
            disabled={syncing}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-md shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Bust client & server cache and fetch live updates"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${syncing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          {setActivePage && (
            <button
              onClick={() => setActivePage('admin')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-slate-300" />
              <span>Coordinator Desk &rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Students</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{stats.totalStudents}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Enrolled candidates</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">In Teams</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-800 font-mono tracking-tight">{stats.assignedStudents}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">
              {Math.round((stats.assignedStudents / (stats.totalStudents || 1)) * 100)}% allocated
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Unassigned</span>
              <UserX className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-800 font-mono tracking-tight">{stats.unassignedStudents}</p>
            <p className="text-[10px] text-amber-600 mt-0.5">Seeking teams</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Teams</span>
              <Layers3 className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{stats.totalTeams}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Active projects</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">Recruiting</span>
              <Sparkles className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-800 font-mono tracking-tight">{stats.recruitingTeams}</p>
            <p className="text-[10px] text-blue-600 mt-0.5">Slots open</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700">SIH Teams</span>
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-900 font-mono tracking-tight">{stats.sihTeams}</p>
            <p className="text-[10px] text-purple-600 mt-0.5">Smart India Hackathon</p>
          </div>
        </div>
      )}

      {/* Main Controls Card: View Toggle + Search + Filters + Sorting */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
        
        {/* Row 1: View Mode Switcher and Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* View Mode Segmented Control */}
          <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold shrink-0">
            <button
              onClick={() => {
                setViewMode('teams');
                setTeamPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'teams'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Team-wise Accordion View</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                viewMode === 'teams' ? 'bg-indigo-50 text-indigo-700 font-mono' : 'bg-slate-200 text-slate-600'
              }`}>
                {teams.length}
              </span>
            </button>

            <button
              onClick={() => {
                setViewMode('users');
                setUserPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-2 cursor-pointer ${
                viewMode === 'users'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Users List View</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                viewMode === 'users' ? 'bg-emerald-50 text-emerald-700 font-mono' : 'bg-slate-200 text-slate-600'
              }`}>
                {students.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setTeamPage(1);
                setUserPage(1);
              }}
              placeholder={
                viewMode === 'teams'
                  ? 'Search by team name, problem domain, leader, roll no...'
                  : 'Search by student name, roll no, email, department, team...'
              }
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Filters and Sorting controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Department Filter (Only for Users view or global) */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Dept:</span>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setUserPage(1);
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Hackathon Event Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Event:</span>
              <select
                value={hackathonFilter}
                onChange={(e) => {
                  setHackathonFilter(e.target.value);
                  setTeamPage(1);
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none"
              >
                <option value="All">All Events</option>
                <option value="sih">Smart India Hackathon (SIH 2026)</option>
                <option value="internal">NBKRIST Internal</option>
              </select>
            </div>

            {/* Allocation Status Filter (For Users View) */}
            {viewMode === 'users' && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Allocation:</span>
                <select
                  value={allocationFilter}
                  onChange={(e) => {
                    setAllocationFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none"
                >
                  <option value="All">All Candidates</option>
                  <option value="assigned">Assigned to a Team</option>
                  <option value="unassigned">Unassigned (Free Agents)</option>
                </select>
              </div>
            )}
          </div>

          {/* Right: Sorting and Expand/Collapse Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Team View Accordion Expand/Collapse All */}
            {viewMode === 'teams' && (
              <div className="flex items-center gap-1 mr-1">
                <button
                  onClick={expandAllTeams}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAllTeams}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Collapse All
                </button>
              </div>
            )}

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Sort:</span>
              {viewMode === 'teams' ? (
                <select
                  value={teamSort}
                  onChange={(e) => {
                    setTeamSort(e.target.value);
                    setTeamPage(1);
                  }}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 font-medium focus:outline-none"
                >
                  <option value="team-asc">Team Name (A &rarr; Z)</option>
                  <option value="team-desc">Team Name (Z &rarr; A)</option>
                  <option value="members-desc">Members (Most &rarr; Least)</option>
                  <option value="members-asc">Members (Least &rarr; Most)</option>
                  <option value="status-recruiting">Recruiting Teams First</option>
                  <option value="status-full">Full Teams First</option>
                </select>
              ) : (
                <select
                  value={userSort}
                  onChange={(e) => {
                    setUserSort(e.target.value);
                    setUserPage(1);
                  }}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 font-medium focus:outline-none"
                >
                  <option value="team-asc">Team Name (A &rarr; Z, Assigned)</option>
                  <option value="team-desc">Team Name (Z &rarr; A)</option>
                  <option value="unassigned-first">Unassigned Students First</option>
                  <option value="name-asc">Student Name (A &rarr; Z)</option>
                  <option value="name-desc">Student Name (Z &rarr; A)</option>
                  <option value="roll-asc">Roll Number (Ascending)</option>
                  <option value="dept-asc">Department</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">Loading allocation directory...</p>
          <p className="text-xs text-slate-400 mt-1">Cross-referencing student roll numbers with registered teams</p>
        </div>
      ) : (
        <>
          {/* VIEW 1: Team-wise Accordion View */}
          {viewMode === 'teams' && (
            <div className="space-y-4">
              
              {/* Optional Unassigned Students Accordion Notice */}
              {unassignedStudentsList.length > 0 && allocationFilter !== 'assigned' && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl overflow-hidden transition-all shadow-2xs">
                  <div
                    onClick={() => setIsUnassignedExpanded(!isUnassignedExpanded)}
                    className="p-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-amber-100/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-amber-200 text-amber-800">
                        {isUnassignedExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-amber-950">
                            Unassigned Students Pool (Free Agents)
                          </h3>
                          <span className="px-2 py-0.2 bg-amber-200/80 text-amber-900 rounded-full text-[10px] font-bold">
                            {unassignedStudentsList.length} Students
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Students currently not enrolled in any registered team. Click to inspect or facilitate team formation.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 bg-amber-200/70 hover:bg-amber-200 text-amber-900 rounded text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                    >
                      {isUnassignedExpanded ? 'Hide Pool' : 'View Pool'}
                    </button>
                  </div>

                  {isUnassignedExpanded && (
                    <div className="border-t border-amber-200/80 p-4 bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-amber-50 text-amber-900 font-semibold border-b border-amber-200 text-[11px] uppercase tracking-wider">
                            <tr>
                              <th className="p-2.5">Student</th>
                              <th className="p-2.5">Roll Number</th>
                              <th className="p-2.5">Dept & Year</th>
                              <th className="p-2.5">Gender</th>
                              <th className="p-2.5">Email</th>
                              <th className="p-2.5">Technical Skills</th>
                              <th className="p-2.5 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {unassignedStudentsList.map((st) => (
                              <tr key={st._id} className="hover:bg-amber-50/40">
                                <td className="p-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                                      {st.name?.charAt(0) || 'S'}
                                    </div>
                                    <span className="font-semibold text-slate-800">{st.name}</span>
                                  </div>
                                </td>
                                <td className="p-2.5 font-mono text-slate-800 font-medium">{st.rollNumber}</td>
                                <td className="p-2.5 text-slate-600">{st.department} • {st.year}</td>
                                <td className="p-2.5 text-slate-600">{st.gender}</td>
                                <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                                  <a href={`mailto:${st.email}`} className="text-indigo-600 hover:underline">
                                    {st.email}
                                  </a>
                                </td>
                                <td className="p-2.5">
                                  <div className="flex flex-wrap gap-1 max-w-xs">
                                    {(st.skills || []).slice(0, 4).map((sk, idx) => (
                                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                                        {sk}
                                      </span>
                                    ))}
                                    {(st.skills || []).length > 4 && (
                                      <span className="text-[10px] text-slate-400">+{st.skills.length - 4}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-2.5 text-right">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                    Unassigned
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Teams Accordion List */}
              {filteredTeams.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
                  <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-800">No teams match your criteria</h3>
                  <p className="text-xs text-slate-500 mt-1">Try adjusting your search query, event filter, or sorting options.</p>
                  {(searchQuery || hackathonFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setHackathonFilter('All');
                      }}
                      className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedTeams.map((team) => {
                    const isExpanded = expandedTeams.has(team._id);
                    const members = team.members || [];
                    const leader = team.leader || {};
                    const reqMembers = team.requiredMembers || 6;
                    const isFull = members.length >= reqMembers;
                    const fillPercent = Math.min(100, Math.round((members.length / reqMembers) * 100));

                    return (
                      <div
                        key={team._id}
                        className={`bg-white rounded-xl border transition-all shadow-2xs ${
                          isExpanded ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Accordion Header */}
                        <div
                          onClick={() => toggleTeamAccordion(team._id)}
                          className="p-4 cursor-pointer select-none flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 transition-transform duration-200 ${
                              isExpanded ? 'bg-indigo-100 text-indigo-700 rotate-90' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <ChevronRight className="w-4 h-4" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                  {team.teamName}
                                </h3>

                                <SIHBadge team={team} />

                                {team.isFlagged && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                                    <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                    Flagged
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-600 line-clamp-1 max-w-xl">
                                <strong className="text-slate-500 font-semibold">Domain:</strong> {team.problemDomain}
                              </p>

                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="flex items-center gap-1 font-medium text-slate-700">
                                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                                  Lead: {leader.name || 'N/A'}
                                  {leader.rollNumber && (
                                    <span className="font-mono text-[11px] text-slate-400">({leader.rollNumber})</span>
                                  )}
                                </span>
                                <span>•</span>
                                <span>Dept: {leader.department || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Side: Roster Progress Pill & Actions */}
                          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                            
                            {/* Member Roster Progress Bar */}
                            <div className="text-right space-y-1">
                              <div className="flex items-center gap-2 justify-end">
                                <span className="text-xs font-bold text-slate-800 font-mono">
                                  {members.length} / {reqMembers}
                                </span>
                                <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold capitalize ${
                                  isFull
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {isFull ? 'Full Team' : 'Recruiting'}
                                </span>
                              </div>

                              <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-auto">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isFull ? 'bg-slate-900' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${fillPercent}%` }}
                                />
                              </div>
                            </div>

                            {/* Quick Inspect Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectingTeam(team);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="Inspect full team details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Accordion Body (Expanded Member Roster Table) */}
                        {isExpanded && (
                          <div className="border-t border-slate-200 bg-slate-50/50 p-4 rounded-b-xl space-y-3">
                            
                            {team.description && (
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600">
                                <p className="italic">"{team.description}"</p>
                              </div>
                            )}

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Official Team Roster ({members.length} Members)</span>
                                </h4>
                                <span className="text-[11px] text-slate-500">
                                  Target Size: {reqMembers} members • {reqMembers - members.length > 0 ? `${reqMembers - members.length} vacancy available` : 'Roster complete'}
                                </span>
                              </div>

                              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                                      <tr>
                                        <th className="p-2.5">Role</th>
                                        <th className="p-2.5">Student Name</th>
                                        <th className="p-2.5">Roll Number</th>
                                        <th className="p-2.5">Dept & Year</th>
                                        <th className="p-2.5">Gender</th>
                                        <th className="p-2.5">College Email</th>
                                        <th className="p-2.5">Skills</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {members.map((member, mIdx) => {
                                        const isLeader =
                                          member._id === leader._id ||
                                          member._id?.toString() === leader._id?.toString();

                                        return (
                                          <tr key={member._id || mIdx} className="hover:bg-slate-50">
                                            <td className="p-2.5 whitespace-nowrap">
                                              {isLeader ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                                  <Crown className="w-3 h-3 text-amber-600 shrink-0" />
                                                  <span>Team Leader</span>
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                  <span>Member #{mIdx + 1}</span>
                                                </span>
                                              )}
                                            </td>

                                            <td className="p-2.5 font-semibold text-slate-900 whitespace-nowrap">
                                              <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-md bg-slate-800 text-white flex items-center justify-center font-bold text-[10px]">
                                                  {member.name?.charAt(0) || 'M'}
                                                </div>
                                                <span>{member.name}</span>
                                              </div>
                                            </td>

                                            <td className="p-2.5 font-mono text-slate-800 font-medium whitespace-nowrap">
                                              {member.rollNumber || 'N/A'}
                                            </td>

                                            <td className="p-2.5 text-slate-600 whitespace-nowrap">
                                              {member.department || 'N/A'} • {member.year || 'N/A'}
                                            </td>

                                            <td className="p-2.5 whitespace-nowrap">
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                                member.gender === 'Female'
                                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                  : 'text-slate-600'
                                              }`}>
                                                {member.gender || 'N/A'}
                                              </span>
                                            </td>

                                            <td className="p-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                              <a
                                                href={`mailto:${member.email}`}
                                                className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                                              >
                                                <span>{member.email}</span>
                                              </a>
                                            </td>

                                            <td className="p-2.5">
                                              <div className="flex flex-wrap gap-1 max-w-xs">
                                                {(member.skills || []).slice(0, 3).map((sk, skIdx) => (
                                                  <span
                                                    key={skIdx}
                                                    className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200"
                                                  >
                                                    {sk}
                                                  </span>
                                                ))}
                                                {(member.skills || []).length > 3 && (
                                                  <span className="text-[10px] text-slate-400">
                                                    +{member.skills.length - 3}
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Team-wise Pagination */}
              <PaginationBar
                currentPage={teamPage}
                totalPages={totalTeamPages}
                totalItems={filteredTeams.length}
                pageSize={pageSize}
                onPageChange={setTeamPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}

          {/* VIEW 2: Users List View */}
          {viewMode === 'users' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              {filteredStudents.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-800">No students match your criteria</h3>
                  <p className="text-xs text-slate-500 mt-1">Try clearing your department filter, allocation toggle, or search query.</p>
                  {(searchQuery || departmentFilter !== 'All' || allocationFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setDepartmentFilter('All');
                        setAllocationFilter('All');
                      }}
                      className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
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
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Roll Number</th>
                        <th className="p-3">Dept & Year</th>
                        <th className="p-3">Gender</th>
                        <th className="p-3">College Email</th>
                        <th className="p-3 font-bold text-slate-900 bg-slate-100/80">Assigned Team & Role</th>
                        <th className="p-3">Skills</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedStudents.map((st) => {
                        const primaryTeam = st.primaryTeam;
                        const isAssigned = Boolean(st.isAssigned && primaryTeam);

                        return (
                          <tr key={st._id} className="hover:bg-slate-50/80 transition-colors">
                            
                            {/* Student Name */}
                            <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                                  {st.name?.charAt(0) || 'S'}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{st.name}</p>
                                  <p className="text-[10px] text-slate-400 font-normal">Candidate</p>
                                </div>
                              </div>
                            </td>

                            {/* Roll Number */}
                            <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                              {st.rollNumber}
                            </td>

                            {/* Department & Year */}
                            <td className="p-3 text-slate-700 whitespace-nowrap">
                              {st.department} • {st.year}
                            </td>

                            {/* Gender */}
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                st.gender === 'Female'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200 font-semibold'
                                  : 'text-slate-600'
                              }`}>
                                {st.gender}
                              </span>
                            </td>

                            {/* Email */}
                            <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                              <a href={`mailto:${st.email}`} className="text-indigo-600 hover:underline">
                                {st.email}
                              </a>
                            </td>

                            {/* Assigned Team & Role (Highlight Column) */}
                            <td className="p-3 bg-slate-50/50">
                              {isAssigned ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const fullTeam = teams.find((t) => t._id === primaryTeam.teamId);
                                        if (fullTeam) setInspectingTeam(fullTeam);
                                      }}
                                      className="font-bold text-slate-900 hover:text-indigo-600 hover:underline text-xs text-left cursor-pointer"
                                    >
                                      {primaryTeam.teamName}
                                    </button>

                                    {primaryTeam.role === 'Leader' ? (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                        <Crown className="w-2.5 h-2.5 text-amber-600" />
                                        Leader
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                        Member
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <span className="truncate max-w-[150px]" title={primaryTeam.problemDomain}>
                                      {primaryTeam.problemDomain}
                                    </span>
                                    <span>•</span>
                                    <span className="font-mono font-medium text-slate-600">
                                      {primaryTeam.memberCount}/{primaryTeam.requiredMembers}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Unassigned (Free Agent)</span>
                                </span>
                              )}
                            </td>

                            {/* Skills */}
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1 max-w-[180px]">
                                {(st.skills || []).slice(0, 3).map((sk, idx) => (
                                  <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                                    {sk}
                                  </span>
                                ))}
                                {(st.skills || []).length > 3 && (
                                  <span className="text-[10px] text-slate-400">+{st.skills.length - 3}</span>
                                )}
                              </div>
                            </td>

                            {/* Account Status */}
                            <td className="p-3 whitespace-nowrap">
                              {st.isFlagged ? (
                                <div className="space-y-0.5">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                                    <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                    Flagged
                                  </span>
                                  {st.flagReason && (
                                    <p className="text-[10px] text-rose-700 italic truncate max-w-[120px]" title={st.flagReason}>
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

                            {/* Actions */}
                            <td className="p-3 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                {isAssigned && (
                                  <button
                                    onClick={() => {
                                      const fullTeam = teams.find((t) => t._id === primaryTeam.teamId);
                                      if (fullTeam) setInspectingTeam(fullTeam);
                                    }}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                    title="View full team details"
                                  >
                                    <Eye className="w-3 h-3 text-slate-600" />
                                    <span>Team</span>
                                  </button>
                                )}

                                {st.isFlagged ? (
                                  <button
                                    onClick={() => handleUnflag(st)}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Unflag student"
                                  >
                                    <FlagOff className="w-3 h-3 text-emerald-600" />
                                    <span>Unflag</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleOpenFlagModal(st)}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Flag fake account or violation"
                                  >
                                    <Flag className="w-3 h-3 text-rose-500" />
                                    <span>Flag</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Users Pagination */}
              <PaginationBar
                currentPage={userPage}
                totalPages={totalUserPages}
                totalItems={filteredStudents.length}
                pageSize={pageSize}
                onPageChange={setUserPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </>
      )}

      {/* Modal: Team Inspector */}
      {inspectingTeam && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="sticky top-0 bg-white/95 backdrop-blur-xs border-b border-slate-200 p-4 sm:p-5 flex items-center justify-between z-10">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Team Allocation Inspector
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  {inspectingTeam.teamName}
                </h3>
              </div>
              <button
                onClick={() => setInspectingTeam(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              
              {/* Event & Diversity Badges */}
              <div>
                <SIHBadge team={inspectingTeam} />
              </div>

              {/* Problem Domain & Description */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 uppercase text-[10px]">Problem Domain:</span>
                  <p className="font-bold text-slate-800 text-sm">{inspectingTeam.problemDomain}</p>
                </div>
                {inspectingTeam.description && (
                  <div>
                    <span className="font-semibold text-slate-500 uppercase text-[10px]">Description:</span>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{inspectingTeam.description}</p>
                  </div>
                )}
              </div>

              {/* Full Roster List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Team Members ({inspectingTeam.members?.length || 0} / {inspectingTeam.requiredMembers || 6})
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="p-2.5">Role</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Roll No</th>
                        <th className="p-2.5">Dept & Year</th>
                        <th className="p-2.5">Gender</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(inspectingTeam.members || []).map((m, idx) => {
                        const isLeader = m._id === inspectingTeam.leader?._id;
                        return (
                          <tr key={m._id || idx} className="hover:bg-slate-50">
                            <td className="p-2.5">
                              {isLeader ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                                  <Crown className="w-2.5 h-2.5 text-amber-600" />
                                  Leader
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                  Member #{idx + 1}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 font-semibold text-slate-900">{m.name}</td>
                            <td className="p-2.5 font-mono text-slate-700 font-medium">{m.rollNumber}</td>
                            <td className="p-2.5 text-slate-600">{m.department} • {m.year}</td>
                            <td className="p-2.5 text-slate-600">{m.gender}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Requirements & Skills */}
              {inspectingTeam.skillsNeeded?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-500 uppercase text-[10px]">Skills In Demand:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectingTeam.skillsNeeded.map((sk, idx) => (
                      <span key={idx} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md font-medium">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-end rounded-b-2xl">
              <button
                onClick={() => setInspectingTeam(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Flag Student */}
      {flagModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Flag Student Account
                </h3>
                <p className="text-xs text-slate-500">
                  Restrict account actions for {flagModal.user?.name} ({flagModal.user?.rollNumber})
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Flag Reason:</label>
              <textarea
                value={flagModal.reason}
                onChange={(e) => setFlagModal((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. Unverified college roll number, disciplinary notice, policy violation..."
                rows={3}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-rose-600 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFlagModal({ isOpen: false, user: null, reason: '', submitting: false })}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFlag}
                disabled={flagModal.submitting}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flagModal.submitting ? 'Applying Flag...' : 'Confirm Flag'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
