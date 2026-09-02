import React, { useState } from 'react';
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

function MainApp() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [activePage, setActivePage] = useState('home');
  const [selectedTeamId, setSelectedTeamId] = useState(null);

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

  const handleSelectTeam = (team) => {
    setSelectedTeamId(team._id || team);
    setActivePage('team-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTriggerRequest = (team) => {
    if (!isAuthenticated) {
      showToast('Please sign in with your NBKRIST account to send a join request.');
      setActivePage('login');
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

      {/* Navigation */}
      <Navbar activePage={activePage} setActivePage={setActivePage} />

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
