import api from "./client";

export default {
  list: (params) => api.get("/homework.php", params),
  get: (id) => api.get("/homework.php", { id }),
  create: (data) => api.post("/homework.php", data),
  saveSubmissions: (data) => api.post("/homework.php", data),
  remove: (id) => api.delete(`/homework.php?id=${id}`),
};
