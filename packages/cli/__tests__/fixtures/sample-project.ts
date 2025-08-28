/**
 * Sample TachUI project fixtures for testing
 */

export const basicTachUIProject = {
  'package.json': JSON.stringify({
    name: 'test-tachui-project',
    version: '1.0.0',
    dependencies: {
      '@tachui/core': '^0.1.0'
    },
    devDependencies: {
      'vite': '^5.0.0',
      'typescript': '^5.0.0'
    }
  }, null, 2),

  'vite.config.ts': `import { defineConfig } from 'vite'
import { tachui } from '@tachui/core/vite'

export default defineConfig({
  plugins: [tachui()]
})`,

  'src/main.ts': `import { TachUI } from '@tachui/core'

const app = TachUI.createApp({
  target: '#app'
})`,

  'src/components/Counter.ts': `import { VStack, Text, Button } from '@tachui/core'
import { State } from '@tachui/core'

export function Counter() {
  const count = State(0)
  
  return VStack({
    children: [
      Text(\`Count: \${count.value}\`),
      Button({
        title: 'Increment',
        onTap: () => count.value++
      })
    ]
  })
}`,

  'src/screens/HomeScreen.ts': `import { VStack, Text } from '@tachui/core'
import { Counter } from '../components/Counter'

export function HomeScreen() {
  return VStack({
    children: [
      Text('Welcome to TachUI!'),
      Counter()
    ]
  })
}`
}

export const reactComponentSamples = {
  'Counter.jsx': `import React, { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}`,

  'UserProfile.tsx': `import React from 'react'

interface UserProfileProps {
  name: string
  email: string
  avatar?: string
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  name, 
  email, 
  avatar 
}) => {
  return (
    <div className="user-profile">
      {avatar && <img src={avatar} alt={name} />}
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  )
}`
}

export const vueComponentSamples = {
  'Counter.vue': `<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value++
}
</script>`,

  'UserProfile.vue': `<template>
  <div class="user-profile">
    <img v-if="avatar" :src="avatar" :alt="name" />
    <h2>{{ name }}</h2>
    <p>{{ email }}</p>
  </div>
</template>

<script setup>
interface Props {
  name: string
  email: string
  avatar?: string
}

defineProps<Props>()
</script>`
}

export const configFileSamples = {
  'tachui.config.js': `export default {
  plugins: [],
  theme: {
    colors: {
      primary: '#007AFF',
      secondary: '#34C759'
    }
  }
}`,

  'invalid-config.js': `export default {
  plugins: [
    'invalid-plugin',
    { name: 'missing-handler' }
  ],
  theme: {
    colors: {
      primary: 'invalid-color-format'
    }
  }
}`
}

export const invalidFileSamples = {
  'syntax-error.ts': `import { Text } from '@tachui/core'

export function InvalidComponent() {
  return Text({
    // Missing closing quote
    title: 'Hello World
  })
}`,

  'missing-imports.ts': `export function ComponentWithMissingImports() {
  return Text({
    title: 'This will fail - Text is not imported'
  })
}`,

  'invalid-tachui.ts': `import { NonExistentComponent } from '@tachui/core'

export function BrokenComponent() {
  return NonExistentComponent({
    invalidProp: 'value'
  })
}`
}