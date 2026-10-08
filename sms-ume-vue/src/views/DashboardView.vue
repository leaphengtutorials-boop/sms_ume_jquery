<template>
  <PageHeader icon="📊" title="ផ្ទាំងគ្រប់គ្រង" subtitle="ទិដ្ឋភាពទូទៅ" />

  <div class="stats-grid">
    <div class="stat-card">
      <div class="icon">👥</div>
      <h3>{{ activeStudents }}</h3>
      <p>សិស្សកំពុងរៀន</p>
    </div>
    <div class="stat-card green">
      <div class="icon">📚</div>
      <h3>{{ app.subjects.length }}</h3>
      <p>មុខវិជ្ជា</p>
    </div>
    <div class="stat-card orange">
      <div class="icon">📅</div>
      <h3>{{ app.years.length }}</h3>
      <p>ឆ្នាំ</p>
    </div>
    <div class="stat-card red">
      <div class="icon">🎓</div>
      <h3>{{ graduatedStudents }}</h3>
      <p>បញ្ចប់</p>
    </div>
  </div>

  <div class="row-2">
    <div class="card">
      <h3>📚 មុខវិជ្ជាសកម្ម</h3>
      <div
        v-for="s in topSubjects"
        :key="s.id"
        style="
          padding: 0.6rem 0;
          border-bottom: 1px solid var(--light);
          display: flex;
          justify-content: space-between;
        "
      >
        <div>
          <strong style="font-size: 0.9rem">{{ s.subject_name }}</strong>
          <div style="font-size: 0.72rem; color: var(--gray)">
            {{ s.subject_code }} · {{ s.total_weeks }} សប្តាហ៍
          </div>
        </div>
        <span class="badge-info">{{ s.student_count || 0 }} សិស្ស</span>
      </div>
    </div>
    <div class="card">
      <h3>🏆 សិស្សល្អបំផុត</h3>
      <p style="color: var(--gray)">មើលក្នុងលទ្ធផល</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import { useAppStore } from "@/stores/app";

const app = useAppStore();
const activeStudents = computed(
  () => app.students.filter((s) => s.status === "active").length,
);
const graduatedStudents = computed(
  () => app.students.filter((s) => s.status === "graduated").length,
);
const topSubjects = computed(() => app.subjects.slice(0, 5));
</script>
