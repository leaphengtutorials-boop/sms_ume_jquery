<template>
  <PageHeader icon="✅" title="វត្តមាន" />

  <div class="view-toggle">
    <button
      :class="['att-view-btn', { active: view === 'take' }]"
      @click="view = 'take'"
    >
      ✅ ស្រង់វត្តមាន
    </button>
    <button
      :class="['att-view-btn', { active: view === 'report' }]"
      @click="view = 'report'"
    >
      📊 របាយការណ៍
    </button>
  </div>

  <div v-show="view === 'take'">
    <div class="toolbar">
      <select v-model="subjectId" class="input" @change="onSubjectChange">
        <option value="">-- ជ្រើសមុខវិជ្ជា --</option>
        <option v-for="s in app.subjects" :key="s.id" :value="s.id">
          {{ s.subject_code }} — {{ s.subject_name }}
        </option>
      </select>
      <select
        v-model="week"
        class="input"
        @change="loadAttendance"
        style="width: 160px"
      >
        <option value="">-- សប្តាហ៍ --</option>
        <option v-for="i in totalWeeks" :key="i" :value="i">
          សប្តាហ៍ {{ i }}
        </option>
      </select>
      <input type="date" v-model="attendDate" class="input" />
      <button class="btn btn-secondary" @click="loadAttendance">
        🔄 ផ្ទុក
      </button>
      <button class="btn btn-success" @click="markAll('present')">
        ✅ ទាំងអស់
      </button>
      <button class="btn btn-warning" @click="markAll('absent')">
        ❌ អវត្តមាន
      </button>
      <button class="btn btn-primary" @click="save">💾 រក្សាទុក</button>
    </div>

    <div id="attSummary" class="att-summary">
      <div class="summary-card">
        <div class="num">{{ students.length }}</div>
        <div class="label">សរុប</div>
      </div>
      <div class="summary-card present">
        <div class="num">{{ counts.present }}</div>
        <div class="label">✅ មាន</div>
      </div>
      <div class="summary-card late">
        <div class="num">{{ counts.late }}</div>
        <div class="label">⏰ យឺត</div>
      </div>
      <div class="summary-card permission">
        <div class="num">{{ counts.permission }}</div>
        <div class="label">📝 ច្បាប់</div>
      </div>
      <div class="summary-card absent">
        <div class="num">{{ counts.absent }}</div>
        <div class="label">❌ អវត្តមាន</div>
      </div>
    </div>

    <div class="table-wrap">
      <table id="attTable">
        <thead>
          <tr>
            <th width="60">#</th>
            <th width="70">រូបថត</th>
            <th>លេខកូដ</th>
            <th>ឈ្មោះ</th>
            <th width="200">ស្ថានភាព</th>
            <th>កំណត់សម្គាល់</th>
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
              <select
                v-model="s.status"
                :class="['status-select', `status-${s.status}`]"
              >
                <option value="present">✅ មាន</option>
                <option value="late">⏰ យឺត</option>
                <option value="permission">📝 ច្បាប់</option>
                <option value="absent">❌ អវត្តមាន</option>
              </select>
            </td>
            <td>
              <input
                v-model="s.note"
                class="note-input input"
                style="width: 100%"
                placeholder="..."
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div v-show="view === 'report'">
    <div class="toolbar">
      <select v-model="subjectId" class="input" @change="loadReport">
        <option value="">-- ជ្រើស --</option>
        <option v-for="s in app.subjects" :key="s.id" :value="s.id">
          {{ s.subject_code }} — {{ s.subject_name }}
        </option>
      </select>
      <button class="btn btn-secondary" @click="loadReport">📊 បង្ហាញ</button>
      <button class="btn btn-success" @click="exportExcel">
        📥 Export Excel
      </button>
      <button class="btn btn-primary" @click="window.print()">🖨️ Print</button>
    </div>
    <div v-html="reportHtml"></div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import { useAppStore } from "@/stores/app";
import { useToastStore } from "@/stores/toast";
import attendanceApi from "@/api/attendance";

const app = useAppStore();
const toast = useToastStore();

const view = ref("take");
const subjectId = ref("");
const week = ref("");
const attendDate = ref(new Date().toISOString().split("T")[0]);
const students = ref([]);
const reportHtml = ref("");
const totalWeeks = computed(
  () => app.getSubjectById(subjectId.value)?.total_weeks || 15,
);

const counts = computed(() => {
  const c = { present: 0, late: 0, permission: 0, absent: 0 };
  students.value.forEach((s) => c[s.status]++);
  return c;
});

function fullPhoto(p) {
  return p?.startsWith("http") ? p : `${import.meta.env.VITE_UPLOAD_BASE}/${p}`;
}

async function onSubjectChange() {
  week.value = 1;
  await loadAttendance();
}

async function loadAttendance() {
  if (!subjectId.value || !week.value) return;
  students.value = await attendanceApi.take({
    subject_id: subjectId.value,
    week: week.value,
  });
}

function markAll(status) {
  students.value.forEach((s) => (s.status = status));
}

async function save() {
  if (!students.value.length) return;
  const res = await attendanceApi.save({
    subject_id: subjectId.value,
    week: week.value,
    attend_date: attendDate.value,
    records: students.value.map((s) => ({
      student_id: s.student_id,
      status: s.status,
      note: s.note || "",
    })),
  });
  if (res?.success) toast.show(res.message);
}

async function loadReport() {
  if (!subjectId.value) return;
  const res = await attendanceApi.report({ subject_id: subjectId.value });
  // Render simple table
  const tw = res.total_weeks;
  const map = { present: "✓", late: "L", absent: "A", permission: "P" };
  let html = `<div style="background:white;padding:1.5rem;border-radius:14px;overflow-x:auto;">
    <h2 style="text-align:center;">📊 របាយការណ៍វត្តមាន</h2>
    <table style="font-size:0.78rem;width:100%;border-collapse:collapse;">
      <thead><tr style="background:#f8fafc;">
        <th>N°</th><th>ឈ្មោះ</th>`;
  for (let i = 1; i <= tw; i++) html += `<th>W${i}</th>`;
  html += `<th>A</th><th>ពិន្ទុ</th></tr></thead><tbody>`;
  res.results.forEach((s, i) => {
    html += `<tr><td>${i + 1}</td><td>${s.full_name}</td>`;
    for (let w = 1; w <= tw; w++) {
      const st = s.week_status[w] || "absent";
      html += `<td style="text-align:center;">${map[st]}</td>`;
    }
    html += `<td>${s.attendance.absent}</td><td>${s.attendance_percent}</td></tr>`;
  });
  html += "</tbody></table></div>";
  reportHtml.value = html;
}

function exportExcel() {
  if (!subjectId.value) return;
  window.location.href = attendanceApi.exportUrl(subjectId.value);
}

onMounted(() => {
  if (app.subjects.length === 0) app.loadSubjects();
});
</script>
