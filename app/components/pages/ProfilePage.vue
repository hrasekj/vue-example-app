<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ProfileSummary from '@/components/profile/ProfileSummary.vue'
import RepositoryListItem from '@/components/profile/RepositoryListItem.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import StatusMessage from '@/components/ui/StatusMessage.vue'
import { useGitHubProfile } from '@/github/useGitHubProfile'

const props = defineProps<{ username: string }>()
const { profileState, retry } = useGitHubProfile(() => props.username)
const query = ref('')

watch(
  () => props.username,
  () => (query.value = ''),
)

const profile = computed(() =>
  profileState.value.status === 'ready' ? profileState.value.profile : null,
)
const repositories = computed(() => profile.value?.repositories ?? [])
const filteredRepos = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase()
  if (!needle) return repositories.value
  return repositories.value.filter((repository) =>
    `${repository.name} ${repository.description ?? ''}`.toLocaleLowerCase().includes(needle),
  )
})
</script>

<template>
  <main>
    <nav class="mb-8" aria-label="Primary">
      <NuxtLink class="link text-sm font-medium" to="/"> Search another username </NuxtLink>
    </nav>

    <StatusMessage v-if="profileState.status === 'loading'">
      Loading {{ username }}…
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
      title="Could not load this profile"
    >
      Check your connection and try again.
      <template #actions><BaseButton @click="retry">Try again</BaseButton></template>
    </StatusMessage>

    <div v-else-if="profile" class="flex flex-col gap-8 md:flex-row">
      <ProfileSummary class="md:w-64 md:shrink-0" :profile="profile" />

      <section class="min-w-0 flex-1" aria-labelledby="repositories-heading">
        <div class="mb-6">
          <h2 id="repositories-heading" class="text-2xl font-bold">Repositories</h2>
          <label class="mt-4 block text-sm font-medium" for="repo-search">
            Search repositories
          </label>
          <BaseInput
            id="repo-search"
            v-model="query"
            class="mt-2"
            placeholder="Name or description"
            type="search"
          />
        </div>

        <StatusMessage v-if="repositories.length === 0">
          This user has no public repositories.
        </StatusMessage>
        <StatusMessage v-else-if="filteredRepos.length === 0">
          No repositories match “{{ query }}”.
        </StatusMessage>
        <ul v-else class="divide-y divide-slate-200 border-y border-slate-300">
          <RepositoryListItem
            v-for="repository in filteredRepos"
            :key="repository.url"
            :repository="repository"
            :username="profile.login"
          />
        </ul>
      </section>
    </div>
  </main>
</template>
