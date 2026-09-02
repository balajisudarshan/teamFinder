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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-lg border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Send Join Request
            </h3>
            <p className="text-xs text-slate-500">
              Applying to <strong className="text-slate-900">{team.teamName}</strong> ({team.hackathon})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
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
