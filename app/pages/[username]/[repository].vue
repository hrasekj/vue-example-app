<script setup lang="ts">
import RepositoryPage from '@/components/pages/RepositoryPage.vue'

const route = useRoute()
const repositoryName = computed(() => String(route.params.repository))
const username = computed(() => String(route.params.username))
</script>

<template>
  <RepositoryPage :repository-name="repositoryName" :username="username" />
</template>
