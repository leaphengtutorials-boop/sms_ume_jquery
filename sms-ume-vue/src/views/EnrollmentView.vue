<template>
  <PageHeader
    icon="📝"
    title="ចុះឈ្មោះចូលរៀន"
    subtitle="តាមដានមុខវិជ្ជាច្រើន"
  />

  <!-- Row 1 -->
  <div class="toolbar">
    <select v-model="filters.subject_id" class="input" @change="loadEnrollment">
      <option value="">-- ជ្រើសមុខវិជ្ជា --</option>
      <option v-for="s in app.subjects" :key="s.id" :value="s.id">
        {{ s.subject_code }} — {{ s.subject_name }} (ឆ្នាំ {{ s.study_year }} ·
        ឆមាស {{ s.semester }})
      </option>
    </select>
    <input
      v-model="filters.search"
      class="input"
      placeholder="🔍 ស្វែងរក..."
      @input="debouncedLoad"
    />
    <span class="badge-info">{{ filteredRows.length }} នាក់</span>
  </div>

  <!-- Row 2 -->
  <div class="toolbar">
    <select v-model="filters.cohort_id" class="input" @change="loadEnrollment">
      <option value="">-- ជំនាន់ --</option>
      <option v-for="c in app.cohorts" :key="c.id" :value="c.id">
        {{ c.cohort_name }}{{ c.is_current ? " ⭐" : "" }}
      </option>
    </select>
    <select v-model="filters.entry_year_id" class="input" disabled>
      <option value="">-- ឆ្នាំ --</option>
      <option v-for="y in app.years" :key="y.id" :value="y.id">
        {{ y.year_name }}
      </option>
    </select>
    <select
      v-model="filters.enroll_status"
      class="input"
      @change="loadEnrollment"
    >
      <option value="">-- ស្ថានភាពមុខវិជ្ជា --</option>
      <option value="active">🟢 កំពុងរៀន</option>
      <option value="completed">✅ បញ្ចប់</option>
      <option value="dropped">🔴 ឈប់</option>
    </select>
    <select
      v-model="filters.student_status"
      class="input"
      @change="loadEnrollment"
    >
      <option value="">-- ស្ថានភាពសិស្ស --</option>
      <option value="active">🟢 កំពុងរៀន</option>
      <option value="graduated">🎓 បញ្ចប់ការសិក្សា</option>
    </select>
    <select v-model="viewMode" class="input">
      <option value="all">📋 ទាំងអស់</option>
      <option value="available">✅ អាចចុះឈ្មោះ</option>
      <option value="busy">🔒 រវល់</option>
    </select>
  </div>

  <!-- Row 3 — Actions -->
  <div class="toolbar">
    <button class="btn btn-success" @click="selectAll">✅ ជ្រើសទាំងអស់</button>
    <button class="btn btn-warning" @click="deselectAll">❌ ដកទាំងអស់</button>
    <button class="btn btn-info" @click="bulkComplete">🎓 បញ្ចប់ទាំងអស់</button>
    <button class="btn btn-primary" @click="saveEnrollment">💾 រក្សាទុក</button>
  </div>

  <!-- List -->
  <div class="enrollment-list">
    <div
      v-if="!filters.subject_id"
      style="text-align: center; padding: 2rem; color: var(--gray)"
    >
      សូមជ្រើសមុខវិជ្ជា
    </div>

    <template v-else>
      <!-- Summary -->
      <div class="enroll-summary">
        <div>✅ <strong>អាចចុះឈ្មោះ:</strong> {{ availableCount }} នាក់</div>
        <div>🔒 <strong>រវល់:</strong> {{ busyCount }} នាក់</div>
      </div>

      <!-- Rows -->
      <div
        v-for="s in filteredRows"
        :key="s.id"
        :class="['enroll-row', rowClass(s)]"
      >
        <div class="enroll-checkbox-col">
          <input
            type="checkbox"
            class="enroll-check"
            :checked="isEnrolled(s)"
            :disabled="isBusy(s)"
            @change="toggleCheck(s, $event.target.checked)"
          />
        </div>
        <div class="enroll-photo-col">
          <img v-if="s.photo" :src="fullPhoto(s.photo)" />
          <span v-else>{{ s.gender === "M" ? "👨" : "👩" }}</span>
        </div>
        <div class="enroll-info-col">
          <div class="enroll-name">{{ s.full_name }}</div>
          <div class="enroll-meta">
            📌 {{ s.student_code }}
            <template v-if="s.cohort_name"> · 🎓 {{ s.cohort_name }}</template>
          </div>
          <div class="enroll-subject-info">
            <span class="subj-chip"
              >📖 ឆ្នាំទី {{ subject?.study_year || "-" }}</span
            >
            <span class="subj-chip"
              >📅 ឆមាស {{ subject?.semester || "-" }}</span
            >
            <span class="subj-chip">🗓️ {{ subject?.year_name || "-" }}</span>
          </div>
        </div>
        <div class="enroll-status-col">
          <select
            v-if="isEnrolled(s)"
            class="enroll-status-select"
            :value="s.enroll_status"
            @change="changeStatus(s, $event.target.value)"
          >
            <option value="active">🟢 កំពុងរៀន</option>
            <option value="completed">✅ បញ្ចប់</option>
            <option value="dropped">🔴 ឈប់</option>
          </select>
          <span v-else-if="isBusy(s)" class="enroll-busy-chip"
            >🔒 កំពុងរៀន</span
          >
          <span v-else class="enroll-not-enrolled">-</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import { useAppStore } from "@/stores/app";
