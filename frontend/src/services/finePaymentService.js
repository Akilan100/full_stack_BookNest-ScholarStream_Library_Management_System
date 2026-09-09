import axios from 'axios';

const API = '/api/fines';

export const finePaymentService = {
  getAll: () => axios.get(API),
  getMy: () => axios.get(`${API}/my`),
  getById: (id) => axios.get(`${API}/${id}`),
  getByAccountId: (accountId) => axios.get(`${API}/account/${accountId}`),
  create: (data) => axios.post(API, data),
  createFine: (data) => axios.post(API, data),
  payFine: (id) => axios.put(`${API}/${id}/pay`),
  waiveFine: (id) => axios.put(`${API}/${id}/waive`),
  delete: (id) => axios.delete(`${API}/${id}`),
};

export default finePaymentService;
