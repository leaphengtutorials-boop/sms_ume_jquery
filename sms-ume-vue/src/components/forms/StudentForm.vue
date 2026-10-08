<template>
  <h3>{{ props.student ? "✏️ កែសិស្ស" : "➕ បន្ថែមសិស្ស" }}</h3>
  <form @submit.prevent="save">
    <input type="hidden" v-model="form.id" />

    <label>លេខកូដ *</label>
    <input v-model="form.student_code" required :readonly="!!form.id" />

    <label>ឈ្មោះ *</label>
    <input v-model="form.full_name" required />

    <label>ភេទ *</label>
    <select v-model="form.gender" required>
      <option value="M">ប្រុស</option>
      <option value="F">ស្រី</option>
    </select>

    <label>🎓 ជំនាន់</label>
    <select v-model="form.cohort_id">
      <option value="">-- ជ្រើស --</option>
      <option v-for="c in app.cohorts" :key="c.id" :value="c.id">
        {{ c.cohort_name }}{{ c.is_current ? " ⭐" : "" }}
      </option>
    </select>

    <label>📅 ឆ្នាំចូលរៀន</label>
    <select v-model="form.entry_year_id">
      <option value="">-- ជ្រើស --</option>
      <option v-for="y in app.years" :key="y.id" :value="y.id">
        {{ y.year_name }}
      </option>
    </select>

    <label>📊 ស្ថានភាព</label>
    <select v-model="form.status">
      <option value="active">🟢 កំពុងរៀន</option>
      <option value="graduated">🎓 បញ្ចប់</option>
      <option value="dropped">🔴 ឈប់</option>
    </select>

    <label>ថ្ងៃកំណើត</label>
    <input type="date" v-model="form.dob" />

    <label>ទូរស័ព្ទ</label>
    <input v-model="form.phone" />

    <label>Email</label>
    <input type="email" v-model="form.email" />

    <label>អាសយដ្ឋាន</label>
    <textarea v-model="form.address" rows="2"></textarea>

    <template v-if="!form.id">
      <label>📸 រូបថត</label>
      <div class="photo-upload-zone" @click="$refs.fileInput.click()">
        <div v-if="preview">
          <img :src="preview" class="photo-preview" />
        </div>
        <div v-else>
          <div class="icon">📷</div>
          <p>ចុចដើម្បីជ្រើស</p>
        </div>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="onFile"
      />
    </template>

    <div class="modal-actions">
      <button type="button" class="btn btn-secondary" @click="modal.close()">
        បោះបង់
      </button>
      <button type="submit" class="btn btn-primary">💾 រក្សាទុក</button>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useAppStore } from "@/stores/app";
import { useModalStore } from "@/stores/modal";
import { useToastStore } from "@/stores/toast";
import studentsApi from "@/api/students";

const props = defineProps({ student: Object });
const app = useAppStore();
const modal = useModalStore();
const toast = useToastStore();

const form = reactive({
  id: props.student?.id || null,
  student_code: props.student?.student_code || "",
  full_name: props.student?.full_name || "",
  gender: props.student?.gender || "M",
  cohort_id: props.student?.cohort_id || "",
  entry_year_id: props.student?.entry_year_id || "",
  status: props.student?.status || "active",
  dob: props.student?.dob || "",
  phone: props.student?.phone || "",
  email: props.student?.email || "",
  address: props.student?.address || "",
});

const fileInput = ref(null);
const preview = ref("");

function onFile(e) {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = (ev) => (preview.value = ev.target.result);
  reader.readAsDataURL(f);
}

async function save() {
  const isEdit = !!form.id;

  try {
    if (isEdit) {
      await studentsApi.update(form);
    } else if (fileInput.value?.files?.[0]) {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v !== null && fd.append(k, v));
      fd.append("photo", fileInput.value.files[0]);
      await studentsApi.create(fd);
    } else {
      await studentsApi.create(form);
    }
    toast.show("✅ រក្សាទុកជោគជ័យ");
    modal.close();
    app.loadStudents();
  } catch (e) {
    toast.show(e.response?.data?.error || "បរាជ័យ", "error");
  }
}
</script>
