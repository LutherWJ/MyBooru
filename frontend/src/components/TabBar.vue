<script setup lang="ts">
import useTabStore from "../stores/tabStore.ts";
import {computed, ref} from "vue";

const tabStore = useTabStore()
const tabs = computed(() => tabStore.tabs)

const draggedIndex = ref<number | null>(null);

const onDragStart = (event: DragEvent, index: number) => {
  draggedIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.dropEffect = 'move';
  }
};

const onDragOver = (event: DragEvent) => {
  event.preventDefault();
};

const onDrop = (event: DragEvent, dropIndex: number) => {
  event.preventDefault();
  if (draggedIndex.value !== null && draggedIndex.value !== dropIndex) {
    tabStore.reorderTabs(draggedIndex.value, dropIndex);
  }
  draggedIndex.value = null;
};
</script>

<template>
  <div class="flex flex-col w-64 bg-gray-900 h-full border-r border-gray-800 overflow-y-auto shrink-0">
    <div class="p-4 font-bold text-gray-500 text-xs uppercase tracking-wider">
      Open Tabs
    </div>
    <div class="flex flex-col gap-1 px-2 pb-4">
      <button
          v-for="(tab, index) in tabs"
          :key="tab.id"
          draggable="true"
          @dragstart="onDragStart($event, index)"
          @dragover="onDragOver"
          @drop="onDrop($event, index)"
          :class="[
          'flex items-center justify-between w-full px-4 py-3 rounded-md transition-colors text-sm text-left group',
          tab.id === tabStore.activeTabID
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200',
           draggedIndex === index ? 'opacity-50' : 'opacity-100'
        ]"
          @click="tabStore.setActiveTab(tab.id)"
      >
        <div class="flex flex-col truncate pr-2">
          <span class="font-medium truncate">{{ tab.title }}</span>
          <span class="text-xs opacity-70 truncate">#{{ index + 1 }}</span>
        </div>
        <span
            class="text-lg opacity-0 group-hover:opacity-100 hover:text-red-300 transition-all p-1 rounded hover:bg-white/10"
            @click.stop="tabStore.removeTab(tab.id)"
        >
        ×
      </span>
      </button>
    </div>
  </div>
</template>
