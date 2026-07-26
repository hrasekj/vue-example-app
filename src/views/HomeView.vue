<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')

function openProfile() {
  const value = username.value.trim()
  if (value) void router.push({ name: 'profile', params: { username: value } })
}
</script>

<template>
  <main class="flex min-h-[70vh] items-center justify-center py-12">
    <section class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 class="text-2xl font-bold tracking-tight">GitHub Profile Viewer</h1>
      <p class="mt-2 text-sm text-slate-600">Enter a GitHub username to view their profile and repositories.</p>

      <form class="mt-6" @submit.prevent="openProfile">
        <label class="block text-sm font-medium" for="username">GitHub username</label>
        <div class="mt-2 flex gap-2">
          <input
            id="username"
            v-model="username"
            class="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            name="username"
            placeholder="octocat"
            required
            type="search"
          />
          <button
            class="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            type="submit"
          >
            View
          </button>
        </div>
      </form>
    </section>
  </main>
</template>
