import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  AlertTriangle, 
  RefreshCw, 
  Mail, 
  LogOut, 
  Lock,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

export default function FlaggedAlertModal() {
  const { 
    user, 
    isFlagged, 
    flagReason, 
    isTeamFlagged, 
    teamFlagReason, 
    flaggedTeamName,
    hasActiveFlag, 
    refreshUser, 
    logout 
  } = useAuth();

  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [showAppealDetails, setShowAppealDetails] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [dismissedTeamWarning, setDismissedTeamWarning] = useState(false);

  React.useEffect(() => {
    const handleOpenFlagAlert = () => setDismissedTeamWarning(false);
    window.addEventListener('open-flag-alert', handleOpenFlagAlert);
    return () => window.removeEventListener('open-flag-alert', handleOpenFlagAlert);
  }, []);

  // If no active flag, don't show
  if (!hasActiveFlag) return null;

  // If ONLY the team is flagged and student closed the popup, show a convenient floating pill to reopen it anytime
  if (!isFlagged && isTeamFlagged && dismissedTeamWarning) {
    return (
      <div className="fixed bottom-5 right-5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-150">
        <button
          type="button"
          onClick={() => setDismissedTeamWarning(false)}
          className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold px-4 py-2.5 rounded-full shadow-xl border-2 border-amber-300 flex items-center gap-2 text-xs transition-all hover:shadow-2xl cursor-pointer"
          title="Click to reopen team flag details and contact coordinator"
        >
          <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
          <span>Team Flagged — View Notice & Contact</span>
        </button>
      </div>
    );
  }

  const handleRecheck = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const updated = await refreshUser();
      const stillFlagged = Boolean(updated?.isFlagged || updated?.team?.isFlagged);
      if (!stillFlagged) {
        setCheckResult({ success: true, text: 'Account and team restored! All restrictions have been lifted.' });
      } else {
        setCheckResult({ success: false, text: 'Flag status is still active with the coordinator.' });
      }
    } catch {
      setCheckResult({ success: false, text: 'Failed to verify status. Please try again.' });
    } finally {
      setChecking(false);
    }
  };

  const coordinatorEmail = '24kb1a0517@nbkrist.org';
  const plainSubject = `NBKRIST TeamFinder - Flag Review Request (${user?.rollNumber || 'Student'})`;
  const plainBody = `Respected Faculty Coordinator,\n\nMy name is ${user?.name || 'Student'} (${user?.rollNumber || ''}, ${user?.department || ''} - ${user?.year || ''}).\nMy ${isFlagged ? 'account' : 'team'} was flagged on the TeamFinder portal with the following reason:\n"${isFlagged ? (flagReason || 'Under Review') : (teamFlagReason || 'Flagged Team')}"\n\nPlease review the verification details and restore standing.\n\nThank you,\n${user?.name || 'Student'}\nRoll No: ${user?.rollNumber || ''}\nEmail: ${user?.email || ''}`;

  const mailSubject = encodeURIComponent(plainSubject);
  const mailBody = encodeURIComponent(plainBody);

  // Direct Gmail Web compose URL - works on all browsers without requiring desktop mail client
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${coordinatorEmail}&su=${mailSubject}&body=${mailBody}`;

  const handleCopy = (text, fieldName) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  const handleOpenMailto = () => {
    window.location.href = `mailto:${coordinatorEmail}?subject=${mailSubject}&body=${mailBody}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl max-w-lg w-full shadow-2xl border-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] ${
        isFlagged ? 'border-rose-500' : 'border-amber-500'
      }`}>
        
        {/* Header Alert Strip */}
        <div className={`px-6 py-4 sm:py-5 text-white flex items-center justify-between shrink-0 ${
          isFlagged 
            ? 'bg-gradient-to-r from-rose-600 via-rose-700 to-red-700'
            : 'bg-gradient-to-r from-amber-600 via-rose-600 to-rose-700'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/15 rounded-xl border border-white/20 shrink-0">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/25 border border-white/30 text-[10px] font-bold uppercase tracking-wider text-white mb-0.5">
                <AlertTriangle className="w-3 h-3 text-amber-300" />
                <span>{isFlagged ? 'Official Account Restriction' : 'Team Notice'}</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                {isFlagged ? 'Account Flagged by Coordinator' : `Team "${flaggedTeamName}" Flagged`}
              </h2>
            </div>
          </div>

          {/* If only team is flagged, provide X mark to close and continue using account */}
          {!isFlagged && isTeamFlagged && (
            <button
              type="button"
              onClick={() => setDismissedTeamWarning(true)}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/35 text-white transition-colors shrink-0 ml-3 cursor-pointer"
              title="Close alert and continue"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1">
          
          {/* Target Student Identity Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Logged In As</span>
              <strong className="text-slate-900 font-semibold text-sm">{user?.name}</strong>
              <span className="text-slate-500 font-mono text-[11px] block">
                {user?.rollNumber} • {user?.department} ({user?.year})
              </span>
            </div>
            {isFlagged ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>Account Locked</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                <span>Account Usable</span>
              </span>
            )}
          </div>

          {/* Prominent Official Reason Box */}
          <div className={`rounded-xl p-4 space-y-1.5 border ${
            isFlagged ? 'bg-rose-50/90 border-rose-300' : 'bg-amber-50/90 border-amber-300'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isFlagged ? 'text-rose-900' : 'text-amber-900'
              }`}>
                <AlertTriangle className={`w-3.5 h-3.5 ${isFlagged ? 'text-rose-600' : 'text-amber-600'}`} />
                Coordinator Reason:
              </span>
              <span className={`text-[10px] font-mono ${isFlagged ? 'text-rose-600' : 'text-amber-700'}`}>
                {user?.flaggedAt ? new Date(user.flaggedAt).toLocaleDateString() : 'Active Flag'}
              </span>
            </div>
            <p className={`text-sm font-bold font-serif italic bg-white/70 p-3 rounded-lg border ${
              isFlagged ? 'text-rose-950 border-rose-200' : 'text-amber-950 border-amber-200'
            }`}>
              "{isFlagged ? (flagReason || 'Unverified student roll number or policy concern') : (teamFlagReason || 'Flagged team registration')}"
            </p>
          </div>

          {/* Consequence notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] space-y-1 leading-relaxed text-slate-700">
            <strong className="font-semibold block text-slate-900">
              {isFlagged ? 'Why are actions blocked?' : 'Account Status Notice'}
            </strong>
            {isFlagged ? (
              <p>
                The department faculty coordinator has flagged your student profile for verification. While flagged, you <strong>cannot create new teams, submit join requests, or modify team rosters</strong> until the coordinator unflags your record in the Admin Dashboard.
              </p>
            ) : (
              <p>
                The faculty coordinator flagged team <strong>"{flaggedTeamName}"</strong> for review. Your personal student account is <strong>not blocked and remains active</strong>. However, this flagged team cannot receive new join requests until unflagged. You can dismiss this alert with the <strong>(X)</strong> mark at top right.
              </p>
            )}
          </div>

          {/* Status Feedback Message */}
          {checkResult && (
            <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
              checkResult.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}>
              {checkResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{checkResult.text}</span>
            </div>
          )}

          {/* Expandable Appeal / Contact Section */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setShowAppealDetails(!showAppealDetails)}
              className="w-full px-4 py-2.5 bg-slate-100/80 hover:bg-slate-200/70 border-b border-slate-200 flex items-center justify-between text-slate-800 font-semibold text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-rose-600" />
                <span>Contact Coordinator (24kb1a0517@nbkrist.org)</span>
              </div>
              {showAppealDetails ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {showAppealDetails && (
              <div className="p-4 space-y-3 bg-white text-xs">
                
                {/* Coordinator Email Row */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Coordinator Recipient:
                  </span>
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800">
                    <span>{coordinatorEmail}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(coordinatorEmail, 'email')}
                      className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[10px] font-sans font-semibold text-slate-700 flex items-center gap-1 transition-colors"
                    >
                      {copiedField === 'email' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copy Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  
                  {/* Gmail Web Compose Button (100% reliable in any browser) */}
                  <a
                    href={gmailComposeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
                    <span>Open in Gmail Web</span>
                  </a>

                  {/* Mailto App Button */}
                  <button
                    type="button"
                    onClick={handleOpenMailto}
                    className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>Open Default Mail App</span>
                  </button>

                </div>

                {/* Copy Ready-Made Appeal Letter */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(plainBody, 'letter')}
                    className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedField === 'letter' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="font-semibold text-emerald-700">Appeal Letter Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Pre-written Appeal Letter</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          
          <button
            type="button"
            onClick={logout}
            className="w-full sm:w-auto px-3.5 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-200/70 transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAppealDetails(!showAppealDetails)}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{showAppealDetails ? 'Hide Contact' : 'Appeal / Contact'}</span>
            </button>

            <button
              type="button"
              onClick={handleRecheck}
              disabled={checking}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 shadow-xs"
              title="Query coordinator status directly"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking...' : 'Check Status'}</span>
            </button>

            {/* If only team is flagged, provide a direct dismiss button in the footer too */}
            {!isFlagged && isTeamFlagged && (
              <button
                type="button"
                onClick={() => setDismissedTeamWarning(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Dismiss</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
