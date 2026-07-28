<script setup lang="ts">
const model = defineModel<string>({ required: true })
</script>

<template>
  <input
    v-model="model"
    class="w-full border-b border-slate-400 bg-transparent px-1 py-2 outline-none focus:border-slate-900"
  />
</template>
