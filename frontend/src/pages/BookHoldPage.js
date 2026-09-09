import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { setHolds } from '../store/slices/bookHoldRequestSlice';
import { bookHoldService } from '../services/bookHoldService';

const STATUS_BADGES = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  READY_FOR_PICKUP: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  FULFILLED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
};

function BookHoldPage({ users: propUsers, books: propBooks }) {
  const dispatch = useDispatch();
  const { holds } = useSelector(s => s.bookHoldRequest);
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-xl z-50 text-sm font-semibold flex items-center gap-2">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header & Controls Toolbar (SRS Page 31 Middle) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {isPatron ? 'My Book Hold Requests & Queue' : 'Master Hold Reservation Queues'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isPatron ? 'Manage your reserved titles waiting for physical shelf availability' : 'Review priority waitlists, stage pickup readiness, and fulfill checkout requests'}
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2 shrink-0"
          >
            <span>+ Place Hold</span>
          </button>
        </div>
      </div>

      {/* Holds Queue Table (SRS Page 31 Middle Table) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Queue ID</th>
                <th className="px-5 py-3.5">Target Book Title</th>
                <th className="px-5 py-3.5">Requesting Patron</th>
                <th className="px-5 py-3.5">Queue Entrance Date</th>
                <th className="px-5 py-3.5">Projected Expiry Bound</th>
                <th className="px-5 py-3.5">Queue State</th>
                <th className="px-5 py-3.5 text-right">Resolution Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(holds || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-400">
                    No active hold reservations currently in queue.
                  </td>
                </tr>
              ) : (
                holds.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-500">#{h.id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{h.bookTitle || `Volume #${h.libraryBookId}`}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-bold text-slate-800">{h.accountFullName || 'Patron User'}</div>
                      <div className="text-[11px] text-slate-400">{h.accountEmail || `Account #${h.libraryAccountId}`}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {h.requestDate ? new Date(h.requestDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {h.requestDate
                        ? new Date(new Date(h.requestDate).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
                        : '7 Days'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${STATUS_BADGES[h.status] || 'bg-slate-100 text-slate-700'}`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {isStaff && h.status === 'PENDING' && (
                          <button
                            onClick={() => handlePickup(h.id)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition"
                          >
                            Ready for Pickup
                          </button>
                        )}
                        {isStaff && h.status === 'READY_FOR_PICKUP' && (
                          <button
                            onClick={() => handleFulfill(h.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                          >
                            Fulfill Checkout
                          </button>
                        )}
                        {['PENDING', 'READY_FOR_PICKUP'].includes(h.status) && (
                          <button
                            onClick={() => handleCancel(h.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition"
                          >
                            Cancel
                          </button>
                        )}
                        {isStaff && (
                          <button
                            onClick={() => handleDelete(h.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                          >
                            Delete
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

      {/* Reserve Place in Queue Modal (SRS Page 31 Bottom Modal) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" role="dialog">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {isStaff ? 'Reserve Place in Item Line Queue' : 'Place Book Hold Request'}
              </h3>
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

            <form onSubmit={handlePlace} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Target Catalogue Volume <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formBookId}
                  onChange={e => setFormBookId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a book volume...</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title} (Available: {b.availableCopies}/{b.totalCopies}) - ISBN: {b.isbn}
                    </option>
                  ))}
                </select>
              </div>

              {isStaff ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Patron Account ID <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formUserId}
                    onChange={e => setFormUserId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a patron account...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        #{u.id} — {u.fullName} ({u.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Reserving under verified patron identity queue position
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                  Reserving under your verified patron account: <span className="font-bold text-slate-800">{auth.fullName}</span>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Confirm Hold
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

export default BookHoldPage;
export { BookHoldPage };
