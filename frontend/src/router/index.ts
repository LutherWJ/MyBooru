import {createRouter, createWebHashHistory} from 'vue-router';
import type {RouteRecordRaw} from 'vue-router';
import Home from '../views/Home.vue';
import Gallery from "../views/Gallery.vue";
import Upload from '../views/Upload.vue';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Gallery',
        component: Gallery,
    },
    {
        path: '/upload',
        name: 'Upload',
        component: Upload
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;
