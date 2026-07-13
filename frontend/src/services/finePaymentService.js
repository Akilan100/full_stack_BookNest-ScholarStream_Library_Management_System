import axios from 'axios';

const finePaymentService = {
  getAll: () => axios.get('/api/fines'),
  createFine: (data) => axios.post('/api/fines', data),
  payFine: (id) => axios.put(`/api/fines/${id}/pay`),
  waiveFine: (id) => axios.put(`/api/fines/${id}/waive`),
};

export default finePaymentService;
