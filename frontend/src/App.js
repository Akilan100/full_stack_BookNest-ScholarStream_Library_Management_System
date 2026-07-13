import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { setAuth, clearAuth } from './store/slices/authSlice';
import { setBooks } from './store/slices/libraryBookSlice';
import LoginPage from './pages/LoginPage';
import BookIssuePage from './pages/BookIssuePage';
import BookHoldPage from './pages/BookHoldPage';
import FinePaymentPage from './pages/FinePaymentPage';
const ROLES = ['LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN', 'LIBRARY_PATRON'];
const CATEGORIES = ['All', 'Computer Science', 'Mathematics', 'Science', 'History', 'Software Engineering'];
const STAFF_ROLES = ['LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN'];

function App() {
  const dispatch = useDispatch();
  const auth = useSelector(s => s.auth);
  const { books, totalPages } = useSelector(s => s.libraryBook);
  const issueRecords = useSelector(s => s.bookIssueRecord.records);

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES[0]);
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');

  const [view, setView] = useState('catalogue');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
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

  useEffect(() => {
    if (!auth.token) return;
    const params = { page, size: 10 };
    if (search) params.title = search;
    if (category && category !== 'All') params.category = category;
    axios.get('/api/books', { params }).then(res => {
      dispatch(setBooks(res.data));
    });
  }, [auth.token, search, category, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!auth.token) return;
    axios.get('/api/auth/users').then(res => setUsers(res.data)).catch(() => {});
  }, [auth.token]);

  const fetchBooks = () => {
    const params = { page, size: 10 };
    if (search) params.title = search;
    if (category && category !== 'All') params.category = category;
    axios.get('/api/books', { params }).then(res => {
      dispatch(setBooks(res.data));
    });
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
    await axios.post('/api/books', { isbn: formIsbn, title: formTitle, author: formAuthor, category: formCategory, totalCopies: formTotalCopies });
    fetchBooks();
    setShowCreate(false);
    resetForm();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    await axios.put(`/api/books/${editBook.id}`, { isbn: formIsbn, title: formTitle, author: formAuthor, category: formCategory, totalCopies: formTotalCopies });
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

  const [loading, setLoading] = useState(false);

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
    { key: 'catalogue', label: 'Catalogue' },
    { key: 'issues', label: 'Book Issues' },
    { key: 'holds', label: 'Book Holds' },
    { key: 'fines', label: 'Fine Payments' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="font-bold text-slate-800 mr-4">BookNest</span>
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === item.key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">Welcome back! {auth.fullName}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {view === 'catalogue' && (
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Library Master Catalogue</h2>
          <div className="flex gap-3 mb-4">
            <input
              placeholder="Search by book title..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(0); }}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {isStaff && (
              <button
                onClick={() => { resetForm(); setShowCreate(true); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                + Add New Book
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Author</th>
                  <th className="px-4 py-3 font-medium">ISBN</th>
                  <th className="px-4 py-3 font-medium">Availability</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books.map(book => (
                  <tr key={book.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{book.title}</td>
                    <td className="px-4 py-3 text-slate-600">{book.author}</td>
                    <td className="px-4 py-3 text-slate-500">{book.isbn}</td>
                    <td className="px-4 py-3 text-slate-600">{book.availableCopies}/{book.totalCopies} available</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {book.availableCopies > 0
                          ? <button onClick={() => setView('issues')} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition">Issue</button>
                          : <button onClick={() => setView('holds')} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200 transition">Place Hold</button>
                        }
                        {isStaff && (
                          <>
                            <button onClick={() => openEdit(book)} className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs hover:bg-slate-200 transition">Edit</button>
                            <button onClick={() => handleDelete(book.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition">Delete</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm hover:bg-slate-100 transition">Previous</button>
              <span className="text-sm text-slate-600">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm hover:bg-slate-100 transition">Next</button>
            </div>
          )}
        </div>
      )}

      {view === 'issues' && <BookIssuePage users={users} books={books} />}
      {view === 'holds' && <BookHoldPage users={users} books={books} />}
      {view === 'fines' && <FinePaymentPage users={users} issueRecords={issueRecords} />}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40" role="dialog">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Catalogue New Library Book</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input placeholder="978-" value={formIsbn} onChange={e => setFormIsbn(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {formErrors.isbn && <span className="text-xs text-red-600">{formErrors.isbn}</span>}
              <input placeholder="comprehensive book title" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {formErrors.title && <span className="text-xs text-red-600">{formErrors.title}</span>}
              <input placeholder="Author Full Name" value={formAuthor} onChange={e => setFormAuthor(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Category" value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="number" value={formTotalCopies} onChange={e => setFormTotalCopies(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Register Volume Entry</button>
                <button type="button" onClick={() => { setShowCreate(false); resetForm(); }} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition">×</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40" role="dialog">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Modify Volume Configuration</h3>
            <form onSubmit={handleUpdate} className="space-y-3">
              <input placeholder="978-" value={formIsbn} onChange={e => setFormIsbn(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {formErrors.isbn && <span className="text-xs text-red-600">{formErrors.isbn}</span>}
              <input placeholder="comprehensive book title" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {formErrors.title && <span className="text-xs text-red-600">{formErrors.title}</span>}
              <input placeholder="Author Full Name" value={formAuthor} onChange={e => setFormAuthor(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Category" value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="number" value={formTotalCopies} onChange={e => setFormTotalCopies(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">Update Volume Entry</button>
                <button type="button" onClick={() => { setShowEdit(false); resetForm(); }} className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition">×</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
