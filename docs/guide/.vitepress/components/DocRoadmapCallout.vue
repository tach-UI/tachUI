<template>
  <section class="tach-roadmap">
    <p class="tach-roadmap__status">
      <span>{{ status }}</span>
      <span>•</span>
      <span>{{ timeframe }}</span>
    </p>
    <h3>{{ title }}</h3>
    <p class="tach-roadmap__meta">
      {{ description }}
    </p>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  status: string
  timeframe: string
  title: string
  description: string
}>()
</script>
