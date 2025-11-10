<template>
  <div>
    <div class="tach-playground-frame">
      <iframe
        :title="title"
        src="/playground/index.html"
        loading="lazy"
        width="100%"
        height="460"
        frameborder="0"
      />
    </div>
    <p class="caption">
      <slot>
        Interactive playground opens in an iframe powered by the tachUI sandbox.
      </slot>
    </p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: 'tachUI Playground',
  }
)
</script>

<style scoped>
.caption {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin-top: 0.35rem;
}
</style>
