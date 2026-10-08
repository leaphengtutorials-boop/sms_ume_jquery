<template>
  <div class="page-header">
    <h1>{{ icon }} {{ title }}</h1>
    <p v-if="subtitle">{{ subtitle }}</p>
  </div>
</template>

<script setup>
defineProps({
  icon: String,
  title: String,
  subtitle: String,
});
</script>
