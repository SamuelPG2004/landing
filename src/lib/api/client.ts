import axios from "axios";

const API_BASE_URL =
  import.meta.env.PUBLIC_API_BASE_URL ??
  "https://tippal-backend.onrender.com/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});
