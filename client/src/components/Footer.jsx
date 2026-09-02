import React from 'react';
import { Users, Award, ShieldCheck } from 'lucide-react';

export default function Footer({ setActivePage }) {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: About Institution */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center">
                <Users className="w-4 h-4 text-slate-200" />
              </div>
              <span className="font-bold text-base tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
                TeamFinder • NBKRIST
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-lg text-xs">
              Official hackathon and Smart India Hackathon (SIH) student collaboration platform for N.B.K.R. Institute of Science & Technology. Built to connect students across departments, enforce official SIH team formation guidelines, and generate coordinator rosters.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified @nbkrist.org authentication
              </span>
              <span>•</span>
              <span>Vidyanagar, Andhra Pradesh</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider mb-2.5">
              Portal Sections
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => setActivePage('home')}
                  className="hover:text-white transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('teams')}
                  className="hover:text-white transition-colors"
                >
                  Browse Open Teams
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('create-team')}
                  className="hover:text-white transition-colors"
                >
                  Create a Team
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePage('my-teams')}
                  className="hover:text-white transition-colors"
                >
                  Manage My Teams
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Guidelines Summary */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider mb-2.5">
              SIH Rules Overview
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li className="flex items-start gap-1.5">
                <span className="text-slate-300 font-bold">•</span>
                <span>Teams must have exactly 6 members.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-slate-300 font-bold">•</span>
                <span>At least 1 female teammate is strictly required.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-slate-300 font-bold">•</span>
                <span>No student may join multiple teams for the same hackathon.</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-8 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} N.B.K.R. Institute of Science & Technology (Autonomous). All rights reserved.</p>
          <p>Institutional Innovation & Hackathon Collaboration Desk</p>
        </div>
      </div>
    </footer>
  );
}
