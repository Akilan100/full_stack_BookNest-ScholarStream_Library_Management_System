import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { setHolds } from '../store/slices/bookHoldRequestSlice';

export const placeHold = async (payload) => {
  return await axios.post('/api/holds', payload);
};

export const markHoldReadyForPickup = async (id) => {
  return await axios.put(`/api/holds/${id}/ready`);
};

export const fulfillHoldCheckout = async (id) => {
  return await axios.put(`/api/holds/${id}/fulfill`);
};

export const cancelHold = async (id) => {
  return await axios.put(`/api/holds/${id}/cancel`);
};

export const deleteHold = async (id) => {
  return await axios.delete(`/api/holds/${id}`);
};

function BookHoldPage({ books = [], onDataChange }) {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth);
  const holdsState = useSelector((s) => s.holds) || { list: [] };
  const holds = Array.isArray(holdsState) ? holdsState : holdsState.list || [];

  const [loading, setLoading] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [patrons, setPatrons] = useState([]);

  const [holdForm, setHoldForm] = useState({
    bookId: '',
    userId: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isPatron = auth.role === 'LIBRARY_PATRON';
  const isStaffOrAdmin = auth.role === 'CHIEF_LIBRARIAN' || auth.role === 'LIBRARIAN_STAFF' || auth.role === 'ROLE_ADMIN' || auth.role === 'ADMIN';

  useEffect(() => {
    fetchHolds();
    if (isStaffOrAdmin) {
      fetchPatrons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.token, auth.role]);

  const fetchHolds = async () => {
    setLoading(true);
    try {
      const endpoint = isPatron ? '/api/holds/my' : '/api/holds';
      const res = await axios.get(endpoint);
      dispatch(setHolds(res.data));
    } catch (err) {
      console.error('Failed to load hold records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatrons = async () => {
    try {
      const res = await axios.get('/api/auth/users');
      setPatrons(res.data.filter((u) => u.role === 'LIBRARY_PATRON' || !u.role));
    } catch (err) {
      console.error('Failed to fetch patrons:', err);
    }
  };

  const handleHoldSubmit = async (e) => {
    e.preventDefault();
    if (!holdForm.bookId) {
      setError('Please select a target library volume.');
      return;
    }

    try {
      const payload = {
        bookId: Number(holdForm.bookId),
        userId: Number(holdForm.userId || (patrons[0]?.id || 5)),
      };
      await placeHold(payload);
      setShowHoldModal(false);
      setSuccess('Item queue reservation confirmed.');
      setTimeout(() => setSuccess(''), 3500);
      fetchHolds();
      if (onDataChange) onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place hold reservation.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleReady = async (id) => {
    try {
      await markHoldReadyForPickup(id);
      setSuccess('Hold staged as READY_FOR_PICKUP. Patron notified.');
      setTimeout(() => setSuccess(''), 3500);
      fetchHolds();
      if (onDataChange) onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update hold status.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleFulfill = async (id) => {
    try {
      await fulfillHoldCheckout(id);
      setSuccess('Hold fulfilled and issued to borrower.');
      setTimeout(() => setSuccess(''), 3500);
      fetchHolds();
      if (onDataChange) onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fulfill hold.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Cancel this hold queue reservation?')) {
      try {
        await cancelHold(id);
        setSuccess('Hold reservation cancelled.');
        setTimeout(() => setSuccess(''), 3500);
        fetchHolds();
        if (onDataChange) onDataChange();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to cancel hold.');
        setTimeout(() => setError(''), 4000);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Permanently remove this hold request from the log?')) {
      try {
        await deleteHold(id);
        setSuccess('Hold request record deleted.');
        setTimeout(() => setSuccess(''), 3500);
        fetchHolds();
        if (onDataChange) onDataChange();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete hold.');
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
            {isPatron ? 'My Book Hold Requests & Queue' : 'Master Hold Reservation Queues'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review priority waitlists, stage pickup readiness, and fulfill checkout requests
          </p>
        </div>

        <button
          onClick={() => {
            setHoldForm({
              bookId: books[0]?.id || '',
              userId: patrons[0]?.id || '',
            });
            setShowHoldModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          + Reserve Place in Item Line Queue
        </button>
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
                <th className="py-3 px-4">QUEUE ID</th>
                <th className="py-3 px-4">TARGET BOOK TITLE</th>
                <th className="py-3 px-4">REQUESTING PATRON</th>
                <th className="py-3 px-4">QUEUE ENTRANCE DATE</th>
                <th className="py-3 px-4">PROJECTED EXPIRY BOUND</th>
                <th className="py-3 px-4">QUEUE STATE</th>
                <th className="py-3 px-4 text-right">RESOLUTION ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {holds.length > 0 ? (
                holds.map((h) => {
                  const bookTitle = h.bookTitle || (h.book && h.book.title) || 'Catalogue Volume';
                  const patron = h.patronEmail || (h.user && (h.user.email || h.user.username)) || 'Patron Account';

                  let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (h.status === 'READY_FOR_PICKUP') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (h.status === 'FULFILLED') badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (h.status === 'CANCELLED') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <tr key={h.id} className="table-row">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 font-semibold">
                        #{h.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {bookTitle}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {patron}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {h.requestDate || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {h.expiryDate || 'Standard Term'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`badge-pill border ${badgeColor}`}>
                          {h.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {isStaffOrAdmin && h.status === 'PENDING' && (
                          <button
                            onClick={() => handleReady(h.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            Ready for Pickup
                          </button>
                        )}

                        {isStaffOrAdmin && (h.status === 'PENDING' || h.status === 'READY_FOR_PICKUP') && (
                          <button
                            onClick={() => handleFulfill(h.id)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            Fulfill Checkout
                          </button>
                        )}

                        {(h.status === 'PENDING' || h.status === 'READY_FOR_PICKUP') && (
                          <button
                            onClick={() => handleCancel(h.id)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}

                        {isStaffOrAdmin && (
                          <button
                            onClick={() => handleDelete(h.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No hold reservations currently in queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Reserve Place in Item Line Queue */}
      {showHoldModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Reserve Place in Item Line Queue
              </h3>
              <button
                type="button"
                onClick={() => setShowHoldModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleHoldSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Catalogue Volume *
                </label>
                <select
                  required
                  value={holdForm.bookId}
                  onChange={(e) => setHoldForm({ ...holdForm, bookId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select Catalogue Book...</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.author}) — Copies: {b.availableCopies !== undefined ? b.availableCopies : b.totalCopies}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patron Account ID *
                </label>
                {patrons.length > 0 ? (
                  <select
                    value={holdForm.userId}
                    onChange={(e) => setHoldForm({ ...holdForm, userId: e.target.value })}
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
                    placeholder="Enter numerical Patron ID (e.g. 5)"
                    value={holdForm.userId}
                    onChange={(e) => setHoldForm({ ...holdForm, userId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Reserving under verified patron identity queue position
                </p>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm Hold Reservation'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowHoldModal(false)}
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

export default BookHoldPage;
