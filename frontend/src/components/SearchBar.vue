<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

// Vue 3.4+ defineModel macro automatically handles the modelValue prop and update:modelValue emit
const query = defineModel<string>({ default: '' });
const props = defineProps<{
  isFocused?: boolean
}>();

const emit = defineEmits<{
  (e: 'search'): void
}>();

const searchInput = ref<HTMLInputElement | null>(null);

watch(() => props.isFocused, (newVal) => {
  if (newVal) {
    searchInput.value?.focus();
  }
});

onMounted(() => {
  if (props.isFocused) {
    searchInput.value?.focus();
  }
});

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    emit('search');
  }
}
</script>

<template>
  <div class="relative w-full group">
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" :class="{ 'text-blue-400': isFocused }">
        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    </div>
    <input
      ref="searchInput"
      v-model="query"
      @keydown="handleKeydown"
      type="text"
      placeholder="Search tags... (e.g. cat -dog ~outdoors)"
      class="block w-full pl-10 pr-3 py-2 border rounded-md leading-5 transition-all duration-200 shadow-sm sm:text-sm spellcheck-false focus:outline-none"
      :class="[
        isFocused 
        ? 'bg-gray-700 border-blue-500 ring-1 ring-blue-500 text-white' 
        : 'bg-gray-700/50 border-gray-600 text-gray-300 placeholder-gray-400 focus:bg-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
      ]"
    />
  </div>
</template>