import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogIn, 
  Mail, 
  Lock, 
  AlertCircle, 
  Users
} from 'lucide-react';

export default function Login({ setActivePage, onSuccess }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loggedUser = await login(email, password);
      if (loggedUser?.role === 'admin') {
        setActivePage('admin');
      } else {
        setActivePage('teams');
      }
      if (loggedUser?.isFlagged) {
        onSuccess && onSuccess(`Warning: Your account has been flagged by the coordinator: "${loggedUser.flagReason || 'Under Review'}".`);
      } else {
        onSuccess && onSuccess('Logged in successfully!');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-10">
      <div className="max-w-sm w-full space-y-5">
        
        {/* Top Branding */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center mx-auto shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            Sign in to TeamFinder
          </h2>
          <p className="text-xs text-slate-500">
            N.B.K.R. Institute of Science & Technology student portal
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                NBKRIST Email:
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rollnumber@nbkrist.org"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Password:
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 mt-1"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>



          {/* Switch to Register */}
          <div className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
            Need an account?{' '}
            <button
              onClick={() => setActivePage('register')}
              className="text-slate-900 font-semibold hover:underline"
            >
              Register here
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
