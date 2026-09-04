import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SIHBadge({ team }) {
  if (!team) return null;

  const isSIH =
    team.hackathon?.toLowerCase().includes('sih') ||
    team.hackathon?.toLowerCase().includes('smart india');

  const members = team.members || [];
  const leader = team.leader || {};

  // Check if female teammate is present
  const hasFemale =
    leader.gender === 'Female' ||
    members.some((m) => m && m.gender === 'Female');

  const isFull = members.length >= (team.requiredMembers || 6);

  if (!isSIH) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        {team.hackathon}
      </span>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
        SIH 2026
      </span>

      {hasFemale ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Female rule met</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200/80">
          <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
          <span>Female teammate needed</span>
        </span>
      )}

      {isFull && hasFemale && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 text-white">
          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>SIH Qualified</span>
        </span>
      )}
    </div>
  );
}
