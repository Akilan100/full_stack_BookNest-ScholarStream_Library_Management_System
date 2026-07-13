import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFines } from '../store/slices/finePaymentSlice';
import finePaymentService from '../services/finePaymentService';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  WAIVED: 'bg-slate-100 text-slate-600',
};

function FinePaymentPage({ users, issueRecords }) {
  const dispatch = useDispatch();
  const { fines, loading } = useSelector(s => s.finePayment);
  const auth = useSelector(s => s.auth);
  const isStaff = ['LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN'].includes(auth.role);

  const [showForm, setShowForm] = useState(false);
  const [formIssueId, setFormIssueId] = useState('');
  const [formUserId, setFormUserId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const load = () => finePaymentService.getAll().then(r => dispatch(setFines(r.data)));

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      showToast('Fine created successfully.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create fine.');
    }
  };

  const handlePay = async (id) => {
    try {
      await finePaymentService.payFine(id);
      load();
      showToast('Fine paid successfully.');
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to pay fine.');
    }
  };

  const handleWaive = async (id) => {
    if (!window.confirm('Waive this fine?')) return;
    try {
      await finePaymentService.waiveFine(id);
      load();
      showToast('Fine waived.');
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to waive fine.');
    }
  };

  return (
    <div className="p-6">
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">{toast}</div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Fine Payments</h2>
        {isStaff && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            + Generate Fine
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Generate Fine</h3>
            {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Issue Record</label>
                <select
                  value={formIssueId}
                  onChange={e => setFormIssueId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select issue record...</option>
                  {(issueRecords || []).map(r => (
                    <option key={r.id} value={r.id}>#{r.id} — {r.bookTitle} ({r.status})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Patron</label>
                <select
                  value={formUserId}
                  onChange={e => setFormUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a patron...</option>
                  {(users || []).map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Create Fine</button>
                <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Book</th>
                <th className="px-4 py-3 font-medium">Patron</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fines.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No fine records found.</td></tr>
              )}
              {fines.map(f => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{f.bookTitle || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{f.accountFullName}<br /><span className="text-xs text-slate-400">{f.accountEmail}</span></td>
                  <td className="px-4 py-3 text-slate-800 font-medium">${f.amount}</td>
                  <td className="px-4 py-3 text-slate-600">{f.paymentDate ? new Date(f.paymentDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[f.paymentStatus] || 'bg-slate-100 text-slate-600'}`}>{f.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {f.paymentStatus === 'PENDING' && (
                        <button onClick={() => handlePay(f.id)} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition">Pay</button>
                      )}
                      {f.paymentStatus === 'PENDING' && isStaff && (
                        <button onClick={() => handleWaive(f.id)} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs hover:bg-slate-200 transition">Waive</button>
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
