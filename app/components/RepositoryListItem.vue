<script setup lang="ts">
import type { Repository } from '@/github/useGitHubProfile'

defineProps<{ repository: Repository }>()
</script>

<template>
  <li class="py-5">
    <a
      class="break-words text-lg font-semibold text-blue-700 underline hover:no-underline"
      :href="repository.url"
      rel="noopener noreferrer"
      target="_blank"
      >{{ repository.name }}</a
    >
    <span
      v-if="repository.isFork"
      class="ml-2 text-xs font-medium uppercase tracking-wide text-slate-500"
      >Fork</span
    >
    <p v-if="repository.description" class="mt-2 text-sm leading-6 text-slate-600">
      {{ repository.description }}
    </p>
    <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
      <span v-if="repository.language">{{ repository.language }}</span>
      <span
        ><span aria-hidden="true">★</span> {{ repository.starCount.toLocaleString() }} stars</span
      >
      <span
        ><span aria-hidden="true">⑂</span> {{ repository.forkCount.toLocaleString() }} forks</span
      >
    </div>
  </li>
</template>
