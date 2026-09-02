import React, { useState, useEffect } from 'react';
import api from '../services/api';
import SIHBadge from '../components/SIHBadge';
import { 
  ArrowLeft, 
  Crown, 
  Users, 
  Mail, 
  AlertCircle,
  Send,
  Trash2,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TeamDetails({ teamId, onBack, onRequestJoin, setActivePage, onSuccess }) {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/teams/${teamId}`);
      if (res.data?.success) {
        setTeam(res.data.team);
      }
    } catch (err) {
      setError(err.message || 'Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) fetchTeam();
  }, [teamId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-32" />
        <div className="h-44 bg-slate-200 rounded-xl" />
        <div className="h-56 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">{error || 'Team not found'}</h2>
        <button
          onClick={onBack}
          className="px-3.5 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold"
        >
          Back to Teams
        </button>
      </div>
    );
  }

  const isLeader = user && team.leader?._id?.toString() === user._id?.toString();
  const isMember = user && team.members?.some((m) => m._id?.toString() === user._id?.toString());
  const isFull = team.members?.length >= (team.requiredMembers || 6);

  const handleDeleteTeam = async () => {
    if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await api.delete(`/teams/${team._id}`);
      if (res.data?.success) {
        onSuccess && onSuccess('Team deleted successfully');
        onBack();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete team');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-950 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Team Directory</span>
      </button>

      {/* Main Team Banner Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-5">
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <SIHBadge team={team} />
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                isFull
                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
              }`}>
                {team.status === 'full' ? 'Team Full' : 'Open for Teammates'}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              {team.teamName}
            </h1>
            <p className="text-xs font-semibold text-slate-600">
              Domain / Theme: <span className="text-slate-900">{team.problemDomain}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isLeader ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePage('my-teams')}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                >
                  Manage Roster & Requests
                </button>
                <button
                  onClick={handleDeleteTeam}
                  disabled={deleteLoading}
                  className="p-2 text-rose-700 hover:bg-rose-50 border border-slate-200 rounded-md transition-colors"
                  title="Delete Team"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : !isMember && !isFull ? (
              <button
                onClick={() => onRequestJoin(team)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Request to Join</span>
              </button>
            ) : isMember ? (
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>You are a team member</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-xs font-medium">
                Team Full
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {team.description && (
          <div className="space-y-1">
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Project Description:
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/70">
              {team.description}
            </p>
          </div>
        )}

        {/* Requirements & Target Roles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          
          <div className="bg-slate-50/70 rounded-lg p-3.5 border border-slate-200/70 space-y-2">
            <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              Required Skills:
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {team.skillsNeeded?.length > 0 ? (
                team.skillsNeeded.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-white text-slate-800 rounded text-xs font-medium border border-slate-200 shadow-2xs"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">Open to all tech stacks</span>
              )}
            </div>
          </div>

          <div className="bg-slate-50/70 rounded-lg p-3.5 border border-slate-200/70 space-y-2">
            <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              Eligibility & Preferences:
            </h4>
            <ul className="text-xs text-slate-600 space-y-1">
              <li className="flex items-center justify-between">
                <span>Female Teammate:</span>
                <span className={`font-semibold ${team.requirements?.femaleRequired ? 'text-purple-800' : 'text-slate-700'}`}>
                  {team.requirements?.femaleRequired ? 'Mandatory (SIH Rule)' : 'Optional'}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Target Department:</span>
                <span className="font-semibold text-slate-800">
                  {team.requirements?.targetDepartment || 'Any Department'}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Target Academic Year:</span>
                <span className="font-semibold text-slate-800">
                  {team.requirements?.targetYear || 'Any Year'}
                </span>
              </li>
              {team.requirements?.otherRequirements && (
                <li className="pt-1 text-[11px] text-slate-500 border-t border-slate-200">
                  Note: {team.requirements.otherRequirements}
                </li>
              )}
            </ul>
          </div>

        </div>

      </div>

      {/* Official Team Roster Section */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              Confirmed Team Members Roster
            </h2>
            <p className="text-xs text-slate-500">
              Verified NBKRIST student roll numbers and academic records
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md">
            {team.members?.length || 0} of {team.requiredMembers || 6} Confirmed
          </span>
        </div>

        {/* Member cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          
          {/* Leader Card */}
          {team.leader && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                  <Crown className="w-3 h-3 text-amber-700" />
                  Team Leader
                </span>
                <span className="text-[11px] text-slate-600 font-medium">
                  {team.leader.gender}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">{team.leader.name}</h4>
                <p className="text-xs font-mono font-semibold text-slate-800">{team.leader.rollNumber}</p>
                <p className="text-[11px] text-slate-500">{team.leader.department} • {team.leader.year}</p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{team.leader.email}</span>
                </p>
              </div>

              {team.leader.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-200">
                  {team.leader.skills.map((s, i) => (
                    <span key={i} className="text-[10px] bg-white px-1.5 py-0.5 rounded text-slate-700 border border-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Other Members */}
          {team.members
            ?.filter((m) => m._id?.toString() !== team.leader?._id?.toString())
            .map((member) => (
              <div key={member._id} className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    <Users className="w-3 h-3" />
                    Member
                  </span>
                  <span className="text-[11px] text-slate-600 font-medium">
                    {member.gender}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{member.name}</h4>
                  <p className="text-xs font-mono font-semibold text-slate-800">{member.rollNumber}</p>
                  <p className="text-[11px] text-slate-500">{member.department} • {member.year}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </p>
                </div>

                {member.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-200">
                    {member.skills.map((s, i) => (
                      <span key={i} className="text-[10px] bg-white px-1.5 py-0.5 rounded text-slate-700 border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

          {/* Empty Member Slots */}
          {Array.from({ length: Math.max(0, (team.requiredMembers || 6) - (team.members?.length || 0)) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-center text-slate-400 min-h-[140px]"
            >
              <Users className="w-5 h-5 mb-1 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Open Slot #{team.members?.length + i + 1}</p>
              <p className="text-[11px] text-slate-400">Available</p>
              {!isMember && !isFull && (
                <button
                  onClick={() => onRequestJoin(team)}
                  className="mt-2 text-xs font-semibold text-slate-900 hover:underline"
                >
                  Apply to join
                </button>
              )}
            </div>
          ))}

        </div>

      </div>

    </div>
  );
}
