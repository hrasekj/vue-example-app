<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
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
    <nav class="mb-6" aria-label="Primary">
      <RouterLink
        class="text-sm font-medium text-blue-700 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600"
        to="/"
      >
        Search another username
      </RouterLink>
    </nav>

    <div
      v-if="profileState.status === 'loading'"
      class="rounded-xl border border-slate-200 bg-white p-8 text-center"
      role="status"
    >
      <p class="font-medium">Loading {{ username }}…</p>
    </div>

    <section
      v-else-if="profileState.status === 'not-found'"
      class="rounded-xl border border-slate-200 bg-white p-8 text-center"
      role="alert"
    >
      <h1 class="text-xl font-bold">User not found</h1>
      <p class="mt-2 text-slate-600">GitHub has no public profile named “{{ username }}”.</p>
    </section>

    <section
      v-else-if="profileState.status === 'rate-limited'"
      class="rounded-xl border border-amber-300 bg-amber-50 p-8 text-center"
      role="alert"
    >
      <h1 class="text-xl font-bold">GitHub rate limit reached</h1>
      <p class="mt-2 text-slate-700">Please wait before trying again.</p>
      <button
        class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        type="button"
        @click="retry"
      >
        Try again
      </button>
    </section>

    <section
      v-else-if="profileState.status === 'error'"
      class="rounded-xl border border-red-300 bg-red-50 p-8 text-center"
      role="alert"
    >
      <h1 class="text-xl font-bold">Could not load this profile</h1>
      <p class="mt-2 text-slate-700">Check your connection and try again.</p>
      <button
        class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        type="button"
        @click="retry"
      >
        Try again
      </button>
    </section>

    <div v-else-if="profile" class="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
      <aside class="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <img
          class="aspect-square w-28 rounded-full object-cover md:w-full"
          :alt="`${profile.login}'s avatar`"
          :src="profile.avatarUrl"
          loading="lazy"
        />
        <h1 class="mt-4 text-2xl font-bold leading-tight">{{ profile.name || profile.login }}</h1>
        <p class="text-slate-600">@{{ profile.login }}</p>
        <p v-if="profile.bio" class="mt-4 text-sm leading-6">{{ profile.bio }}</p>

        <dl class="mt-5 space-y-3 text-sm">
          <div class="flex gap-2">
            <dt class="font-semibold">Followers</dt>
            <dd>{{ profile.followerCount.toLocaleString() }}</dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-semibold">Following</dt>
            <dd>{{ profile.followingCount.toLocaleString() }}</dd>
          </div>
          <div v-if="profile.location">
            <dt class="font-semibold">Location</dt>
            <dd>{{ profile.location }}</dd>
          </div>
          <div v-if="profile.email">
            <dt class="font-semibold">Public email</dt>
            <dd>
              <a
                class="break-all text-blue-700 hover:underline"
                :href="`mailto:${profile.email}`"
                >{{ profile.email }}</a
              >
            </dd>
          </div>
          <div v-if="profile.company">
            <dt class="font-semibold">Organization</dt>
            <dd>{{ profile.company }}</dd>
          </div>
        </dl>

        <div class="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <a
            class="font-medium text-blue-700 hover:underline"
            :href="profile.profileUrl"
            rel="noopener noreferrer"
            target="_blank"
            >GitHub profile</a
          >
          <a
            v-if="profile.websiteUrl"
            class="font-medium text-blue-700 hover:underline"
            :href="profile.websiteUrl"
            rel="noopener noreferrer"
            target="_blank"
            >Website</a
          >
        </div>
      </aside>

      <section class="min-w-0" aria-labelledby="repositories-heading">
        <div class="mb-4">
          <h2 id="repositories-heading" class="text-2xl font-bold">Repositories</h2>
          <label class="mt-4 block text-sm font-medium" for="repo-search"
            >Search repositories</label
          >
          <input
            id="repo-search"
            v-model="query"
            class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            placeholder="Name or description"
            type="search"
          />
        </div>

        <p
          v-if="repositories.length === 0"
          class="rounded-xl border border-slate-200 bg-white p-6 text-slate-600"
        >
          This user has no public repositories.
        </p>
        <p
          v-else-if="filteredRepos.length === 0"
          class="rounded-xl border border-slate-200 bg-white p-6 text-slate-600"
        >
          No repositories match “{{ query }}”.
        </p>
        <ul v-else class="space-y-3">
          <li
            v-for="repository in filteredRepos"
            :key="repository.url"
            class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <a
              class="break-words text-lg font-semibold text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600"
              :href="repository.url"
              rel="noopener noreferrer"
              target="_blank"
              >{{ repository.name }}</a
            >
            <span
              v-if="repository.isFork"
              class="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              >Fork</span
            >
            <p v-if="repository.description" class="mt-2 text-sm leading-6 text-slate-600">
              {{ repository.description }}
            </p>
            <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span v-if="repository.language">{{ repository.language }}</span>
              <span
                ><span aria-hidden="true">★</span>
                {{ repository.starCount.toLocaleString() }} stars</span
              >
              <span
                ><span aria-hidden="true">⑂</span>
                {{ repository.forkCount.toLocaleString() }} forks</span
              >
            </div>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>
