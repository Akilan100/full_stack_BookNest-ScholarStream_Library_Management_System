import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { setRecords } from '../store/slices/bookIssueRecordSlice';
import { bookIssueService } from '../services/bookIssueService';

const STATUS_BADGES = {
  ISSUED: 'bg-blue-100 text-blue-800 border-blue-200',
  RETURNED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  OVERDUE: 'bg-rose-100 text-rose-800 border-rose-200',
  LOST: 'bg-slate-100 text-slate-700 border-slate-300',
};

function BookIssuePage({ users: propUsers, books: propBooks }) {
  const dispatch = useDispatch();
  const { records } = useSelector(s => s.bookIssueRecord);
  const auth = useSelector(s => s.auth);
  const isStaff = ['LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN'].includes(auth.role);
  const isPatron = auth.role === 'LIBRARY_PATRON';

  const [localBooks, setLocalBooks] = useState([]);
  const [localUsers, setLocalUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formBookId, setFormBookId] = useState('');
  const [formUserId, setFormUserId] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const books = propBooks && propBooks.length > 0 ? propBooks : localBooks;
  const users = propUsers && propUsers.length > 0 ? propUsers : localUsers;

  const load = () => {
    const fetcher = isPatron ? bookIssueService.getMy : bookIssueService.getAll;
    fetcher()
      .then(r => dispatch(setRecords(r.data || [])))
      .catch(err => {
        console.error('Error loading issue records:', err);
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

  const handleIssue = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await bookIssueService.issueBook({
        libraryBookId: Number(formBookId),
        libraryAccountId: Number(formUserId || auth.accountId),
        dueDate: formDueDate ? formDueDate + ':00' : undefined,
      });
      setShowForm(false);
      setFormBookId(''); setFormUserId(''); setFormDueDate('');
      load();
      showToast('Book issued successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to issue book.');
    }
  };

  const handleReturn = async (id) => {
    try {
      await bookIssueService.returnBook(id);
      load();
      showToast('Book returned successfully.');
    } catch (err) {
      showToast(err?.response?.data?.message || err?.response?.data?.error || 'Failed to return book.');
    }
  };

  const handleLost = async (id) => {
    if (!window.confirm('Mark this book as lost?')) return;
    try {
      await bookIssueService.markLost(id);
      load();
      showToast('Book marked as lost.');
    } catch (err) {
      showToast(err?.response?.data?.message || err?.response?.data?.error || 'Failed to mark lost.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this issue record?')) return;
    try {
      await bookIssueService.delete(id);
      load();
      showToast('Record deleted.');
    } catch (err) {
      showToast(err?.response?.data?.message || err?.response?.data?.error || 'Failed to delete.');
    }
  };

  const filteredRecords = (records || []).filter(r => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-xl z-50 text-sm font-semibold flex items-center gap-2">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Header & Controls Toolbar (SRS Page 30 Bottom) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {isPatron ? 'My Issued Books & Lending History' : 'Circulation Desk Checkouts'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isPatron ? 'Track your active checkouts, loan terms, and due dates' : 'Manage active book checkouts, returns, inventory status, and circulation tracking'}
            </p>
          </div>

          {isStaff && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2 shrink-0"
            >
              <span>+ Issue Book to Patron</span>
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Filter tracking logs by lifecycle state:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All States</option>
              <option value="ISSUED">ISSUED (Active Out)</option>
              <option value="RETURNED">RETURNED</option>
              <option value="OVERDUE">OVERDUE</option>
              <option value="LOST">LOST</option>
            </select>
          </div>

          {statusFilter !== 'ALL' && (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Circulation Table (SRS Page 30 Table Columns) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Tracking ID</th>
                <th className="px-5 py-3.5">Volume Title</th>
                <th className="px-5 py-3.5">Borrower Account</th>
                <th className="px-5 py-3.5">Checkout Timestamp</th>
                <th className="px-5 py-3.5">Target Due Date</th>
                <th className="px-5 py-3.5">Lifecycle Status</th>
                <th className="px-5 py-3.5">Fine Balance</th>
                <th className="px-5 py-3.5 text-right">Desk Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-400">
                    No circulation checkouts match current criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-500">#{rec.id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{rec.bookTitle || `Volume #${rec.libraryBookId}`}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-bold text-slate-800">{rec.accountFullName || 'Patron User'}</div>
                      <div className="text-[11px] text-slate-400">{rec.accountEmail || `Account #${rec.libraryAccountId}`}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {rec.issueDate ? new Date(rec.issueDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {rec.dueDate ? new Date(rec.dueDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${STATUS_BADGES[rec.status] || 'bg-slate-100 text-slate-700'}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">
                      ${Number(rec.fineAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {rec.status === 'ISSUED' && (
                          <button
                            onClick={() => handleReturn(rec.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                          >
                            Return
                          </button>
                        )}
                        {isStaff && rec.status === 'ISSUED' && (
                          <button
                            onClick={() => handleLost(rec.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition"
                          >
                            Lost
                          </button>
                        )}
                        {isStaff && (
                          <button
                            onClick={() => handleDelete(rec.id)}
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

      {/* Issue Book Modal (SRS Page 31 Top Modal) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" role="dialog">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Issue Book at Circulation Desk</h3>
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

            <form onSubmit={handleIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Target Library Book Volume <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formBookId}
                  onChange={e => setFormBookId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a book volume...</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.availableCopies}/{b.totalCopies} available) - ISBN: {b.isbn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Borrowing Patron Account ID <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formUserId}
                  onChange={e => setFormUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a patron account...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      #{u.id} — {u.fullName} ({u.email}) [{u.role}]
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Must reference an active unsuspended patron ledger tracking profile
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Target Due Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formDueDate}
                  onChange={e => setFormDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Confirm Book Check-out
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

export default BookIssuePage;
export { BookIssuePage };
