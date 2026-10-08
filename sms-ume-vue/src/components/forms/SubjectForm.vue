<template>
  <h3>{{ props.subject ? "✏️ កែមុខវិជ្ជា" : "➕ បន្ថែមមុខវិជ្ជាថ្មី" }}</h3>
  <form @submit.prevent="save">
    <label>លេខកូដ *</label>
    <input v-model="form.subject_code" required />

    <label>ឈ្មោះ *</label>
    <input v-model="form.subject_name" required />

    <label>🗓️ ឆ្នាំសិក្សា *</label>
    <select v-model="form.academic_year_id" required>
      <option value="">-- ជ្រើស --</option>
      <option v-for="y in app.years" :key="y.id" :value="y.id">
        {{ y.year_name }}
      </option>
    </select>

    <label>📖 ឆ្នាំទី *</label>
    <select v-model="form.study_year" required>
      <option v-for="i in [1, 2, 3, 4]" :key="i" :value="i">
        ឆ្នាំទី {{ i }}
      </option>
    </select>

    <label>📅 ឆមាស *</label>
    <select v-model="form.semester" required>
      <option value="1">ឆមាស ១</option>
      <option value="2">ឆមាស ២</option>
    </select>

    <label>ចំនួនសប្តាហ៍</label>
    <select v-model="form.total_weeks">
      <option :value="13">13 សប្តាហ៍</option>
      <option :value="15">15 សប្តាហ៍</option>
    </select>

    <label>ការពិពណ៌នា</label>
    <textarea v-model="form.description" rows="2"></textarea>

    <div class="modal-actions">
      <button type="button" class="btn btn-secondary" @click="modal.close()">
        បោះបង់
      </button>
      <button type="submit" class="btn btn-primary">💾 រក្សាទុក</button>
    </div>
  </form>
</template>

<script setup>
import { reactive } from "vue";
import { useAppStore } from "@/stores/app";
import { useModalStore } from "@/stores/modal";
import { useToastStore } from "@/stores/toast";
import subjectsApi from "@/api/subjects";

const props = defineProps({ subject: Object });
const app = useAppStore();
const modal = useModalStore();
const toast = useToastStore();

const form = reactive({
  id: props.subject?.id || null,
  subject_code: props.subject?.subject_code || "",
  subject_name: props.subject?.subject_name || "",
  academic_year_id: props.subject?.academic_year_id || "",
  study_year: props.subject?.study_year || 1,
  semester: props.subject?.semester || 1,
  total_weeks: props.subject?.total_weeks || 15,
  description: props.subject?.description || "",
});

async function save() {
  const isEdit = !!form.id;
  if (isEdit) await subjectsApi.update(form);
  else await subjectsApi.create(form);

  toast.show("✅ រក្សាទុកជោគជ័យ");
  modal.close();
  app.loadSubjects();
}
</script>
