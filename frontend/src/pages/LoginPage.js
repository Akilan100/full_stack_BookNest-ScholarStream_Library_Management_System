import React, { useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setAuth } from '../store/slices/authSlice';

function LoginPage({ onLoginSuccess }) {
  const dispatch = useDispatch();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'LIBRARY_PATRON',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (isRegister) {
      try {
        const payload = {
          username: formData.email.trim(),
          email: formData.email.trim(),
          password: formData.password,
          fullName: formData.fullName.trim() || formData.email.split('@')[0],
          role: formData.role || 'LIBRARY_PATRON',
        };
        await axios.post('/api/auth/register', payload);
        setSuccessMsg('Account registered successfully. You can now sign in.');
        setIsRegister(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Registration failed. Please check details and retry.');
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const payload = {
          username: formData.email.trim(),
          password: formData.password,
        };
        const res = await axios.post('/api/auth/login', payload);
        const data = res.data;
        const authData = {
          token: data.token,
          user: {
            id: data.id,
            email: data.email || data.username,
            fullName: data.fullName || data.username,
            role: data.role,
          },
          role: data.role,
          fullName: data.fullName || data.username,
          email: data.email || data.username,
        };
        dispatch(setAuth(authData));
        if (onLoginSuccess) onLoginSuccess();
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid credentials. Please verify your email and password.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/10 mb-4 transition-transform hover:scale-105">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            BookNest <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">ScholarStream</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400 text-center font-normal">
            Unified Institutional Library Management System
          </p>
        </div>

        {/* Form card */}
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800 text-slate-100">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {isRegister ? 'Library Account Setup' : 'Library Portal Sign-In'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isRegister
                ? 'Create your verified institutional library profile'
                : 'Enter your credentials to access the library catalogue'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium flex items-center gap-2.5">
              <svg className="w-4 h-4 flex-shrink-0 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-medium flex items-center gap-2.5">
              <svg className="w-4 h-4 flex-shrink-0 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Enter full registered name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="patron@booknest.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Security Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Assigned Domain Access Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition cursor-pointer"
                >
                  <option value="LIBRARY_PATRON" className="bg-slate-900 text-white">LIBRARY_PATRON (Standard Access)</option>
                  <option value="LIBRARIAN_STAFF" className="bg-slate-900 text-white">LIBRARIAN_STAFF (Desk Circulation Ops)</option>
                  <option value="CHIEF_LIBRARIAN" className="bg-slate-900 text-white">CHIEF_LIBRARIAN (System Administrator)</option>
                </select>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isRegister ? (
                  'Register Account'
                ) : (
                  'Access Library Portal'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center border-t border-slate-800/80 pt-4">
            {isRegister ? (
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); setSuccessMsg(''); }}
                className="text-xs text-blue-400 hover:text-blue-300 transition font-medium cursor-pointer"
              >
                Already registered? Sign in here
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(''); setSuccessMsg(''); }}
                className="text-xs text-blue-400 hover:text-blue-300 transition font-medium cursor-pointer"
              >
                Need a library card? Setup account
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-slate-500">
          BookNest Library System &bull; Version 1.0 &bull; Secure Institutional Portal
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
