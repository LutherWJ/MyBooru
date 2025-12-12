<script setup>
import useTabStore from "@/stores/tabStore";
import {watch, onMounted} from "vue";
import TabBar from "@/components/TabBar.vue";
import Upload from "@/views/Upload.vue";

const tabStore = useTabStore();

onMounted(() => {
  tabStore.addTab('gallery');
})
</script>

<template>
  <TabBar/>
  <Upload/>
</template>
