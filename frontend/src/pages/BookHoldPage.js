import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setHolds } from '../store/slices/bookHoldRequestSlice';
import bookHoldService from '../services/bookHoldService';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  READY_FOR_PICKUP: 'bg-blue-100 text-blue-700',
  FULFILLED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

function BookHoldPage({ users, books }) {
  const dispatch = useDispatch();
  const { holds, loading } = useSelector(s => s.bookHoldRequest);
  const auth = useSelector(s => s.auth);
  const isStaff = ['LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN'].includes(auth.role);

  const [showForm, setShowForm] = useState(false);
  const [formBookId, setFormBookId] = useState('');
  const [formUserId, setFormUserId] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const load = () => bookHoldService.getAll().then(r => dispatch(setHolds(r.data)));

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handlePlace = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await bookHoldService.placeHold({
        libraryBookId: Number(formBookId),
        libraryAccountId: Number(formUserId),
      });
      setShowForm(false);
      setFormBookId(''); setFormUserId('');
      load();
      showToast('Hold placed successfully.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to place hold.');
    }
  };

  const handleCancel = async (id) => {
    try {
      await bookHoldService.cancelHold(id);
      load();
      showToast('Hold cancelled.');
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to cancel hold.');
    }
  };

  const handlePickup = async (id) => {
    try {
      await bookHoldService.markPickup(id);
      load();
      showToast('Hold marked ready for pickup.');
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to update hold.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hold request?')) return;
    try {
      await bookHoldService.delete(id);
      load();
      showToast('Hold deleted.');
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to delete.');
    }
  };

  return (
    <div className="p-6">
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">{toast}</div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">Book Holds</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Place Hold
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Place Book Hold</h3>
            {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
            <form onSubmit={handlePlace} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Book</label>
                <select
                  value={formBookId}
                  onChange={e => setFormBookId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a book...</option>
                  {(books || []).map(b => (
                    <option key={b.id} value={b.id}>{b.title}</option>
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
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Place Hold</button>
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
                <th className="px-4 py-3 font-medium">Request Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {holds.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No hold requests found.</td></tr>
              )}
              {holds.map(h => (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{h.bookTitle}</td>
                  <td className="px-4 py-3 text-slate-600">{h.accountFullName}<br /><span className="text-xs text-slate-400">{h.accountEmail}</span></td>
                  <td className="px-4 py-3 text-slate-600">{h.requestDate ? new Date(h.requestDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[h.status] || 'bg-slate-100 text-slate-600'}`}>{h.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {h.status === 'PENDING' && isStaff && (
                        <button onClick={() => handlePickup(h.id)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition">Ready</button>
                      )}
                      {(h.status === 'PENDING' || h.status === 'READY_FOR_PICKUP') && (
                        <button onClick={() => handleCancel(h.id)} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 transition">Cancel</button>
                      )}
                      {isStaff && (
                        <button onClick={() => handleDelete(h.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition">Delete</button>
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

export default BookHoldPage;
