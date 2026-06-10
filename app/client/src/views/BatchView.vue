<script setup>
import { ref, computed } from 'vue';
import { batches } from '../api.js';

const files = ref([]);
const beverageType = ref('unknown');
const busy = ref(false);
const error = ref('');
const rows = ref([]);
const total = ref(0);
const completed = ref(0);
const batchId = ref(null);
const startTime = ref(null);
const endTime = ref(null);

const elapsedSec = computed(() => {
  if (!startTime.value) return null;
  const end = endTime.value || Date.now();
  return ((end - startTime.value) / 1000).toFixed(1);
});

const counts = computed(() => {
  const c = { ok: 0, warn: 0, bad: 0, failed: 0 };
  for (const r of rows.value) {
    if (r.status === 'failed') c.failed += 1;
    else if (!r.compliance) c.warn += 1;
    else if (r.compliance.warning_text_exact_match) c.ok += 1;
    else c.bad += 1;
  }
  return c;
});

function onFilesChange(e) {
  files.value = Array.from(e.target.files || []);
  rows.value = [];
  error.value = '';
  endTime.value = null;
}

async function submit() {
  if (!files.value.length) return;
  busy.value = true;
  error.value = '';
  rows.value = files.value.map((f) => ({
    id: null,
    name: f.name,
    status: 'pending',
    compliance: null,
    error: null,
  }));
  total.value = files.value.length;
  completed.value = 0;
  startTime.value = Date.now();
  endTime.value = null;

  let nextIndex = 0;
  try {
    await batches.submit(
      { images: files.value, beverageType: beverageType.value },
      (event, data) => {
        if (event === 'batch_start') {
          batchId.value = data.batch_id;
        } else if (event === 'scan_done') {
          const row = rows.value[nextIndex];
          if (row) {
            row.id = data.scan_id;
            row.status = 'done';
            row.compliance = data.compliance;
          }
          nextIndex += 1;
        } else if (event === 'scan_failed') {
          const row = rows.value[nextIndex];
          if (row) {
            row.id = data.scan_id;
            row.status = 'failed';
            row.error = data.error;
          }
          nextIndex += 1;
        } else if (event === 'progress') {
          completed.value = data.completed;
        } else if (event === 'batch_done') {
          endTime.value = Date.now();
        }
      },
    );
  } catch (err) {
    error.value = err.message || 'Batch failed';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-8">
    <header class="mb-6">
      <h2 class="text-2xl font-semibold text-navy">Batch upload</h2>
      <p class="text-sm text-navy/60">Upload up to 300 labels and stream the results as each one finishes.</p>
    </header>

    <div class="card p-5 mb-6">
      <label class="block">
        <span class="label">Label images (multi-select)</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple @change="onFilesChange" class="block w-full text-sm" />
      </label>
      <div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
        <label class="block">
          <span class="label">Beverage type for the batch</span>
          <select v-model="beverageType" class="input">
            <option value="unknown">Mixed / let the system decide</option>
            <option value="wine">Wine</option>
            <option value="spirits">Spirits</option>
            <option value="beer">Beer</option>
          </select>
        </label>
      </div>
      <p v-if="files.length" class="text-sm text-navy/60 mt-2">{{ files.length }} file(s) selected.</p>
      <button class="btn-primary mt-4" :disabled="!files.length || busy" @click="submit">
        {{ busy ? 'Processing…' : `Process ${files.length || ''} labels` }}
      </button>
      <p v-if="error" class="text-coral text-sm mt-3">{{ error }}</p>
    </div>

    <div v-if="rows.length" class="card p-5">
      <header class="flex items-center justify-between mb-3 flex-wrap gap-3">
        <h3 class="font-semibold text-lg">Results</h3>
        <div class="flex items-center gap-4 text-sm">
          <span class="pill-ok">✓ Warning OK: {{ counts.ok }}</span>
          <span class="pill-bad">✗ Needs review: {{ counts.bad }}</span>
          <span v-if="counts.failed" class="pill-bad">⚠ Failed: {{ counts.failed }}</span>
          <span class="text-navy/60">{{ completed }} / {{ total }} processed</span>
          <span v-if="elapsedSec" class="text-navy/60">{{ elapsedSec }} s</span>
        </div>
      </header>
      <div class="w-full bg-ice/40 rounded-full h-2 mb-4 overflow-hidden">
        <div class="bg-navy h-2 transition-all" :style="{ width: `${(completed / total) * 100}%` }"></div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-xs uppercase tracking-wide text-navy/50">
            <tr>
              <th class="text-left py-2">File</th>
              <th class="text-left">Status</th>
              <th class="text-left">Government warning</th>
              <th class="text-left">Brand (extracted)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in rows" :key="i" class="border-t border-navy/10">
              <td class="py-2 font-mono text-xs">{{ r.name }}</td>
              <td>
                <span v-if="r.status === 'pending'" class="pill-neutral">Queued</span>
                <span v-else-if="r.status === 'failed'" class="pill-bad">Failed</span>
                <span v-else class="pill-ok">Done</span>
              </td>
              <td>
                <span v-if="r.status === 'failed'" class="text-navy/40">—</span>
                <span v-else-if="!r.compliance" class="text-navy/40">…</span>
                <span v-else-if="r.compliance.warning_text_exact_match" class="pill-ok">✓ Exact</span>
                <span v-else-if="r.compliance.warning_present" class="pill-bad">✗ Differs</span>
                <span v-else class="pill-bad">✗ Missing</span>
              </td>
              <td class="text-navy/80">
                <span v-if="r.status === 'failed'" class="text-coral text-xs">{{ r.error }}</span>
                <span v-else>—</span>
              </td>
              <td>
                <RouterLink v-if="r.id && r.status !== 'failed'" :to="`/scans/${r.id}`" class="text-navy underline text-xs">View</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
