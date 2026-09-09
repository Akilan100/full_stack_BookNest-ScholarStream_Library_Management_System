import axios from 'axios';

const API = '/api/book-issues';

export const bookIssueService = {
  getAll: () => axios.get(API),
  getMy: () => axios.get(`${API}/my`),
  getById: (id) => axios.get(`${API}/${id}`),
  getByAccountId: (accountId) => axios.get(`${API}/account/${accountId}`),
  issueBook: (data) => axios.post(API, data),
  create: (data) => axios.post(API, data),
  returnBook: (id) => axios.put(`${API}/${id}/return`),
  markLost: (id) => axios.put(`${API}/${id}/lost`),
  delete: (id) => axios.delete(`${API}/${id}`),
};

export default bookIssueService;
