import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { setFines } from '../store/slices/finePaymentSlice';
import { finePaymentService } from '../services/finePaymentService';

const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  WAIVED: 'bg-slate-100 text-slate-600',
};

function FinePaymentPage({ users: propUsers, issueRecords: propIssueRecords }) {
  const dispatch = useDispatch();
  const { fines, loading } = useSelector(s => s.finePayment);
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
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to create fine assessment.');
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
    <div className="p-6">
      {toast && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium">{toast}</div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {isPatron ? 'My Overdue Fines & Payment History' : 'Fine Management & Fee Collection'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPatron ? 'Review and clear overdue penalty balances' : 'Assess overdue penalty records, track settlement, and process fee waivers'}
          </p>
        </div>
        {isStaff && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            + Generate Fine
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Assess Penalty Fine</h3>
            {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Issue Record</label>
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select issue record...</option>
                  {(issueRecords || []).map(r => (
                    <option key={r.id} value={r.id}>#{r.id} — {r.bookTitle} ({r.accountFullName || r.accountEmail})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Patron Account</label>
                <select
                  value={formUserId}
                  onChange={e => setFormUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a patron...</option>
                  {(users || []).map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Penalty Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">Create Fine</button>
                <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Book Volume</th>
                <th className="px-4 py-3 font-semibold">Patron</th>
                <th className="px-4 py-3 font-semibold">Assessed Amount</th>
                <th className="px-4 py-3 font-semibold">Payment / Assessment Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!fines || fines.length === 0) && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No fine records or outstanding penalties found.</td></tr>
              )}
              {(fines || []).map(f => (
                <tr key={f.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-800">{f.bookTitle || 'Library Circulation Overdue'}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{f.accountFullName}</div>
                    <div className="text-xs text-slate-400">{f.accountEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-900 font-bold">${Number(f.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">{f.paymentDate ? new Date(f.paymentDate).toLocaleDateString() : (f.createdAt ? new Date(f.createdAt).toLocaleDateString() : 'Pending')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[f.paymentStatus] || 'bg-slate-100 text-slate-600'}`}>{f.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1.5 justify-end flex-wrap">
                      {f.paymentStatus === 'PENDING' && (
                        <button onClick={() => handlePay(f.id)} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-medium hover:bg-emerald-100 transition">Pay Now</button>
                      )}
                      {f.paymentStatus === 'PENDING' && isStaff && (
                        <button onClick={() => handleWaive(f.id)} className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium hover:bg-slate-200 transition">Waive</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FinePaymentPage;
