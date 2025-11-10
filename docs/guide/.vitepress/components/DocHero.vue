<template>
  <section class="tach-hero">
    <p class="tach-hero__subtitle">
      <slot name="eyebrow">tachUI v0.9 alpha</slot>
    </p>
    <h1>{{ title }}</h1>
    <p class="lead">
      {{ description }}
    </p>
    <div class="tach-hero__actions">
      <slot name="actions" />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<style scoped>
.lead {
  max-width: 720px;
  margin: 0.75rem auto 0;
  color: var(--vp-c-text-2);
  font-size: 1.15rem;
}
</style>
