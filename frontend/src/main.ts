import { createApp } from 'vue';
import App from './App.vue';
import {createPinia} from 'pinia';
import router from './router';
import './style.css';
import {useAppStore} from "@/stores/appStore.ts";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const appStore = useAppStore();
appStore.init();

app.mount('#app');
