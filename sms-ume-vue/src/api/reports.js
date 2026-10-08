import api from "./client";

export default {
  load: (params = {}) => api.get("/reports.php", params),
  completed: (params = {}) => api.get("/completed_students.php", params),
};
