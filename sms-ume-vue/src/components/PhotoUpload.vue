<template>
  <h3>📸 គ្រប់គ្រងរូបថត</h3>
  <p style="text-align: center; color: var(--gray); margin-bottom: 1rem">
    {{ props.student.full_name }}
  </p>

  <div class="photo-upload-zone" @click="$refs.fileInput.click()">
    <img v-if="preview" :src="preview" class="photo-preview" />
    <img
      v-else-if="props.student.photo"
      :src="fullPhoto(props.student.photo)"
      class="photo-preview"
    />
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

  <div class="modal-actions">
    <button class="btn btn-secondary" @click="modal.close()">បោះបង់</button>
    <button v-if="props.student.photo" class="btn btn-danger" @click="remove">
      🗑️ លុប
    </button>
    <button class="btn btn-primary" :disabled="!preview" @click="upload">
      📤 Upload
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAppStore } from "@/stores/app";
import { useModalStore } from "@/stores/modal";
import { useToastStore } from "@/stores/toast";
import studentsApi from "@/api/students";

const props = defineProps({ student: Object });
const app = useAppStore();
const modal = useModalStore();
const toast = useToastStore();

const fileInput = ref(null);
const preview = ref("");
const file = ref(null);

function fullPhoto(p) {
  return p?.startsWith("http") ? p : `${import.meta.env.VITE_UPLOAD_BASE}/${p}`;
}

function onFile(e) {
  const f = e.target.files[0];
  if (!f) return;
  file.value = f;
  const reader = new FileReader();
  reader.onload = (ev) => (preview.value = ev.target.result);
  reader.readAsDataURL(f);
}

async function upload() {
  if (!file.value) return;
  const res = await studentsApi.uploadPhoto(props.student.id, file.value);
  if (res?.success) {
    toast.show("✅ Upload ជោគជ័យ");
    modal.close();
    app.loadStudents();
  }
}

async function remove() {
  if (!confirm("លុបរូបថត?")) return;
  const res = await studentsApi.deletePhoto(props.student.id);
  if (res?.success) {
    toast.show("✅ លុបជោគជ័យ");
    modal.close();
    app.loadStudents();
  }
}
</script>
