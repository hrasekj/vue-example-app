<script setup lang="ts">
withDefaults(
  defineProps<{
    role?: 'alert' | 'status'
    title?: string
  }>(),
  { role: 'status', title: undefined },
)
</script>

<template>
  <div class="border-l-2 border-slate-300 py-4 pl-4" :role="role">
    <h1 v-if="title" class="mb-2 text-xl font-bold">{{ title }}</h1>
    <p class="text-slate-600"><slot /></p>
    <div v-if="$slots.actions" class="mt-4"><slot name="actions" /></div>
  </div>
</template>
