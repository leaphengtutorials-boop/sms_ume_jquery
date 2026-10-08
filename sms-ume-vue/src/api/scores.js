import api from "./client";

export default {
  midterm: {
    list: (params) => api.get("/scores.php", { type: "midterm", ...params }),
    save: (data) => api.post("/scores.php", { ...data, score_type: "midterm" }),
  },
  final: {
    list: (params) => api.get("/final_scores.php", params),
    save: (data) => api.post("/final_scores.php", data),
    remove: (subjectId) =>
      api.delete(`/final_scores.php?subject_id=${subjectId}`),
  },
};
