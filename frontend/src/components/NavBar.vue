<script setup lang="ts">
import useTabStore from "@/stores/tabStore.ts";

const tabStore = useTabStore();
</script>

<template>
  <nav class="h-16 bg-gray-900 border-b border-gray-800 flex items-center px-6 gap-6 shrink-0 z-50">
    <div class="text-white font-bold text-xl mr-4 tracking-wider">
      MYBOORU
    </div>
    
    <div class="h-8 w-px bg-gray-700 mx-2"></div>

    <button 
      @click="tabStore.updateTabComponent(tabStore.activeTabID, 'Gallery')"
      class="text-gray-300 hover:text-white font-medium transition-colors px-3 py-2 rounded hover:bg-gray-800 cursor-pointer"
    >
      Gallery
    </button>
    
    <button 
      @click="tabStore.updateTabComponent(tabStore.activeTabID, 'Upload')"
      class="text-gray-300 hover:text-white font-medium transition-colors px-3 py-2 rounded hover:bg-gray-800 cursor-pointer"
    >
      Upload
    </button>
  </nav>
</template>
