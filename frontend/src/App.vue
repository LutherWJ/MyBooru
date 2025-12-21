<script setup lang="ts">
import TabBar from "@/components/TabBar.vue";
import NavBar from "@/components/NavBar.vue";
import useTabStore from "@/stores/tabStore";
import {useAppStore} from "@/stores/appStore";
import {onMounted} from "vue";

const tabStore = useTabStore();
const appStore = useAppStore();

onMounted(async () => {
  await appStore.init();

  if (tabStore.tabs.length === 0) {
    const id = tabStore.addTab('Gallery');
    tabStore.setActiveTab(id);
  }
})
</script>

<template>
  <div class="flex flex-col h-screen bg-app-bg text-white overflow-hidden">
    <!-- Top Navigation Bar -->
    <NavBar />
    
    <!-- Main Workspace -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left Sidebar Tabs -->
      <TabBar />
      
      <!-- Content Area -->
      <main class="flex-1 overflow-auto relative bg-app-bg">
        <router-view :key="$route.fullPath"/>
      </main>
    </div>
  </div>
</template>
