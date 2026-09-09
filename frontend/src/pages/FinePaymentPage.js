import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { setFines } from '../store/slices/finePaymentSlice';
import { finePaymentService } from '../services/finePaymentService';

const STATUS_BADGES = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  PAID: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  WAIVED: 'bg-slate-100 text-slate-600 border-slate-200',
};

function FinePaymentPage({ users: propUsers, issueRecords: propIssueRecords }) {
  const dispatch = useDispatch();
  const { fines } = useSelector(s => s.finePayment);
  const auth = useSelector(s => s.auth);
  const isStaff = ['LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN'].includes(auth.role);
  const isPatron = auth.role === 'LIBRARY_PATRON';

  const [localIssues, setLocalIssues] = useState([]);
  const [localUsers, setLocalUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formIssueId, setFormIssueId] = useState('');
  const [formUserId, setFormUserId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const issueRecords = propIssueRecords && propIssueRecords.length > 0 ? propIssueRecords : localIssues;
  const users = propUsers && propUsers.length > 0 ? propUsers : localUsers;

  const load = () => {
    const fetcher = isPatron ? finePaymentService.getMy : finePaymentService.getAll;
    fetcher()
      .then(r => dispatch(setFines(r.data || [])))
      .catch(err => {
        console.error('Error loading fines:', err);
      });
  };

  useEffect(() => {
    load();
    if (isStaff && (!propIssueRecords || propIssueRecords.length === 0)) {
      axios.get('/api/book-issues').then(r => {
        setLocalIssues(r.data || []);
      }).catch(() => {});
    }
    if (isStaff && (!propUsers || propUsers.length === 0)) {
      axios.get('/api/auth/users').then(r => {
        setLocalUsers(r.data || []);
      }).catch(() => {});
    }
  }, [auth.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await finePaymentService.createFine({
        bookIssueRecordId: Number(formIssueId),
        libraryAccountId: Number(formUserId),
        amount: parseFloat(formAmount),
      });
      setShowForm(false);
      setFormIssueId(''); setFormUserId(''); setFormAmount('');
      load();
      showToast('Fine assessed successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to assess fine.');
    }
  };

  const handlePay = async (id) => {
    try {
      await finePaymentService.payFine(id);
      load();
      showToast('Fine balance settled successfully.');
    } catch (err) {
      showToast(err?.response?.data?.message || err?.response?.data?.error || 'Failed to process payment.');
    }
  };

  const handleWaive = async (id) => {
    if (!window.confirm('Waive this assessed fine balance?')) return;
    try {
      await finePaymentService.waiveFine(id);
      load();
      showToast('Fine waived.');
    } catch (err) {
      showToast(err?.response?.data?.message || err?.response?.data?.error || 'Failed to waive fine.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-xl z-50 text-sm font-semibold flex items-center gap-2">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header & Controls Toolbar (SRS Page 32) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {isPatron ? 'My Overdue Fines & Payment History' : 'Library Financial Penalty Ledger'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isPatron ? 'Review and clear overdue penalty balances' : 'Ledger & Real-Time Penalty Settlement Rate Ledger'}
            </p>
          </div>

          {isStaff && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2 shrink-0"
            >
              <span>+ Generate Fine</span>
            </button>
          )}
        </div>
      </div>

      {/* Fines Table (SRS Page 32 Table) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Ledger ID</th>
                <th className="px-5 py-3.5">Target Book Volume</th>
                <th className="px-5 py-3.5">Patron Account</th>
                <th className="px-5 py-3.5">Assessed Fine Amount</th>
                <th className="px-5 py-3.5">Payment / Assessment Date</th>
                <th className="px-5 py-3.5">Settlement Status</th>
                <th className="px-5 py-3.5 text-right">Ledger Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(fines || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-400">
                    No financial penalty ledger records found.
                  </td>
                </tr>
              ) : (
                fines.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-500">#{f.id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{f.bookTitle || `Record #${f.bookIssueRecordId}`}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-bold text-slate-800">{f.accountFullName || 'Patron User'}</div>
                      <div className="text-[11px] text-slate-400">{f.accountEmail || `Account #${f.libraryAccountId}`}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm font-bold text-slate-800">
                      ${Number(f.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {f.paymentDate ? new Date(f.paymentDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${STATUS_BADGES[f.paymentStatus] || 'bg-slate-100 text-slate-700'}`}>
                        {f.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {f.paymentStatus === 'PENDING' && (
                          <button
                            onClick={() => handlePay(f.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                          >
                            Pay Now
                          </button>
                        )}
                        {isStaff && f.paymentStatus === 'PENDING' && (
                          <button
                            onClick={() => handleWaive(f.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                          >
                            Waive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Fine Modal (SRS Page 32 Modal) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" role="dialog">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Assess Penalty Fine</h3>
              <button
                onClick={() => { setShowForm(false); setError(''); }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Issue Record <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formIssueId}
                  onChange={e => {
                    const issId = e.target.value;
                    setFormIssueId(issId);
                    const matched = (issueRecords || []).find(r => String(r.id) === String(issId));
                    if (matched && matched.libraryAccountId) {
                      setFormUserId(String(matched.libraryAccountId));
                    }
                  }}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select issue record...</option>
                  {(issueRecords || []).map(r => (
                    <option key={r.id} value={r.id}>
                      #{r.id} — {r.bookTitle || `Volume #${r.libraryBookId}`} ({r.accountFullName || r.accountEmail || 'Patron'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Patron Account <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formUserId}
                  onChange={e => setFormUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select a patron...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Penalty Amount ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="20.00"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Create Fine
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
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
export { FinePaymentPage };
