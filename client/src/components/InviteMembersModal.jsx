import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import {
  Search,
  X,
  UserPlus,
  Send,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Users,
  Sparkles,
  BookOpen,
  Mail,
  ChevronRight
} from 'lucide-react';

const DEPARTMENTS = ['All', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI&DS', 'IT', 'OTHER'];

export default function InviteMembersModal({ isOpen, team, onClose, onSuccess }) {
  if (!isOpen || !team) return null;

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [pendingInvites, setPendingInvites] = useState(new Set());
  
  // Active student whose invite form is open
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [sendingId, setSendingId] = useState(null);
  const [errorBanner, setErrorBanner] = useState('');

  const spotsLeft = Math.max(0, (team.requiredMembers || 6) - (team.members?.length || 0));

  // Load unallocated students and existing invitations for this team
  const loadData = async () => {
    setLoading(true);
    setErrorBanner('');
    try {
      const hackParam = team.hackathon ? `?hackathon=${encodeURIComponent(team.hackathon)}` : '';
      const [unallocRes, invitesRes] = await Promise.all([
        api.get(`/requests/unallocated${hackParam}`).catch(() => ({ data: { students: [] } })),
        api.get(`/requests/team/${team._id}/invitations`).catch(() => ({ data: { invitations: [] } })),
      ]);

      if (unallocRes.data?.success) {
        setStudents(unallocRes.data.students || []);
      }

      if (invitesRes.data?.success) {
        const pendingSet = new Set();
        (invitesRes.data.invitations || []).forEach((inv) => {
          if (inv.status === 'pending' && inv.student) {
            const sid = inv.student._id || inv.student;
            pendingSet.add(sid.toString());
          }
        });
        setPendingInvites(pendingSet);
      }
    } catch (err) {
      console.error('Error loading unallocated members:', err);
      setErrorBanner('Failed to load unallocated members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Close on Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [team._id]);

  // Open invite prompt for a student with sensible default message
  const handleOpenInvitePrompt = (student) => {
    setActiveStudentId(student._id);
    const firstName = student.name?.split(' ')[0] || 'there';
    const topSkills = (student.skills || []).slice(0, 3).join(', ');
    const skillsMention = topSkills ? ` Your skills in ${topSkills} would be a great addition to our project.` : '';
    setCustomMessage(
      `Hi ${firstName}! We'd love to have you join team "${team.teamName}" for ${team.hackathon || 'SIH 2026'}.${skillsMention}`
    );
  };

  // Send the invitation
  const handleSendInvitation = async (student) => {
    setSendingId(student._id);
    setErrorBanner('');
    try {
      const res = await api.post('/requests/invite', {
        teamId: team._id,
        studentId: student._id,
        message: customMessage.trim(),
      });

      if (res.data?.success) {
        setPendingInvites((prev) => new Set([...prev, student._id.toString()]));
        setActiveStudentId(null);
        setCustomMessage('');
        onSuccess && onSuccess(res.data.message || `Invitation sent to ${student.name}!`);
      }
    } catch (err) {
      setErrorBanner(err.response?.data?.message || err.message || 'Failed to send invitation.');
    } finally {
      setSendingId(null);
    }
  };

  // Filter unallocated students by department and search
  const filteredStudents = useMemo(() => {
    let list = [...students];

    if (selectedDept !== 'All') {
      list = list.filter((s) => s.department === selectedDept);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((s) => {
        const name = (s.name || '').toLowerCase();
        const roll = (s.rollNumber || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const dept = (s.department || '').toLowerCase();
        const skills = (s.skills || []).join(' ').toLowerCase();
        return name.includes(q) || roll.includes(q) || email.includes(q) || dept.includes(q) || skills.includes(q);
      });
    }

    return list;
  }, [students, selectedDept, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                Team Recruitment
              </span>
              <span className="text-[11px] text-slate-300">
                {team.hackathon || 'SIH 2026'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Invite Members to</span>
              <span className="text-indigo-300 underline decoration-indigo-400/40">{team.teamName}</span>
            </h2>
            <p className="text-xs text-slate-300">
              {spotsLeft > 0 ? (
                <span>
                  <strong className="text-emerald-400 font-bold">{spotsLeft} spot{spotsLeft > 1 ? 's' : ''} remaining</strong> ({team.members?.length || 0} of {team.requiredMembers || 6} filled) • Domain: <strong className="text-white">{team.problemDomain}</strong>
                </span>
              ) : (
                <span className="text-amber-300 font-semibold">Team is currently full ({team.requiredMembers || 6} members)</span>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification if any */}
        {errorBanner && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-800 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorBanner}</span>
            </div>
            <button
              onClick={() => setErrorBanner('')}
              className="text-rose-500 hover:text-rose-700 font-bold ml-2 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Toolbar: Search & Filter */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, roll number, or skills (e.g. React, Python)..."
              className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-slate-800"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-slate-800 font-medium"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All Departments' : dept}
                </option>
              ))}
            </select>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh unallocated members list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Subheader info bar */}
        <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200 text-[11px] text-slate-600 flex items-center justify-between shrink-0">
          <span>
            Showing <strong className="text-slate-900 font-semibold">{filteredStudents.length}</strong> unallocated candidate{filteredStudents.length === 1 ? '' : 's'}
          </span>
          <span className="text-slate-500 italic hidden sm:inline">
            Students who haven't joined any team for {team.hackathon || 'SIH 2026'}
          </span>
        </div>

        {/* Candidate List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Scanning for unallocated students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No unallocated students found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {search || selectedDept !== 'All'
                  ? 'Try clearing your search filters to find more candidates.'
                  : `All registered students have already been allocated to teams for ${team.hackathon || 'SIH 2026'}.`}
              </p>
            </div>
          ) : (
            filteredStudents.map((student) => {
              const isInvited = pendingInvites.has(student._id.toString());
              const isFormOpen = activeStudentId === student._id;

              return (
                <div
                  key={student._id}
                  className={`pt-3 first:pt-0 transition-all rounded-xl p-3 ${
                    isFormOpen
                      ? 'bg-indigo-50/50 border border-indigo-200 shadow-2xs'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Student Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{student.name}</span>
                        <span className="font-mono text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                          {student.rollNumber}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
                          {student.department}
                        </span>
                        {student.year && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {student.year}
                          </span>
                        )}
                        {student.gender && (
                          <span className="text-[10px] text-slate-400">
                            • {student.gender}
                          </span>
                        )}
                      </div>

                      {student.email && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{student.email}</span>
                        </p>
                      )}

                      {/* Bio snippet if available */}
                      {student.bio && (
                        <p className="text-xs text-slate-600 italic line-clamp-2 pt-0.5">
                          "{student.bio}"
                        </p>
                      )}

                      {/* Skills Badges */}
                      {student.skills && student.skills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {student.skills.map((skill, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-medium px-2 py-0.5 bg-white text-slate-700 rounded-md border border-slate-200 shadow-3xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 sm:self-start">
                      {isInvited ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Invited (Pending)</span>
                        </span>
                      ) : spotsLeft === 0 ? (
                        <span className="text-xs text-slate-400 font-medium px-2 py-1">
                          Team Full
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (isFormOpen) {
                              setActiveStudentId(null);
                            } else {
                              handleOpenInvitePrompt(student);
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer ${
                            isFormOpen
                              ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{isFormOpen ? 'Cancel' : 'Invite'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Message Expander for this student */}
                  {isFormOpen && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-indigo-200 space-y-2.5 animate-in fade-in duration-100">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Personal Message to {student.name}:</span>
                        </label>
                        <span className="text-[10px] text-slate-400">Optional customized invitation</span>
                      </div>

                      <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        rows={2}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white resize-none"
                        placeholder="Write a warm note explaining why they'd be a great teammate..."
                      />

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveStudentId(null)}
                          disabled={sendingId === student._id}
                          className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendInvitation(student)}
                          disabled={sendingId === student._id}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {sendingId === student._id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Send Invitation</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500 text-[11px]">
            Invitations can be accepted or declined by candidates in their <strong>My Teams</strong> tab.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
