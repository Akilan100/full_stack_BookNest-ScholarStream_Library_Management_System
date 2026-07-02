import React from 'react';

const ROLES = ['LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN', 'LIBRARY_PATRON'];

const ROLE_LABELS = {
  LIBRARIAN_STAFF: 'LIBRARY_STAFF (Staff Access)',
  CHIEF_LIBRARIAN: 'LIBRARY_ADMIN (Admin Access)',
  LIBRARY_PATRON: 'LIBRARY_PATRON (Standard Access)',
};

function LoginPage({
  isRegister, setIsRegister,
  email, setEmail,
  password, setPassword,
  fullName, setFullName,
  role, setRole,
  authError,
  loading,
  onLogin,
  onRegister,
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2563eb] mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1e293b]">BookNest</h1>
          <p className="text-sm text-slate-500 mt-1">Library Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
          <h2 className="text-xl font-bold text-[#1e293b] text-center mb-6">
            {isRegister ? 'Library Account Setup' : 'Library Portal Sign-In'}
          </h2>

          {authError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {authError}
            </div>
          )}

          <form onSubmit={isRegister ? onRegister : onLogin} noValidate>
            {isRegister && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter full registered name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="patron@booknest.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Security Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition"
              />
            </div>

            {isRegister && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Assigned Domain Access Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {isRegister ? 'Register Account' : 'Access Library Portal'}
            </button>
          </form>

          <div className="mt-5 text-center">
            {isRegister ? (
              <button
                onClick={() => setIsRegister(false)}
                className="text-sm text-[#2563eb] hover:underline font-medium"
              >
                Already registered? Sign in here
              </button>
            ) : (
              <button
                onClick={() => setIsRegister(true)}
                className="text-sm text-[#2563eb] hover:underline font-medium"
              >
                Need a library card? Setup account
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} BookNest Library System
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
