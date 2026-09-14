import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import {
  Bell,
  MailCheck,
  Check,
  X,
  Clock,
  ExternalLink,
  Users,
  RefreshCw,
  Sparkles,
  Inbox
} from 'lucide-react';

export default function NotificationDropdown({ setActivePage, onSuccess }) {
  const {
    pendingInvitations,
    pendingRequests,
    unreadCount,
    isDropdownOpen,
    closeDropdown,
    fetchNotifications,
    respondInvitation,
    respondRequest,
    loading
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('invitations');
  const [actingId, setActingId] = useState(null);

  if (!isDropdownOpen) return null;

  const handleActionInvite = async (inviteId, action) => {
    setActingId(inviteId);
    try {
      const res = await respondInvitation(inviteId, action);
      if (res?.message && onSuccess) {
        onSuccess(res.message);
      }
    } catch (err) {
      alert(err.message || `Failed to ${action} invitation`);
    } finally {
      setActingId(null);
    }
  };

  const handleActionRequest = async (requestId, action) => {
    setActingId(requestId);
    try {
      const res = await respondRequest(requestId, action);
      if (res?.message && onSuccess) {
        onSuccess(res.message);
      }
    } catch (err) {
      alert(err.message || `Failed to ${action} request`);
    } finally {
      setActingId(null);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Invisible backdrop to close on click outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={closeDropdown}
      />

      {/* Dropdown Card */}
      <div
        className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/10 rounded-lg text-amber-300">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Notifications</h3>
              <p className="text-[11px] text-slate-300">
                {unreadCount > 0 ? `${unreadCount} pending item${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchNotifications()}
              disabled={loading}
              className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              title="Refresh notifications"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={closeDropdown}
              className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switcher: Invitations vs Requests */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('invitations')}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'invitations'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MailCheck className="w-3.5 h-3.5" />
            <span>Invitations</span>
            {pendingInvitations.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                {pendingInvitations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'requests'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Applications</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* List Content */}
        <div className="overflow-y-auto p-3 space-y-2.5 flex-1 divide-y divide-slate-100">
          {activeTab === 'invitations' && (
            pendingInvitations.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <MailCheck className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">No pending team invitations</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  When a team leader invites you to join their project, it will pop up right here in real time.
                </p>
              </div>
            ) : (
              pendingInvitations.map((inv) => (
                <div
                  key={inv._id}
                  className="pt-2.5 first:pt-0 space-y-2 bg-indigo-50/40 hover:bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs">{inv.team?.teamName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-semibold">
                          {inv.team?.hackathon || 'SIH 2026'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Domain: <strong>{inv.team?.problemDomain}</strong>
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {formatTime(inv.createdAt)}
                    </span>
                  </div>

                  {inv.message && (
                    <p className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-indigo-100/80 italic leading-relaxed">
                      "{inv.message}"
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleActionInvite(inv._id, 'reject')}
                      disabled={actingId === inv._id}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-md font-medium transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleActionInvite(inv._id, 'accept')}
                      disabled={actingId === inv._id}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-2xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'requests' && (
            pendingRequests.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">No pending join applications</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Applications from students wishing to join your teams will appear here.
                </p>
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div
                  key={req._id}
                  className="pt-2.5 first:pt-0 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{req.student?.name}</span>
                        <span className="font-mono text-[10px] text-slate-600 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                          {req.student?.rollNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Target: <strong className="text-slate-800">{req.team?.teamName}</strong> • {req.student?.department}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {formatTime(req.createdAt)}
                    </span>
                  </div>

                  {req.message && (
                    <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200/80 italic">
                      "{req.message}"
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleActionRequest(req._id, 'reject')}
                      disabled={actingId === req._id}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-md font-medium transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleActionRequest(req._id, 'accept')}
                      disabled={actingId === req._id}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-2xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept</span>
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-500">
            Real-time notifications active
          </span>
          <button
            onClick={() => {
              closeDropdown();
              setActivePage('my-teams');
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All in My Teams</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </>
  );
}
