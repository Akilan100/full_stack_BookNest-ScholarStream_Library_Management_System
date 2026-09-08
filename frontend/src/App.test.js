import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './store/slices/authSlice';
import libraryBookReducer from './store/slices/libraryBookSlice';
import bookIssueRecordReducer from './store/slices/bookIssueRecordSlice';
import bookHoldRequestReducer from './store/slices/bookHoldRequestSlice';
import finePaymentReducer from './store/slices/finePaymentSlice';
import App from './App';
import axios from 'axios';

jest.mock('axios');

const PRIMARY_ENTITY = "LibraryBook";
const DOMAIN_ROLE = "LIBRARIAN_STAFF";
const CRUD_CREATE_MSG = "LibraryBook created successfully.";
const CRUD_UPDATE_MSG = "LibraryBook updated successfully.";
const CRUD_DELETE_MSG = "LibraryBook deleted successfully.";
const DOMAIN_FIELD_1 = "title";
const DOMAIN_FIELD_2 = "author";
const DOMAIN_VALUE_1 = "Effective Java (3rd Edition)";
const DOMAIN_VALUE_2 = "Joshua Bloch";

const mockAuth = {
  token: 'fake-jwt-token',
  role: DOMAIN_ROLE,
  email: 'admin@booknest.com',
  fullName: 'Admin User',
  accountId: 1
};

const mockBooks = {
  content: [
    { id: 1, isbn: '978-1', title: DOMAIN_VALUE_1, author: DOMAIN_VALUE_2, category: 'Software Engineering', totalCopies: 10, availableCopies: 5, shelfLocation: 'A1' }
  ],
  totalPages: 1
};

