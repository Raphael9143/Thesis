import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:3000/api/", // Đổi lại baseURL cho phù hợp backend
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  function (config) {
    if (sessionStorage.getItem("isLogin") === "true") {
      const token = sessionStorage.getItem("token");
      if (token !== null && token !== undefined && token !== "undefined") {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  function (response) {
    return response.data;
  },
  function (error) {
    return Promise.reject(error);
  }
);

export default axiosClient;
