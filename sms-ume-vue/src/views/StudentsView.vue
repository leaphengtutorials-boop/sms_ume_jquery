<template>
  <PageHeader
    icon="👥"
    title="គ្រប់គ្រងសិស្ស"
    subtitle="បន្ថែម · Import · ទាញគំរូ"
  />

  <div class="toolbar">
    <button class="btn btn-primary" @click="openStudentForm()">
      ➕ បន្ថែមសិស្សថ្មី
    </button>
    <button class="btn btn-success" @click="openImport">📥 Import Excel</button>
    <button class="btn btn-secondary" @click="downloadTemplate">
      📄 ទាញយកគំរូ
    </button>
  </div>

  <div class="toolbar">
    <input v-model="filters.search" class="input" placeholder="🔍 ស្វែងរក..." />
    <select v-model="filters.gender" class="input">
      <option value="">-- ភេទ --</option>
      <option value="M">👨 ប្រុស</option>
      <option value="F">👩 ស្រី</option>
    </select>
    <select v-model="filters.photo" class="input">
      <option value="">-- រូបថត --</option>
      <option value="has">✅ មាន</option>
      <option value="none">❌ គ្មាន</option>
    </select>
    <select v-model="filters.subject" class="input">
      <option value="">-- មុខវិជ្ជា --</option>
      <option v-for="s in app.subjects" :key="s.id" :value="s.id">
        {{ s.subject_code }} - {{ s.subject_name }}
      </option>
    </select>
    <select v-model="filters.status" class="input">
      <option value="">-- ស្ថានភាព --</option>
      <option value="active">🟢 កំពុងរៀន</option>
      <option value="graduated">🎓 បញ្ចប់</option>
      <option value="dropped">🔴 ឈប់</option>
    </select>
    <span class="badge-info">{{ filteredStudents.length }} នាក់</span>
  </div>

  <div class="students-list-view">
    <div class="student-list-header">
      <div>#</div>
      <div>រូបថត</div>
      <div>ឈ្មោះ</div>
      <div>ស្ថានភាព</div>
      <div>មុខវិជ្ជា</div>
      <div style="text-align: right">សកម្មភាព</div>
    </div>
    <div
      v-for="(s, i) in filteredStudents"
      :key="s.id"
      class="student-list-item"
    >
      <div class="index">{{ i + 1 }}</div>
      <div class="photo">
        <img v-if="s.photo" :src="fullPhoto(s.photo)" />
        <span v-else style="font-size: 1.5rem">{{
          s.gender === "M" ? "👨" : "👩"
        }}</span>
      </div>
      <div class="info">
        <div
          class="name"
          style="cursor: pointer; color: var(--primary)"
          @click="openHistory(s)"
        >
          {{ s.full_name }}
        </div>
        <div class="code">📌 {{ s.student_code }}</div>
      </div>
      <div><StatusBadge :status="s.status" /></div>
      <div>
        <button
          class="btn btn-sm btn-info"
          @click="openHistory(s)"
          style="font-size: 0.72rem"
        >
          📚 ប្រវត្តិ
        </button>
      </div>
      <div class="actions">
        <button @click="openStudentForm(s)" title="កែ">✏️</button>
        <button @click="openPhoto(s)" title="រូបថត">📸</button>
        <button @click="confirmDelete(s)" title="លុប">🗑️</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { useAppStore } from "@/stores/app";
import { useModalStore } from "@/stores/modal";
import { useToastStore } from "@/stores/toast";
import studentsApi from "@/api/students";
import StudentForm from "@/components/forms/StudentForm.vue";
import StudentHistory from "@/components/StudentHistory.vue";
import PhotoUpload from "@/components/PhotoUpload.vue";

const app = useAppStore();
const modal = useModalStore();
const toast = useToastStore();

const filters = reactive({
  search: "",
  gender: "",
  photo: "",
  subject: "",
  status: "",
});

const filteredStudents = computed(() => {
  let list = app.students;
  const q = filters.search.toLowerCase();
  if (q)
    list = list.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.student_code.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)),
    );
  if (filters.gender) list = list.filter((s) => s.gender === filters.gender);
  if (filters.photo === "has") list = list.filter((s) => s.photo);
  if (filters.photo === "none") list = list.filter((s) => !s.photo);
  if (filters.status) list = list.filter((s) => s.status === filters.status);
  if (filters.subject)
    list = list.filter(
      (s) => s.subjects && s.subjects.includes(parseInt(filters.subject)),
    );
  return list;
});

function fullPhoto(path) {
  return path?.startsWith("http")
    ? path
    : `${import.meta.env.VITE_UPLOAD_BASE}/${path}`;
}
function openStudentForm(s) {
  modal.show(StudentForm, { student: s });
}
function openHistory(s) {
  modal.show(StudentHistory, { student: s }, true);
}
function openPhoto(s) {
  modal.show(PhotoUpload, { student: s });
}
function openImport() {
  modal.show(ImportCSV);
}
function downloadTemplate() {
  window.location.href = `${import.meta.env.VITE_API_BASE}/template.php`;
}
async function confirmDelete(s) {
  if (!confirm(`លុបសិស្ស "${s.full_name}"?`)) return;
  await studentsApi.remove(s.id);
  toast.show("✅ លុបជោគជ័យ");
  app.loadStudents();
}
</script>
