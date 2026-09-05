import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Users,
  PlusCircle,
  ShieldCheck,
  User,
  LogOut,
  Menu,
  X,
  Layers,
  Bell,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { user, isAuthenticated, isAdmin, logout, isFlagged, isTeamFlagged } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setPendingCount(0);
      return;
    }

    const checkPending = async () => {
      try {
        const teamsRes = await api.get('/teams/my-teams');
        if (teamsRes.data?.success) {
          const lead = teamsRes.data.leadingTeams || [];
          let total = 0;
          for (const t of lead) {
            try {
              const reqRes = await api.get(`/requests/team/${t._id}`);
              if (reqRes.data?.success) {
                const pending = (reqRes.data.requests || []).filter((r) => r.status === 'pending');
                total += pending.length;
              }
            } catch (e) {}
          }
          setPendingCount(total);
        }
      } catch (err) {
        // silent catch
      }
    };

    checkPending();
  }, [isAuthenticated, activePage]);

  const handleNav = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & College Identity */}
          <div
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0">
              <Users className="w-4 h-4 text-slate-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                  TeamFinder
                </span>
                <span className="text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                  SIH 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none">
                NBKRIST Collaboration Portal
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            <button
              onClick={() => handleNav('home')}
              className={`px-3 py-1.5 rounded-md transition-colors ${activePage === 'home'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              Home
            </button>

            <button
              onClick={() => handleNav('teams')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${activePage === 'teams'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Browse Teams</span>
            </button>

            {isAuthenticated && (
              <>
                <button
                  onClick={() => handleNav('create-team')}
                  className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${activePage === 'create-team'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                  <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Create Team</span>
                </button>

                <button
                  onClick={() => handleNav('my-teams')}
                  className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${activePage === 'my-teams'
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>My Teams</span>
                  {pendingCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold bg-rose-600 text-white rounded-full leading-tight">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </>
            )}

            {isAdmin && (
              <button
                onClick={() => handleNav('admin')}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${activePage === 'admin'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                  }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Coordinator Desk</span>
              </button>
            )}

            <button
              onClick={() => window.dispatchEvent(new Event('open-help-modal'))}
              className="px-2.5 py-1.5 rounded-md text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Help & Coordinator Contact"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
              <span>Help</span>
            </button>
          </nav>

          {/* Desktop Right Side / Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {(isFlagged || isTeamFlagged) && (
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new Event('open-flag-alert'))}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 rounded-md text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                    title="Active Flag Notice - Click to view details and coordinator contact"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700 animate-bounce" />
                    <span>{isFlagged ? 'Account Flagged' : 'Team Flagged'}</span>
                  </button>
                )}

                <button
                  onClick={() => handleNav('profile')}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-md bg-slate-800 text-white flex items-center justify-center font-semibold text-[11px]">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-slate-800">
                      {user?.name?.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {user?.rollNumber}
                    </p>
                  </div>
                </button>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => handleNav('login')}
                  className="px-3 py-1.5 font-semibold text-slate-700 hover:text-slate-950 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="px-3.5 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 text-sm">
          <button
            onClick={() => handleNav('home')}
            className={`w-full text-left px-3 py-2 rounded-md font-medium ${activePage === 'home' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
              }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('teams')}
            className={`w-full text-left px-3 py-2 rounded-md font-medium ${activePage === 'teams' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
              }`}
          >
            Browse Teams
          </button>
          {isAuthenticated && (
            <>
              <button
                onClick={() => handleNav('create-team')}
                className={`w-full text-left px-3 py-2 rounded-md font-medium ${activePage === 'create-team' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
                  }`}
              >
                Create Team
              </button>
              <button
                onClick={() => handleNav('my-teams')}
                className={`w-full text-left px-3 py-2 rounded-md font-medium flex items-center justify-between ${activePage === 'my-teams' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
                  }`}
              >
                <span>My Teams & Requests</span>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-rose-600 text-white rounded-full">
                    {pendingCount} pending
                  </span>
                )}
              </button>
              <button
                onClick={() => handleNav('profile')}
                className={`w-full text-left px-3 py-2 rounded-md font-medium ${activePage === 'profile' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
                  }`}
              >
                My Profile ({user?.rollNumber})
              </button>

              {(isFlagged || isTeamFlagged) && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.dispatchEvent(new Event('open-flag-alert'));
                  }}
                  className="w-full text-left px-3 py-2 rounded-md font-bold bg-amber-100 border border-amber-300 text-amber-900 flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{isFlagged ? 'Account Flagged — View Notice' : 'Team Flagged — View Notice & Contact'}</span>
                </button>
              )}
            </>
          )}
          {isAdmin && (
            <button
              onClick={() => handleNav('admin')}
              className="w-full text-left px-3 py-2 rounded-md font-semibold text-white bg-slate-900 mt-1"
            >
              Coordinator Desk
            </button>
          )}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              window.dispatchEvent(new Event('open-help-modal'));
            }}
            className="w-full text-left px-3 py-2 rounded-md font-medium text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 mt-1"
          >
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            <span>Help Desk & Contact Info</span>
          </button>
          <div className="pt-3 mt-2 border-t border-slate-100">
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium text-rose-700 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleNav('login')}
                  className="w-full text-center px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-md"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNav('register')}
                  className="w-full text-center px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
