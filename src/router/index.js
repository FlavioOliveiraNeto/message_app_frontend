import { createRouter, createWebHistory } from 'vue-router';
import Auth from '@/components/Auth.vue';
import UserList from '@/components/UserList.vue';
import Messages from '@/components/Messages.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Auth },
    { path: '/messages', component: UserList },
    { path: '/messages/:userId', component: Messages, props: true }
  ]
});

export default router;