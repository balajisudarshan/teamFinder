import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Crown, 
  Check, 
  X, 
  UserMinus, 
  Send,
  PlusCircle,
  Inbox,
  AlertTriangle,
  MailCheck,
  UserPlus,
  Bell,
  MessageSquare
} from 'lucide-react';
import SIHBadge from '../components/SIHBadge';
import InviteMembersModal from '../components/InviteMembersModal';

export default function MyTeams({ setActivePage, onSelectTeam, onSuccess }) {
  const { user } = useAuth();
  const [leadingTeams, setLeadingTeams] = useState([]);
  const [inviteModalTeam, setInviteModalTeam] = useState(null);
  const [memberTeams, setMemberTeams] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [teamRequests, setTeamRequests] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('leading');

  const fetchData = async () => {
    setLoading(true);
    try {
      const teamsRes = await api.get('/teams/my-teams');
      if (teamsRes.data?.success) {
        const lead = teamsRes.data.leadingTeams || [];
        setLeadingTeams(lead);
        setMemberTeams(teamsRes.data.memberTeams || []);

        const requestsMap = {};
        for (const t of lead) {
          try {
            const reqRes = await api.get(`/requests/team/${t._id}`);
            if (reqRes.data?.success) {
              requestsMap[t._id] = reqRes.data.requests || [];
            }
          } catch (e) {
            console.warn(`Failed to fetch requests for team ${t._id}`);
          }
        }
        setTeamRequests(requestsMap);
      }

      const [sentRes, invitesRes] = await Promise.all([
        api.get('/requests/my/sent').catch(() => ({ data: { requests: [] } })),
        api.get('/requests/my/invitations').catch(() => ({ data: { invitations: [] } })),
      ]);

      if (sentRes.data?.success) {
        setSentRequests(sentRes.data.requests || []);
      }
      if (invitesRes.data?.success) {
        setReceivedInvitations(invitesRes.data.invitations || []);
      }
    } catch (err) {
      console.error('Error fetching my teams data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleNotif = () => fetchData();
    window.addEventListener('team-notification', handleNotif);
    return () => window.removeEventListener('team-notification', handleNotif);
  }, []);

  const handleRespondInvitation = async (inviteId, action) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/requests/invitations/${inviteId}/respond`, { action });
      if (res.data?.success) {
        onSuccess && onSuccess(res.data.message);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || `Failed to ${action} invitation`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespondRequest = async (requestId, action, teamId) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/requests/${requestId}`, { action });
      if (res.data?.success) {
        onSuccess && onSuccess(res.data.message);
        fetchData();
      }
    } catch (err) {
      alert(err.message || `Failed to ${action} request`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (teamId, memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this team?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.delete(`/teams/${teamId}/members/${memberId}`);
      if (res.data?.success) {
        onSuccess && onSuccess(`${memberName} has been removed from the team.`);
        fetchData();
      }
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            Team Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review incoming teammate applications, audit member rosters, and check application statuses
          </p>
        </div>

        <button
          onClick={() => setActivePage('create-team')}
          className="self-start sm:self-auto px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Team</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('leading')}
          className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'leading'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>Teams I Lead ({leadingTeams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('joined')}
          className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'joined'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Member In ({memberTeams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'sent'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>My Sent Requests ({sentRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'invitations'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MailCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Team Invitations</span>
          {receivedInvitations.filter((i) => i.status === 'pending').length > 0 && (
            <span className="flex items-center gap-1.5 ml-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-indigo-600 text-white rounded-full leading-tight">
                {receivedInvitations.filter((i) => i.status === 'pending').length}
              </span>
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Teams I Lead */}
      {activeTab === 'leading' && (
        <div className="space-y-6">
          {leadingTeams.length === 0 ? (
            <div className="bg-white rounded-xl p-10 border border-slate-200 text-center space-y-2">
              <Crown className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="font-semibold text-slate-800 text-sm">You haven't created any teams yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Step up as a team leader for Smart India Hackathon. Define a problem domain and start forming your team.
              </p>
              <button
                onClick={() => setActivePage('create-team')}
                className="mt-2 px-3.5 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold"
              >
                Create Team
              </button>
            </div>
          ) : (
            leadingTeams.map((team) => {
              const requests = teamRequests[team._id] || [];
              const pendingRequests = requests.filter((r) => r.status === 'pending');
              const isFull = team.members?.length >= team.requiredMembers;

              return (
                <div
                  key={team._id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  {/* Team Top Banner */}
                  <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-700" />
                          Leader
                        </span>
                        <SIHBadge team={team} />
                      </div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {team.teamName}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Domain: <strong className="text-slate-700">{team.problemDomain}</strong> • {team.members?.length} / {team.requiredMembers} spots filled
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                      {(team.members?.length || 0) < (team.requiredMembers || 6) && (
                        <button
                          onClick={() => setInviteModalTeam(team)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Invite unallocated students to join your team"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Invite Unallocated Members &rarr;</span>
                        </button>
                      )}
                      <button
                        onClick={() => onSelectTeam(team)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium rounded-md cursor-pointer"
                      >
                        View Team Page
                      </button>
                    </div>
                  </div>

                  {team.isFlagged && (
                    <div className="mx-4 sm:mx-5 mt-4 p-3 bg-amber-50 border border-amber-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-amber-950">
                            Team Flagged: "{team.flagReason || 'Under review by faculty coordinator'}"
                          </p>
                          <p className="text-[11px] text-amber-800">
                            New join requests are blocked until unflagged. Personal student accounts remain usable.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new Event('open-flag-alert'))}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-md shadow-xs transition-colors shrink-0 cursor-pointer"
                      >
                        View Notice & Contact
                      </button>
                    </div>
                  )}

                  <div className="p-5 space-y-5">
                    
                    {/* Incoming Join Requests */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                          <span>Incoming Applications</span>
                          <span className="px-2 py-0.2 bg-slate-100 text-slate-700 rounded text-[11px] font-mono">
                            {pendingRequests.length} pending
                          </span>
                        </h3>
                      </div>

                      {pendingRequests.length === 0 ? (
                        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70 text-center text-xs text-slate-500">
                          No pending join requests for this team at the moment.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {pendingRequests.map((req) => (
                            <div
                              key={req._id}
                              className="p-3.5 bg-slate-50/70 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-900">
                                    {req.student?.name}
                                  </span>
                                  <span className="font-mono text-slate-700 font-medium bg-slate-100 px-1.5 py-0.2 rounded text-[11px]">
                                    {req.student?.rollNumber}
                                  </span>
                                  <span className="text-slate-500 text-[11px]">
                                    {req.student?.department} • {req.student?.year} • {req.student?.gender}
                                  </span>
                                </div>

                                {req.message && (
                                  <p className="text-slate-700 bg-white p-2.5 rounded border border-slate-200/80 text-[11px] leading-relaxed">
                                    "{req.message}"
                                  </p>
                                )}

                                {req.student?.skills?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-0.5">
                                    {req.student.skills.map((s, i) => (
                                      <span key={i} className="text-[10px] bg-white px-1.5 py-0.2 rounded text-slate-600 border border-slate-200">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleRespondRequest(req._id, 'accept', team._id)}
                                  disabled={actionLoading || isFull}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => handleRespondRequest(req._id, 'reject', team._id)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium rounded-md transition-colors flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Decline</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Current Confirmed Members */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Confirmed Members ({team.members?.length} / {team.requiredMembers})
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {team.members?.map((member) => {
                          const isTeamLeader = member._id?.toString() === team.leader?._id?.toString() || member._id?.toString() === user._id?.toString();
                          return (
                            <div
                              key={member._id}
                              className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-start justify-between gap-2 text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-900">{member.name}</span>
                                  {isTeamLeader && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                                      Lead
                                    </span>
                                  )}
                                </div>
                                <p className="font-mono text-slate-800 text-[11px]">{member.rollNumber}</p>
                                <p className="text-slate-500 text-[11px]">{member.department} • {member.year} • {member.gender}</p>
                              </div>

                              {!isTeamLeader && (
                                <button
                                  onClick={() => handleRemoveMember(team._id, member._id, member.name)}
                                  disabled={actionLoading}
                                  title="Remove Member from Team"
                                  className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Teams I am Member Of */}
      {activeTab === 'joined' && (
        <div className="space-y-3">
          {memberTeams.length === 0 ? (
            <div className="bg-white rounded-xl p-10 border border-slate-200 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="font-semibold text-slate-800 text-sm">You haven't joined any teams as a member</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore teams currently recruiting members and send join requests.
              </p>
              <button
                onClick={() => setActivePage('teams')}
                className="mt-2 px-3.5 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold"
              >
                Browse Teams
              </button>
            </div>
          ) : (
            memberTeams.map((team) => (
              <div
                key={team._id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <SIHBadge team={team} />
                    <h3 className="text-base font-bold text-slate-900">{team.teamName}</h3>
                    <p className="text-xs text-slate-500">
                      Leader: <strong className="text-slate-700">{team.leader?.name} ({team.leader?.rollNumber})</strong> • Domain: {team.problemDomain}
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectTeam(team)}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-md transition-colors self-start md:self-auto"
                  >
                    View Team Roster
                  </button>
                </div>

                {team.isFlagged && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <div>
                        <p className="font-bold text-amber-950">
                          Team Flagged: "{team.flagReason || 'Under coordinator review'}"
                        </p>
                        <p className="text-[11px] text-amber-800">
                          This team is under review. Your personal student account is not blocked.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new Event('open-flag-alert'))}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded shadow-xs transition-colors shrink-0 cursor-pointer"
                    >
                      View Notice & Contact
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: My Sent Requests */}
      {activeTab === 'sent' && (
        <div className="space-y-3">
          {sentRequests.length === 0 ? (
            <div className="bg-white rounded-xl p-10 border border-slate-200 text-center space-y-2">
              <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="font-semibold text-slate-800 text-sm">No sent join requests</h3>
              <p className="text-xs text-slate-500">
                Browse teams and request to join projects that align with your technical background.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Target Team</th>
                    <th className="p-3.5">Hackathon</th>
                    <th className="p-3.5">Leader</th>
                    <th className="p-3.5">Pitch Message</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sentRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-semibold text-slate-900">
                        {req.team?.teamName || 'Deleted Team'}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {req.team?.hackathon}
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-800 font-medium block">{req.team?.leader?.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{req.team?.leader?.rollNumber}</span>
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">
                        {req.message || 'No pitch provided'}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                          req.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : req.status === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(req.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Team Invitations Received */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
              <MailCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-indigo-950">Team Invitations for You</h3>
              <p className="text-xs text-indigo-800 mt-0.5 leading-relaxed">
                Team leaders who have open slots have invited you to join their SIH project. Accept an invitation to join the team, or decline to stay available.
              </p>
            </div>
          </div>

          {receivedInvitations.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-slate-200 text-center space-y-2 shadow-2xs">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <MailCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">No invitations yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When a team leader invites you to their team, the invitation and their personal message will appear here.
              </p>
              <button
                onClick={() => setActivePage('teams')}
                className="mt-3 px-3.5 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold cursor-pointer"
              >
                Browse Open Teams &rarr;
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {receivedInvitations.map((inv) => (
                <div
                  key={inv._id}
                  className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3 transition-all hover:border-slate-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">{inv.team?.teamName || 'Team'}</h4>
                        {inv.team?.hackathon && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {inv.team.hackathon}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                          inv.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : inv.status === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Domain: <strong className="text-slate-800">{inv.team?.problemDomain || 'General'}</strong> • Leader: <strong className="text-slate-800">{inv.team?.leader?.name || inv.sender?.name}</strong>
                      </p>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(inv.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Leader message */}
                  {inv.message && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs text-slate-700 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <MessageSquare className="w-3 h-3 text-indigo-500" />
                        <span>Message from Team Leader</span>
                      </div>
                      <p className="italic leading-relaxed">"{inv.message}"</p>
                    </div>
                  )}

                  {/* Actions if pending */}
                  {inv.status === 'pending' && (
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleRespondInvitation(inv._id, 'reject')}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleRespondInvitation(inv._id, 'accept')}
                        disabled={actionLoading}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Invitation & Join Team</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Unallocated Members Modal */}
      <InviteMembersModal
        isOpen={!!inviteModalTeam}
        team={inviteModalTeam}
        onClose={() => setInviteModalTeam(null)}
        onSuccess={(msg) => {
          onSuccess && onSuccess(msg);
          fetchData();
        }}
      />

    </div>
  );
}

