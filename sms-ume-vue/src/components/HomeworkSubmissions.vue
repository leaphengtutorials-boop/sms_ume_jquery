<template>
  <h3>{{ typeLabel }} — {{ props.homework.title }}</h3>

  <div
    v-if="isReadonly"
    style="
      background: #fef3c7;
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 1rem;
      border-left: 4px solid #f59e0b;
    "
  >
    <strong style="color: #92400e">✅ ជំនាន់បានបញ្ចប់</strong>
    <div style="color: #78350f; font-size: 0.82rem; margin-top: 0.3rem">
      Read-only — មិនអាចកែបានទេ
    </div>
  </div>

  <div v-if="loading" style="text-align: center; padding: 2rem">⏳</div>

  <template v-else>
    <div
      style="
        background: linear-gradient(135deg, #eef2ff, #e0e7ff);
        padding: 0.8rem 1rem;
        border-radius: 12px;
        margin-bottom: 1rem;
        font-size: 0.82rem;
        color: #1e40af;
      "
    >
      <div style="display: flex; gap: 1.2rem; flex-wrap: wrap">
        <div>
          🎓 <strong>ជំនាន់:</strong> {{ data.homework.cohort_name || "-" }}
        </div>
        <div>👥 <strong>សិស្ស:</strong> {{ students.length }}</div>
        <div>🎯 <strong>ពិន្ទុពេញ:</strong> {{ data.homework.max_score }}</div>
      </div>
    </div>

    <div
      v-if="!isReadonly"
      style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap"
    >
      <button
        type="button"
        class="btn btn-success btn-sm"
        @click="markAll(true)"
      >
        ✅ ទាំងអស់
      </button>
      <button
        type="button"
        class="btn btn-danger btn-sm"
        @click="markAll(false)"
      >
        ❌ មិនដាក់
      </button>
      <button type="button" class="btn btn-secondary btn-sm" @click="fillFull">
        ⭐ ពេញ
      </button>
    </div>

    <div
      style="
        max-height: 50vh;
        overflow-y: auto;
        border: 1px solid var(--border);
        border-radius: 12px;
      "
    >
      <table style="width: 100%; border-collapse: collapse">
        <thead>
          <tr style="background: #f8fafc; position: sticky; top: 0">
            <th style="padding: 0.7rem; text-align: left; font-size: 0.75rem">
              ឈ្មោះ
            </th>
            <th style="padding: 0.7rem; text-align: center; font-size: 0.75rem">
              បានដាក់
            </th>
            <th style="padding: 0.7rem; text-align: center; font-size: 0.75rem">
              ពិន្ទុ /{{ data.homework.max_score }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="s in students"
            :key="s.student_id"
            style="border-bottom: 1px solid #f1f5f9"
          >
            <td style="padding: 0.6rem">
              <div style="font-size: 0.85rem; font-weight: 600">
                {{ s.full_name }}
              </div>
              <div style="font-size: 0.7rem; color: var(--gray)">
                {{ s.student_code
                }}<template v-if="s.cohort_name">
                  · 🎓 {{ s.cohort_name }}</template
                >
              </div>
            </td>
            <td style="padding: 0.6rem; text-align: center">
              <input
                type="checkbox"
                v-model="s.submitted"
                :disabled="isReadonly"
                @change="toggleScore(s)"
              />
            </td>
            <td style="padding: 0.6rem; text-align: center">
              <input
                type="number"
                v-model.number="s.score"
                :min="0"
                :max="data.homework.max_score"
                step="0.25"
                :disabled="!s.submitted || isReadonly"
                class="input"
                style="width: 80px"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="modal-actions" style="margin-top: 1rem">
      <button type="button" class="btn btn-secondary" @click="modal.close()">
        បិទ
      </button>
      <button
        v-if="!isReadonly"
        type="button"
        class="btn btn-primary"
        @click="save"
      >
        💾 រក្សាទុក
      </button>
    </div>
  </template>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useModalStore } from "@/stores/modal";
import { useToastStore } from "@/stores/toast";
import homeworkApi from "@/api/homework";

const props = defineProps({ homework: Object });
const modal = useModalStore();
const toast = useToastStore();

const data = ref({ homework: {}, students: [], is_readonly: false });
const students = ref([]);
const loading = ref(true);

const isReadonly = computed(
  () =>
    data.value.is_readonly || parseInt(data.value.homework?.is_current) === 0,
);
const typeLabel = computed(
  () =>
    ({
      homework: "📝 Homework",
      quiz: "❓ Quiz",
      assignment: "📋 Assignment",
    })[data.value.homework?.type] || "📝",
);

onMounted(async () => {
  const res = await homeworkApi.get(props.homework.id);
  data.value = res;
  students.value = res.students.map((s) => ({
    ...s,
    submitted: !!s.submitted,
    score: s.score ?? null,
  }));
  loading.value = false;
});

function toggleScore(s) {
  if (!s.submitted) s.score = null;
}

function markAll(submitted) {
  students.value.forEach((s) => {
    s.submitted = submitted;
    if (!submitted) s.score = null;
    else if (s.score == null) s.score = data.value.homework.max_score;
  });
}

function fillFull() {
  students.value.forEach((s) => {
    s.submitted = true;
    s.score = data.value.homework.max_score;
  });
}

async function save() {
  const submissions = students.value.map((s) => ({
    student_id: s.student_id,
    submitted: s.submitted ? 1 : 0,
    score: s.submitted && s.score !== null ? s.score : null,
  }));

  const res = await homeworkApi.saveSubmissions({
    homework_id: props.homework.id,
    submissions,
  });
  if (res?.success) {
    toast.show(res.message);
    modal.close();
    window.dispatchEvent(new CustomEvent("homework-updated"));
  }
}
</script>
