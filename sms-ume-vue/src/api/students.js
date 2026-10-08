import api from "./client";

export default {
  list: (params = {}) => api.get("/students.php", params),
  get: (id) => api.get("/students.php", { id }),
  create: (data) => api.post("/students.php", data),
  update: (data) => api.put("/students.php", data),
  remove: (id) => api.delete(`/students.php?id=${id}`),
  bulkStatus: (ids, status) => api.patch("/students.php", { ids, status }),

  uploadPhoto: (studentId, file) => {
    const fd = new FormData();
    fd.append("student_id", studentId);
    fd.append("photo", file);
    return api.upload("/photo.php", fd);
  },
  deletePhoto: (studentId) => api.delete(`/photo.php?student_id=${studentId}`),

  importCSV: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.upload("/import.php", fd);
  },
  history: (studentId) =>
    api.get("/enrollment.php", { history: 1, student_id: studentId }),
};
