import { createSlice } from '@reduxjs/toolkit';

const finePaymentSlice = createSlice({
  name: 'finePayment',
  initialState: { fines: [], loading: false, error: null },
  reducers: {
    setFines(state, action) { state.fines = action.payload; },
    setLoading(state, action) { state.loading = action.payload; },
    setError(state, action) { state.error = action.payload; }
  }
});

export const { setFines, setLoading, setError } = finePaymentSlice.actions;
export default finePaymentSlice.reducer;
