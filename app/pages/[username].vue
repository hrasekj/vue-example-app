<script setup lang="ts">
const route = useRoute()
const username = computed(() => String(route.params.username))
</script>

<template>
  <ProfilePage :username="username" />
</template>
