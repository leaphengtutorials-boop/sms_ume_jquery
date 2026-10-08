// years.js
import api from "./client";
export default {
  list: () => api.get("/academic_years.php"),
  create: (data) => api.post("/academic_years.php", data),
  remove: (id) => api.delete(`/academic_years.php?id=${id}`),
};
