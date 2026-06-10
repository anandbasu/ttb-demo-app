<script setup>
import { ref, onMounted } from 'vue';
import { scans } from '../api.js';

const list = ref([]);
const loading = ref(true);
const filter = ref('');

async function load() {
  loading.value = true;
  try {
    const params = filter.value ? { application_id: filter.value } : {};
    const r = await scans.list(params);
    list.value = r.scans || [];
  } finally { loading.value = false; }
}

onMounted(load);

function statusPill(s) {
  if (s === 'done') return 'pill-ok';
  if (s === 'processing') return 'pill-warn';
  if (s === 'failed') return 'pill-bad';
  return 'pill-neutral';
}
function fmtTime(t) { return t ? new Date(t).toLocaleString() : '—'; }
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-8">
    <header class="mb-6">
      <h2 class="text-2xl font-semibold text-navy">History</h2>
      <p class="text-sm text-navy/60">Most recent 50 scans across all sessions.</p>
    </header>

    <div class="card p-5">
      <div class="flex items-end gap-3 mb-4">
        <label class="flex-1">
          <span class="label">Filter by Application ID</span>
          <input v-model="filter" class="input" placeholder="exact match" @keyup.enter="load" />
        </label>
        <button class="btn-secondary" @click="load">Apply</button>
      </div>

      <p v-if="loading" class="text-navy/50 text-sm">Loading…</p>
      <p v-else-if="!list.length" class="text-navy/50 text-sm">No scans yet.</p>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-xs uppercase tracking-wide text-navy/50">
            <tr>
              <th class="text-left py-2">When</th>
              <th class="text-left">Application ID</th>
              <th class="text-left">Type</th>
              <th class="text-left">Status</th>
              <th class="text-left">Warning</th>
              <th class="text-left">Comparison</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in list" :key="s.id" class="border-t border-navy/10">
              <td class="py-2 text-navy/70">{{ fmtTime(s.created_at) }}</td>
              <td class="font-mono text-xs">{{ s.application_id || '—' }}</td>
              <td class="capitalize">{{ s.beverage_type }}</td>
              <td><span :class="statusPill(s.status)">{{ s.status }}</span></td>
              <td>
                <span v-if="s.warning_text_exact_match" class="pill-ok">✓ Exact</span>
                <span v-else-if="s.warning_present === false" class="pill-bad">✗ Missing</span>
                <span v-else-if="s.warning_present === true" class="pill-bad">✗ Differs</span>
                <span v-else class="text-navy/40">—</span>
              </td>
              <td>
                <span v-if="s.comparison_status" :class="statusPill(s.comparison_status === 'match' ? 'done' : (s.comparison_status === 'fuzzy_match' ? 'processing' : 'failed'))">{{ s.comparison_status.replace('_',' ') }}</span>
                <span v-else class="text-navy/40">—</span>
              </td>
              <td><RouterLink :to="`/scans/${s.id}`" class="text-navy underline text-xs">View</RouterLink></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
