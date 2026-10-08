<template>
  <PageHeader icon="📈" title="លទ្ធផលពិន្ទុសរុប" />

  <div class="toolbar no-print">
    <select v-model="filters.subject_id" class="input" @change="loadReport">
      <option value="">-- ជ្រើសមុខវិជ្ជា --</option>
      <option v-for="s in app.subjects" :key="s.id" :value="s.id">
        {{ s.subject_code }} — {{ s.subject_name }}
      </option>
    </select>
    <select v-model="viewMode" class="input" @change="loadReport">
      <option value="current">🎯 ជំនាន់បច្ចុប្បន្ន</option>
      <option value="all">📊 ទាំងអស់</option>
      <option value="history">📚 រួមបញ្ចប់</option>
    </select>
    <select v-model="filters.cohort_id" class="input" @change="loadReport">
      <option value="">-- ជំនាន់ --</option>
      <option v-for="c in app.cohorts" :key="c.id" :value="c.id">
        {{ c.cohort_name }}
      </option>
    </select>
    <input
      v-model="filters.search"
      class="input"
      placeholder="🔍 ស្វែងរក..."
      @input="debouncedLoad"
    />
  </div>

  <div class="toolbar no-print">
    <button class="btn btn-secondary" @click="loadReport">🔄 ផ្ទុក</button>
    <button class="btn btn-primary" @click="print">🖨️ Print</button>
    <button class="btn btn-info" @click="exportExcel">📊 Excel</button>
    <button class="btn btn-danger" @click="exportPDF">📄 PDF</button>
  </div>

  <div ref="reportContent" id="reportContent">
    <div
      v-if="!result"
      style="text-align: center; padding: 2rem; color: var(--gray)"
    >
      សូមជ្រើសមុខវិជ្ជា
    </div>

    <div
      v-else
      style="
        background: white;
        padding: 1.5rem;
        border-radius: 14px;
        overflow-x: auto;
      "
    >
      <div style="text-align: center; margin-bottom: 1.5rem">
        <h2>📈 លទ្ធផលពិន្ទុសរុប</h2>
        <p style="color: var(--gray)">
          {{ result.subject.subject_name }} · {{ result.results.length }} នាក់
        </p>
        <div
          v-if="result.weights"
          style="
            margin-top: 0.8rem;
            padding: 0.7rem;
            background: #eef2ff;
            border-radius: 10px;
            display: inline-block;
            font-size: 0.82rem;
          "
        >
          ⚖️ Att {{ result.weights.attendance_weight }}% · HW
          {{ result.weights.homework_weight }}% · Quiz
          {{ result.weights.quiz_weight }}% · Mid
          {{ result.weights.midterm_weight }}% · Asg
          {{ result.weights.assignment_weight }}% · Final
          {{ result.weights.final_weight }}%
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>N°</th>
            <th>លេខកូដ</th>
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
          <tr v-for="(s, i) in result.results" :key="s.student_id">
            <td>
              <strong>{{ i + 1 }}</strong>
            </td>
            <td>{{ s.student_code }}</td>
            <td>{{ s.full_name }}</td>
            <td style="font-size: 0.72rem; color: var(--gray)">
              {{ s.cohort_name || "-" }}
            </td>
            <td style="text-align: center; color: #166534; font-weight: 700">
              {{ s.attendance_score }}
            </td>
            <td style="text-align: center">{{ s.scores.homework }}</td>
            <td style="text-align: center">{{ s.scores.quiz }}</td>
            <td style="text-align: center; color: #3b82f6; font-weight: 700">
              {{ s.scores.midterm }}
            </td>
            <td style="text-align: center">{{ s.scores.assignment }}</td>
            <td style="text-align: center; color: #8b5cf6; font-weight: 700">
              {{ s.scores.final }}
            </td>
            <td style="text-align: center">
              <strong style="color: #6366f1; font-size: 1.05rem">{{
                s.total_score
              }}</strong>
            </td>
            <td style="text-align: center">
              <strong :class="`grade-${s.grade}`">{{ s.grade }}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import * as XLSX from "xlsx";
import PageHeader from "@/components/PageHeader.vue";
import { useAppStore } from "@/stores/app";
import { useToastStore } from "@/stores/toast";
import reportsApi from "@/api/reports";

const app = useAppStore();
const toast = useToastStore();

const filters = reactive({ subject_id: "", cohort_id: "", search: "" });
const viewMode = ref("current");
const result = ref(null);
const reportContent = ref(null);

async function loadReport() {
  if (!filters.subject_id) {
    result.value = null;
    return;
  }
  const params = { subject_id: filters.subject_id };
  if (filters.cohort_id) params.cohort_id = filters.cohort_id;
  if (filters.search) params.search = filters.search;
  if (viewMode.value === "current") params.only_current = 1;
  if (viewMode.value === "history") params.include_completed = 1;

  const res = await reportsApi.load(params);
  if (res?.error) {
    toast.show(res.error, "error");
    return;
  }
  result.value = res;
}

let timer;
function debouncedLoad() {
  clearTimeout(timer);
  timer = setTimeout(loadReport, 400);
}

function print() {
  window.print();
}

function exportExcel() {
  const el = reportContent.value?.querySelector("table");
  if (!el) return toast.show("សូមបង្ហាញ", "error");
  const wb = XLSX.utils.table_to_book(el, { sheet: "Results" });
  XLSX.writeFile(wb, `results_${Date.now()}.xlsx`);
}

function exportPDF() {
  const el = reportContent.value;
  if (!el) return;
  if (!window.html2pdf) {
    toast.show("PDF plugin មិនទាន់ load", "error");
    return;
  }
  window
    .html2pdf()
    .from(el)
    .set({
      filename: `results_${Date.now()}.pdf`,
      html2canvas: { scale: 2 },
    })
    .save();
}

onMounted(() => {
  if (app.subjects.length === 0) app.loadSubjects();
  filters.cohort_id = app.currentCohortId || "";
});
</script>
