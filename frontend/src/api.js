import axios from 'axios';

// En desarrollo, Django corre en el puerto 8000
const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
});

export default api;
