import React, { useState } from 'react';
import { X, Send, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export default function RequestModal({ team, isOpen, onClose, onSuccess }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !team) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post(`/requests/${team._id}`, { message });
      if (res.data?.success) {
        onSuccess && onSuccess(res.data.message);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to send join request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-center justify-center py-10 sm:py-14 px-4 sm:px-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 sm:px-7 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-850 dark:to-slate-900">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
              Send Join Request
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Applying to <strong className="text-slate-900 dark:text-slate-200">{team.teamName}</strong> ({team.hackathon})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body with generous padding */}
        <form onSubmit={handleSubmit} className="px-6 sm:px-7 pt-5 pb-7 space-y-5">
          
          {/* Important Rule Notice */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/90 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="block font-semibold">Hackathon Exclusivity Rule</strong>
              <span>
                If accepted, you will be officially committed to this team for <strong>{team.hackathon}</strong> and cannot join any other team for this event.
              </span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Your Pitch / Introduction to the Leader:
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Hi! I am a 3rd year CSE student skilled in React and Node.js. I have worked on IoT dashboards and would like to build the frontend..."
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <span>Sending...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
