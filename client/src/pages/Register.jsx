import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Hash, 
  CheckCircle2,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';

export default function Register({ setActivePage, onSuccess }) {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    email: '',
    password: '',
    department: 'CSE',
    year: '3rd Year',
    gender: 'Male',
    skills: '',
    bio: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isEmailValidNBKRIST = formData.email.trim().toLowerCase().endsWith('@nbkrist.org');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isEmailValidNBKRIST) {
      setError('Registration is strictly restricted to NBKRIST students. Your email must end with @nbkrist.org');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      onSuccess && onSuccess('Account created successfully! Welcome to TeamFinder.');
      setActivePage('teams');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-xl w-full space-y-4">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center mx-auto shadow-xs">
            <UserPlus className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            Student Registration
          </h2>
          <p className="text-xs text-slate-500">
            Official N.B.K.R. Institute of Science & Technology hackathon directory
          </p>
        </div>

        {/* Form Box */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          
          {/* Domain Notice Banner */}
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="block text-slate-900 font-semibold">Institutional Verification Required</strong>
              <span>
                To ensure academic record verification for SIH nodal submission, accounts require an official email ending with <strong>@nbkrist.org</strong>.
              </span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Full Name: *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Sneha Reddy"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              </div>

              {/* Roll Number */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Roll Number: *
                </label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="rollNumber"
                    required
                    value={formData.rollNumber}
                    onChange={handleChange}
                    placeholder="e.g. 22KB1A0542"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 uppercase font-mono focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* College Email */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700">
                    College Email: *
                  </label>
                  {formData.email && (
                    <span className={`text-[10px] font-semibold ${isEmailValidNBKRIST ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {isEmailValidNBKRIST ? 'Valid Domain' : 'Must be @nbkrist.org'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="rollnumber@nbkrist.org"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Password (min 6 chars): *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              </div>

            </div>

            {/* Academic Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Department: *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none"
                >
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="AI&DS">AI & DS</option>
                  <option value="IT">IT</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">
                  Year: *
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
                  Gender (SIH Rule): *
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

            {/* Skills */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-slate-700">
                  Skills & Technologies (comma separated):
                </label>
                <span className="text-[10px] text-slate-400">Click chips to toggle or type custom</span>
              </div>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g. React, Python, IoT, 3D CAD, UI/UX, Figma..."
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

            {/* Bio */}
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Bio / Interests:
              </label>
              <textarea
                name="bio"
                rows={2}
                value={formData.bio}
                onChange={handleChange}
                placeholder="Briefly state your hackathon interests..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {loading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Complete Registration</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Switch to Login */}
          <div className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
            Already registered?{' '}
            <button
              onClick={() => setActivePage('login')}
              className="text-slate-900 font-semibold hover:underline"
            >
              Sign in here
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
