import {createRouter, createWebHashHistory} from 'vue-router';
import type {RouteRecordRaw} from 'vue-router';
import Gallery from "../views/Gallery.vue";
import Upload from '../views/Upload.vue';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        redirect: () => {
            return { name: 'Gallery', params: { tabID: '0' } };
        }
    },
    {
        path: '/gallery/:tabID',
        name: 'Gallery',
        component: Gallery,
    },
    {
        path: '/upload/:tabID',
        name: 'Upload',
        component: Upload
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;
