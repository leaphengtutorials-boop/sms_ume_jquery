<template>
  <h3>📥 Import សិស្សពី Excel/CSV</h3>

  <div
    style="
      background: linear-gradient(135deg, #eef2ff, #e0e7ff);
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 1.2rem;
      font-size: 0.85rem;
      color: #1e40af;
    "
  >
    <strong>📌 ជំហាន៖</strong><br />
    1️⃣ ចុច <strong>"ទាញគំរូ"</strong><br />
    2️⃣ បំពេញទិន្នន័យ<br />
    3️⃣ Save ជា <strong>CSV UTF-8</strong><br />
    4️⃣ Upload
  </div>

  <form @submit.prevent="submit">
    <label>📁 File CSV *</label>
    <input ref="fileInput" type="file" accept=".csv,.txt" required />

    <div class="modal-actions">
      <button type="button" class="btn btn-secondary" @click="modal.close()">
        បោះបង់
      </button>
      <button type="button" class="btn btn-info" @click="downloadTemplate">
        📄 ទាញគំរូ
      </button>
      <button type="submit" class="btn btn-success" :disabled="loading">
        {{ loading ? "⏳..." : "📥 Import" }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref } from "vue";
import { useAppStore } from "@/stores/app";
import { useModalStore } from "@/stores/modal";
import { useToastStore } from "@/stores/toast";
import studentsApi from "@/api/students";

const app = useAppStore();
const modal = useModalStore();
const toast = useToastStore();

const fileInput = ref(null);
const loading = ref(false);

async function submit() {
  const f = fileInput.value?.files?.[0];
  if (!f) return;
  loading.value = true;
  try {
    const res = await studentsApi.importCSV(f);
    if (res?.success) {
      toast.show(res.message);
      modal.close();
      app.loadStudents();
      app.loadSubjects();
    }
  } finally {
    loading.value = false;
  }
}

function downloadTemplate() {
  window.location.href = `${import.meta.env.VITE_API_BASE}/template.php`;
}
</script>
