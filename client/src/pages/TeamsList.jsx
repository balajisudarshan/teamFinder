import React, { useState, useEffect } from 'react';
import api from '../services/api';
import TeamCard from '../components/TeamCard';
import { 
  Search, 
  PlusCircle, 
  RotateCcw,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TeamsList({ setActivePage, onSelectTeam, onRequestJoin }) {
  const { isAuthenticated } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [search, setSearch] = useState('');
  const [hackathon, setHackathon] = useState('All');
  const [status, setStatus] = useState('All');
  const [department, setDepartment] = useState('All');
  const [femaleReqOnly, setFemaleReqOnly] = useState(false);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (hackathon !== 'All') params.hackathon = hackathon;
      if (status !== 'All') params.status = status;
      if (department !== 'All') params.department = department;
      if (femaleReqOnly) params.genderReq = 'true';

      const res = await api.get('/teams', { params });
      if (res.data?.success) {
        setTeams(res.data.teams || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [hackathon, status, department, femaleReqOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTeams();
  };

  const handleResetFilters = () => {
    setSearch('');
    setHackathon('All');
    setStatus('All');
    setDepartment('All');
    setFemaleReqOnly(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              Browse Hackathon Teams
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {teams.length} teams
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover peer teams seeking your specific skills for SIH and institutional competitions
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setActivePage('create-team')}
            className="self-start sm:self-auto px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        )}
      </div>

      {/* Filter Control Box */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3.5">
        
        {/* Search row */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by team name, problem domain, or required skill (e.g. React, IoT, Flutter)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 text-xs">
          
          {/* Hackathon Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Hackathon
            </label>
            <select
              value={hackathon}
              onChange={(e) => setHackathon(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800"
            >
              <option value="All">All Hackathons</option>
              <option value="Smart India Hackathon (SIH)">Smart India Hackathon (SIH)</option>
              <option value="NBKRIST Internal Hackathon">NBKRIST Internal Hackathon</option>
              <option value="Open National Hackathon">Open National Hackathon</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Roster Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800"
            >
              <option value="All">All Statuses</option>
              <option value="open">Open (Recruiting)</option>
              <option value="full">Full (Roster Complete)</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Target Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-slate-800"
            >
              <option value="All">Any Department</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="AI&DS">AI & DS</option>
              <option value="IT">IT</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

        </div>

        {/* Inclusivity Filter Checkbox */}
        <div className="pt-2 border-t border-slate-100 flex items-center">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs select-none">
            <input
              type="checkbox"
              checked={femaleReqOnly}
              onChange={(e) => setFemaleReqOnly(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
            />
            <span className="text-slate-700 font-medium">
              Show only teams seeking female teammates (SIH requirement)
            </span>
          </label>
        </div>

      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-xl" />
          ))}
        </div>
      ) : teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              onSelectTeam={onSelectTeam}
              onRequestJoin={onRequestJoin}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6 space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-semibold text-slate-800 text-sm">
            No teams match the current criteria
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms, changing the department filter, or resetting all filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md"
          >
            Clear All Filters
          </button>
        </div>
      )}

    </div>
  );
}
