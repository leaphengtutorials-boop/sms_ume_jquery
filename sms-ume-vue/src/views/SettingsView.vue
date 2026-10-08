<template>
  <PageHeader icon="⚙️" title="ការកំណត់" />

  <div class="settings-tabs">
    <button
      v-for="t in tabs"
      :key="t.id"
      :class="['set-tab', { active: currentTab === t.id }]"
      @click="currentTab = t.id"
    >
      {{ t.label }}
    </button>
  </div>

  <!-- Weights -->
  <div v-show="currentTab === 'weights'" class="card">
    <h3>⚖️ ទម្ងន់ពិន្ទុ</h3>
    <select
      v-model="weightSubject"
      class="input"
      @change="loadWeights"
      style="margin-bottom: 1rem"
    >
      <option value="">-- ជ្រើសមុខវិជ្ជា --</option>
      <option v-for="s in app.subjects" :key="s.id" :value="s.id">
        {{ s.subject_code }} — {{ s.subject_name }}
      </option>
    </select>
    <div class="form-grid">
      <div class="form-group">
        <label>✅ Attendance (%)</label
        ><input
          v-model.number="weights.attendance_weight"
          type="number"
          class="input"
        />
      </div>
      <div class="form-group">
        <label>📝 Homework (%)</label
        ><input
          v-model.number="weights.homework_weight"
          type="number"
          class="input"
        />
      </div>
      <div class="form-group">
        <label>❓ Quiz (%)</label
        ><input
          v-model.number="weights.quiz_weight"
          type="number"
          class="input"
        />
      </div>
      <div class="form-group">
        <label>📖 Midterm (%)</label
        ><input
          v-model.number="weights.midterm_weight"
          type="number"
          class="input"
        />
      </div>
      <div class="form-group">
        <label>📋 Assignment (%)</label
        ><input
          v-model.number="weights.assignment_weight"
          type="number"
          class="input"
        />
      </div>
      <div class="form-group">
        <label>🎓 Final (%)</label
        ><input
          v-model.number="weights.final_weight"
          type="number"
          class="input"
        />
      </div>
    </div>
    <div
      style="
        background: #f0fdf4;
        padding: 0.8rem;
        border-radius: 10px;
        text-align: center;
        margin-bottom: 1rem;
      "
    >
      <strong
        >ផលបូក:
        <span
          :style="{
            color:
              Math.abs(weightTotal - 100) < 0.01
                ? 'var(--success)'
                : 'var(--danger)',
          }"
          >{{ weightTotal }}</span
        >%</strong
      >
    </div>
    <button class="btn btn-primary" @click="saveWeights">💾 រក្សាទុក</button>
  </div>

  <!-- Rules -->
  <div v-show="currentTab === 'rules'" class="card">
    <h3>✅ ច្បាប់វត្តមាន</h3>
    <select
      v-model="ruleSubject"
      class="input"
      @change="loadRules"
      style="margin-bottom: 1rem"
    >
      <option value="">-- ជ្រើសមុខវិជ្ជា --</option>
      <option v-for="s in app.subjects" :key="s.id" :value="s.id">
        {{ s.subject_code }} — {{ s.subject_name }}
      </option>
    </select>
    <div class="form-grid">
      <div class="form-group">
        <label>✅ ពិន្ទុពេញ</label
        ><input
          v-model.number="rules.present_score"
          type="number"
          step="0.1"
          class="input"
        />
      </div>
      <div class="form-group">
        <label>⏰ កាត់យឺត</label
        ><input
          v-model.number="rules.late_deduction"
          type="number"
          step="0.1"
          class="input"
        />
      </div>
      <div class="form-group">
        <label>❌ កាត់អវត្តមាន</label
        ><input
          v-model.number="rules.absent_deduction"
          type="number"
          step="0.1"
          class="input"
        />
      </div>
      <div class="form-group">
        <label>📝 កាត់ច្បាប់</label
        ><input
          v-model.number="rules.permission_deduction"
          type="number"
          step="0.1"
          class="input"
        />
      </div>
    </div>
    <button class="btn btn-primary" @click="saveRules">💾 រក្សាទុក</button>
  </div>

  <!-- Years -->
  <div v-show="currentTab === 'years'" class="card">
    <h3>📅 ឆ្នាំសិក្សា</h3>
    <div class="toolbar">
      <input
        v-model="newYear.name"
        class="input"
        placeholder="ឈ្មោះ 2026-2027"
      />
      <input v-model="newYear.start" type="date" class="input" />
      <input v-model="newYear.end" type="date" class="input" />
      <button class="btn btn-primary" @click="createYear">➕ បន្ថែម</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>ឈ្មោះ</th>
            <th>ចាប់ផ្តើម</th>
            <th>បញ្ចប់</th>
            <th>សកម្ម</th>
            <th>សកម្មភាព</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="y in app.years" :key="y.id">
            <td>{{ y.id }}</td>
            <td>
              <strong>{{ y.year_name }}</strong>
            </td>
            <td>{{ y.start_date || "-" }}</td>
            <td>{{ y.end_date || "-" }}</td>
            <td>{{ y.is_active ? "✅" : "❌" }}</td>
            <td>
              <button class="btn btn-danger btn-sm" @click="deleteYear(y)">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Cohorts -->
  <div v-show="currentTab === 'cohorts'" class="card">
    <h3>🎓 ជំនាន់</h3>
    <div class="toolbar">
      <input v-model="newCohort.name" class="input" placeholder="ឈ្មោះជំនាន់" />
      <input v-model="newCohort.desc" class="input" placeholder="ការពិពណ៌នា" />
      <button class="btn btn-primary" @click="createCohort">➕ បន្ថែម</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>ឈ្មោះ</th>
            <th>ការពិពណ៌នា</th>
            <th>បច្ចុប្បន្ន</th>
            <th>សកម្មភាព</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in app.cohorts"
            :key="c.id"
            :style="c.is_current ? 'background:#f0fdf4;' : ''"
          >
            <td>{{ c.id }}</td>
            <td>
              <strong>{{ c.cohort_name }}</strong>
              <span v-if="c.is_current">⭐</span>
            </td>
            <td>{{ c.description || "-" }}</td>
            <td>{{ c.is_current ? "⭐" : "" }}</td>
            <td>
              <button
                v-if="!c.is_current"
                class="btn btn-success btn-sm"
                @click="setCurrent(c)"
              >
                ⭐
              </button>
              <button
                v-if="!c.is_current"
                class="btn btn-danger btn-sm"
                @click="deleteCohort(c)"
              >
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import PageHeader from "@/components/PageHeader.vue";
import { useAppStore } from "@/stores/app";
import { useToastStore } from "@/stores/toast";
import settingsApi from "@/api/settings";
import yearsApi from "@/api/years";
import cohortsApi from "@/api/cohorts";

