<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { GitHubRepo, GitHubUser } from '@/types/github'

const props = defineProps<{ username: string }>()

type ViewState = 'loading' | 'ready' | 'not-found' | 'rate-limited' | 'error'

const state = ref<ViewState>('loading')
const user = ref<GitHubUser | null>(null)
const repos = ref<GitHubRepo[]>([])
const query = ref('')
let controller: AbortController | undefined

const filteredRepos = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase()
  if (!needle) return repos.value
  return repos.value.filter((repo) =>
    `${repo.name} ${repo.description ?? ''}`.toLocaleLowerCase().includes(needle),
  )
})

const website = computed(() => {
  if (!user.value?.blog) return null
  try {
    const url = new URL(user.value.blog.startsWith('http') ? user.value.blog : `https://${user.value.blog}`)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
})

function isRateLimited(response: Response) {
  return response.status === 403 && response.headers.get('X-RateLimit-Remaining') === '0'
}

async function loadProfile() {
  controller?.abort()
  controller = new AbortController()
  const { signal } = controller

  state.value = 'loading'
  user.value = null
  repos.value = []
  query.value = ''

  try {
    const encodedUsername = encodeURIComponent(props.username)
    const userResponse = await fetch(`https://api.github.com/users/${encodedUsername}`, { signal })
    if (signal.aborted) return

    if (userResponse.status === 404) {
      state.value = 'not-found'
      return
    }
    if (isRateLimited(userResponse)) {
      state.value = 'rate-limited'
      return
    }
    if (!userResponse.ok) throw new Error(`GitHub user request failed: ${userResponse.status}`)

    const loadedUser = (await userResponse.json()) as GitHubUser
    if (signal.aborted) return
    user.value = loadedUser

    // ponytail: GitHub caps this view at 100 repos; add API pagination when larger profiles matter.
    const repoResponse = await fetch(
      `https://api.github.com/users/${encodedUsername}/repos?per_page=100&sort=updated`,
      { signal },
    )
    if (signal.aborted) return
    if (isRateLimited(repoResponse)) {
      state.value = 'rate-limited'
      return
    }
    if (!repoResponse.ok) throw new Error(`GitHub repository request failed: ${repoResponse.status}`)

    const loadedRepos = (await repoResponse.json()) as GitHubRepo[]
    if (signal.aborted) return
    repos.value = loadedRepos
    state.value = 'ready'
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) state.value = 'error'
  }
}

watch(() => props.username, loadProfile, { immediate: true })
onUnmounted(() => controller?.abort())
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

    <div v-if="state === 'loading'" class="rounded-xl border border-slate-200 bg-white p-8 text-center" role="status">
      <p class="font-medium">Loading {{ username }}…</p>
    </div>

    <section v-else-if="state === 'not-found'" class="rounded-xl border border-slate-200 bg-white p-8 text-center" role="alert">
      <h1 class="text-xl font-bold">User not found</h1>
      <p class="mt-2 text-slate-600">GitHub has no public profile named “{{ username }}”.</p>
    </section>

    <section v-else-if="state === 'rate-limited'" class="rounded-xl border border-amber-300 bg-amber-50 p-8 text-center" role="alert">
      <h1 class="text-xl font-bold">GitHub rate limit reached</h1>
      <p class="mt-2 text-slate-700">Please wait before trying again.</p>
      <button class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2" type="button" @click="loadProfile">
        Try again
      </button>
    </section>

    <section v-else-if="state === 'error'" class="rounded-xl border border-red-300 bg-red-50 p-8 text-center" role="alert">
      <h1 class="text-xl font-bold">Could not load this profile</h1>
      <p class="mt-2 text-slate-700">Check your connection and try again.</p>
      <button class="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2" type="button" @click="loadProfile">
        Try again
      </button>
    </section>

    <div v-else-if="user" class="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
      <aside class="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <img class="aspect-square w-28 rounded-full object-cover md:w-full" :alt="`${user.login}'s avatar`" :src="user.avatar_url" loading="lazy" />
        <h1 class="mt-4 text-2xl font-bold leading-tight">{{ user.name || user.login }}</h1>
        <p class="text-slate-600">@{{ user.login }}</p>
        <p v-if="user.bio" class="mt-4 text-sm leading-6">{{ user.bio }}</p>

        <dl class="mt-5 space-y-3 text-sm">
          <div class="flex gap-2">
            <dt class="font-semibold">Followers</dt>
            <dd>{{ user.followers.toLocaleString() }}</dd>
          </div>
          <div class="flex gap-2">
            <dt class="font-semibold">Following</dt>
            <dd>{{ user.following.toLocaleString() }}</dd>
          </div>
          <div v-if="user.location">
            <dt class="font-semibold">Location</dt>
            <dd>{{ user.location }}</dd>
          </div>
          <div v-if="user.email">
            <dt class="font-semibold">Public email</dt>
            <dd><a class="break-all text-blue-700 hover:underline" :href="`mailto:${user.email}`">{{ user.email }}</a></dd>
          </div>
          <div v-if="user.company">
            <dt class="font-semibold">Organization</dt>
            <dd>{{ user.company }}</dd>
          </div>
        </dl>

        <div class="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <a class="font-medium text-blue-700 hover:underline" :href="user.html_url" rel="noopener noreferrer" target="_blank">GitHub profile</a>
          <a v-if="website" class="font-medium text-blue-700 hover:underline" :href="website" rel="noopener noreferrer" target="_blank">Website</a>
        </div>
      </aside>

      <section class="min-w-0" aria-labelledby="repositories-heading">
        <div class="mb-4">
          <h2 id="repositories-heading" class="text-2xl font-bold">Repositories</h2>
          <label class="mt-4 block text-sm font-medium" for="repo-search">Search repositories</label>
          <input
            id="repo-search"
            v-model="query"
            class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            placeholder="Name or description"
            type="search"
          />
        </div>

        <p v-if="repos.length === 0" class="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">This user has no public repositories.</p>
        <p v-else-if="filteredRepos.length === 0" class="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">No repositories match “{{ query }}”.</p>
        <ul v-else class="space-y-3">
          <li v-for="repo in filteredRepos" :key="repo.html_url" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <a class="break-words text-lg font-semibold text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600" :href="repo.html_url" rel="noopener noreferrer" target="_blank">{{ repo.name }}</a>
            <span v-if="repo.fork" class="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Fork</span>
            <p v-if="repo.description" class="mt-2 text-sm leading-6 text-slate-600">{{ repo.description }}</p>
            <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span v-if="repo.language">{{ repo.language }}</span>
              <span><span aria-hidden="true">★</span> {{ repo.stargazers_count.toLocaleString() }} stars</span>
              <span><span aria-hidden="true">⑂</span> {{ repo.forks_count.toLocaleString() }} forks</span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>
