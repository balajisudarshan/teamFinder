import React, { useState } from 'react';
import { Users, Award, ShieldCheck, Mail, Phone, MessageSquare, Copy, Check } from 'lucide-react';

export default function Footer({ setActivePage }) {
  const [copied, setCopied] = useState(false);
  const email = '24kb1a0517@nbkrist.org';
  const phone = '+91 96760 43817';
  const rawPhone = '9676043817';

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: About Institution */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center">
                <Users className="w-4 h-4 text-slate-200" />
              </div>
              <span className="font-bold text-base tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
                TeamFinder • NBKRIST
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Official hackathon and Smart India Hackathon (SIH) student collaboration platform for N.B.K.R. Institute of Science & Technology. Built to connect students across departments, enforce official SIH team formation guidelines, and generate coordinator rosters.
            </p>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified @nbkrist.org
              </span>
              <span>•</span>
              <span>Vidyanagar, AP</span>
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

          {/* Col 4: Coordinator & Help Support */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Help & Coordinator Desk
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Facing issues with registration, finding team members, or team status? Contact coordinator:
            </p>

            {/* Email card */}
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
                <span>Support Email</span>
                <button
                  type="button"
                  onClick={copyEmail}
                  className="hover:text-white transition-colors flex items-center gap-1"
                  title="Copy email"
                >
                  {copied ? (
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> Copied
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <Copy className="w-2.5 h-2.5" /> Copy
                    </span>
                  )}
                </button>
              </div>
              <a
                href={`mailto:${email}`}
                className="text-white hover:text-indigo-300 font-mono text-[11px] font-medium flex items-center gap-1.5 truncate"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{email}</span>
              </a>
            </div>

            {/* Phone & WhatsApp card */}
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">
                Contact Helpline
              </div>
              <div className="flex items-center justify-between">
                <a
                  href={`tel:+91${rawPhone}`}
                  className="text-white hover:text-emerald-300 font-mono text-xs font-semibold flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{phone}</span>
                </a>
                <a
                  href={`https://wa.me/91${rawPhone}?text=${encodeURIComponent('Hello Coordinator, I need assistance on NBKRIST TeamFinder.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-600/40 text-[10px] font-semibold hover:bg-emerald-900 transition-colors flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  WhatsApp
                </a>
              </div>
            </div>

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