const app = useAppStore();
const toast = useToastStore();

const tabs = [
  { id: "weights", label: "⚖️ ទម្ងន់" },
  { id: "rules", label: "✅ ច្បាប់វត្តមាន" },
  { id: "years", label: "📅 ឆ្នាំ" },
  { id: "cohorts", label: "🎓 ជំនាន់" },
];
const currentTab = ref("weights");

// Weights
const weightSubject = ref("");
const weights = reactive({
  attendance_weight: 10,
  homework_weight: 10,
  quiz_weight: 10,
  midterm_weight: 20,
  assignment_weight: 15,
  final_weight: 35,
});
const weightTotal = computed(() =>
  Object.values(weights).reduce((s, v) => s + (Number(v) || 0), 0),
);
async function loadWeights() {
  if (!weightSubject.value) return;
  const d = await settingsApi.weights.get(weightSubject.value);
  Object.assign(weights, d);
}
async function saveWeights() {
  await settingsApi.weights.save({
    subject_id: weightSubject.value,
    ...weights,
  });
  toast.show("✅ រក្សាទុកជោគជ័យ");
}

// Rules
const ruleSubject = ref("");
const rules = reactive({
  present_score: 1,
  late_deduction: 0.5,
  absent_deduction: 1,
  permission_deduction: 0.3,
});
async function loadRules() {
  if (!ruleSubject.value) return;
  const d = await settingsApi.rules.get(ruleSubject.value);
  Object.assign(rules, d);
}
async function saveRules() {
  await settingsApi.rules.save({ subject_id: ruleSubject.value, ...rules });
  toast.show("✅ រក្សាទុកជោគជ័យ");
}

// Years
const newYear = reactive({ name: "", start: "", end: "" });
async function createYear() {
  if (!newYear.name) return toast.show("សូមបំពេញឈ្មោះ", "error");
  await yearsApi.create({
    year_name: newYear.name,
    start_date: newYear.start,
    end_date: newYear.end,
  });
  newYear.name = "";
  newYear.start = "";
  newYear.end = "";
  toast.show("✅ បង្កើតជោគជ័យ");
  app.loadAll();
}
async function deleteYear(y) {
  if (!confirm("លុបឆ្នាំសិក្សានេះ?")) return;
  await yearsApi.remove(y.id);
  toast.show("✅ លុបជោគជ័យ");
  app.loadAll();
}

// Cohorts
const newCohort = reactive({ name: "", desc: "" });
async function createCohort() {
  if (!newCohort.name) return toast.show("សូមបំពេញឈ្មោះ", "error");
  await cohortsApi.create({
    cohort_name: newCohort.name,
    description: newCohort.desc,
  });
  newCohort.name = "";
  newCohort.desc = "";
  toast.show("✅ បង្កើតជោគជ័យ");
  app.loadAll();
}
async function setCurrent(c) {
  if (!confirm(`កំណត់ "${c.cohort_name}" ជាជំនាន់បច្ចុប្បន្ន?`)) return;
  await cohortsApi.setCurrent(c.id);
  toast.show("✅ កំណត់ជោគជ័យ");
  app.loadAll();
}
async function deleteCohort(c) {
  if (!confirm("លុបជំនាន់នេះ?")) return;
  await cohortsApi.remove(c.id);
  toast.show("✅ លុបជោគជ័យ");
  app.loadAll();
}

onMounted(() => {
  if (app.subjects.length === 0) app.loadSubjects();
});
</script>
