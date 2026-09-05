import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Hash,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  KeyRound,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export default function Register({ setActivePage, onSuccess }) {
  const { loginWithGoogle, registerJuniorWithGoogle } = useAuth();

  // Tab state: 'oauth' (Seniors with @nbkrist.org) or 'junior' (1st years with any personal Google account)
  const [activeTab, setActiveTab] = useState('oauth');

  // 1st Year / Junior Registration Form State
  const [rollNumber, setRollNumber] = useState('');

  const [formData, setFormData] = useState({
    department: 'CSE',
    year: '1st Year',
    gender: 'Male',
    skills: '',
    bio: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const loggedUser = await loginWithGoogle(credentialResponse.credential);
      if (loggedUser?.role === 'admin') {
        setActivePage('admin');
      } else {
        setActivePage('teams');
      }
      onSuccess && onSuccess(`Welcome to TeamFinder, ${loggedUser.name}! Account verified via NBKRIST Google.`);
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please ensure you select your @nbkrist.org email.');
    } finally {
      setLoading(false);
    }
  };

  // Junior Registration with Any Google Account
  const handleJuniorGoogleSuccess = async (credentialResponse) => {
    const cleanRoll = rollNumber.trim().toUpperCase();
    const rollRegex = /^[0-9]{2}KB[15]A[0-9]{2}[0-9A-Z]{2}$/i;

    if (!cleanRoll) {
      setError('Please enter your College Roll Number (e.g. 26KB1A0546) above before signing in with Google.');
      return;
    }

    if (!rollRegex.test(cleanRoll)) {
      setError('Please enter a valid NBKRIST roll number format (e.g. 26KB1A0546 for regular or 25KB5A0546 for lateral entry).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const loggedUser = await registerJuniorWithGoogle({
        credential: credentialResponse.credential,
        rollNumber: cleanRoll,
        department: formData.department,
        year: formData.year,
        gender: formData.gender,
        skills: formData.skills,
        bio: formData.bio,
      });
      setActivePage('teams');
      onSuccess && onSuccess(`Welcome to TeamFinder, ${loggedUser.name}! Account verified via Google.`);
    } catch (err) {
      setError(err.message || 'Google registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const autoEmail = rollNumber.trim()
    ? `${rollNumber.trim().toLowerCase()}@nbkrist.org`
    : 'rollnumber@nbkrist.org';

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
            N.B.K.R. Institute of Science & Technology hackathon directory
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('oauth'); setError(''); }}
            className={`py-2 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === 'oauth'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Seniors (Google Account)</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('junior'); setError(''); }}
            className={`py-2 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === 'junior'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span>1st Year / Juniors (Any Email)</span>
          </button>
        </div>

        {/* Form Box */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {infoMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{infoMsg}</span>
            </div>
          )}

          {activeTab === 'oauth' ? (
            /* TAB 1: Seniors & Staff (Instant Google OAuth) */
            <div className="space-y-4 text-center py-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-left text-xs text-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-slate-800" />
                  <span>Institutional Single Sign-On</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Students with an assigned college inbox (e.g. <code>24kb1a0517@nbkrist.org</code> or lateral entry <code>25kb5a0546@nbkrist.org</code>) can sign in with 1-click Google authentication.
                </p>
              </div>

              <div className="flex justify-center pt-2 overflow-hidden">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in was canceled or encountered an error')}
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  text="signup_with"
                  width="100%"
                />
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Restricted strictly to <strong>@nbkrist.org</strong> domain accounts</span>
              </div>
            </div>
          ) : (
            /* TAB 2: 1st Years / Juniors with any Google account */
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>1st Year & Junior Registration (Any Google Account)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  No official college email yet? You can register using <strong>any personal Google account (Gmail, etc.)</strong>. Enter your university roll number and academic details below, then click Sign Up with Google.
                </p>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Roll Number Input */}
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    College Roll Number: *
                  </label>
                  <div className="relative">
                    <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. 26KB1A0546 or 25KB5A0546"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono text-slate-900 uppercase tracking-wider focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Format: Regular (26KB1A...) or Lateral (25KB5A...)</span>
                    {rollNumber.trim() && (
                      <span className="font-mono text-slate-700 font-medium">
                        Reserved: {autoEmail}
                      </span>
                    )}
                  </div>
                </div>

                {/* Academic Details: Department, Year, Gender */}
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

                {/* Skills Chips */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-700">
                      Skills & Technologies:
                    </label>
                    <span className="text-[10px] text-slate-400">Click chips to toggle or type custom</span>
                  </div>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="e.g. Web Dev, Python, IoT, CAD, UI/UX..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                  />
                  <div className="pt-1 flex flex-wrap gap-1">
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
                        const updated = isSelected
                          ? currentSkills.filter((s) => s.toLowerCase() !== skill.toLowerCase())
                          : [...currentSkills, skill];
                        setFormData((prev) => ({ ...prev, skills: updated.join(', ') }));
                      };
                      return (
                        <button
                          type="button"
                          key={skill}
                          onClick={toggleSkill}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${isSelected
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{skill}
                        </button>
                      );
                    })}
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
                    placeholder="Briefly describe your areas of interest..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                  />
                </div>

                {/* Google Sign-up Action */}
                <div className="pt-3 space-y-2.5 text-center border-t border-slate-100">
                  <div className="flex justify-center overflow-hidden">
                    <GoogleLogin
                      onSuccess={handleJuniorGoogleSuccess}
                      onError={() => setError('Google sign-in was canceled or encountered an error')}
                      theme="outline"
                      size="large"
                      shape="rectangular"
                      text="signup_with"
                      width="100%"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Personal Google accounts accepted (Gmail, etc.)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Switch to Login */}
          <div className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
            Already have an account?{' '}
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

