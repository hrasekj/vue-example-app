<script setup lang="ts">
import ProfilePage from '@/components/pages/ProfilePage.vue'

const route = useRoute()
const username = computed(() => String(route.params.username))
</script>

<template>
  <ProfilePage :username="username" />
</template>
