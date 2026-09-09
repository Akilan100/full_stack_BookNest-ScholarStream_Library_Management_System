import { createSlice } from '@reduxjs/toolkit';

// Rehydrate auth from localStorage on app load
const persisted = (() => {
  try {
    const raw = localStorage.getItem('booknest_auth');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
})();

const defaultState = { token: null, role: null, email: null, fullName: null, accountId: null };

const authSlice = createSlice({
  name: 'auth',
  initialState: persisted || defaultState,
  reducers: {
    setAuth(state, action) {
      Object.assign(state, action.payload);
      try {
        localStorage.setItem('booknest_auth', JSON.stringify({ ...state, ...action.payload }));
      } catch (e) {}
    },
    clearAuth(state) {
      state.token = null;
      state.role = null;
      state.email = null;
      state.fullName = null;
      state.accountId = null;
      try {
        localStorage.removeItem('booknest_auth');
      } catch (e) {}
    }
  }
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
