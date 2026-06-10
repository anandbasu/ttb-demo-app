import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import HomeView from './views/HomeView.vue';
import BatchView from './views/BatchView.vue';
import HistoryView from './views/HistoryView.vue';
import ScanDetailView from './views/ScanDetailView.vue';
import LoginView from './views/LoginView.vue';
import { auth } from './api.js';
import './main.css';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView, meta: { public: true } },
    { path: '/', component: HomeView },
    { path: '/batch', component: BatchView },
    { path: '/history', component: HistoryView },
    { path: '/scans/:id', component: ScanDetailView, props: true },
  ],
});

router.beforeEach(async (to) => {
  if (to.meta.public) return true;
  const ok = await auth.isAuthed();
  if (!ok) return { path: '/login', query: { redirect: to.fullPath } };
  return true;
});

createApp(App).use(router).mount('#app');
