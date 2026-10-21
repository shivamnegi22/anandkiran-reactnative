import axios from 'axios';
import { API_URL } from './env';

// One API client for the whole app. The token lives in memory (set by AuthContext) and is
// never logged. A 401 response signs the patient out.

let authToken = null;
let onUnauthorized = null;

export const setAuthToken = (token) => {
  authToken = token || null;
};

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

export const getAuthToken = () => authToken;

export const api = axios.create({
  baseURL: `${API_URL}v1`,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  if (authToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && authToken && onUnauthorized) onUnauthorized();
    return Promise.reject(error);
  }
);

export { API_URL };
