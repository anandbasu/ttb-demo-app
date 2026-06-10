<script setup>
import { ref, onMounted, computed } from 'vue';
import { scans } from '../api.js';
import ResultPanel from '../components/ResultPanel.vue';

const props = defineProps({ id: { type: String, required: true } });
const data = ref(null);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    data.value = await scans.get(props.id);
  } catch (err) {
    error.value = err.message || 'Failed to load scan';
  } finally {
    loading.value = false;
  }
});

const reconstructed = computed(() => {
  if (!data.value?.extraction) return null;
  return {
    fields: data.value.extraction.fields_json,
    compliance: {
      warning_present: data.value.extraction.warning_present,
      warning_prefix_all_caps: data.value.extraction.warning_prefix_all_caps,
      warning_text_exact_match: data.value.extraction.warning_text_exact_match,
      warning_diff: data.value.extraction.warning_diff,
    },
    comparison: data.value.comparison ? {
      overall_status: data.value.comparison.overall_status,
      confidence: data.value.comparison.confidence,
      field_results: data.value.comparison.field_results,
    } : null,
    timing: { total_ms: data.value.extraction.latency_ms },
  };
});

const imageUrl = computed(() => {
  if (!data.value?.scan?.image_path) return '';
  const p = data.value.scan.image_path.split('/').pop();
  return `/uploads/${p}`;
});
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-8">
    <RouterLink to="/history" class="text-sm text-navy underline">← Back to history</RouterLink>
    <p v-if="loading" class="text-navy/50 mt-4">Loading…</p>
    <p v-else-if="error" class="text-coral mt-4">{{ error }}</p>
    <div v-else-if="data" class="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-4">
      <section class="card p-5 lg:col-span-2 self-start">
        <h2 class="text-xl font-semibold mb-2">Scan</h2>
        <dl class="text-sm space-y-1">
          <div><dt class="inline text-navy/60">ID: </dt><dd class="inline font-mono text-xs">{{ data.scan.id }}</dd></div>
          <div><dt class="inline text-navy/60">Application: </dt><dd class="inline">{{ data.scan.application_id || '—' }}</dd></div>
          <div><dt class="inline text-navy/60">Beverage: </dt><dd class="inline capitalize">{{ data.scan.beverage_type }}</dd></div>
          <div><dt class="inline text-navy/60">Status: </dt><dd class="inline">{{ data.scan.status }}</dd></div>
          <div><dt class="inline text-navy/60">Created: </dt><dd class="inline">{{ new Date(data.scan.created_at).toLocaleString() }}</dd></div>
        </dl>
        <img v-if="imageUrl" :src="imageUrl" alt="Scanned label" class="mt-4 rounded-lg border border-navy/10 max-h-96 object-contain mx-auto" />
      </section>
      <section class="lg:col-span-3">
        <ResultPanel v-if="reconstructed" :result="reconstructed" />
        <p v-else class="text-navy/50">No extraction data.</p>
      </section>
    </div>
  </div>
</template>
