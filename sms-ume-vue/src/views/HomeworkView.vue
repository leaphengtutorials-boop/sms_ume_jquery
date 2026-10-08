<template>
  <PageHeader
    icon="📋"
    title="កិច្ចការ"
    subtitle="Homework · Quiz · Assignment"
  />

  <div class="toolbar">
    <select v-model="filters.subject_id" class="input" @change="loadHomework">
      <option value="">-- ជ្រើសមុខវិជ្ជា --</option>
      <option v-for="s in app.subjects" :key="s.id" :value="s.id">
        {{ s.subject_code }} — {{ s.subject_name }} (ឆ្នាំ {{ s.study_year }} ·
        ឆមាស {{ s.semester }})
      </option>
    </select>
    <select v-model="filters.cohort_id" class="input" @change="loadHomework">
      <option value="">-- ជំនាន់ --</option>
      <option v-for="c in app.cohorts" :key="c.id" :value="c.id">
        {{ c.cohort_name }}{{ c.is_current ? " ⭐" : "" }}
      </option>
    </select>
  </div>

  <div class="toolbar">
    <select v-model="filters.year_id" class="input" @change="loadHomework">
      <option value="">-- ឆ្នាំសិក្សា --</option>
      <option v-for="y in app.years" :key="y.id" :value="y.id">
        {{ y.year_name }}
      </option>
    </select>
    <select v-model="filters.study_year" class="input" @change="loadHomework">
      <option value="">-- ឆ្នាំទី --</option>
      <option v-for="i in [1, 2, 3, 4]" :key="i" :value="i">
        📖 ឆ្នាំទី {{ i }}
      </option>
    </select>
    <select v-model="filters.semester" class="input" @change="loadHomework">
      <option value="">-- ឆមាស --</option>
      <option value="1">📅 ឆមាស ១</option>
      <option value="2">📅 ឆមាស ២</option>
    </select>
    <select v-model="filters.type" class="input" @change="loadHomework">
      <option value="">-- ប្រភេទ --</option>
      <option value="homework">📝 Homework</option>
      <option value="quiz">❓ Quiz</option>
      <option value="assignment">📋 Assignment</option>
    </select>
  </div>

  <div class="toolbar">
    <input v-model="filters.search" class="input" placeholder="🔍 ស្វែងរក..." />
    <button class="btn btn-secondary" @click="loadHomework">🔄 ផ្ទុក</button>
    <button class="btn btn-primary" @click="openCreate">
      ➕ បង្កើតកិច្ចការ
    </button>
  </div>

  <div class="hw-list">
    <div v-for="h in homeworks" :key="h.id" class="hw-card">
      <div
        style="
          font-size: 0.72rem;
          background: #eef2ff;
          color: #4f46e5;
          padding: 3px 10px;
          border-radius: 20px;
          font-weight: 700;
          display: inline-block;
        "
      >
        {{ typeLabel(h.type) }}
      </div>
      <h4>{{ h.title }}</h4>
      <p>{{ h.description || "" }}</p>
      <p>
        <small
          >📅 ផុតកំណត់: {{ h.due_date || "-" }} · ពិន្ទុពេញ:
          {{ h.max_score }}</small
        >
      </p>
      <p>
        <small
          >✅ បានដាក់: <strong>{{ h.submitted_count || 0 }}</strong> នាក់</small
        >
      </p>
      <div class="actions">
        <button class="btn btn-primary btn-sm" @click="openView(h)">
          📝 ដាក់ពិន្ទុ
        </button>
        <button class="btn btn-danger btn-sm" @click="confirmDelete(h)">
          🗑️
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import { useAppStore } from "@/stores/app";
import { useModalStore } from "@/stores/modal";
import { useToastStore } from "@/stores/toast";
import homeworkApi from "@/api/homework";
import HomeworkForm from "@/components/forms/HomeworkForm.vue";
import HomeworkSubmissions from "@/components/HomeworkSubmissions.vue";

const app = useAppStore();
const modal = useModalStore();
const toast = useToastStore();

const filters = reactive({
  subject_id: "",
  cohort_id: "",
  year_id: "",
  study_year: "",
  semester: "",
  type: "",
  search: "",
});
const homeworks = ref([]);

const typeLabel = (t) =>
  ({ homework: "📝 Homework", quiz: "❓ Quiz", assignment: "📋 Assignment" })[
    t
  ] || t;

async function loadHomework() {
  if (!filters.subject_id) {
    homeworks.value = [];
    return;
  }
  const params = {};
  for (const k in filters) if (filters[k]) params[k] = filters[k];
  homeworks.value = await homeworkApi.list(params);
}

function openCreate() {
  if (!filters.subject_id) return toast.show("សូមជ្រើសមុខវិជ្ជាមុន", "error");
  modal.show(HomeworkForm, {
    subject_id: filters.subject_id,
    cohort_id: filters.cohort_id,
  });
}
function openView(h) {
  modal.show(HomeworkSubmissions, { homework: h }, true);
}
async function confirmDelete(h) {
  if (!confirm("លុប?")) return;
  await homeworkApi.remove(h.id);
  toast.show("✅ លុបជោគជ័យ");
  loadHomework();
}

onMounted(() => {
  // Auto-populate current cohort + year
  filters.cohort_id = app.currentCohortId;
  filters.year_id = app.years[0]?.id;
});
</script>
