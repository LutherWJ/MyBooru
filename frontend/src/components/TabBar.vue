<script setup lang="ts">
import useTabStore from "../stores/tabStore.ts";
import {computed} from "vue";

const tabStore = useTabStore()
const tabs = computed(() => tabStore.tabs)
</script>

<template>
  <div class="flex flex-row gap-3 bg-gray-900 p-6">
    <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="[
          'flex items-center gap-4 px-6 py-5 rounded-t-md transition-colors text-lg',
          tab.id === tabStore.activeTabID
            ? 'bg-app-bg text-white'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
        ]"
        @click="tabStore.setActiveTab(tab.id)"
    >
      <span>{{ tab.title }}</span>
      <span
          class="text-2xl text-gray-500 hover:text-red-500 transition-colors"
          @click.stop="tabStore.removeTab(tab.id)"
      >
        ×
      </span>
    </button>
    <button
        class="w-12 h-12 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 rounded-t-md transition-colors text-xl flex items-center justify-center"
        @click="tabStore.addTab('Gallery')"
    >
      +
    </button>
  </div>
</template>
