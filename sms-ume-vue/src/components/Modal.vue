<template>
  <Teleport to="body">
    <div v-if="modal.open" class="modal open" @click.self="modal.close()">
      <div
        class="modal-content"
        :style="modal.wide ? 'max-width:1200px;width:95vw' : ''"
      >
        <component
          :is="modal.component"
          v-bind="modal.props"
          v-if="modal.component"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useModalStore } from "@/stores/modal";
const modal = useModalStore();
</script>
