import { createSlice } from '@reduxjs/toolkit';

const libraryBookSlice = createSlice({
  name: 'libraryBook',
  initialState: { books: [], totalPages: 0, loading: false, error: null },
  reducers: {
    setBooks(state, action) {
      state.books = action.payload.content || [];
      state.totalPages = action.payload.totalPages || 0;
    },
    setLoading(state, action) { state.loading = action.payload; },
    setError(state, action) { state.error = action.payload; }
  }
});

export const { setBooks, setLoading, setError } = libraryBookSlice.actions;
export default libraryBookSlice.reducer;
