import { defineStore } from "pinia";
import { ref, computed } from "vue";
import subjectsApi from "@/api/subjects";
import studentsApi from "@/api/students";
import cohortsApi from "@/api/cohorts";
import yearsApi from "@/api/years";

export const useAppStore = defineStore("app", () => {
  // ==================== STATE ====================
  const subjects = ref([]);
  const students = ref([]);
  const years = ref([]);
  const cohorts = ref([]);
  const currentCohortId = ref(null);
  const loading = ref(false);

  // ==================== GETTERS ====================
  const currentCohort = computed(
    () => cohorts.value.find((c) => c.id === currentCohortId.value) || null,
  );

  const activeSubjects = computed(() =>
    subjects.value.filter((s) => s.is_active === 1),
  );

  // ==================== ACTIONS ====================
  async function loadAll() {
    loading.value = true;
    try {
      const [yRes, cRes] = await Promise.all([
        yearsApi.list(),
        cohortsApi.list(),
      ]);
      years.value = yRes.sort((a, b) => b.year_name.localeCompare(a.year_name));
      cohorts.value = (cRes.list || cRes).sort((a, b) => b.id - a.id);
      currentCohortId.value =
        cRes.current_cohort_id || cohorts.value[0]?.id || null;

      await Promise.all([loadSubjects(), loadStudents()]);
    } finally {
      loading.value = false;
    }
  }

  async function loadSubjects(params = {}) {
    subjects.value = await subjectsApi.list(params);
    return subjects.value;
  }

  async function loadStudents() {
    students.value = await studentsApi.list();
    return students.value;
  }

  function getSubjectById(id) {
    return subjects.value.find((s) => s.id == id) || null;
  }
  function getCohortById(id) {
    return cohorts.value.find((c) => c.id == id) || null;
  }
  function getYearById(id) {
    return years.value.find((y) => y.id == id) || null;
  }

  return {
    subjects,
    students,
    years,
    cohorts,
    currentCohortId,
    loading,
    currentCohort,
    activeSubjects,
    loadAll,
    loadSubjects,
    loadStudents,
    getSubjectById,
    getCohortById,
    getYearById,
  };
});
