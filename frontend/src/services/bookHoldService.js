import axios from 'axios';

const API = '/api/book-holds';

export const bookHoldService = {
  getAll: () => axios.get(API),
  getMy: () => axios.get(`${API}/my`),
  getById: (id) => axios.get(`${API}/${id}`),
  getByAccountId: (accountId) => axios.get(`${API}/account/${accountId}`),
  placeHold: (data) => axios.post(API, data),
  markReadyForPickup: (id) => axios.put(`${API}/${id}/pickup`),
  markPickup: (id) => axios.put(`${API}/${id}/pickup`),
  fulfillHold: (id) => axios.put(`${API}/${id}/fulfill`),
  cancelHold: (id) => axios.put(`${API}/${id}/cancel`),
  delete: (id) => axios.delete(`${API}/${id}`),
};

export default bookHoldService;