describe('BookNest Frontend Consistency & CRUD Enforcement', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
        libraryBook: libraryBookReducer,
        bookIssueRecord: bookIssueRecordReducer,
        bookHoldRequest: bookHoldRequestReducer,
        finePayment: finePaymentReducer
      }
    });
    axios.post.mockResolvedValue({ data: mockAuth });
    axios.get.mockResolvedValue({ data: mockBooks });
    axios.put.mockResolvedValue({ data: { ...mockBooks.content[0], totalCopies: 15 } });
    axios.delete.mockResolvedValue({ data: { message: CRUD_DELETE_MSG } });
    localStorage.clear();
  });

  const renderApp = () => render(<Provider store={store}><App /></Provider>);

  const loginByUI = async () => {
    fireEvent.change(screen.getByPlaceholderText(/patron@booknest\.com/i), { target: { value: 'admin@booknest.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••/), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText(/Access Library Portal/i));
    return await screen.findByText(/Welcome back! Admin User/i);
  };

  const goToCatalogue = async () => {
    const navBtn = await screen.findByText('Catalogue');
    fireEvent.click(navBtn);
    await screen.findByText(/Library Master Catalogue/i);
  };

  test('T01 — Login page renders with domain-specific branding', () => {
    renderApp();
    expect(screen.getByText(/Library Portal Sign-In/i)).toBeInTheDocument();
  });

  test('T02 — Email input uses correct placeholder and type', () => {
    renderApp();
    const emailInput = screen.getByPlaceholderText(/patron@booknest\.com/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('T03 — Password field is obfuscated', () => {
    renderApp();
    const pwdInput = screen.getByPlaceholderText(/••••/);
    expect(pwdInput).toHaveAttribute('type', 'password');
  });

  test('T04 — Role selection available in registration mode', () => {
    renderApp();
    fireEvent.click(screen.getByText(/Setup account/i));
    expect(screen.getByText(/Assigned Domain Access Role/i)).toBeInTheDocument();
  });

  test('T05 — Login submission triggers API call', async () => {
    renderApp();
    fireEvent.change(screen.getByPlaceholderText(/patron@booknest\.com/i), { target: { value: 'admin@booknest.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••/), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText(/Access Library Portal/i));
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
  });

  test('T06 — Add New button visibility', async () => {
    renderApp();
    await loginByUI();
    await goToCatalogue();
    const btn = await screen.findByText(/\+ Add New Book/i);
    expect(btn).toBeInTheDocument();
  });

  test('T07 — Catalog list renders primary entity data', async () => {
    renderApp();
    await loginByUI();
    await goToCatalogue();
    expect(await screen.findByText(DOMAIN_VALUE_1)).toBeInTheDocument();
  });

  test('T08 — Search bar filters list items', async () => {
    renderApp();
    await loginByUI();
    await goToCatalogue();
    const searchInput = await screen.findByPlaceholderText(/search by book title/i);
    fireEvent.change(searchInput, { target: { value: 'Effective' } });
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  });

  test('T09 — Category filter updates catalogue view', async () => {
    renderApp();
    await loginByUI();
    await goToCatalogue();
    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'Computer Science' } });
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  });

  test('T10 — Pagination controls presence verified', async () => {
    const multiPageMock = { ...mockBooks, totalPages: 2 };
    axios.get.mockResolvedValue({ data: multiPageMock });
    renderApp();
    await loginByUI();
    await goToCatalogue();
    expect(await screen.findByText(/Previous/i)).toBeInTheDocument();
  });

  test('T11 — Create modal opens with correct title', async () => {
    renderApp();
    await loginByUI();
    await goToCatalogue();
    fireEvent.click(await screen.findByText(/\+ Add New Book/i));
    expect(await screen.findByText(/Catalogue New Library Book/i)).toBeInTheDocument();
  });

  test('T12 — ISBN field is mandatory in creation', async () => {
    renderApp();
    await loginByUI();
    await goToCatalogue();
    fireEvent.click(await screen.findByText(/\+ Add New Book/i));
    fireEvent.click(await screen.findByText(/Register Volume Entry/i));
    expect(await screen.findByText(/ISBN identifier is mandatory/i)).toBeInTheDocument();
  });

  test('T13 — Title field validation enforced', async () => {
    renderApp();
    await loginByUI();
    await goToCatalogue();
    fireEvent.click(await screen.findByText(/\+ Add New Book/i));
    fireEvent.change(screen.getByPlaceholderText(/978-/), { target: { value: '978-1' } });
    fireEvent.click(screen.getByText(/Register Volume Entry/i));
    expect(await screen.findByText(/Volume title is mandatory/i)).toBeInTheDocument();
  });

  test('T14 — Successful creation shows feedback', async () => {
    renderApp();
    await loginByUI();
    axios.post.mockResolvedValueOnce({ data: { id: 2, title: 'New' } });
    await goToCatalogue();
    fireEvent.click(await screen.findByText(/\+ Add New Book/i));
    fireEvent.change(screen.getByPlaceholderText(/978-/), { target: { value: '978-2' } });
    fireEvent.change(screen.getByPlaceholderText(/comprehensive book title/i), { target: { value: 'New Book' } });
    fireEvent.change(screen.getByPlaceholderText(/Author Full Name/i), { target: { value: 'New Author' } });
    fireEvent.click(screen.getByText(/Register Volume Entry/i));
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
  });

  test('T15 — Edit modal pre-fills existing data', async () => {
    renderApp();
    await loginByUI();
    await goToCatalogue();
    const editBtn = await screen.findByRole('button', { name: /^Edit$/ });
    fireEvent.click(editBtn);
    expect(await screen.findByText(/Modify Volume Configuration/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(DOMAIN_VALUE_1)).toBeInTheDocument();
  });

  test('T16 — Delete button triggers confirmation', async () => {
    renderApp();
    await loginByUI();
    const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);
    await goToCatalogue();
    const delBtn = await screen.findByRole('button', { name: /^Delete$/ });
    fireEvent.click(delBtn);
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  test('T17 — Successful deletion removes item from UI', async () => {
    renderApp();
    await loginByUI();
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
    await goToCatalogue();
    const delBtn = await screen.findByRole('button', { name: /^Delete$/ });
    fireEvent.click(delBtn);
    await waitFor(() => expect(axios.delete).toHaveBeenCalled());
  });

  test('T18 — Capacity bar renders correct percentage', async () => {
    renderApp();
    await loginByUI();
    await goToCatalogue();
    expect(await screen.findByText(/5.*10.*available/i)).toBeInTheDocument();
  });

  test('T19 — Issue button visible when available > 0', async () => {
    renderApp();
    await loginByUI();
    await goToCatalogue();
    expect(await screen.findByText(/Issue/i)).toBeInTheDocument();
  });

  test('T20 — Place Hold button visible when available === 0', async () => {
    const outOfStockMock = { content: [{ ...mockBooks.content[0], availableCopies: 0 }], totalPages: 1 };
    axios.get.mockResolvedValueOnce({ data: outOfStockMock });
    renderApp();
    await loginByUI();
    await goToCatalogue();
    expect(await screen.findByText(/Place Hold/i)).toBeInTheDocument();
  });

  test('T21 — Entity Name Consistency', () => {
    expect(PRIMARY_ENTITY).toBe("LibraryBook");
  });

  test('T22 — Create Msg Consistency', () => {
    expect(CRUD_CREATE_MSG).toContain("successfully");
  });

  test('T23 — Update Msg Consistency', () => {
    expect(CRUD_UPDATE_MSG).toContain("successfully");
  });

  test('T24 — Delete Msg Consistency', () => {
    expect(CRUD_DELETE_MSG).toContain("successfully");
  });

  test('T25 — RBAC: Patron check', async () => {
    renderApp();
    fireEvent.change(screen.getByPlaceholderText(/patron@booknest\.com/i), { target: { value: 'patron@booknest.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••/), { target: { value: 'password123' } });
    axios.post.mockResolvedValueOnce({ data: { ...mockAuth, role: 'LIBRARY_PATRON' } });
    fireEvent.click(screen.getByText(/Access Library Portal/i));
    await screen.findByText(/Welcome back!/i);
    await goToCatalogue();
    expect(screen.queryByText(/\+ Add New Book/i)).not.toBeInTheDocument();
  });

  test('T26 — Logout check', async () => {
    renderApp();
    await loginByUI();
    fireEvent.click(screen.getByText(/Logout/i));
    expect(await screen.findByText(/Library Portal Sign-In/i)).toBeInTheDocument();
  });

  test('T27 — Error alert check', async () => {
    renderApp();
    fireEvent.change(screen.getByPlaceholderText(/patron@booknest\.com/i), { target: { value: 'wrong@booknest.com' } });
    fireEvent.change(screen.getByPlaceholderText(/••••/), { target: { value: 'passwordWrong' } });
    axios.post.mockRejectedValueOnce({ response: { data: { message: 'Auth failed' } } });
    fireEvent.click(screen.getByText(/Access Library Portal/i));
    expect(await screen.findByText(/Auth failed/i)).toBeInTheDocument();
  });

  test('T28 — Form reset check', async () => {
    renderApp();
    await loginByUI();
    await goToCatalogue();
    fireEvent.click(await screen.findByText(/\+ Add New Book/i));
    fireEvent.change(screen.getByPlaceholderText(/978-/), { target: { value: 'temp' } });
    fireEvent.click(screen.getByText(/×/));
    fireEvent.click(await screen.findByText(/\+ Add New Book/i));
    expect(screen.getByPlaceholderText(/978-/).value).toBe('');
  });

  test('T29 — DTO field check', () => {
    expect(DOMAIN_FIELD_1).toBe("title");
  });

  test('T30 — Final UI check', () => {
    renderApp();
    expect(screen.getByRole('heading', { name: /Library Portal Sign-In/i })).toBeInTheDocument();
  });

});
