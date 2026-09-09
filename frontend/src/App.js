import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { setAuth, clearAuth } from './store/slices/authSlice';
import { setBooks } from './store/slices/libraryBookSlice';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BookIssuePage from './pages/BookIssuePage';
import BookHoldPage from './pages/BookHoldPage';
import FinePaymentPage from './pages/FinePaymentPage';

const ROLES = ['LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN', 'LIBRARY_PATRON'];
const CATEGORIES = ['All Categories / Streams', 'Computer Science', 'Mathematics', 'Science', 'History', 'Software Engineering'];
const STAFF_ROLES = ['LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN'];

function App() {
  const dispatch = useDispatch();
  const auth = useSelector(s => s.auth);
  const { books, totalPages } = useSelector(s => s.libraryBook);
  const issueRecords = useSelector(s => s.bookIssueRecord.records);
  const holds = useSelector(s => s.bookHoldRequest.holds);
  const fines = useSelector(s => s.finePayment.fines);

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES[0]);
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');

  const [view, setView] = useState('catalogue');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories / Streams');
  const [page, setPage] = useState(0);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editBook, setEditBook] = useState(null);

  const [formIsbn, setFormIsbn] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formTotalCopies, setFormTotalCopies] = useState(1);
  const [formErrors, setFormErrors] = useState({});

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.token) return;
    const params = { page, size: 10 };
    if (search) params.title = search;
    if (category && category !== 'All Categories / Streams' && category !== 'All') {
      params.category = category;
    }
    axios.get('/api/books', { params }).then(res => {
      dispatch(setBooks(res.data));
    }).catch(() => {});
  }, [auth.token, search, category, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!auth.token) return;
    axios.get('/api/auth/users').then(res => {
      const data = res.data;
      setUsers(Array.isArray(data) ? data : (data?.content ?? []));
    }).catch(() => {});
  }, [auth.token]);

  const fetchBooks = () => {
    const params = { page, size: 10 };
    if (search) params.title = search;
    if (category && category !== 'All Categories / Streams' && category !== 'All') {
      params.category = category;
    }
    axios.get('/api/books', { params }).then(res => {
      dispatch(setBooks(res.data));
    }).catch(() => {});
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      dispatch(setAuth(res.data));
    } catch (err) {
      setAuthError(err?.response?.data?.error || err?.response?.data?.message || 'Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await axios.post('/api/auth/register', { email, password, role, fullName });
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      dispatch(setAuth(res.data));
    } catch (err) {
      setAuthError(err?.response?.data?.error || err?.response?.data?.message || 'Registration failed');
    }
  };

  const handleLogout = () => {
    delete axios.defaults.headers.common['Authorization'];
    dispatch(clearAuth());
    localStorage.clear();
  };

  const resetForm = () => {
    setFormIsbn('');
    setFormTitle('');
    setFormAuthor('');
    setFormCategory('');
    setFormTotalCopies(1);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formIsbn) errors.isbn = 'ISBN identifier is mandatory';
    if (!formTitle) errors.title = 'Volume title is mandatory';
    return errors;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    await axios.post('/api/books', {
      isbn: formIsbn,
      title: formTitle,
      author: formAuthor,
      category: formCategory,
      totalCopies: formTotalCopies
    });
    fetchBooks();
    setShowCreate(false);
    resetForm();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    await axios.put(`/api/books/${editBook.id}`, {
      isbn: formIsbn,
      title: formTitle,
      author: formAuthor,
      category: formCategory,
      totalCopies: formTotalCopies
    });
    fetchBooks();
    setShowEdit(false);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    await axios.delete(`/api/books/${id}`);
    fetchBooks();
  };

  const openEdit = (book) => {
    setEditBook(book);
    setFormIsbn(book.isbn);
    setFormTitle(book.title);
    setFormAuthor(book.author);
    setFormCategory(book.category);
    setFormTotalCopies(book.totalCopies);
    setFormErrors({});
    setShowEdit(true);
  };

  const handleLoginWithLoading = async (e) => {
    setLoading(true);
    await handleLogin(e);
    setLoading(false);
  };

  const handleRegisterWithLoading = async (e) => {
    setLoading(true);
    await handleRegister(e);
    setLoading(false);
  };

  const isStaff = STAFF_ROLES.includes(auth.role);

  if (!auth.token) {
    return (
      <LoginPage
        isRegister={isRegister}
        setIsRegister={setIsRegister}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        fullName={fullName}
        setFullName={setFullName}
        role={role}
        setRole={setRole}
        authError={authError}
        loading={loading}
        onLogin={handleLoginWithLoading}
        onRegister={handleRegisterWithLoading}
      />
    );
  }

  const NAV_ITEMS = [
    { key: 'home', label: 'Home' },
    { key: 'catalogue', label: 'Catalogue' },
    { key: 'issues', label: 'Lending' },
    { key: 'holds', label: 'Holds' },
    { key: 'fines', label: 'Fines' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Main Navigation (SRS Pages 29-32 Navbar) */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Brand Logo */}
            <div
              onClick={() => setView('home')}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-sm">
                📚
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-slate-900">BookNest</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    view === item.key
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-800">
                Welcome back! {auth.fullName || 'Chief Librarian'}
              </div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {auth.role || 'CHIEF_LIBRARIAN'}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        {view === 'home' && (
          <DashboardPage
            onNavigate={setView}
            books={books}
            issueRecords={issueRecords}
            holds={holds}
            fines={fines}
          />
        )}

        {view === 'catalogue' && (
          <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header & Controls Toolbar (SRS Page 30 Top) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                    Library Master Catalogue
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Search and browse indexed library volumes, check availability status, and initiate loans
                  </p>
                </div>

                {isStaff && (
                  <button
                    onClick={() => { resetForm(); setShowCreate(true); }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2 shrink-0"
                  >
                    <span>+ Add New Book</span>
                  </button>
                )}
              </div>

              {/* Search & Category Filter Toolbar */}
              <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-slate-100">
                <div className="relative flex-1 min-w-[260px]">
                  <input
                    placeholder="Search by book title or author name..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(0); }}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                </div>

                <select
                  value={category}
                  onChange={e => { setCategory(e.target.value); setPage(0); }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Catalogue Master Table (SRS Page 30 Table Columns) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">ISBN Number</th>
                      <th className="px-5 py-3.5">Volume Title</th>
                      <th className="px-5 py-3.5">Author / Creator</th>
                      <th className="px-5 py-3.5">Category / Shelf</th>
                      <th className="px-5 py-3.5">Availability</th>
                      <th className="px-5 py-3.5 text-right">Service Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {books.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">
                          No catalogue volumes match the query.
                        </td>
                      </tr>
                    ) : (
                      books.map(book => {
                        const total = book.totalCopies || 1;
                        const available = book.availableCopies ?? 0;
                        const pct = Math.round((available / total) * 100);

                        return (
                          <tr key={book.id} className="hover:bg-slate-50/80 transition">
                            <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-500">{book.isbn}</td>
                            <td className="px-5 py-3.5 font-bold text-slate-800">{book.title}</td>
                            <td className="px-5 py-3.5 text-xs text-slate-600">{book.author}</td>
                            <td className="px-5 py-3.5">
                              <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
                                {book.category || 'General'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-slate-700">
                                  {available}/{total} available
                                </div>
                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${available > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                    style={{ width: `${Math.max(5, pct)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {available > 0 ? (
                                  <button
                                    onClick={() => setView('issues')}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                                  >
                                    Issue
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setView('holds')}
                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition shadow-xs"
                                  >
                                    Place Hold
                                  </button>
                                )}
                                {isStaff && (
                                  <>
                                    <button
                                      onClick={() => openEdit(book)}
                                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDelete(book.id)}
                                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Page {page + 1} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'issues' && <BookIssuePage users={users} books={books} />}
        {view === 'holds' && <BookHoldPage users={users} books={books} />}
        {view === 'fines' && <FinePaymentPage users={users} issueRecords={issueRecords} />}
      </main>

      {/* Catalogue New Book Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" role="dialog">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Catalogue New Library Book</h3>
              <button
                onClick={() => { setShowCreate(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  ISBN Number <span className="text-rose-500">*</span>
                </label>
                <input
                  placeholder="978-0134685991"
                  value={formIsbn}
                  onChange={e => setFormIsbn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formErrors.isbn && <span className="text-[11px] text-rose-600 font-semibold">{formErrors.isbn}</span>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Volume Title <span className="text-rose-500">*</span>
                </label>
                <input
                  placeholder="comprehensive book title"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formErrors.title && <span className="text-[11px] text-rose-600 font-semibold">{formErrors.title}</span>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Author Full Name
                </label>
                <input
                  placeholder="Author Full Name"
                  value={formAuthor}
                  onChange={e => setFormAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Category Stream
                  </label>
                  <input
                    placeholder="Category"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Total Copies
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formTotalCopies}
                    onChange={e => setFormTotalCopies(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Register Volume Entry
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); resetForm(); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modify Volume Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" role="dialog">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Modify Volume Configuration</h3>
              <button
                onClick={() => { setShowEdit(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  ISBN Number <span className="text-rose-500">*</span>
                </label>
                <input
                  placeholder="978-0134685991"
                  value={formIsbn}
                  onChange={e => setFormIsbn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formErrors.isbn && <span className="text-[11px] text-rose-600 font-semibold">{formErrors.isbn}</span>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Volume Title <span className="text-rose-500">*</span>
                </label>
                <input
                  placeholder="comprehensive book title"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formErrors.title && <span className="text-[11px] text-rose-600 font-semibold">{formErrors.title}</span>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Author Full Name
                </label>
                <input
                  placeholder="Author Full Name"
                  value={formAuthor}
                  onChange={e => setFormAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Category Stream
                  </label>
                  <input
                    placeholder="Category"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Total Copies
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formTotalCopies}
                    onChange={e => setFormTotalCopies(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Update Volume Entry
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEdit(false); resetForm(); }}
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

export default App;
