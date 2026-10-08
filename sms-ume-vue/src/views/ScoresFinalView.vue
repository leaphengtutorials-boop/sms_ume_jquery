<template>
  <PageHeader icon="🎓" title="ពិន្ទុ Final" />

  <div
    style="
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 1.2rem;
      border-left: 4px solid #f59e0b;
      font-size: 0.85rem;
    "
  >
    <strong style="color: #92400e">⚠️ ចំណាំ៖</strong>
    <span style="color: #78350f">
      ពិន្ទុ Final បញ្ចូលដោយ <strong>ការិយាល័យសាលា</strong></span
    >
  </div>

  <div class="toolbar">
    <select v-model="filters.subject_id" class="input" @change="loadScores">
      <option value="">-- ជ្រើសមុខវិជ្ជា --</option>
      <option v-for="s in app.subjects" :key="s.id" :value="s.id">
        {{ s.subject_code }} — {{ s.subject_name }}
      </option>
    </select>
    <select v-model="filters.cohort_id" class="input" @change="loadScores">
      <option value="">-- ជំនាន់ --</option>
      <option v-for="c in app.cohorts" :key="c.id" :value="c.id">
        {{ c.cohort_name }}
      </option>
    </select>
    <input v-model="title" class="input" placeholder="ចំណងជើង" />
    <input v-model="examDate" type="date" class="input" />
  </div>

  <div class="toolbar">
    <input
      v-model="filters.search"
      class="input"
      placeholder="🔍 ស្វែងរក..."
      @input="debouncedLoad"
    />
    <button class="btn btn-secondary" @click="loadScores">🔄 ផ្ទុក</button>
    <button class="btn btn-primary" @click="save">💾 រក្សាទុក</button>
    <button class="btn btn-danger" @click="removeAll">🗑️ លុប</button>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th width="60">#</th>
          <th width="70">រូបថត</th>
          <th>លេខកូដ</th>
          <th>ឈ្មោះ</th>
          <th width="180">ពិន្ទុ Final</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(s, i) in students" :key="s.student_id">
          <td>
            <strong>{{ i + 1 }}</strong>
          </td>
          <td>
            <img v-if="s.photo" class="avatar" :src="fullPhoto(s.photo)" />
            <div
              v-else
              class="avatar"
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.3rem;
              "
            >
              {{ s.gender === "M" ? "👨" : "👩" }}
            </div>
          </td>
          <td>
            <strong>{{ s.student_code }}</strong>
          </td>
          <td>{{ s.full_name }}</td>
          <td>
            <input
              v-model="scores[s.student_id]"
              type="number"
              min="0"
              max="100"
              step="0.5"
              class="input"
              style="width: 100%"
              placeholder="0-100"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import { useAppStore } from "@/stores/app";
import { useToastStore } from "@/stores/toast";
import scoresApi from "@/api/scores";

const app = useAppStore();
const toast = useToastStore();

const filters = reactive({ subject_id: "", cohort_id: "", search: "" });
const students = ref([]);
const scores = reactive({});
const title = ref("Final Exam");
const examDate = ref(new Date().toISOString().split("T")[0]);

function fullPhoto(p) {
  return p?.startsWith("http") ? p : `${import.meta.env.VITE_UPLOAD_BASE}/${p}`;
}

async function loadScores() {
  if (!filters.subject_id) {
    students.value = [];
    return;
  }
  const params = { subject_id: filters.subject_id };
  if (filters.cohort_id) params.cohort_id = filters.cohort_id;
  if (filters.search) params.search = filters.search;

  const res = await scoresApi.final.list(params);
  students.value = res.students || [];

  Object.keys(scores).forEach((k) => delete scores[k]);
  Object.entries(res.scores || {}).forEach(([sid, v]) => (scores[sid] = v));
}

let timer;
function debouncedLoad() {
  clearTimeout(timer);
  timer = setTimeout(loadScores, 400);
}

async function save() {
  if (!filters.subject_id) return;
  const records = [];
  students.value.forEach((s) => {
    const v = scores[s.student_id];
    if (v !== "" && v !== null && v !== undefined) {
      records.push({ student_id: s.student_id, score: parseFloat(v) });
    }
  });
  if (!records.length) return toast.show("សូមបញ្ចូលពិន្ទុ", "error");
  if (!confirm(`រក្សាទុក ${records.length} នាក់?`)) return;

  const res = await scoresApi.final.save({
    subject_id: filters.subject_id,
    title: title.value,
    exam_date: examDate.value,
    records,
  });
  if (res?.success) {
    toast.show(res.message);
    loadScores();
  }
}

async function removeAll() {
  if (!filters.subject_id) return;
  if (!confirm("លុបពិន្ទុ Final ទាំងអស់?")) return;
  const res = await scoresApi.final.remove(filters.subject_id);
  if (res?.success) {
    toast.show(`✅ លុប ${res.deleted}`);
    loadScores();
  }
}

onMounted(() => {
  if (app.subjects.length === 0) app.loadSubjects();
  filters.cohort_id = app.currentCohortId || "";
});
</script>
