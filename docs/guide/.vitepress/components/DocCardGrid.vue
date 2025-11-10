<template>
  <div class="tach-card-grid">
    <article
      v-for="card in cards"
      :key="card.title"
      class="tach-card"
    >
      <h3>{{ card.title }}</h3>
      <p>{{ card.description }}</p>
      <p v-if="card.link">
        <a :href="card.link">Read more →</a>
      </p>
    </article>
  </div>
</template>

<script setup lang="ts">
export interface DocCard {
  title: string
  description: string
  link?: string
}

defineProps<{
  cards: DocCard[]
}>()
</script>
