import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import libraryBookReducer from './slices/libraryBookSlice';
import bookIssueRecordReducer from './slices/bookIssueRecordSlice';
import bookHoldRequestReducer from './slices/bookHoldRequestSlice';
import finePaymentReducer from './slices/finePaymentSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    libraryBook: libraryBookReducer,
    bookIssueRecord: bookIssueRecordReducer,
    bookHoldRequest: bookHoldRequestReducer,
    finePayment: finePaymentReducer
  }
});

export default store;
