import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

const assetBaseUrl = API_URL.replace(/\/api\/?$/, "");

export const getImageUrl = (assetPath) => {
  if (!assetPath) {
    return "";
  }

  if (/^https?:\/\//.test(assetPath)) {
    return assetPath;
  }

  return `${assetBaseUrl}${assetPath.startsWith("/") ? assetPath : `/${assetPath}`}`;
};

export const getApiErrorMessage = (error) =>
  error.response?.data?.message || "Something went wrong. Please try again.";

export default api;

