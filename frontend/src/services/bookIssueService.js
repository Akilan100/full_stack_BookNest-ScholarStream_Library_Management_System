import axios from 'axios';

const bookIssueService = {
  getAll: () => axios.get('/api/book-issues'),
  getById: (id) => axios.get(`/api/book-issues/${id}`),
  issueBook: (data) => axios.post('/api/book-issues', data),
  returnBook: (id) => axios.put(`/api/book-issues/${id}/return`),
  markLost: (id) => axios.put(`/api/book-issues/${id}/lost`),
  delete: (id) => axios.delete(`/api/book-issues/${id}`),
};

export default bookIssueService;
