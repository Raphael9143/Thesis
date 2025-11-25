import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:3000/api/', // Đổi lại baseURL cho phù hợp backend
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    if (sessionStorage.getItem('isLogin') === 'true') {
      const token = sessionStorage.getItem('token');
      if (token !== null && token !== undefined && token !== 'undefined') {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // If sending FormData, let the browser set the Content-Type (with boundary).
    if (
      config &&
      config.data &&
      typeof FormData !== 'undefined' &&
      config.data instanceof FormData
    ) {
      // Remove any existing Content-Type so the browser can set the correct multipart boundary
      if (config.headers && config.headers['Content-Type']) delete config.headers['Content-Type'];
      if (config.headers && config.headers['content-type']) delete config.headers['content-type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;
