import { createSlice } from '@reduxjs/toolkit';

const bookIssueRecordSlice = createSlice({
  name: 'bookIssueRecord',
  initialState: { records: [], loading: false, error: null },
  reducers: {
    setRecords(state, action) { state.records = action.payload; },
    setLoading(state, action) { state.loading = action.payload; },
    setError(state, action) { state.error = action.payload; }
  }
});

export const { setRecords, setLoading, setError } = bookIssueRecordSlice.actions;
export default bookIssueRecordSlice.reducer;
