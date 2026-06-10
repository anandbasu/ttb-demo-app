<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { auth } from '../api.js';

const password = ref('');
const error = ref('');
const busy = ref(false);
const router = useRouter();
const route = useRoute();

async function submit() {
  error.value = '';
  busy.value = true;
  try {
    await auth.login(password.value);
    router.push(route.query.redirect || '/');
  } catch (err) {
    error.value = err.message || 'Login failed';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-navy-deep px-4">
    <div class="card p-8 w-full max-w-md">
      <div class="mb-6">
        <p class="text-xs font-bold tracking-widest text-navy/60">TTB COMPLIANCE</p>
        <h1 class="text-2xl font-semibold text-navy">Label Recognition</h1>
        <p class="text-sm text-navy/60 mt-1">Prototype access — shared password</p>
      </div>
      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label for="pw" class="label">Password</label>
          <input id="pw" v-model="password" type="password" class="input" autocomplete="current-password" required />
        </div>
        <p v-if="error" class="text-sm text-coral font-medium">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="busy">
          {{ busy ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>
