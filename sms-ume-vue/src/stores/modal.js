import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";

export const useModalStore = defineStore("modal", () => {
  const open = ref(false);
  const wide = ref(false);
  const component = shallowRef(null);
  const props = ref({});

  function show(comp, p = {}, isWide = false) {
    component.value = comp;
    props.value = p;
    wide.value = isWide;
    open.value = true;
  }
  function close() {
    open.value = false;
    component.value = null;
    props.value = {};
  }
  return { open, wide, component, props, show, close };
});