import { useToastStore } from "@/stores/toast";
import enrollmentApi from "@/api/enrollment";

const app = useAppStore();
const toast = useToastStore();

const filters = reactive({
  subject_id: "",
  search: "",
  cohort_id: "",
  entry_year_id: "",
  enroll_status: "",
  student_status: "",
});

const rows = ref([]);
const viewMode = ref("all");
const selected = reactive({}); // { student_id: status }

const subject = computed(() => app.getSubjectById(filters.subject_id));

const filteredRows = computed(() => {
  let list = rows.value;
  if (viewMode.value === "available") {
    list = list.filter((s) => !isBusy(s) || isEnrolled(s));
  } else if (viewMode.value === "busy") {
    list = list.filter((s) => isBusy(s));
  }
  return list;
});

const availableCount = computed(
  () => rows.value.filter((s) => !isBusy(s)).length,
);
const busyCount = computed(() => rows.value.filter((s) => isBusy(s)).length);

function fullPhoto(p) {
  return p?.startsWith("http") ? p : `${import.meta.env.VITE_UPLOAD_BASE}/${p}`;
}

function isEnrolled(s) {
  return s.enrolled == 1;
}
function isBusy(s) {
  return parseInt(s.other_active_count || 0) > 0 && !isEnrolled(s);
}
function rowClass(s) {
  if (s.enroll_status === "completed") return "enroll-row-completed";
  if (s.enroll_status === "dropped") return "enroll-row-dropped";
  if (s.enroll_status === "active") return "enroll-row-active";
  if (isBusy(s)) return "enroll-row-busy";
  return "";
}

async function loadEnrollment() {
  if (!filters.subject_id) {
    rows.value = [];
    return;
  }
  const params = {};
  for (const k in filters) if (filters[k]) params[k] = filters[k];
  const res = await enrollmentApi.list(params);
  rows.value = Array.isArray(res) ? res : [];

  // Init selected map
  Object.keys(selected).forEach((k) => delete selected[k]);
  rows.value.forEach((s) => {
    if (s.enrolled == 1) selected[s.id] = s.enroll_status || "active";
  });
}

let timer;
function debouncedLoad() {
  clearTimeout(timer);
  timer = setTimeout(loadEnrollment, 400);
}

function toggleCheck(s, checked) {
  if (checked) selected[s.id] = s.enroll_status || "active";
  else delete selected[s.id];
}

function selectAll() {
  filteredRows.value.forEach((s) => {
    if (!isBusy(s)) selected[s.id] = selected[s.id] || "active";
  });
  toast.show("✅ បានជ្រើសទាំងអស់");
}
function deselectAll() {
  Object.keys(selected).forEach((k) => delete selected[k]);
}

async function changeStatus(s, status) {
  const res = await enrollmentApi.changeStatus(
    s.id,
    filters.subject_id,
    status,
  );
  if (res?.success) {
    toast.show("✅ កែជោគជ័យ");
    loadEnrollment();
  } else if (res?.missing) {
    alert(
      `⚠️ មិនអាចបញ្ចប់បាន!\n\n${res.missing.map((m) => "• " + m).join("\n")}`,
    );
  } else {
    toast.show(res?.error || "បរាជ័យ", "error");
  }
}

async function saveEnrollment() {
  if (!filters.subject_id) return;
  const students = Object.entries(selected).map(([id, status]) => ({
    id: parseInt(id),
    status,
  }));

  const res = await enrollmentApi.save({
    subject_id: parseInt(filters.subject_id),
    students,
  });
  if (res?.success) {
    toast.show(res.message);
    loadEnrollment();
    app.loadSubjects();
  } else {
    toast.show(res?.error || "បរាជ័យ", "error");
    if (res?.conflicts) alert(`⚠️ ${res.message}`);
  }
}

async function bulkComplete() {
  if (!filters.subject_id) return;
  const ids = Object.keys(selected).map(Number);
  if (!ids.length) return toast.show("សូមជ្រើសសិស្ស", "error");
  if (!confirm(`🎓 បញ្ចប់សម្រាប់ ${ids.length} នាក់?`)) return;

  const res = await enrollmentApi.bulkComplete(
    parseInt(filters.subject_id),
    ids,
  );
  if (res?.success) {
    toast.show(res.message);
    if (res.skipped?.length) {
      setTimeout(
        () =>
          alert(
            `⚠️ រំលង ${res.skipped.length} នាក់:\n\n${res.skipped.slice(0, 10).join("\n")}`,
          ),
        500,
      );
    }
    loadEnrollment();
  } else {
    toast.show(res?.error || "បរាជ័យ", "error");
  }
}

onMounted(() => {
  if (app.subjects.length === 0) app.loadSubjects();
  filters.cohort_id = app.currentCohortId || "";
});
</script>
