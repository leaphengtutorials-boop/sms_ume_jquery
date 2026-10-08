<template>
  <h3>📚 សិស្សក្នុងមុខវិជ្ជា — {{ props.subject.subject_name }}</h3>
  <div v-if="loading" style="text-align: center; padding: 2rem">⏳</div>
  <table v-else>
    <thead>
      <tr>
        <th>#</th>
        <th>ឈ្មោះ</th>
        <th>ជំនាន់</th>
        <th>វត្តមាន</th>
        <th>HW</th>
        <th>Quiz</th>
        <th>Mid</th>
        <th>Asg</th>
        <th>Final</th>
        <th>សរុប</th>
        <th>និទ្ទេស</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(s, i) in students" :key="s.student_id">
        <td>{{ i + 1 }}</td>
        <td>
          <div style="font-weight: 600">{{ s.full_name }}</div>
          <small style="color: var(--gray)">{{ s.student_code }}</small>
        </td>
        <td>{{ s.cohort_name }}</td>
        <td>{{ s.attendance_score }}</td>
        <td>{{ s.scores.homework }}</td>
        <td>{{ s.scores.quiz }}</td>
        <td>{{ s.scores.midterm }}</td>
        <td>{{ s.scores.assignment }}</td>
        <td>{{ s.scores.final }}</td>
        <td>
          <strong style="color: #6366f1">{{ s.total_score }}</strong>
        </td>
        <td>
          <strong :class="`grade-${s.grade}`">{{ s.grade }}</strong>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { ref, onMounted } from "vue";
import subjectsApi from "@/api/subjects";
import { useAppStore } from "@/stores/app";

const props = defineProps({ subject: Object });
const app = useAppStore();

const students = ref([]);
const loading = ref(true);

onMounted(async () => {
  const params = {};
  if (app.currentCohortId) params.cohort_id = app.currentCohortId;
  const res = await subjectsApi.students(props.subject.id, params);
  students.value = res.students || [];
  loading.value = false;
});
</script>
