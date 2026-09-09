import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { setHolds } from '../store/slices/bookHoldRequestSlice';
import { bookHoldService } from '../services/bookHoldService';

const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-800',
  READY_FOR_PICKUP: 'bg-indigo-100 text-indigo-800',
  FULFILLED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-slate-100 text-slate-600',
};

function BookHoldPage({ users: propUsers, books: propBooks }) {
  const dispatch = useDispatch();
  const { holds, loading } = useSelector(s => s.bookHoldRequest);
  const auth = useSelector(s => s.auth);
  const isStaff = ['LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN'].includes(auth.role);
  const isPatron = auth.role === 'LIBRARY_PATRON';

  const [localBooks, setLocalBooks] = useState([]);
  const [localUsers, setLocalUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formBookId, setFormBookId] = useState('');
  const [formUserId, setFormUserId] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const books = propBooks && propBooks.length > 0 ? propBooks : localBooks;
  const users = propUsers && propUsers.length > 0 ? propUsers : localUsers;

  const load = () => {
    const fetcher = isPatron ? bookHoldService.getMy : bookHoldService.getAll;
    fetcher()
      .then(r => dispatch(setHolds(r.data || [])))
      .catch(err => {
        console.error('Error loading holds:', err);
      });
  };

  useEffect(() => {
    load();
    if (!propBooks || propBooks.length === 0) {
      axios.get('/api/books').then(r => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.content || []);
        setLocalBooks(list);
      }).catch(() => {});
    }
    if (isStaff && (!propUsers || propUsers.length === 0)) {
      axios.get('/api/auth/users').then(r => {
        setLocalUsers(r.data || []);
      }).catch(() => {});
    }
  }, [auth.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handlePlace = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        libraryBookId: Number(formBookId),
      };
      if (isStaff && formUserId) {
        payload.libraryAccountId = Number(formUserId);
      }
      await bookHoldService.placeHold(payload);
      setShowForm(false);
      setFormBookId(''); setFormUserId('');
      load();
      showToast('Hold request placed successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to place hold request.');
    }
  };

  const handleCancel = async (id) => {
    try {
      await bookHoldService.cancelHold(id);
      load();
      showToast('Hold reservation cancelled.');
    } catch (err) {
      showToast(err?.response?.data?.message || err?.response?.data?.error || 'Failed to cancel hold.');
    }
  };

  const handlePickup = async (id) => {
    try {
      await bookHoldService.markReadyForPickup(id);
      load();
      showToast('Hold marked ready for pickup.');
    } catch (err) {
      showToast(err?.response?.data?.message || err?.response?.data?.error || 'Failed to update hold.');
    }
  };

  const handleFulfill = async (id) => {
    try {
      await bookHoldService.fulfillHold(id);
      load();
      showToast('Hold fulfilled and issued to patron.');
    } catch (err) {
      showToast(err?.response?.data?.message || err?.response?.data?.error || 'Failed to fulfill hold.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this hold request permanently?')) return;
    try {
      await bookHoldService.delete(id);
      load();
      showToast('Hold record deleted.');
    } catch (err) {
      showToast(err?.response?.data?.message || err?.response?.data?.error || 'Failed to delete.');
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
            {isPatron ? 'My Book Hold Requests & Queue' : 'Book Holds & Reservation Queue'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPatron ? 'Manage your reserved titles waiting for availability' : 'Review priority waitlists, stage pickup readiness, and fulfill checkout requests'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
        >
          + Place Hold
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Place Book Hold Request</h3>
            {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
            <form onSubmit={handlePlace} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Book Volume</label>
                <select
                  value={formBookId}
                  onChange={e => setFormBookId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a book...</option>
                  {(books || []).map(b => (
                    <option key={b.id} value={b.id}>{b.title} (Available: {b.availableCopies}/{b.totalCopies})</option>
                  ))}
                </select>
              </div>
              {isStaff && (
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
              )}
              {isPatron && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                  Reserving under your account: <strong className="text-slate-800">{auth.fullName || auth.email}</strong>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">Confirm Hold</button>
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
                <th className="px-4 py-3 font-semibold">Book Title</th>
                <th className="px-4 py-3 font-semibold">Patron</th>
                <th className="px-4 py-3 font-semibold">Request Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!holds || holds.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No active hold requests found in queue.</td></tr>
              )}
              {(holds || []).map(h => (
                <tr key={h.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-medium text-slate-800">{h.bookTitle}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{h.accountFullName}</div>
                    <div className="text-xs text-slate-400">{h.accountEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{h.requestDate ? new Date(h.requestDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[h.status] || 'bg-slate-100 text-slate-600'}`}>{h.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1.5 justify-end flex-wrap">
                      {h.status === 'PENDING' && isStaff && (
                        <button onClick={() => handlePickup(h.id)} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-xs font-medium hover:bg-indigo-100 transition">Ready for Pickup</button>
                      )}
                      {h.status === 'READY_FOR_PICKUP' && isStaff && (
                        <button onClick={() => handleFulfill(h.id)} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-medium hover:bg-emerald-100 transition">Fulfill Checkout</button>
                      )}
                      {(h.status === 'PENDING' || h.status === 'READY_FOR_PICKUP') && (
                        <button onClick={() => handleCancel(h.id)} className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-medium hover:bg-amber-100 transition">Cancel</button>
                      )}
                      {isStaff && (
                        <button onClick={() => handleDelete(h.id)} className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-medium hover:bg-rose-100 transition">Delete</button>
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
