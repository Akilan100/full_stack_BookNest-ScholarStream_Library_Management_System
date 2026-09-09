import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { clearAuth } from './store/slices/authSlice';
import { setBooks, addBook, updateBookInState, removeBookFromState } from './store/slices/libraryBookSlice';
import { setRecords } from './store/slices/bookIssueRecordSlice';
import { setHolds } from './store/slices/bookHoldRequestSlice';
import { setFines } from './store/slices/finePaymentSlice';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BookIssuePage from './pages/BookIssuePage';
import BookHoldPage from './pages/BookHoldPage';
import FinePaymentPage from './pages/FinePaymentPage';

function App() {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth);
  const libraryBookState = useSelector((s) => s.libraryBook) || { books: [] };
  const books = Array.isArray(libraryBookState) ? libraryBookState : (libraryBookState.books || libraryBookState.list || []);
  
  const issueRecordsState = useSelector((s) => s.bookIssueRecord) || { list: [] };
  const issueRecords = Array.isArray(issueRecordsState) ? issueRecordsState : (issueRecordsState.records || issueRecordsState.list || []);

  const holdsState = useSelector((s) => s.bookHoldRequest) || { list: [] };
  const holds = Array.isArray(holdsState) ? holdsState : (holdsState.holds || holdsState.list || []);

  const finesState = useSelector((s) => s.finePayment) || { list: [] };
  const fines = Array.isArray(finesState) ? finesState : (finesState.fines || finesState.list || []);

  const [activeTab, setActiveTab] = useState('catalogue');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories / Streams');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    category: 'Computer Science',
    totalCopies: 5,
    availableCopies: 5,
  });

  const [formErrors, setFormErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isPatron = auth.role === 'LIBRARY_PATRON';
  const isStaffOrAdmin = auth.role === 'CHIEF_LIBRARIAN' || auth.role === 'LIBRARIAN_STAFF' || auth.role === 'ROLE_ADMIN' || auth.role === 'ADMIN';

  // Configure axios token
  useEffect(() => {
    if (auth.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
      fetchCatalogue();
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.token]);

  const fetchCatalogue = async () => {
    try {
      const res = await axios.get('/api/books');
      const data = res.data;
      if (Array.isArray(data)) {
        dispatch(setBooks(data));
      } else if (data && Array.isArray(data.content)) {
        dispatch(setBooks(data.content));
      }
    } catch (err) {
      console.error('Failed to load catalogue books:', err);
    }
  };

  const fetchAuxiliaryData = async () => {
    try {
      if (auth.token) {
        // Fetch issues
        try {
          const res = isPatron ? await axios.get('/api/issues/my') : await axios.get('/api/issues');
          if (Array.isArray(res.data)) dispatch(setRecords(res.data));
        } catch (e) {}

        // Fetch holds
        try {
          const res = isPatron ? await axios.get('/api/holds/my') : await axios.get('/api/holds');
          if (Array.isArray(res.data)) dispatch(setHolds(res.data));
        } catch (e) {}

        // Fetch fines
        try {
          const res = isPatron ? await axios.get('/api/fines/my') : await axios.get('/api/fines');
          if (Array.isArray(res.data)) dispatch(setFines(res.data));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed auxiliary fetch:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      isbn: '',
      title: '',
      author: '',
      category: 'Computer Science',
      totalCopies: 5,
      availableCopies: 5,
    });
    setFormErrors({});
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.isbn.trim()) errors.isbn = 'ISBN identifier is mandatory';
    if (!formData.title.trim()) errors.title = 'Volume title is mandatory';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        isbn: formData.isbn.trim(),
        title: formData.title.trim(),
        author: formData.author.trim() || 'Unknown Author',
        category: formData.category,
        totalCopies: parseInt(formData.totalCopies, 10) || 1,
        availableCopies: parseInt(formData.availableCopies !== undefined ? formData.availableCopies : formData.totalCopies, 10) || 1,
      };
      const res = await axios.post('/api/books', payload);
      dispatch(addBook(res.data));
      setShowCreate(false);
      resetForm();
      setSuccessMessage('Volume catalogue entry created successfully.');
      setTimeout(() => setSuccessMessage(''), 3500);
      fetchCatalogue();
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Failed to register library volume.');
      setTimeout(() => setGlobalError(''), 4000);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingBook) return;

    try {
      const payload = {
        isbn: formData.isbn.trim(),
        title: formData.title.trim(),
        author: formData.author.trim(),
        category: formData.category,
        totalCopies: parseInt(formData.totalCopies, 10) || 1,
        availableCopies: parseInt(formData.availableCopies, 10) || 0,
      };
      const res = await axios.put(`/api/books/${editingBook.id}`, payload);
      dispatch(updateBookInState(res.data));
      setShowEdit(false);
      setEditingBook(null);
      resetForm();
      setSuccessMessage('Volume catalogue record modified successfully.');
      setTimeout(() => setSuccessMessage(''), 3500);
      fetchCatalogue();
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Failed to update volume record.');
      setTimeout(() => setGlobalError(''), 4000);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Are you sure you want to remove this volume from the master catalogue?')) {
      try {
        await axios.delete(`/api/books/${bookId}`);
        dispatch(removeBookFromState(bookId));
        setSuccessMessage('Volume removed from library inventory.');
        setTimeout(() => setSuccessMessage(''), 3500);
        fetchCatalogue();
      } catch (err) {
        setGlobalError(err.response?.data?.message || 'Failed to delete volume record.');
        setTimeout(() => setGlobalError(''), 4000);
      }
    }
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setFormData({
      isbn: book.isbn || '',
      title: book.title || '',
      author: book.author || '',
      category: book.category || 'Computer Science',
      totalCopies: book.totalCopies || 1,
      availableCopies: book.availableCopies !== undefined ? book.availableCopies : book.totalCopies,
    });
    setShowEdit(true);
  };

  const handleLogout = () => {
    dispatch(clearAuth());
    setActiveTab('catalogue');
  };

  if (!auth.token) {
    return <LoginPage />;
  }

  // Filter catalogue
  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      (b.title && b.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.author && b.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.isbn && b.isbn.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All Categories / Streams' ||
      selectedCategory === '' ||
      b.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / itemsPerPage));
  const currentBooks = filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      {/* Top Navigation Bar (Clean White Theme) */}
      <header className="bg-white text-slate-800 border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and App Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-1.5 leading-tight">
                  BookNest <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">ScholarStream</span>
                </span>
                <span className="text-[10px] text-slate-500">Integrated Library Management</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1">
              {isStaffOrAdmin && (
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'home'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>📊</span> Home
                </button>
              )}
              <button
                onClick={() => setActiveTab('catalogue')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'catalogue'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>📚</span> Catalogue
              </button>
              <button
                onClick={() => setActiveTab('issues')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'issues'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>🔄</span> Lending
              </button>
              <button
                onClick={() => setActiveTab('holds')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'holds'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>⏳</span> Holds
              </button>
              <button
                onClick={() => setActiveTab('fines')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'fines'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>💳</span> Fines
              </button>
            </nav>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800">
                  Welcome back! {auth.fullName || auth.user?.fullName || 'Chief Librarian'}
                </span>
                <span className="text-[10px] text-blue-600 font-mono font-medium">
                  {auth.role || 'CHIEF_LIBRARIAN'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                title="Sign out of the system"
              >
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Global Notifications */}
        {globalError && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-rose-500 font-bold">Error:</span>
              <span>{globalError}</span>
            </div>
            <button onClick={() => setGlobalError('')} className="text-rose-500 hover:text-rose-800 font-bold">×</button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">Success:</span>
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-800 font-bold">×</button>
          </div>
        )}

        {/* Tab Routing */}
        {isStaffOrAdmin && activeTab === 'home' && (
          <DashboardPage
            onNavigate={(tab) => setActiveTab(tab)}
            books={books}
            issueRecords={issueRecords}
            holds={holds}
            fines={fines}
          />
        )}

        {activeTab === 'catalogue' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Header & Primary Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Library Master Catalogue
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Search and browse indexed library volumes, check availability status, and initiate loans
                </p>
              </div>

              {isStaffOrAdmin && (
                <button
                  onClick={() => { resetForm(); setShowCreate(true); }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  + Add New Book
                </button>
              )}
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search by book title or author name..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-slate-800"
                />
              </div>

              <div className="sm:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-slate-800 cursor-pointer"
                >
                  <option value="All Categories / Streams">All Categories / Streams</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="History">History</option>
                  <option value="Software Engineering">Software Engineering</option>
                </select>
              </div>
            </div>

            {/* Master Books Table */}
            <div className="card-modern overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="table-header">
                      <th className="py-3 px-4">ISBN NUMBER</th>
                      <th className="py-3 px-4">VOLUME TITLE</th>
                      <th className="py-3 px-4">AUTHOR / CREATOR</th>
                      <th className="py-3 px-4">CATEGORY / SHELF</th>
                      <th className="py-3 px-4">AVAILABILITY</th>
                      <th className="py-3 px-4 text-right">SERVICE ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {currentBooks.length > 0 ? (
                      currentBooks.map((book) => {
                        const total = book.totalCopies || 1;
                        const avail = book.availableCopies !== undefined ? book.availableCopies : total;
                        const percent = Math.round((avail / total) * 100);

                        return (
                          <tr key={book.id} className="table-row">
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                              <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200/80">
                                {book.isbn || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {book.title}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {book.author}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="badge-pill bg-slate-100 text-slate-700 border border-slate-200">
                                {book.category || 'General'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1 w-28">
                                <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                                  <span>{avail}/{total} available</span>
                                  <span>{percent}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      avail === 0 ? 'bg-rose-500' : avail < 2 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-1.5">
                              {avail > 0 ? (
                                <button
                                  onClick={() => setActiveTab('issues')}
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                >
                                  Issue
                                </button>
                              ) : (
                                <button
                                  onClick={() => setActiveTab('holds')}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                >
                                  Place Hold
                                </button>
                              )}

                              {isStaffOrAdmin && (
                                <>
                                  <button
                                    onClick={() => openEditModal(book)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBook(book.id)}
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400">
                          No catalogue volumes match your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
                <span>
                  Showing page {currentPage} of {totalPages} ({filteredBooks.length} items total)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <BookIssuePage
            books={books}
            onDataChange={() => {
              fetchCatalogue();
              fetchAuxiliaryData();
            }}
          />
        )}

        {activeTab === 'holds' && (
          <BookHoldPage
            books={books}
            onDataChange={() => {
              fetchCatalogue();
              fetchAuxiliaryData();
            }}
          />
        )}

        {activeTab === 'fines' && (
          <FinePaymentPage
            onDataChange={() => {
              fetchCatalogue();
              fetchAuxiliaryData();
            }}
          />
        )}
      </main>

      {/* Modal: Catalogue New Library Book */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Catalogue New Library Book
              </h3>
              <button
                type="button"
                onClick={() => { setShowCreate(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ISBN Identifier *
                </label>
                <input
                  type="text"
                  placeholder="978-0131103627"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {formErrors.isbn && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.isbn}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Volume Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter comprehensive book title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {formErrors.title && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Author / Creator
                </label>
                <input
                  type="text"
                  placeholder="Author Full Name..."
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Stream
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="History">History</option>
                    <option value="Software Engineering">Software Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Copies
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalCopies}
                    onChange={(e) => setFormData({ ...formData, totalCopies: e.target.value, availableCopies: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  Register Volume Entry
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); resetForm(); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Modify Volume Configuration */}
      {showEdit && editingBook && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Modify Volume Configuration
              </h3>
              <button
                type="button"
                onClick={() => { setShowEdit(false); setEditingBook(null); resetForm(); }}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ISBN Identifier *
                </label>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Volume Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Author / Creator
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Stream
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="History">History</option>
                    <option value="Software Engineering">Software Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Available Copies
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.availableCopies}
                    onChange={(e) => setFormData({ ...formData, availableCopies: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  Update Volume Entry
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEdit(false); setEditingBook(null); resetForm(); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>BookNest Library Management System &bull; Sri Krishna College of Engineering and Technology</p>
      </footer>
    </div>
  );
}

export default App;
