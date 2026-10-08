import api from "./client";

export default {
  take: (params) => api.get("/attendance.php", params),
  report: (params) => api.get("/attendance.php", { report: 1, ...params }),
  lastWeek: (params) => api.get("/attendance.php", { last_week: 1, ...params }),
  save: (data) => api.post("/attendance.php", data),
  exportUrl: (subjectId) =>
    `${import.meta.env.VITE_API_BASE}/export_attendance.php?subject_id=${subjectId}`,
};
