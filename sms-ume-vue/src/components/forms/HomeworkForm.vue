<template>
  <h3>➕ បង្កើតកិច្ចការថ្មី</h3>

  <div
    v-if="subject"
    style="
      background: linear-gradient(135deg, #eef2ff, #e0e7ff);
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 1rem;
      font-size: 0.85rem;
      color: #1e40af;
    "
  >
    <div style="font-weight: 700; margin-bottom: 0.5rem">
      📚 {{ subject.subject_code }} — {{ subject.subject_name }}
    </div>
    <div style="display: flex; gap: 0.8rem; flex-wrap: wrap">
      <span
        style="
          background: white;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        "
        >📖 ឆ្នាំទី {{ subject.study_year }}</span
      >
      <span
        style="
          background: white;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        "
        >📅 ឆមាស {{ subject.semester }}</span
      >
    </div>
  </div>

  <form @submit.prevent="save">
    <label>🎓 ជំនាន់ *</label>
    <select v-model="form.cohort_id" required>
      <option value="">-- ជ្រើស --</option>
      <option v-for="c in currentCohorts" :key="c.id" :value="c.id">
        {{ c.cohort_name }} ⭐
      </option>
    </select>

    <label>ប្រភេទ *</label>
    <select v-model="form.type" required>
      <option value="homework">📝 Homework</option>
      <option value="quiz">❓ Quiz</option>
      <option value="assignment">📋 Assignment</option>
    </select>

    <label>ចំណងជើង *</label>
    <input v-model="form.title" required />

    <label>ការពិពណ៌នា</label>
    <textarea v-model="form.description" rows="2"></textarea>

    <label>ផុតកំណត់</label>
    <input type="date" v-model="form.due_date" />

    <label>ពិន្ទុពេញ *</label>
    <input
      type="number"
      v-model.number="form.max_score"
      value="100"
      step="0.5"
      required
    />

    <div class="modal-actions">
      <button type="button" class="btn btn-secondary" @click="modal.close()">
        បោះបង់
      </button>
      <button type="submit" class="btn btn-primary">💾 រក្សាទុក</button>
    </div>
  </form>
</template>

<script setup>
import { reactive, computed } from "vue";
import { useAppStore } from "@/stores/app";
import { useModalStore } from "@/stores/modal";
import { useToastStore } from "@/stores/toast";
import homeworkApi from "@/api/homework";

const props = defineProps({
  subject_id: [Number, String],
  cohort_id: [Number, String],
});

const app = useAppStore();
const modal = useModalStore();
const toast = useToastStore();

const form = reactive({
  subject_id: props.subject_id,
  cohort_id: props.cohort_id || app.currentCohortId || "",
  type: "homework",
  title: "",
  description: "",
  due_date: "",
  max_score: 100,
});

const subject = computed(() => app.getSubjectById(props.subject_id));
const currentCohorts = computed(() => app.cohorts.filter((c) => c.is_current));

async function save() {
  const res = await homeworkApi.create(form);
  if (res?.success) {
    toast.show("✅ បង្កើតជោគជ័យ");
    modal.close();
    // Emit event to reload parent
    window.dispatchEvent(new CustomEvent("homework-created"));
  } else {
    toast.show(res?.error || "បរាជ័យ", "error");
  }
}
</script>
