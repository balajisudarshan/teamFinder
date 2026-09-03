import React, { useState } from 'react';
import api from '../services/api';
import {
  Users,
  PlusCircle,
  Award,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CreateTeam({ setActivePage, onSelectTeam, onSuccess }) {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    teamName: '',
    hackathon: 'Smart India Hackathon (SIH)',
    problemDomain: '',
    description: '',
    requiredMembers: 6,
    skillsNeeded: '',
    femaleRequired: true,
    targetDepartment: 'Any',
    targetYear: 'Any',
    otherRequirements: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleHackathonChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({
      ...prev,
      hackathon: val,
      requiredMembers: val.toLowerCase().includes('sih') ? 6 : prev.requiredMembers,
      femaleRequired: val.toLowerCase().includes('sih') ? true : prev.femaleRequired,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        teamName: formData.teamName,
        hackathon: formData.hackathon,
        problemDomain: formData.problemDomain,
        description: formData.description,
        requiredMembers: Number(formData.requiredMembers),
        skillsNeeded: formData.skillsNeeded,
        requirements: {
          femaleRequired: formData.femaleRequired,
          targetDepartment: formData.targetDepartment,
          targetYear: formData.targetYear,
          otherRequirements: formData.otherRequirements,
        },
      };

      const res = await api.post('/teams', payload);
      if (res.data?.success) {
        onSuccess && onSuccess(`Team "${formData.teamName}" created successfully!`);
        onSelectTeam(res.data.team);
      }
    } catch (err) {
      setError(err.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
          Create a Hackathon Team
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Assemble your NBKRIST squad, specify technical requirements, and invite teammates
        </p>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-5">

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <strong className="block font-semibold">Constraint Notice</strong>
              <p className="text-[11px] leading-relaxed mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">

          {/* Hackathon Selection & SIH Note */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Target Hackathon Event: *
            </label>
            <select
              name="hackathon"
              value={formData.hackathon}
              onChange={handleHackathonChange}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
            >
              <option value="Smart India Hackathon (SIH)">Smart India Hackathon (SIH)</option>
              <option value="NBKRIST Internal Hackathon">NBKRIST Internal Hackathon</option>
              <option value="Open National Hackathon">Open National Hackathon</option>
              <option value="State Innovation Challenge">State Innovation Challenge</option>
            </select>

            {formData.hackathon.toLowerCase().includes('sih') && (
              <div className="p-2.5 bg-amber-50 rounded-md border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2 mt-1">
                <Award className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>SIH Rules Applied:</strong> Preset to 6 members with mandatory female teammate requirement.
                </span>
              </div>
            )}
          </div>

          {/* Team Name & Required Members */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Team Name: *
              </label>
              <input
                type="text"
                name="teamName"
                required
                value={formData.teamName}
                onChange={handleChange}
                placeholder="e.g. AgriVision NBKR, CyberShield..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Team Size: *
              </label>
              <input
                type="number"
                name="requiredMembers"
                required
                min={2}
                max={10}
                value={formData.requiredMembers}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
              />
            </div>
          </div>

          {/* Problem Statement / Domain */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Problem Domain / Theme: *
            </label>
            <input
              type="text"
              name="problem Number (PS NUMBER)"
              required
              value={formData.problemDomain}
              onChange={handleChange}
              placeholder="e.g. Smart Education, Clean Energy & EV, Healthcare, Cybersecurity..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
            />
          </div>

          {/* Project Description */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Project Description / Concept:
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Briefly explain the problem statement and the solution approach..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
            />
          </div>

          {/* Skills Needed */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Skills Needed (comma-separated):
            </label>
            <input
              type="text"
              name="skillsNeeded"
              value={formData.skillsNeeded}
              onChange={handleChange}
              placeholder="e.g. React, Flutter, Python, IoT, Embedded C, Figma..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
            />
          </div>

          {/* Requirements Box */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              Teammate Preferences:
            </h3>

            {/* Female Requirement Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="femaleRequired"
                checked={formData.femaleRequired}
                onChange={handleChange}
                className="w-3.5 h-3.5 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
              />
              <span className="text-xs font-medium text-slate-800">
                Prioritize / Require Female Teammate (Mandatory for SIH qualification)
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  Target Department:
                </label>
                <select
                  name="targetDepartment"
                  value={formData.targetDepartment}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Any">Any Department</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="AI&DS">AI & DS</option>
                  <option value="IT">IT</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  Target Academic Year:
                </label>
                <select
                  name="targetYear"
                  value={formData.targetYear}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Any">Any Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-semibold text-slate-600">
                Additional Notes:
              </label>
              <input
                type="text"
                name="otherRequirements"
                value={formData.otherRequirements}
                onChange={handleChange}
                placeholder="e.g. Needs to be available for evening labs..."
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {loading ? (
                <span>Publishing Team...</span>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish Team Listing</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>

    </div>
  );
}
