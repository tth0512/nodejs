// src/api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor: Tự động gắn Token từ localStorage trước khi request gửi đi
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosClient;