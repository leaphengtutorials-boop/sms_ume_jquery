<template>
  <h3>📚 ប្រវត្តិមុខវិជ្ជា — {{ props.student.full_name }}</h3>

  <div v-if="loading" style="text-align: center; padding: 2rem">⏳</div>

  <template v-else>
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
      <strong>សរុប:</strong> {{ items.length }} · <strong>✅ បញ្ចប់:</strong>
      {{ completedCount }} · <strong>🟢 កំពុងរៀន:</strong> {{ activeCount }}
    </div>

    <div
      style="
        max-height: 55vh;
        overflow-y: auto;
        border: 1px solid var(--border);
        border-radius: 12px;
      "
    >
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem">
        <thead>
          <tr
            style="background: #f8fafc; position: sticky; top: 0; z-index: 10"
          >
            <th style="padding: 0.7rem; text-align: left">មុខវិជ្ជា</th>
            <th style="padding: 0.7rem; text-align: left">ឆ្នាំ/ឆមាស</th>
            <th style="padding: 0.7rem; text-align: center">ស្ថានភាព</th>
            <th style="padding: 0.7rem; text-align: center">ពិន្ទុ</th>
            <th style="padding: 0.7rem; text-align: center">និទ្ទេស</th>
            <th style="padding: 0.7rem; text-align: center">សកម្មភាព</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="h in items"
            :key="h.id"
            style="border-bottom: 1px solid #f1f5f9"
          >
            <td style="padding: 0.7rem">
              <strong>{{ h.subject_code }}</strong
              ><br />
              <small style="color: var(--gray)">{{ h.subject_name }}</small>
            </td>
            <td style="padding: 0.7rem; font-size: 0.75rem">
              📖 ឆ្នាំ {{ h.study_year }} · 📅 ឆមាស {{ h.semester }}<br />
              🗓️ {{ h.year_name || "-" }}
            </td>
            <td style="padding: 0.7rem; text-align: center">
              <span :style="statusStyle(h.status)">{{
                statusLabel(h.status)
              }}</span>
            </td>
            <td style="padding: 0.7rem; text-align: center">
              <strong style="color: #6366f1">{{ h.total_score || "-" }}</strong>
            </td>
            <td style="padding: 0.7rem; text-align: center">
              <strong :class="`grade-${h.grade}`">{{ h.grade || "-" }}</strong>
            </td>
            <td style="padding: 0.7rem; text-align: center">
              <button
                v-if="h.status === 'active'"
                class="btn btn-success btn-sm"
                @click="complete(h)"
              >
                ✅ បញ្ចប់
              </button>
              <span v-else style="color: var(--gray)">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="modal-actions" style="margin-top: 1rem">
      <button class="btn btn-secondary" @click="modal.close()">បិទ</button>
    </div>
  </template>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useModalStore } from "@/stores/modal";
import { useToastStore } from "@/stores/toast";
import studentsApi from "@/api/students";
import enrollmentApi from "@/api/enrollment";

const props = defineProps({ student: Object });
const modal = useModalStore();
const toast = useToastStore();

const items = ref([]);
const loading = ref(true);

const completedCount = computed(
  () => items.value.filter((h) => h.status === "completed").length,
);
const activeCount = computed(
  () => items.value.filter((h) => h.status === "active").length,
);

function statusLabel(s) {
  return (
    { active: "🟢 កំពុងរៀន", completed: "✅ បញ្ចប់", dropped: "🔴 ឈប់" }[s] || s
  );
}
function statusStyle(s) {
  const map = {
    active: "background:#dbeafe;color:#1e40af",
    completed: "background:#d1fae5;color:#065f46",
    dropped: "background:#fee2e2;color:#991b1b",
  };
  return `${map[s]};padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;`;
}

async function load() {
  loading.value = true;
  items.value = await studentsApi.history(props.student.id);
  loading.value = false;
}

async function complete(h) {
  if (!confirm(`បញ្ចប់មុខវិជ្ជា "${h.subject_name}"?`)) return;
  const res = await enrollmentApi.changeStatus(
    props.student.id,
    h.subject_id,
    "completed",
  );
  if (res?.success) {
    toast.show("✅ បញ្ចប់មុខវិជ្ជាជោគជ័យ");
    load();
  } else if (res?.missing) {
    alert(
      `⚠️ មិនអាចបញ្ចប់បាន!\n\n${res.missing.map((m) => "• " + m).join("\n")}`,
    );
  } else {
    toast.show(res?.error || "បរាជ័យ", "error");
  }
}

onMounted(load);
</script>
