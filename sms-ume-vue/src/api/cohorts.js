// cohorts.js
import api from "./client";
export default {
  list: () => api.get("/cohorts.php"),
  create: (data) => api.post("/cohorts.php", data),
  setCurrent: (id) => api.put(`/cohorts.php?id=${id}&set_current=1`),
  update: (data) => api.put("/cohorts.php", data),
  remove: (id) => api.delete(`/cohorts.php?id=${id}`),
};
