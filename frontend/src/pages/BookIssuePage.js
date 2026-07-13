import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setRecords } from '../store/slices/bookIssueRecordSlice';
import bookIssueService from '../services/bookIssueService';

const STATUS_COLORS = {
  ISSUED: 'bg-blue-100 text-blue-700',
  RETURNED: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  LOST: 'bg-gray-100 text-gray-700',
};

function BookIssuePage({ users, books }) {
  const dispatch = useDispatch();
  const { records, loading } = useSelector(s => s.bookIssueRecord);
  const auth = useSelector(s => s.auth);
  const isStaff = ['LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN'].includes(auth.role);

  const [showForm, setShowForm] = useState(false);
  const [formBookId, setFormBookId] = useState('');
  const [formUserId, setFormUserId] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const load = () => bookIssueService.getAll().then(r => dispatch(setRecords(r.data)));

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleIssue = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await bookIssueService.issueBook({
        libraryBookId: Number(formBookId),
        libraryAccountId: Number(formUserId),
        dueDate: formDueDate ? formDueDate + ':00' : undefined,
      });
      setShowForm(false);
      setFormBookId(''); setFormUserId(''); setFormDueDate('');
      load();
      showToast('Book issued successfully.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to issue book.');
    }
  };

  const handleReturn = async (id) => {
    try {
      await bookIssueService.returnBook(id);
      load();
      showToast('Book returned successfully.');
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to return book.');
    }
  };

  const handleLost = async (id) => {
    if (!window.confirm('Mark this book as lost?')) return;
    try {
      await bookIssueService.markLost(id);
      load();
      showToast('Book marked as lost.');
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to mark lost.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this issue record?')) return;
    try {
      await bookIssueService.delete(id);
      load();
      showToast('Record deleted.');
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
        <h2 className="text-xl font-bold text-slate-800">Book Issues</h2>
        {isStaff && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            + Issue Book
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Issue Book to Patron</h3>
            {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
            <form onSubmit={handleIssue} className="space-y-3">
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
                    <option key={b.id} value={b.id}>{b.title} ({b.availableCopies} available)</option>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date (optional)</label>
                <input
                  type="datetime-local"
                  value={formDueDate}
                  onChange={e => setFormDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Issue</button>
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
                <th className="px-4 py-3 font-medium">Issue Date</th>
                <th className="px-4 py-3 font-medium">Due Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Fine</th>
                {isStaff && <th className="px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 && (
                <tr><td colSpan={isStaff ? 7 : 6} className="px-4 py-8 text-center text-slate-400">No issue records found.</td></tr>
              )}
              {records.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.bookTitle}</td>
                  <td className="px-4 py-3 text-slate-600">{r.accountFullName}<br /><span className="text-xs text-slate-400">{r.accountEmail}</span></td>
                  <td className="px-4 py-3 text-slate-600">{r.issueDate ? new Date(r.issueDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || 'bg-slate-100 text-slate-600'}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.fineAmount > 0 ? `$${r.fineAmount}` : '-'}</td>
                  {isStaff && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {r.status === 'ISSUED' && (
                          <>
                            <button onClick={() => handleReturn(r.id)} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition">Return</button>
                            <button onClick={() => handleLost(r.id)} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 transition">Lost</button>
                          </>
                        )}
                        <button onClick={() => handleDelete(r.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition">Delete</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BookIssuePage;
