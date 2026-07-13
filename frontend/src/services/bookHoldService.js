import axios from 'axios';

const bookHoldService = {
  getAll: () => axios.get('/api/book-holds'),
  placeHold: (data) => axios.post('/api/book-holds', data),
  cancelHold: (id) => axios.put(`/api/book-holds/${id}/cancel`),
  markPickup: (id) => axios.put(`/api/book-holds/${id}/pickup`),
  delete: (id) => axios.delete(`/api/book-holds/${id}`),
};

export default bookHoldService;
