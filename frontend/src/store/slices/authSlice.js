import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: null, role: null, email: null, fullName: null, accountId: null },
  reducers: {
    setAuth(state, action) {
      Object.assign(state, action.payload);
    },
    clearAuth(state) {
      state.token = null;
      state.role = null;
      state.email = null;
      state.fullName = null;
      state.accountId = null;
    }
  }
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
