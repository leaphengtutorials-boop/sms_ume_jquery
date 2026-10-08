<template>
  <aside class="sidebar" id="sidebar">
    <div class="logo">
      <div class="logo-icon">📚</div>
      <div class="logo-text">
        <h2>គ្រប់គ្រងសិស្ស</h2>
        <small>Student Management</small>
      </div>
    </div>
    <nav class="menu">
      <router-link
        v-for="r in routes"
        :key="r.name"
        :to="{ name: r.name }"
        :class="{ active: $route.name === r.name }"
      >
        <span>{{ r.meta.icon }}</span> {{ r.meta.title }}
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
const routes = router.options.routes.filter((r) => r.meta?.title);
</script>
