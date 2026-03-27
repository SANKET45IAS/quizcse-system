import axios from "axios";

const DEPLOYED_FALLBACK_API_URL = "https://quizcse-system.onrender.com/api";

const normalizeApiUrl = (url) => {
  const trimmedUrl = String(url || "").trim().replace(/\/+$/, "");

  if (!trimmedUrl) {
    return "";
  }

  return trimmedUrl.endsWith("/api") ? trimmedUrl : `${trimmedUrl}/api`;
};

const getDefaultApiUrl = () => {
  if (typeof window === "undefined") {
    return DEPLOYED_FALLBACK_API_URL;
  }

  const { hostname, origin } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5000/api";
  }

  if (hostname.endsWith("onrender.com")) {
    return `${origin}/api`;
  }

  return DEPLOYED_FALLBACK_API_URL;
};

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL) || getDefaultApiUrl();

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
  error.response?.data?.message ||
  error.response?.statusText ||
  error.message ||
  "Something went wrong. Please try again.";

export default api;
