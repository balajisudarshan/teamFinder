import React from 'react';
import SIHBadge from './SIHBadge';
import { 
  Users, 
  Crown, 
  ArrowRight, 
  Check, 
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TeamCard({ team, onSelectTeam, onRequestJoin }) {
  const { user } = useAuth();

  const membersCount = team.members?.length || 0;
  const maxMembers = team.requiredMembers || 6;
  const percentage = Math.min(Math.round((membersCount / maxMembers) * 100), 100);

  const isMember = user && team.members?.some((m) => {
    const id = m._id || m;
    return id.toString() === user._id?.toString();
  });

  const isLeader = user && (team.leader?._id || team.leader)?.toString() === user._id?.toString();
  const isFull = team.status === 'full' || membersCount >= maxMembers;

  return (
    <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs transition-all flex flex-col justify-between overflow-hidden">
      
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 
              onClick={() => onSelectTeam(team)}
              className="font-bold text-base text-slate-900 hover:text-blue-700 transition-colors cursor-pointer truncate"
              title={team.teamName}
            >
              {team.teamName}
            </h3>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              Domain: {team.problemDomain}
            </p>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${
              isFull
                ? 'bg-slate-100 text-slate-600 border border-slate-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
            }`}
          >
            {team.status === 'full' ? 'Team Full' : 'Looking for peers'}
          </span>
        </div>

        {/* Hackathon & SIH Badge */}
        <div className="pt-0.5">
          <SIHBadge team={team} />
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 space-y-3.5 flex-1 text-xs">
        
        {/* Description snippet */}
        {team.description ? (
          <p className="text-slate-600 leading-relaxed line-clamp-2">
            {team.description}
          </p>
        ) : (
          <p className="text-slate-400 italic">No description provided yet.</p>
        )}

        {/* Team Leader Box */}
        <div className="bg-slate-50/80 rounded-lg p-2.5 flex items-center justify-between border border-slate-200/70">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <Crown className="w-3.5 h-3.5 text-slate-700" />
            </div>
            <div className="truncate">
              <span className="font-semibold text-slate-800 block truncate">
                {team.leader?.name || 'Leader'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono block">
                {team.leader?.rollNumber} • {team.leader?.department}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 shrink-0 ml-2">
            Lead
          </span>
        </div>

        {/* Member Capacity Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-600 font-medium">
            <span>Roster capacity</span>
            <span className="font-mono text-slate-800 font-semibold">
              {membersCount} / {maxMembers} filled
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isFull ? 'bg-slate-500' : 'bg-slate-800'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Skills Needed */}
        {team.skillsNeeded && team.skillsNeeded.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Target Skills:
            </span>
            <div className="flex flex-wrap gap-1">
              {team.skillsNeeded.slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 bg-slate-50 text-slate-700 rounded text-[11px] border border-slate-200"
                >
                  {skill}
                </span>
              ))}
              {team.skillsNeeded.length > 4 && (
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                  +{team.skillsNeeded.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Requirement highlights */}
        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
          {team.requirements?.femaleRequired && (
            <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/80">
              Female teammate required
            </span>
          )}
          {team.requirements?.targetDepartment && team.requirements?.targetDepartment !== 'Any' && (
            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Dept: {team.requirements.targetDepartment}
            </span>
          )}
        </div>

      </div>

      {/* Card Footer Actions */}
      <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onSelectTeam(team)}
          className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1 transition-colors"
        >
          <span>Team Details</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {!isMember && !isFull && (
          <button
            onClick={() => onRequestJoin(team)}
            className="py-1.5 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors flex items-center gap-1"
          >
            <span>Request to Join</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}

        {isMember && (
          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
            <Check className="w-3 h-3" />
            {isLeader ? 'You are leader' : 'You are member'}
          </span>
        )}
      </div>

    </div>
  );
}
