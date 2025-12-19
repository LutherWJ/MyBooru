<script setup lang="ts">
// Vue 3.4+ defineModel macro automatically handles the modelValue prop and update:modelValue emit
const query = defineModel<string>({ default: '' });
const emit = defineEmits<{
  (e: 'search'): void
}>();

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    emit('search');
  }
}
</script>

<template>
  <div class="w-full relative">
    <input
      v-model="query"
      @keydown="handleKeydown"
      type="text"
      placeholder="Search tags... (e.g. cat -dog ~outdoors)"
      class="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-6 py-4 text-xl focus:outline-none focus:border-blue-500 transition-colors shadow-lg"
      autofocus
    />
  </div>
</template>