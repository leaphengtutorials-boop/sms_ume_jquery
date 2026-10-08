<template>
  <transition name="toast">
    <div v-if="toast.visible" :class="['toast', 'show', toast.type]">
      {{ toast.message }}
    </div>
  </transition>
</template>

<script setup>
import { useToastStore } from "@/stores/toast";
const toast = useToastStore();
</script>
