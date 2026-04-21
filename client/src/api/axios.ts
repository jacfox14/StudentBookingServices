import axios, { AxiosError, AxiosInstance } from "axios";
import { ApiError } from "@/types/api";
import type { ApiErrorShape } from "@shared/types";

const TOKEN_KEY = "sbs.token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (err: AxiosError<ApiErrorShape>) => {
    const status = err.response?.status ?? 500;
    const body: ApiErrorShape = err.response?.data ?? {
      code: "INTERNAL",
      message: err.message || "Network error",
    };
    if (status === 401) {
      clearToken();
      window.dispatchEvent(new CustomEvent("sbs:logout"));
    }
    return Promise.reject(new ApiError(body, status));
  }
);
