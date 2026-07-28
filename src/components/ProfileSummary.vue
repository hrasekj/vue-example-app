<script setup lang="ts">
import type { DeepReadonly } from 'vue'
import type { Profile } from '@/github/useGitHubProfile'

defineProps<{ profile: DeepReadonly<Profile> }>()
</script>

<template>
  <aside class="self-start border-b border-slate-300 pb-8 md:border-r md:border-b-0 md:pr-8">
    <img
      class="aspect-square w-28 object-cover md:w-full"
      :alt="`${profile.login}'s avatar`"
      :src="profile.avatarUrl"
      loading="lazy"
    />
    <h1 class="mt-4 text-2xl font-bold leading-tight">{{ profile.name || profile.login }}</h1>
    <p class="text-slate-600">@{{ profile.login }}</p>
    <p v-if="profile.bio" class="mt-4 text-sm leading-6">{{ profile.bio }}</p>

    <dl class="mt-5 divide-y divide-slate-200 border-y border-slate-200 text-sm">
      <div class="flex justify-between gap-2 py-2">
        <dt class="font-semibold">Followers</dt>
        <dd>{{ profile.followerCount.toLocaleString() }}</dd>
      </div>
      <div class="flex justify-between gap-2 py-2">
        <dt class="font-semibold">Following</dt>
        <dd>{{ profile.followingCount.toLocaleString() }}</dd>
      </div>
      <div v-if="profile.location" class="py-2">
        <dt class="font-semibold">Location</dt>
        <dd>{{ profile.location }}</dd>
      </div>
      <div v-if="profile.email" class="py-2">
        <dt class="font-semibold">Public email</dt>
        <dd>
          <a class="break-all text-blue-700 underline" :href="`mailto:${profile.email}`">{{
            profile.email
          }}</a>
        </dd>
      </div>
      <div v-if="profile.company" class="py-2">
        <dt class="font-semibold">Organization</dt>
        <dd>{{ profile.company }}</dd>
      </div>
    </dl>

    <div class="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
      <a
        class="font-medium text-blue-700 underline"
        :href="profile.profileUrl"
        rel="noopener noreferrer"
        target="_blank"
        >GitHub profile</a
      >
      <a
        v-if="profile.websiteUrl"
        class="font-medium text-blue-700 underline"
        :href="profile.websiteUrl"
        rel="noopener noreferrer"
        target="_blank"
        >Website</a
      >
    </div>
  </aside>
</template>
