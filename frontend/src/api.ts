import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const fetchStats = () => api.get("/stats").then((r) => r.data);

export const fetchWealthyUsers = (params?: {
  limit?: number;
  offset?: number;
  sort_by?: string;
}) => api.get("/wealthy-users", { params }).then((r) => r.data);

export const fetchWealthyUser = (id: string) =>
  api.get(`/wealthy-users/${id}`).then((r) => r.data);

export const fetchHashtags = (params?: {
  limit?: number;
  category?: string;
  sort_by?: string;
}) => api.get("/hashtags", { params }).then((r) => r.data);

export const fetchInfluencers = (params?: { limit?: number; offset?: number }) =>
  api.get("/influencers", { params }).then((r) => r.data);

export const fetchBrands = (params?: {
  limit?: number;
  category?: string;
  sort_by?: string;
}) => api.get("/brands", { params }).then((r) => r.data);

export const fetchPosts = (params?: {
  limit?: number;
  offset?: number;
  wealth_only?: boolean;
}) => api.get("/posts", { params }).then((r) => r.data);

export const fetchJobs = () => api.get("/jobs").then((r) => r.data);

export const startScrape = (data: {
  keywords?: string[];
  max_users?: number;
}) => api.post("/scrape/start", data).then((r) => r.data);

export const seedMockData = () =>
  api.post("/scrape/seed-mock").then((r) => r.data);

export default api;
