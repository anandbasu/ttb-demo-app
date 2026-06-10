<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router';
import { auth } from './api.js';

const route = useRoute();
const router = useRouter();
const isPublic = ref(true);

onMounted(() => { isPublic.value = Boolean(route.meta.public); });

async function doLogout() {
  await auth.logout();
  router.push('/login');
}
</script>

<template>
  <div class="min-h-full flex flex-col">
    <!-- Prototype banner — visible on every page, including login -->
    <div
      role="alert"
      aria-label="Prototype warning"
      class="bg-amber text-white text-center font-bold py-2 px-4 text-sm sm:text-base tracking-wide shadow-sm flex items-center justify-center gap-2"
    >
      <span aria-hidden="true" class="text-lg leading-none">⚠</span>
      <span>PROTOTYPE — NOT FOR PRODUCTION USE</span>
      <span aria-hidden="true" class="text-lg leading-none">⚠</span>
    </div>

    <header v-if="!route.meta.public" class="bg-navy-deep text-white shadow-md">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">
        <div class="flex items-baseline gap-3">
          <span class="text-xs font-bold tracking-widest text-ice">TTB</span>
          <h1 class="text-xl font-semibold">Label Recognition</h1>
        </div>
        <nav class="flex-1 flex items-center gap-1 text-sm">
          <RouterLink to="/" class="px-4 py-2 rounded-md hover:bg-navy-soft" active-class="bg-navy-soft">Scan a label</RouterLink>
          <RouterLink to="/batch" class="px-4 py-2 rounded-md hover:bg-navy-soft" active-class="bg-navy-soft">Batch upload</RouterLink>
          <RouterLink to="/history" class="px-4 py-2 rounded-md hover:bg-navy-soft" active-class="bg-navy-soft">History</RouterLink>
        </nav>
        <button @click="doLogout" class="text-sm text-ice/80 hover:text-white underline-offset-4 hover:underline">Sign out</button>
      </div>
    </header>
    <main class="flex-1">
      <RouterView />
    </main>
    <footer v-if="!route.meta.public" class="text-center text-xs text-navy/50 py-4">
      Advisory output only. The agent always makes the final call.
    </footer>
  </div>
</template>
