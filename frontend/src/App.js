import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { setAuth, clearAuth } from './store/slices/authSlice';
import { setBooks } from './store/slices/libraryBookSlice';

const ROLES = ['LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN', 'LIBRARY_PATRON'];
const CATEGORIES = ['All', 'Computer Science', 'Mathematics', 'Science', 'History', 'Software Engineering'];
const STAFF_ROLES = ['LIBRARIAN_STAFF', 'CHIEF_LIBRARIAN'];

function App() {
  const dispatch = useDispatch();
  const auth = useSelector(s => s.auth);
  const { books, totalPages } = useSelector(s => s.libraryBook);

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

  useEffect(() => {
    if (!auth.token) return;
    const params = { page, size: 10 };
    if (search) params.title = search;
    if (category && category !== 'All') params.category = category;
    axios.get('/api/books', { params }).then(res => {
      dispatch(setBooks(res.data));
    });
  }, [auth.token, search, category, page]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const isStaff = STAFF_ROLES.includes(auth.role);

  if (!auth.token) {
    return (
      <div>
        <h1>Library Portal Sign-In</h1>
        {authError && <p>{authError}</p>}
        <form onSubmit={isRegister ? handleRegister : handleLogin}>
          <input
            type="email"
            placeholder="patron@booknest.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
              <label>Assigned Domain Access Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </>
          )}
          <button type="submit">{isRegister ? 'Create Account' : 'Access Library Portal'}</button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Back to login' : 'Setup account'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <nav>
        <span>Welcome back! {auth.fullName}</span>
        <button onClick={() => setView('catalogue')}>Catalogue</button>
        <button onClick={handleLogout}>Logout</button>
      </nav>

      {view === 'catalogue' && (
        <div>
          <h2>Library Master Catalogue</h2>
          <input
            placeholder="Search by book title..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(0); }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {isStaff && (
            <button onClick={() => { resetForm(); setShowCreate(true); }}>+ Add New Book</button>
          )}

          <table>
            <tbody>
              {books.map(book => (
                <tr key={book.id}>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.isbn}</td>
                  <td>{book.availableCopies}/{book.totalCopies} available</td>
                  <td>
                    {book.availableCopies > 0
                      ? <button>Issue</button>
                      : <button>Place Hold</button>
                    }
                    {isStaff && (
                      <>
                        <button onClick={() => openEdit(book)}>Edit</button>
                        <button onClick={() => handleDelete(book.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div>
              <button onClick={() => setPage(p => Math.max(0, p - 1))}>Previous</button>
              <span>{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>Next</button>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div role="dialog">
          <h3>Catalogue New Library Book</h3>
          <form onSubmit={handleCreate}>
            <input placeholder="978-" value={formIsbn} onChange={e => setFormIsbn(e.target.value)} />
            {formErrors.isbn && <span>{formErrors.isbn}</span>}
            <input placeholder="comprehensive book title" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
            {formErrors.title && <span>{formErrors.title}</span>}
            <input placeholder="Author Full Name" value={formAuthor} onChange={e => setFormAuthor(e.target.value)} />
            <input placeholder="Category" value={formCategory} onChange={e => setFormCategory(e.target.value)} />
            <input type="number" value={formTotalCopies} onChange={e => setFormTotalCopies(Number(e.target.value))} />
            <button type="submit">Register Volume Entry</button>
            <button type="button" onClick={() => { setShowCreate(false); resetForm(); }}>×</button>
          </form>
        </div>
      )}

      {showEdit && (
        <div role="dialog">
          <h3>Modify Volume Configuration</h3>
          <form onSubmit={handleUpdate}>
            <input placeholder="978-" value={formIsbn} onChange={e => setFormIsbn(e.target.value)} />
            {formErrors.isbn && <span>{formErrors.isbn}</span>}
            <input placeholder="comprehensive book title" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
            {formErrors.title && <span>{formErrors.title}</span>}
            <input placeholder="Author Full Name" value={formAuthor} onChange={e => setFormAuthor(e.target.value)} />
            <input placeholder="Category" value={formCategory} onChange={e => setFormCategory(e.target.value)} />
            <input type="number" value={formTotalCopies} onChange={e => setFormTotalCopies(Number(e.target.value))} />
            <button type="submit">Update Volume Entry</button>
            <button type="button" onClick={() => { setShowEdit(false); resetForm(); }}>×</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
