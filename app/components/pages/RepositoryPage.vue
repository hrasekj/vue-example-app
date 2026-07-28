<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import StatusMessage from '@/components/ui/StatusMessage.vue'
import { useGitHubProfile } from '@/github/useGitHubProfile'

const props = defineProps<{ repositoryName: string; username: string }>()
const { profileState, retry } = useGitHubProfile(() => props.username)
const repository = computed(() => {
  if (profileState.value.status !== 'ready') return null

  const repositoryName = props.repositoryName.toLowerCase()
  return (
    profileState.value.profile.repositories.find(
      (repository) => repository.name.toLowerCase() === repositoryName,
    ) ?? null
  )
})
</script>

<template>
  <main>
    <nav class="mb-8" aria-label="Primary">
      <NuxtLink class="link text-sm font-medium" :to="`/${encodeURIComponent(username)}`">
        Back to @{{ username }}
      </NuxtLink>
    </nav>

    <StatusMessage v-if="profileState.status === 'loading'">
      Loading {{ repositoryName }}…
    </StatusMessage>

    <StatusMessage
      v-else-if="profileState.status === 'not-found'"
      role="alert"
      title="User not found"
    >
      GitHub has no public profile named “{{ username }}”.
    </StatusMessage>

    <StatusMessage
      v-else-if="profileState.status === 'rate-limited'"
      role="alert"
      title="GitHub rate limit reached"
    >
      Please wait before trying again.
      <template #actions><BaseButton @click="retry">Try again</BaseButton></template>
    </StatusMessage>

    <StatusMessage
      v-else-if="profileState.status === 'error'"
      role="alert"
      title="Could not load this repository"
    >
      Check your connection and try again.
      <template #actions><BaseButton @click="retry">Try again</BaseButton></template>
    </StatusMessage>

    <StatusMessage v-else-if="!repository" role="alert" title="Repository not found">
      @{{ username }} has no public repository named “{{ repositoryName }}”.
    </StatusMessage>

    <article v-else>
      <p class="text-sm text-slate-600">@{{ username }}</p>
      <h1 class="mt-1 break-words text-3xl font-bold">{{ repository.name }}</h1>
      <p v-if="repository.description" class="mt-4 max-w-2xl leading-7 text-slate-700">
        {{ repository.description }}
      </p>

      <dl class="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-y border-slate-300 py-4 text-sm">
        <div v-if="repository.language">
          <dt class="font-semibold">Language</dt>
          <dd>{{ repository.language }}</dd>
        </div>
        <div>
          <dt class="font-semibold">Stars</dt>
          <dd>{{ repository.starCount.toLocaleString() }}</dd>
        </div>
        <div>
          <dt class="font-semibold">Forks</dt>
          <dd>{{ repository.forkCount.toLocaleString() }}</dd>
        </div>
        <div>
          <dt class="font-semibold">Type</dt>
          <dd>{{ repository.isFork ? 'Fork' : 'Source' }}</dd>
        </div>
      </dl>

      <p class="mt-6">
        <a
          class="link font-medium"
          :href="repository.url"
          rel="noopener noreferrer"
          target="_blank"
        >
          View on GitHub
        </a>
      </p>
    </article>
  </main>
</template>
