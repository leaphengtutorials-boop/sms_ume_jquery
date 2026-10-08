<template>
  <Sidebar />
  <main class="main">
    <button class="menu-toggle" @click="toggleSidebar">☰</button>

    <!-- ✅ លុប Transition ចេញ (ដើម្បីកាត់បញ្ហា) -->
    <router-view />

    <!-- ឬប្រើ Transition បែបនេះ (បើចង់បាន Animation) -->
    <!--
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
    -->
  </main>
</template>

<script setup>
import { onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import { useAppStore } from '@/stores/app'

const app = useAppStore()

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open')
}

onMounted(() => app.loadAll())
</script>