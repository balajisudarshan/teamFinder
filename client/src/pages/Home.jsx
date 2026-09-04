import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  Search,
  PlusCircle,
  Award
} from 'lucide-react';
import api from '../services/api';
import TeamCard from '../components/TeamCard';
import { useAuth } from '../context/AuthContext';

export default function Home({ setActivePage, onSelectTeam, onRequestJoin }) {
  const { isAuthenticated } = useAuth();
  const [featuredTeams, setFeaturedTeams] = useState([]);
  const [stats, setStats] = useState({ totalTeams: 0, openTeams: 0, sihTeams: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await api.get('/teams');
        if (res.data?.success) {
          const teams = res.data.teams || [];
          setFeaturedTeams(teams.slice(0, 3));
          
          const sih = teams.filter((t) =>
            t.hackathon?.toLowerCase().includes('sih') ||
            t.hackathon?.toLowerCase().includes('smart india')
          ).length;

          const open = teams.filter((t) => t.status === 'open').length;

          setStats({
            totalTeams: teams.length,
            openTeams: open,
            sihTeams: sih,
          });
        }
      } catch (err) {
        console.warn('Failed to load home teams:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="space-y-12 pb-14">
      
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl space-y-4">
            
            {/* College Tag */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
              <span>N.B.K.R. Institute of Science & Technology • Student Portal</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
              Find your Smart India Hackathon teammates at NBKRIST
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              Connect with skilled peers across CSE, ECE, AI&DS, EEE, and IT departments. Discover teams looking for your skills, ensure compliance with SIH female teammate requirements, and form eligible rosters.
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={() => setActivePage('teams')}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-2"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Browse Available Teams</span>
              </button>

              {isAuthenticated ? (
                <button
                  onClick={() => setActivePage('create-team')}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-md border border-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
                  <span>Create a Team</span>
                </button>
              ) : (
                <button
                  onClick={() => setActivePage('register')}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-md border border-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <span>Register with @nbkrist.org</span>
                </button>
              )}
            </div>

          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 pt-6 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <p className="text-xl font-bold text-slate-900 font-mono">
                {stats.totalTeams}
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                Total Registered Teams
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <p className="text-xl font-bold text-emerald-800 font-mono">
                {stats.openTeams}
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                Teams Recruiting Members
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <p className="text-xl font-bold text-slate-900 font-mono">
                {stats.sihTeams}
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                SIH 2026 Teams
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <p className="text-xl font-bold text-slate-900 font-mono">
                100%
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                NBKRIST Verified Students
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SIH Guidelines & Compliance Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
          
          <div className="max-w-3xl space-y-2 mb-6">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Award className="w-4 h-4 text-slate-700" />
              <span>Institutional Guidance</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              Smart India Hackathon Team Formation Guidelines
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              TeamFinder automatically checks official rules so your team is eligible for college screening and national SIH portal submission:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
                <span>6 Members per Team</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                SIH requires exactly 6 students per team including the team leader.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
                <span>Mandatory Female Teammate</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                At least 1 female student is mandatory per team for SIH qualification.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
                <span>Single Team Exclusivity</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Students cannot be registered in multiple teams for the same hackathon.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
                <span>Coordinator Excel Export</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Faculty coordinators can export full team rosters with roll numbers for verification.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Featured Open Teams Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
              Recently Formed Teams Recruiting Members
            </h2>
            <p className="text-xs text-slate-500">
              Browse projects seeking specific skills across NBKRIST
            </p>
          </div>
          <button
            onClick={() => setActivePage('teams')}
            className="text-xs font-semibold text-slate-800 hover:text-slate-950 flex items-center gap-1 transition-colors"
          >
            <span>View All ({stats.totalTeams})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 bg-slate-200 rounded-xl" />
            ))}
          </div>
        ) : featuredTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredTeams.map((team) => (
              <TeamCard
                key={team._id}
                team={team}
                onSelectTeam={onSelectTeam}
                onRequestJoin={onRequestJoin}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-xs text-slate-600">No teams created yet.</p>
            <button
              onClick={() => setActivePage('create-team')}
              className="mt-2 px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold"
            >
              Create the first team
            </button>
          </div>
        )}
      </section>

    </div>
  );
}
