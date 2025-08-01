import axios from "axios";

export const TOKEN_STORE = "bitnap-token";

export const api = axios.create({
  baseURL: import.meta.env.DEV
    ? "http://localhost:3000"
    : "https://api.vjdataquesters.com",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORE);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.relogin) {
      // Clear the token from localStorage
      localStorage.removeItem(TOKEN_STORE);
      // Redirect to login page
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  },
);
