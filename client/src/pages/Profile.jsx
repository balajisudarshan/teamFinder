import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Hash, 
  CheckCircle2, 
  Save,
  ShieldCheck 
} from 'lucide-react';

export default function Profile({ onSuccess }) {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    department: user?.department || 'CSE',
    year: user?.year || '3rd Year',
    gender: user?.gender || 'Male',
    skills: (user?.skills || []).join(', '),
    bio: user?.bio || '',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await updateProfile(formData);
      setSuccessMsg('Profile updated successfully!');
      onSuccess && onSuccess('Profile saved!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      
      {/* Student Identity Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 truncate">
              {user?.name}
            </h1>
            <span className="px-2 py-0.2 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700">
              {user?.role === 'admin' ? 'Coordinator' : 'Student'}
            </span>
          </div>
          <p className="text-xs font-mono font-semibold text-slate-700 mt-0.5">
            Roll No: {user?.rollNumber}
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{user?.email}</span>
            <span className="text-[10px] text-emerald-700 font-semibold">(Verified Domain)</span>
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
          Edit Profile Information
        </h2>

        {successMsg && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">
              Full Name:
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Department:
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none"
              >
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
              <label className="block font-semibold text-slate-700">
                Academic Year:
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Gender:
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-700">
                Skills & Disciplines (comma-separated):
              </label>
              <span className="text-[10px] text-slate-400">Click chips to toggle or type custom</span>
            </div>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="React, Python, IoT, 3D CAD, UI/UX, Figma..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
            />
            {/* Quick Suggestion Chips */}
            <div className="pt-1">
              <div className="flex flex-wrap gap-1">
                {[
                  'Web Dev',
                  'Python',
                  'C / C++',
                  'Java',
                  'Mobile App',
                  'AI / ML',
                  'IoT & Arduino',
                  '3D CAD / SolidWorks',
                  'Circuit & PCB',
                  'UI/UX & Figma',
                  'Pitching & Presentation',
                  'Documentation'
                ].map((skill) => {
                  const currentSkills = formData.skills
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const isSelected = currentSkills.some(
                    (s) => s.toLowerCase() === skill.toLowerCase()
                  );

                  const toggleSkill = () => {
                    let updated;
                    if (isSelected) {
                      updated = currentSkills.filter(
                        (s) => s.toLowerCase() !== skill.toLowerCase()
                      );
                    } else {
                      updated = [...currentSkills, skill];
                    }
                    setFormData((prev) => ({ ...prev, skills: updated.join(', ') }));
                  };

                  return (
                    <button
                      type="button"
                      key={skill}
                      onClick={toggleSkill}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors flex items-center gap-1 ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{isSelected ? '✓' : '+'}</span>
                      <span>{skill}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">
              Bio / Experience Summary:
            </label>
            <textarea
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Brief summary of your skills and hackathon experience..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving Changes...' : 'Save Profile'}</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
