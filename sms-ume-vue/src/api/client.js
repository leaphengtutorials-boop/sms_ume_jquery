import axios from "axios";
import { useToastStore } from "@/stores/toast";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
  headers: { "Content-Type": "application/json" },
});

// ✅ Interceptor Error → Toast
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const toast = useToastStore();
    const msg = err.response?.data?.error || err.message || "Error";
    toast.show(msg, "error");
    return Promise.reject(err);
  },
);

export default {
  get: (url, params) => client.get(url, { params }),
  post: (url, data) => client.post(url, data),
  put: (url, data) => client.put(url, data),
  patch: (url, data) => client.patch(url, data),
  delete: (url) => client.delete(url),

  // ✅ សម្រាប់ FormData (Upload)
  upload: (url, formData) =>
    client.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};
