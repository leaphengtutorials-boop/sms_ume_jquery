import api from "./client";

export default {
  weights: {
    get: (subjectId) => api.get("/weights.php", { subject_id: subjectId }),
    save: (data) => api.post("/weights.php", data),
  },
  rules: {
    get: (subjectId) => api.get("/rules.php", { subject_id: subjectId }),
    save: (data) => api.post("/rules.php", data),
  },
};
