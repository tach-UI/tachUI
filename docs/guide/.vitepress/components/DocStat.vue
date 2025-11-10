<template>
  <div class="tach-stat">
    <div class="tach-stat__value">{{ value }}</div>
    <div class="tach-stat__label">{{ label }}</div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  value: string
  label: string
}>()
</script>
