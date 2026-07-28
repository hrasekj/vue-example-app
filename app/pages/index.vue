<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

const router = useRouter()
const username = ref('')

function openProfile() {
  const value = username.value.trim()
  if (value) void router.push(`/${encodeURIComponent(value)}`)
}
</script>

<template>
  <main class="flex flex-1 items-center py-12">
    <section class="w-full max-w-lg border-l-4 border-slate-900 pl-6">
      <h1 class="text-3xl font-bold tracking-tight">GitHub Profile Viewer</h1>
      <p class="mt-2 text-slate-600">
        Enter a GitHub username to view their profile and repositories.
      </p>

      <form class="mt-8" @submit.prevent="openProfile">
        <label class="block text-sm font-medium" for="username">GitHub username</label>
        <div class="mt-2 flex gap-3">
          <BaseInput
            id="username"
            v-model="username"
            class="min-w-0 flex-1"
            name="username"
            placeholder="octocat"
            required
            type="search"
          />
          <BaseButton type="submit">View</BaseButton>
        </div>
      </form>
    </section>
  </main>
</template>
