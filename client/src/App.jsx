import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RequestModal from './components/RequestModal';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TeamsList from './pages/TeamsList';
import TeamDetails from './pages/TeamDetails';
import CreateTeam from './pages/CreateTeam';
import MyTeams from './pages/MyTeams';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import FlaggedAlertModal from './components/FlaggedAlertModal';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

function MainApp() {
  const { isAuthenticated, isAdmin, isFlagged, flagReason, isTeamFlagged, teamFlagReason } = useAuth();

  const parseHash = () => {
    const raw = window.location.hash.replace(/^#\/?/, '');
    if (raw.startsWith('team/')) {
      const id = raw.replace('team/', '');
      return { page: 'team-details', teamId: id };
    }
    const validPages = ['home', 'teams', 'team-details', 'create-team', 'my-teams', 'profile', 'admin', 'login', 'register'];
    if (validPages.includes(raw)) {
      return { page: raw, teamId: null };
    }
    return { page: 'home', teamId: null };
  };

  const initial = parseHash();
  const [activePage, setActivePageState] = useState(initial.page);
  const [selectedTeamId, setSelectedTeamId] = useState(initial.teamId);

  // Global Join Request Modal State
  const [requestTargetTeam, setRequestTargetTeam] = useState(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Global Toast Alert
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  const setActivePage = (page) => {
    setActivePageState(page);
    if (page !== 'team-details') {
      window.location.hash = `#/${page}`;
    }
  };

  const handleSelectTeam = (team) => {
    const id = team._id || team;
    setSelectedTeamId(id);
    setActivePageState('team-details');
    window.location.hash = `#/team/${id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseHash();
      setActivePageState(parsed.page);
      if (parsed.teamId) {
        setSelectedTeamId(parsed.teamId);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleTriggerRequest = (team) => {
    if (!isAuthenticated) {
      showToast('Please sign in with your NBKRIST account to send a join request.');
      setActivePage('login');
      return;
    }
    if (isFlagged) {
      showToast(`Action Restricted: Your account is flagged by coordinator ("${flagReason}"). Cannot apply to teams.`);
      return;
    }
    if (team?.isFlagged) {
      showToast(`This team has been flagged by coordinator: "${team.flagReason}". Applications are restricted.`);
      return;
    }
    setRequestTargetTeam(team);
    setIsRequestModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-['Inter',sans-serif]">

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-slate-100 text-xs font-medium px-4 py-2.5 rounded-lg shadow-md border border-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Flagged Alert Modal - Displayed immediately when logged in or upon action if flagged */}
      <FlaggedAlertModal />

      {/* Navigation */}
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      {/* Flagged Account Warning Banner */}
      {isAuthenticated && isFlagged && (
        <div className="bg-rose-50 border-b border-rose-300 px-4 py-3 sm:px-6 shadow-2xs">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-200/80 text-rose-800 rounded-lg shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5 text-rose-700" />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-rose-950 text-xs sm:text-sm tracking-tight">
                    ⚠️ Account Flagged by Faculty Coordinator
                  </span>
                  <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Restricted
                  </span>
                </div>
                <p className="text-xs text-rose-900">
                  <strong className="font-semibold">Coordinator Flag Reason:</strong>{' '}
                  <span className="underline decoration-rose-300 font-medium font-mono text-[11px]">
                    "{flagReason || 'Unverified student account or policy violation'}"
                  </span>
                </p>
                <p className="text-[11px] text-rose-700">
                  Your actions (creating teams, submitting join requests, accepting members) are temporarily locked until the coordinator unflags your account.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 self-start md:self-auto">
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=24kb1a0517@nbkrist.org&su=${encodeURIComponent('NBKRIST TeamFinder - Account Flag Appeal')}&body=${encodeURIComponent('Respected SIH Coordinator,\n\nMy account was flagged on the TeamFinder portal. Please review my verification details and restore my account standing.\n\nThank you.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                title="Open appeal draft in Gmail Web"
              >
                <span>Appeal to Coordinator &rarr;</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {activePage === 'home' && (
          <Home
            setActivePage={setActivePage}
            onSelectTeam={handleSelectTeam}
            onRequestJoin={handleTriggerRequest}
          />
        )}

        {activePage === 'teams' && (
          <TeamsList
            setActivePage={setActivePage}
            onSelectTeam={handleSelectTeam}
            onRequestJoin={handleTriggerRequest}
          />
        )}

        {activePage === 'team-details' && (
          <TeamDetails
            teamId={selectedTeamId}
            onBack={() => setActivePage('teams')}
            onRequestJoin={handleTriggerRequest}
            setActivePage={setActivePage}
            onSuccess={showToast}
          />
        )}

        {activePage === 'create-team' && (
          <CreateTeam
            setActivePage={setActivePage}
            onSelectTeam={handleSelectTeam}
            onSuccess={showToast}
          />
        )}

        {activePage === 'my-teams' && (
          <MyTeams
            setActivePage={setActivePage}
            onSelectTeam={handleSelectTeam}
            onSuccess={showToast}
          />
        )}

        {activePage === 'profile' && (
          <Profile onSuccess={showToast} />
        )}

        {activePage === 'admin' && (
          isAdmin ? (
            <AdminDashboard
              onSelectTeam={handleSelectTeam}
              onSuccess={showToast}
            />
          ) : (
            <div className="max-w-md mx-auto py-16 text-center space-y-3">
              <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
              <p className="text-xs text-slate-500">Administrator privileges required to view the coordinator desk.</p>
              <button
                onClick={() => setActivePage('home')}
                className="px-3.5 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold"
              >
                Return to Home
              </button>
            </div>
          )
        )}

        {activePage === 'login' && (
          <Login
            setActivePage={setActivePage}
            onSuccess={showToast}
          />
        )}

        {activePage === 'register' && (
          <Register
            setActivePage={setActivePage}
            onSuccess={showToast}
          />
        )}
      </main>

      {/* Request Modal */}
      <RequestModal
        team={requestTargetTeam}
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setRequestTargetTeam(null);
        }}
        onSuccess={showToast}
      />

      {/* Footer */}
      <Footer setActivePage={setActivePage} />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
