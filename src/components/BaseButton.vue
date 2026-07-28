<script setup lang="ts">
withDefaults(defineProps<{ type?: 'button' | 'submit' | 'reset' }>(), { type: 'button' })
</script>

<template>
  <button
    class="border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-white hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
    :type="type"
  >
    <slot />
  </button>
</template>
