import { createSlice } from '@reduxjs/toolkit';

const libraryBookSlice = createSlice({
  name: 'libraryBook',
  initialState: { books: [], totalPages: 0, loading: false, error: null },
  reducers: {
    setBooks(state, action) {
      if (Array.isArray(action.payload)) {
        state.books = action.payload;
      } else if (action.payload && action.payload.content) {
        state.books = action.payload.content;
        state.totalPages = action.payload.totalPages || 0;
      }
    },
    addBook(state, action) {
      state.books.unshift(action.payload);
    },
    updateBookInState(state, action) {
      const idx = state.books.findIndex((b) => b.id === action.payload.id);
      if (idx !== -1) {
        state.books[idx] = action.payload;
      }
    },
    removeBookFromState(state, action) {
      state.books = state.books.filter((b) => b.id !== action.payload);
    },
    setLoading(state, action) { state.loading = action.payload; },
    setError(state, action) { state.error = action.payload; }
  }
});

export const { setBooks, addBook, updateBookInState, removeBookFromState, setLoading, setError } = libraryBookSlice.actions;
export default libraryBookSlice.reducer;
