// client/src/api/apiClient.js
//
// Single axios instance for all dashboard calls. Attaches the JWT from
// localStorage on every request and clears it + bounces to /login on a 401
// (expired/invalid token) instead of leaving the dashboard stuck on a
// silent failure.

import axios from 'axios';
import { API_BASE_URL } from './config';

const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pve_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pve_token');
      localStorage.removeItem('pve_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
