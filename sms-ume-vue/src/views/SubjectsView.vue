<template>
  <PageHeader
    icon="📚"
    title="គ្រប់គ្រងមុខវិជ្ជា"
    subtitle="ចុចលើចំនួនសិស្ស ដើម្បីមើលបញ្ជី"
  />

  <!-- Filters Row 1 -->
  <div class="toolbar">
    <select v-model="filters.year_id" class="input">
      <option value="">-- ឆ្នាំសិក្សា --</option>
      <option v-for="y in app.years" :key="y.id" :value="y.id">
        {{ y.year_name }}
      </option>
    </select>
    <select v-model="filters.study_year" class="input">
      <option value="">-- ឆ្នាំទី --</option>
      <option v-for="i in [1, 2, 3, 4]" :key="i" :value="i">
        📖 ឆ្នាំទី {{ i }}
      </option>
    </select>
    <select v-model="filters.semester" class="input">
      <option value="">-- ឆមាស --</option>
      <option value="1">📅 ឆមាស ១</option>
      <option value="2">📅 ឆមាស ២</option>
    </select>
    <select v-model="filters.cohort_id" class="input">
      <option value="">-- ជំនាន់ --</option>
      <option v-for="c in app.cohorts" :key="c.id" :value="c.id">
        {{ c.cohort_name }}{{ c.is_current ? " ⭐" : "" }}
      </option>
    </select>
  </div>

  <!-- Filters Row 2 -->
  <div class="toolbar">
    <input v-model="filters.search" class="input" placeholder="🔍 ស្វែងរក..." />
    <select v-model="groupBy" class="input">
      <option value="year_sem">📁 បែងចែក តាម ឆ្នាំទី + ឆមាស</option>
      <option value="year">📁 បែងចែក តាម ឆ្នាំទី</option>
      <option value="none">📋 តារាងធម្មតា</option>
    </select>
    <button class="btn btn-primary" @click="openCreate">
      ➕ បន្ថែមមុខវិជ្ជា
    </button>
  </div>

  <!-- Grouped Grid -->
  <div id="subjectsGrid">
    <template v-for="[key, group] in groupedSubjects" :key="key">
      <div v-if="groupBy !== 'none'" class="subj-group-header">
        <div
          style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center"
        >
          <div class="subj-group-title">
            {{ groupTitle(group) }}
          </div>
          <div class="subj-group-stats">
            📚 {{ group.items.length }} មុខវិជ្ជា · 👥
            {{ totalStudents(group) }} សិស្ស
          </div>
        </div>
      </div>
      <div class="subjects-group-row">
        <div v-for="s in group.items" :key="s.id" class="subject-card">
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              flex-wrap: wrap;
              gap: 0.4rem;
            "
          >
            <div class="code">{{ s.subject_code }}</div>
            <div style="display: flex; gap: 4px">
              <span class="subj-chip">📖 ឆ្នាំ {{ s.study_year }}</span>
              <span class="subj-chip">📅 ឆមាស {{ s.semester }}</span>
            </div>
          </div>
          <h4>{{ s.subject_name }}</h4>
          <div class="year">🗓️ {{ s.year_name || "-" }}</div>
          <div
            v-if="s.cohorts_info"
            style="font-size: 0.7rem; color: var(--gray); margin-bottom: 0.5rem"
          >
            🎓 <strong>ជំនាន់:</strong> {{ s.cohorts_info }}
          </div>
          <div class="stats">
            <span class="subject-student-count" @click="openStudents(s)">
              👥 {{ s.student_count || 0 }} សិស្ស
            </span>
            <span>📆 {{ s.total_weeks }} សប្តាហ៍</span>
            <span
              v-if="s.completed_count > 0"
              style="background: #d1fae5; color: #065f46"
            >
              ✅ {{ s.completed_count }} បញ្ចប់
            </span>
          </div>
          <div class="actions">
            <button @click="openEdit(s)">✏️ កែ</button>
            <button class="del" @click="confirmDelete(s)">🗑️ លុប</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import { useAppStore } from "@/stores/app";
import { useModalStore } from "@/stores/modal";
import { useToastStore } from "@/stores/toast";
import subjectsApi from "@/api/subjects";
import SubjectForm from "@/components/forms/SubjectForm.vue";
import SubjectStudentsModal from "@/components/SubjectStudentsModal.vue";

const app = useAppStore();
const modal = useModalStore();
const toast = useToastStore();

const filters = reactive({
  year_id: "",
  study_year: "",
  semester: "",
  cohort_id: "",
  search: "",
});
const groupBy = ref("year_sem");

const groupedSubjects = computed(() => {
  const groups = {};
  for (const s of app.subjects) {
    let key;
    if (groupBy.value === "year_sem") key = `Y${s.study_year}_S${s.semester}`;
    else if (groupBy.value === "year") key = `Y${s.study_year}`;
    else key = "all";

    if (!groups[key]) {
      groups[key] = {
        study_year: s.study_year,
        semester: s.semester,
        items: [],
      };
    }
    groups[key].items.push(s);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
});

function groupTitle(g) {
  if (groupBy.value === "year_sem")
    return `📖 ឆ្នាំទី ${g.study_year} · 📅 ឆមាស ${g.semester}`;
  if (groupBy.value === "year") return `📖 ឆ្នាំទី ${g.study_year}`;
  return "📚 មុខវិជ្ជាទាំងអស់";
}
function totalStudents(g) {
  return g.items.reduce((sum, s) => sum + parseInt(s.student_count || 0), 0);
}

async function reload() {
  const params = {};
  for (const k in filters) if (filters[k]) params[k] = filters[k];
  if (!params.year_id) params.current_only = 1;
  await app.loadSubjects(params);
}

watch(filters, reload, { deep: true });

function openCreate() {
  modal.show(SubjectForm);
}
function openEdit(s) {
  modal.show(SubjectForm, { subject: s });
}

async function confirmDelete(s) {
  if (!confirm(`លុបមុខវិជ្ជា "${s.subject_name}"?`)) return;
  await subjectsApi.remove(s.id);
  toast.show("✅ លុបជោគជ័យ");
  reload();
}

function openStudents(s) {
  modal.show(SubjectStudentsModal, { subject: s }, true);
}

onMounted(reload);
</script>
