<template>
  <PageHeader
    icon="🎓"
    title="សិស្សដែលបានបញ្ចប់មុខវិជ្ជា"
    subtitle="តាមជំនាន់ · ឆ្នាំ · ឆមាស · មុខវិជ្ជា"
  />

  <div class="toolbar">
    <select v-model="filters.cohort_id" class="input" @change="load">
      <option value="">-- ជំនាន់ --</option>
      <option v-for="c in app.cohorts" :key="c.id" :value="c.id">
        {{ c.cohort_name }}
      </option>
    </select>
    <select v-model="filters.year_id" class="input" @change="load">
      <option value="">-- ឆ្នាំសិក្សា --</option>
      <option v-for="y in app.years" :key="y.id" :value="y.id">
        {{ y.year_name }}
      </option>
    </select>
    <select v-model="filters.study_year" class="input" @change="load">
      <option value="">-- ឆ្នាំទី --</option>
      <option v-for="i in [1, 2, 3, 4]" :key="i" :value="i">
        ឆ្នាំទី {{ i }}
      </option>
    </select>
    <select v-model="filters.semester" class="input" @change="load">
      <option value="">-- ឆមាស --</option>
      <option value="1">ឆមាស ១</option>
      <option value="2">ឆមាស ២</option>
    </select>
  </div>

  <div class="toolbar">
    <select v-model="filters.subject_id" class="input" @change="load">
      <option value="">-- មុខវិជ្ជា --</option>
      <option v-for="s in app.subjects" :key="s.id" :value="s.id">
        {{ s.subject_code }} - {{ s.subject_name }}
      </option>
    </select>
    <select v-model="filters.student_status" class="input" @change="load">
      <option value="">-- ស្ថានភាព --</option>
      <option value="active">🟢 កំពុងរៀន</option>
      <option value="graduated">🎓 បញ្ចប់</option>
      <option value="dropped">🔴 ឈប់</option>
    </select>
    <input
      v-model="filters.search"
      class="input"
      placeholder="🔍 ស្វែងរក..."
      @input="debouncedLoad"
    />
    <button class="btn btn-secondary" @click="load">🔄 ផ្ទុក</button>
    <button class="btn btn-info" @click="exportExcel">📊 Excel</button>
    <span class="badge-info">{{ rows.length }} នាក់</span>
  </div>

  <div class="table-wrap">
    <table ref="tableEl" id="compTable">
      <thead>
        <tr>
          <th width="50">#</th>
          <th width="60">រូបថត</th>
          <th>លេខកូដ</th>
          <th>ឈ្មោះ</th>
          <th>ជំនាន់</th>
          <th>មុខវិជ្ជា</th>
          <th>ឆ្នាំ/ឆមាស</th>
          <th width="130">ពិន្ទុ</th>
          <th width="80">សរុប</th>
          <th width="70">និទ្ទេស</th>
          <th width="130">បញ្ចប់</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(r, i) in rows"
          :key="r.enrollment_id"
          style="background: #f0fdf4"
        >
          <td>
            <strong>{{ i + 1 }}</strong>
          </td>
          <td>
            <img
              v-if="r.photo"
              class="avatar"
              :src="fullPhoto(r.photo)"
              style="border-color: #10b981"
            />
            <div
              v-else
              class="avatar"
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.3rem;
                border: 2px solid #10b981;
              "
            >
              {{ r.gender === "M" ? "👨" : "👩" }}
            </div>
          </td>
          <td>
            <strong>{{ r.student_code }}</strong>
          </td>
          <td>
            <div style="font-weight: 600">{{ r.full_name }}</div>
            <div style="font-size: 0.72rem; color: var(--gray)">
              {{ r.gender === "M" ? "ប្រុស" : "ស្រី" }}
            </div>
          </td>
          <td style="font-size: 0.78rem; color: var(--gray)">
            {{ r.cohort_name || "-" }}
          </td>
          <td>
            <strong>{{ r.subject_code }}</strong
            ><br />
            <small style="color: var(--gray)">{{ r.subject_name }}</small>
          </td>
          <td style="font-size: 0.75rem">
            📖 ឆ្នាំទី {{ r.study_year }}<br />
            📅 ឆមាស {{ r.semester }}<br />
            🗓️ {{ r.year_name || "-" }}
          </td>
          <td style="font-size: 0.72rem; line-height: 1.6">
            <div>
              📝 HW: <strong>{{ r.hw_score }}</strong>
            </div>
            <div>
              ❓ Quiz: <strong>{{ r.quiz_score }}</strong>
            </div>
            <div>
              📖 Mid: <strong style="color: #3b82f6">{{ r.mid_score }}</strong>
            </div>
            <div>
              📋 Asg: <strong>{{ r.asg_score }}</strong>
            </div>
            <div>
              🎓 Final:
              <strong style="color: #8b5cf6">{{ r.fin_score }}</strong>
            </div>
          </td>
          <td style="text-align: center">
            <strong style="color: #6366f1; font-size: 1.05rem">{{
              r.total_score
            }}</strong>
          </td>
          <td style="text-align: center">
            <strong :class="`grade-${r.grade}`">{{ r.grade }}</strong>
          </td>
          <td
            style="
              font-size: 0.75rem;
              color: #065f46;
              font-weight: 600;
              white-space: nowrap;
            "
          >
            <div
              style="
                background: #d1fae5;
                padding: 4px 10px;
                border-radius: 10px;
                display: inline-block;
              "
            >
              ✅ {{ formatDate(r.completed_at) }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import * as XLSX from "xlsx";
import PageHeader from "@/components/PageHeader.vue";
import { useAppStore } from "@/stores/app";
import reportsApi from "@/api/reports";

const app = useAppStore();
const filters = reactive({
  cohort_id: "",
  year_id: "",
  study_year: "",
  semester: "",
  subject_id: "",
  student_status: "",
  search: "",
});
const rows = ref([]);
const tableEl = ref(null);

function fullPhoto(p) {
  return p?.startsWith("http") ? p : `${import.meta.env.VITE_UPLOAD_BASE}/${p}`;
}
function formatDate(d) {
  if (!d) return "-";
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

async function load() {
  const params = {};
  for (const k in filters) if (filters[k]) params[k] = filters[k];
  const res = await reportsApi.completed(params);
  rows.value = Array.isArray(res) ? res : [];
}

let timer;
function debouncedLoad() {
  clearTimeout(timer);
  timer = setTimeout(load, 400);
}

function exportExcel() {
  if (!tableEl.value) return;
  const wb = XLSX.utils.table_to_book(tableEl.value, { sheet: "Completed" });
  XLSX.writeFile(wb, `completed_students_${Date.now()}.xlsx`);
}

onMounted(load);
</script>
