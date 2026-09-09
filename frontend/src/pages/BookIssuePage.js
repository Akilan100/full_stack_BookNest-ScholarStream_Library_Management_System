import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { setRecords } from '../store/slices/bookIssueRecordSlice';

export const issueBook = async (payload) => {
  return await axios.post('/api/issues', payload);
};

export const returnBook = async (id) => {
  return await axios.put(`/api/issues/${id}/return`);
};

export const markBookLost = async (id) => {
  return await axios.put(`/api/issues/${id}/lost`);
};

export const deleteIssueRecord = async (id) => {
  return await axios.delete(`/api/issues/${id}`);
};

function BookIssuePage({ books = [], onDataChange }) {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth);
  const issueRecordsState = useSelector((s) => s.issueRecords) || { list: [] };
  const records = Array.isArray(issueRecordsState) ? issueRecordsState : issueRecordsState.list || [];

  const [filterState, setFilterState] = useState('ALL');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [patrons, setPatrons] = useState([]);

  const [issueForm, setIssueForm] = useState({
    bookId: '',
    userId: '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isPatron = auth.role === 'LIBRARY_PATRON';
  const isStaffOrAdmin = auth.role === 'CHIEF_LIBRARIAN' || auth.role === 'LIBRARIAN_STAFF' || auth.role === 'ROLE_ADMIN' || auth.role === 'ADMIN';

  useEffect(() => {
    fetchRecords();
    if (isStaffOrAdmin) {
      fetchPatrons();
    }
  }, [auth.token, auth.role]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const endpoint = isPatron ? '/api/issues/my' : '/api/issues';
      const res = await axios.get(endpoint);
      dispatch(setRecords(res.data));
    } catch (err) {
      console.error('Failed to load issue records:', err);
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

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueForm.bookId) {
      setError('Please select a target library book volume.');
      return;
    }

    try {
      const payload = {
        bookId: Number(issueForm.bookId),
        userId: Number(issueForm.userId || (patrons[0]?.id || 5)),
        dueDate: issueForm.dueDate,
      };
      await issueBook(payload);
      setShowIssueModal(false);
      setSuccess('Book volume successfully checked out.');
      setTimeout(() => setSuccess(''), 3500);
      fetchRecords();
      if (onDataChange) onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue book. Volume may be unavailable.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleReturn = async (id) => {
    try {
      await returnBook(id);
      setSuccess('Book return processed and inventory restocked.');
      setTimeout(() => setSuccess(''), 3500);
      fetchRecords();
      if (onDataChange) onDataChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process return.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleMarkLost = async (id) => {
    if (window.confirm('Mark this volume as LOST and assess replacement penalty?')) {
      try {
        await markBookLost(id);
        setSuccess('Volume marked as lost.');
        setTimeout(() => setSuccess(''), 3500);
        fetchRecords();
        if (onDataChange) onDataChange();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to update lost status.');
        setTimeout(() => setError(''), 4000);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this circulation checkout record permanently?')) {
      try {
        await deleteIssueRecord(id);
        setSuccess('Circulation log record deleted.');
        setTimeout(() => setSuccess(''), 3500);
        fetchRecords();
        if (onDataChange) onDataChange();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete circulation record.');
        setTimeout(() => setError(''), 4000);
      }
    }
  };

  const filteredRecords = records.filter((r) => {
    if (filterState === 'ALL') return true;
    return r.status === filterState;
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {isPatron ? 'My Issued Books & Lending History' : 'Circulation Desk Checkouts'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPatron
              ? 'View active borrowed loans, return deadlines, and loan history'
              : 'Audit active lending streams, process item checkouts and manage book returns'}
          </p>
        </div>

        {isStaffOrAdmin && (
          <button
            onClick={() => {
              setIssueForm({
                bookId: books.find((b) => (b.availableCopies !== undefined ? b.availableCopies : b.totalCopies) > 0)?.id || '',
                userId: patrons[0]?.id || '',
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              });
              setShowIssueModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            + Issue Book to Patron
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Filter tracking logs by lifecycle state:
          </span>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-slate-800 cursor-pointer"
          >
            <option value="ALL">All States</option>
            <option value="ISSUED">ISSUED (Active Out)</option>
            <option value="RETURNED">RETURNED</option>
            <option value="OVERDUE">OVERDUE</option>
            <option value="LOST">LOST</option>
          </select>
        </div>

        <button
          onClick={() => setFilterState('ALL')}
          className="w-full sm:w-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          Reset Filters
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
                <th className="py-3 px-4">TRACKING ID</th>
                <th className="py-3 px-4">VOLUME TITLE</th>
                <th className="py-3 px-4">BORROWER ACCOUNT</th>
                <th className="py-3 px-4">CHECKOUT TIMESTAMP</th>
                <th className="py-3 px-4">TARGET DUE DATE</th>
                <th className="py-3 px-4">LIFECYCLE STATUS</th>
                <th className="py-3 px-4">FINE BALANCE</th>
                <th className="py-3 px-4 text-right">DESK OPERATIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => {
                  const bookTitle = r.bookTitle || (r.book && r.book.title) || 'Library Volume';
                  const borrower = r.userEmail || (r.user && (r.user.email || r.user.username)) || 'Patron Account';
                  const fine = r.fineAmount ? `$${Number(r.fineAmount).toFixed(2)}` : '$0.00';

                  let statusBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                  if (r.status === 'RETURNED') statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (r.status === 'OVERDUE') statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (r.status === 'LOST') statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <tr key={r.id} className="table-row">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 font-semibold">
                        #{r.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {bookTitle}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {borrower}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {r.issueDate || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {r.dueDate || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`badge-pill border ${statusBadge}`}>
                          {r.status || 'ISSUED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {fine}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {r.status === 'ISSUED' && (
                          <button
                            onClick={() => handleReturn(r.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            Process Return
                          </button>
                        )}

                        {isStaffOrAdmin && r.status === 'ISSUED' && (
                          <button
                            onClick={() => handleMarkLost(r.id)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            Mark Lost
                          </button>
                        )}

                        {isStaffOrAdmin && (
                          <button
                            onClick={() => handleDelete(r.id)}
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
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No circulation records found for this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Issue Book at Circulation Desk */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Issue Book at Circulation Desk
              </h3>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Library Book Volume *
                </label>
                <select
                  required
                  value={issueForm.bookId}
                  onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Select Catalogue Volume...</option>
                  {books.map((b) => {
                    const avail = b.availableCopies !== undefined ? b.availableCopies : b.totalCopies;
                    return (
                      <option key={b.id} value={b.id} disabled={avail <= 0}>
                        {b.title} ({avail} available) — ISBN: {b.isbn}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Borrowing Patron Account ID *
                </label>
                {patrons.length > 0 ? (
                  <select
                    value={issueForm.userId}
                    onChange={(e) => setIssueForm({ ...issueForm, userId: e.target.value })}
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
                    value={issueForm.userId}
                    onChange={(e) => setIssueForm({ ...issueForm, userId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Must reference an active unsuspended patron ledger tracking profile
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={issueForm.dueDate}
                  onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  Confirm Book Check-out
                </button>
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
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

export default BookIssuePage;
