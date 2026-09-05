import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { 
  LogIn, 
  Mail, 
  Lock, 
  AlertCircle, 
  Users,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

export default function Login({ setActivePage, onSuccess }) {
  const { login, loginWithGoogle, sendForgotPasswordOtp, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: enter identifier, 2: enter otp & new pass
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

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
      onSuccess && onSuccess(`Welcome, ${loggedUser.name}! Signed in via NBKRIST Google.`);
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Ensure you select your @nbkrist.org email.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your Roll Number or registered Email');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const res = await sendForgotPasswordOtp(forgotIdentifier.trim());
      setMaskedEmail(res.maskedEmail || '');
      setForgotSuccess(res.message || 'Verification code sent!');
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Failed to find account or send code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim() || !newPassword.trim()) {
      setForgotError('Please provide both the verification code and your new password');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long');
      return;
    }
    setForgotLoading(true);
    setForgotError('');

    try {
      await resetPassword(forgotIdentifier.trim(), forgotOtp.trim(), newPassword);
      setForgotSuccess('Password reset successfully! You can now sign in.');
      setTimeout(() => {
        setShowForgot(false);
        setForgotStep(1);
        setEmail(forgotIdentifier);
        setPassword('');
        setForgotSuccess('');
      }, 2000);
    } catch (err) {
      setForgotError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setForgotLoading(false);
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
            {showForgot ? 'Reset Password' : 'Sign in to TeamFinder'}
          </h2>
          <p className="text-xs text-slate-500">
            N.B.K.R. Institute of Science & Technology student portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
          
          {/* Main Error */}
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {!showForgot ? (
            <>
              {/* Google OAuth Section */}
              <div className="space-y-2">
                <div className="flex justify-center w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google sign-in was canceled or encountered an error')}
                    theme="outline"
                    size="large"
                    shape="rectangular"
                    text="signin_with"
                    width="100%"
                  />
                </div>
                <div className="flex items-center gap-1.5 justify-center text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Accepts official <strong>@nbkrist.org</strong> accounts</span>
                </div>
              </div>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Or with credentials
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Traditional Login Form */}
              <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
                
                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Roll Number or Email:
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. 25KB5A0546 or 24KB1A0517"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">
                      Password:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgot(true);
                        setForgotStep(1);
                        setForgotIdentifier(email);
                        setForgotError('');
                        setForgotSuccess('');
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
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
            </>
          ) : (
            /* Forgot Password Flow */
            <div className="space-y-3.5 text-xs">
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>

              {forgotError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleSendForgotOtp} className="space-y-3">
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Enter your NBKRIST Roll Number or registered email address. We will send a 6-digit OTP verification code to reset your password.
                  </p>
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      Roll Number or Email:
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="e.g. 25KB5A0546 or 24KB1A0517"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {forgotLoading ? 'Sending OTP...' : 'Send Verification Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-800">
                    Code sent to <strong>{maskedEmail}</strong>. Enter it below with your new password.
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      6-Digit Verification Code:
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono tracking-widest text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-center font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      New Password:
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {forgotLoading ? 'Updating Password...' : 'Save New Password'}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-[11px] text-slate-500 hover:underline"
                    >
                      Didn't get code? Resend
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

