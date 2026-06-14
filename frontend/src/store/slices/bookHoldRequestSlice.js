import { createSlice } from '@reduxjs/toolkit';

const bookHoldRequestSlice = createSlice({
  name: 'bookHoldRequest',
  initialState: { holds: [], loading: false, error: null },
  reducers: {
    setHolds(state, action) { state.holds = action.payload; },
    setLoading(state, action) { state.loading = action.payload; },
    setError(state, action) { state.error = action.payload; }
  }
});

export const { setHolds, setLoading, setError } = bookHoldRequestSlice.actions;
export default bookHoldRequestSlice.reducer;
