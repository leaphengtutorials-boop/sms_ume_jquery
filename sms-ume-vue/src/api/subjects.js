import api from "./client";

export default {
  list: (params = {}) => api.get("/subjects.php", params),
  get: (id) => api.get("/subjects.php", { id }),
  create: (data) => api.post("/subjects.php", data),
  update: (data) => api.put("/subjects.php", data),
  remove: (id) => api.delete(`/subjects.php?id=${id}`),
  students: (subjectId, params = {}) =>
    api.get("/subject_students.php", { subject_id: subjectId, ...params }),
};
