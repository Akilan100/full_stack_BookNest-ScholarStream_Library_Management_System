import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { setFines } from '../store/slices/finePaymentSlice';

export const assessFine = async (payload) => {
  return await axios.post('/api/fines', payload);
};

export const payFine = async (id) => {
  return await axios.put(`/api/fines/${id}/pay`);
};

export const waiveFine = async (id) => {
  return await axios.put(`/api/fines/${id}/waive`);
};

function FinePaymentPage({ onDataChange }) {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth);
  const finesState = useSelector((s) => s.fines) || { list: [] };
  const fines = Array.isArray(finesState) ? finesState : finesState.list || [];

  const [showFineModal, setShowFineModal] = useState(false);
  const [issues, setIssues] = useState([]);
  const [patrons, setPatrons] = useState([]);

  const [fineForm, setFineForm] = useState({
    issueRecordId: '',
    userId: '',
    fineAmount: 5.0,
    reason: 'Overdue loan penalty',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isPatron = auth.role === 'LIBRARY_PATRON';
  const isStaffOrAdmin = auth.role === 'CHIEF_LIBRARIAN' || auth.role === 'LIBRARIAN_STAFF' || auth.role === 'ROLE_ADMIN' || auth.role === 'ADMIN';

  useEffect(() => {
    fetchFines();
    if (isStaffOrAdmin) {
      fetchAuxData();
    }
  }, [auth.token, auth.role]);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const endpoint = isPatron ? '/api/fines/my' : '/api/fines';
      const res = await axios.get(endpoint);
      dispatch(setFines(res.data));
    } catch (err) {
      console.error('Failed to load fines:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [issuesRes, usersRes] = await Promise.all([
        axios.get('/api/issues'),
        axios.get('/api/auth/users'),
      ]);
      setIssues(issuesRes.data || []);
      setPatrons((usersRes.data || []).filter((u) => u.role === 'LIBRARY_PATRON' || !u.role));
    } catch (err) {
      console.error('Failed to fetch auxiliary fine data:', err);
    }
  };

  const handleCreateFine = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        issueRecordId: Number(fineForm.issueRecordId || issues[0]?.id || 1),
        userId: Number(fineForm.userId || patrons[0]?.id || 5),
        fineAmount: Number(fineForm.fineAmount) || 5.0,
        reason: fineForm.reason || 'Overdue penalty assessment',
      };
      await assessFine(payload);
      setShowFineModal(false);
      setSuccess('Penalty fine assessed and ledger updated.');
      setTimeout(() => setSuccess(''), 3500);
      fetchFines();
      if (onDataChange) onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create fine record.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handlePay = async (id) => {
    try {
      await payFine(id);
      setSuccess('Penalty fee successfully paid.');
      setTimeout(() => setSuccess(''), 3500);
      fetchFines();
      if (onDataChange) onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process fine payment.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleWaive = async (id) => {
    if (window.confirm('Waive this penalty assessment fee?')) {
      try {
        await waiveFine(id);
        setSuccess('Penalty fee successfully waived.');
        setTimeout(() => setSuccess(''), 3500);
        fetchFines();
        if (onDataChange) onDataChange();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to waive fine.');
        setTimeout(() => setError(''), 4000);
      }
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {isPatron ? 'My Overdue Fines & Payment History' : 'Library Financial Penalty Ledger'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPatron
              ? 'Review and clear overdue penalty balances'
              : 'Ledger & Real-Time Penalty Settlement Rate Ledger'}
          </p>
        </div>

        {isStaffOrAdmin && (
          <button
            onClick={() => {
              setFineForm({
                issueRecordId: issues[0]?.id || '',
                userId: patrons[0]?.id || '',
                fineAmount: 10.0,
                reason: 'Overdue loan penalty',
              });
              setShowFineModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            + Generate Ledger Penalty Fine
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-800 font-bold">×</button>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-800 font-bold">×</button>
        </div>
      )}

      {/* Table */}
      <div className="card-modern overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="table-header">
                <th className="py-3 px-4">LEDGER ID</th>
                <th className="py-3 px-4">TARGET BOOK VOLUME</th>
                <th className="py-3 px-4">PATRON ACCOUNT</th>
                <th className="py-3 px-4">ASSESSED FINE AMOUNT</th>
                <th className="py-3 px-4">PAYMENT / ASSESSMENT DATE</th>
                <th className="py-3 px-4">SETTLEMENT STATUS</th>
                <th className="py-3 px-4 text-right">LEDGER ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {fines.length > 0 ? (
                fines.map((f) => {
                  const bookTitle = f.bookTitle || (f.issueRecord && f.issueRecord.book && f.issueRecord.book.title) || 'Circulation Record';
                  const patron = f.userEmail || (f.user && (f.user.email || f.user.username)) || 'Patron Account';
                  const amount = f.fineAmount ? `$${Number(f.fineAmount).toFixed(2)}` : '$0.00';

                  let badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (f.status === 'PAID') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (f.status === 'WAIVED') badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <tr key={f.id} className="table-row">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 font-semibold">
                        #{f.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {bookTitle}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {patron}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {amount}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {f.paymentDate || f.assessmentDate || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`badge-pill border ${badgeColor}`}>
                          {f.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {f.status === 'PENDING' && (
                          <button
                            onClick={() => handlePay(f.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            Pay Now
                          </button>
                        )}

                        {isStaffOrAdmin && f.status === 'PENDING' && (
                          <button
                            onClick={() => handleWaive(f.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            Waive Fine
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No active penalty fines found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Assess Penalty Fine */}
      {showFineModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Assess Penalty Fine
              </h3>
              <button
                type="button"
                onClick={() => setShowFineModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateFine} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Circulation Record *
                </label>
                <select
                  required
                  value={fineForm.issueRecordId}
                  onChange={(e) => setFineForm({ ...fineForm, issueRecordId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select Checkout Record...</option>
                  {issues.map((i) => (
                    <option key={i.id} value={i.id}>
                      #{i.id} - {i.bookTitle || (i.book && i.book.title)} ({i.userEmail || (i.user && i.user.email)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patron Account *
                </label>
                {patrons.length > 0 ? (
                  <select
                    value={fineForm.userId}
                    onChange={(e) => setFineForm({ ...fineForm, userId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    {patrons.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName || p.username} ({p.email}) — ID: #{p.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={fineForm.userId}
                    onChange={(e) => setFineForm({ ...fineForm, userId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assessed Penalty Fee ($) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={fineForm.fineAmount}
                  onChange={(e) => setFineForm({ ...fineForm, fineAmount: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Fine
                </label>
                <input
                  type="text"
                  value={fineForm.reason}
                  onChange={(e) => setFineForm({ ...fineForm, reason: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  Create Fine
                </button>
                <button
                  type="button"
                  onClick={() => setShowFineModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinePaymentPage;
