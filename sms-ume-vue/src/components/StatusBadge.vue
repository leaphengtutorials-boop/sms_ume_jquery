<template>
  <span
    v-if="status === 'graduated'"
    class="badge"
    style="
      background: #d1fae5;
      color: #065f46;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
    "
  >
    🎓 បញ្ចប់
  </span>
  <span
    v-else-if="status === 'dropped'"
    class="badge"
    style="
      background: #fee2e2;
      color: #991b1b;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
    "
  >
    🔴 ឈប់
  </span>
  <span
    v-else
    class="badge"
    style="
      background: #dbeafe;
      color: #1e40af;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
    "
  >
    🟢 កំពុងរៀន
  </span>
</template>

<script setup>
defineProps({ status: String });
</script>
