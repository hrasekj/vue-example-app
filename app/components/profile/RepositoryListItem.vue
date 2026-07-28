<script setup lang="ts">
import type { Repository } from '@/github/useGitHubProfile'

defineProps<{ repository: Repository; username: string }>()
</script>

<template>
  <li class="py-5">
    <NuxtLink
      class="link break-words text-lg font-semibold"
      :to="`/${encodeURIComponent(username)}/${encodeURIComponent(repository.name)}`"
    >
      {{ repository.name }}
    </NuxtLink>
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
