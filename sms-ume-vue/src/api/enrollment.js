import api from "./client";

export default {
  list: (params = {}) => api.get("/enrollment.php", params),
  save: (data) => api.post("/enrollment.php", data),
  changeStatus: (studentId, subjectId, status) =>
    api.patch("/enrollment.php", {
      student_id: studentId,
      subject_id: subjectId,
      status,
    }),
  bulkComplete: (subjectId, studentIds) =>
    api.post("/bulk_complete.php", {
      subject_id: subjectId,
      student_ids: studentIds,
    }),
};
