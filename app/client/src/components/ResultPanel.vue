<script setup>
import { computed } from 'vue';

const props = defineProps({
  result: { type: Object, required: true },
});

const fieldDefs = [
  ['brand_name', 'Brand name'],
  ['class_type', 'Class / type'],
  ['alcohol_content_abv', 'Alcohol %'],
  ['alcohol_content_proof', 'Proof'],
  ['net_contents', 'Net contents'],
  ['producer_name', 'Producer'],
  ['producer_address', 'Producer address'],
  ['country_of_origin', 'Country of origin'],
];

const fields = computed(() => props.result?.fields || {});
const compliance = computed(() => props.result?.compliance || {});
const comparison = computed(() => props.result?.comparison || null);
const timing = computed(() => props.result?.timing || {});

function statusPillClass(s) {
  if (s === 'match') return 'pill-ok';
  if (s === 'fuzzy_match') return 'pill-warn';
  if (s === 'mismatch' || s === 'missing') return 'pill-bad';
  return 'pill-neutral';
}
function statusLabel(s) {
  if (s === 'match') return 'Match';
  if (s === 'fuzzy_match') return 'Fuzzy match';
  if (s === 'mismatch') return 'Mismatch';
  if (s === 'missing') return 'Missing on label';
  if (s === 'not_in_reference') return 'No reference';
  return s || '—';
}

const missingFieldCount = computed(() => {
  return fieldDefs.filter(([key]) => !fields.value[key]).length;
});

function isEmpty(key) {
  const v = fields.value[key];
  return v == null || v === '';
}

const sortedComparisonEntries = computed(() => {
  if (!comparison.value?.field_results) return [];
  const order = { mismatch: 0, missing: 1, fuzzy_match: 2, match: 3, not_in_reference: 4 };
  return Object.entries(comparison.value.field_results)
    .sort((a, b) => (order[a[1].status] ?? 99) - (order[b[1].status] ?? 99));
});
</script>

<template>
  <div class="space-y-6">
    <!-- Extracted fields -->
    <section class="card p-5">
      <header class="flex items-start justify-between mb-3 gap-4">
        <div>
          <h3 class="font-semibold text-lg">Extracted fields</h3>
          <p class="text-xs text-navy/50">Pulled from the label by OCR + LLM</p>
        </div>
        <span v-if="missingFieldCount > 0" class="pill-warn whitespace-nowrap">
          <span aria-hidden="true">⚠</span>
          {{ missingFieldCount }} of {{ fieldDefs.length }} not found
        </span>
        <span v-else class="pill-ok whitespace-nowrap">
          <span aria-hidden="true">✓</span>
          All fields found
        </span>
      </header>
      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div
          v-for="[key, label] in fieldDefs"
          :key="key"
          :class="[
            'rounded-lg px-3 py-2 border',
            isEmpty(key)
              ? 'bg-amber-soft border-amber/30'
              : 'bg-white border-transparent',
          ]"
        >
          <dt
            :class="[
              'text-xs uppercase tracking-wide font-semibold',
              isEmpty(key) ? 'text-amber' : 'text-navy/50',
            ]"
          >
            {{ label }}
          </dt>
          <dd v-if="isEmpty(key)" class="text-amber italic font-medium mt-0.5">
            Not found on label
          </dd>
          <dd v-else class="font-medium text-navy mt-0.5">{{ fields[key] }}</dd>
        </div>
      </dl>
    </section>

    <!-- Government warning compliance -->
    <section class="card p-5">
      <header class="flex items-start justify-between mb-3">
        <div>
          <h3 class="font-semibold text-lg">Government warning</h3>
          <p class="text-xs text-navy/50">Exact text match per 27 CFR §16.21</p>
        </div>
        <span :class="compliance.warning_text_exact_match ? 'pill-ok' : (compliance.warning_present ? 'pill-bad' : 'pill-bad')">
          <span aria-hidden="true">{{ compliance.warning_text_exact_match ? '✓' : '✗' }}</span>
          {{ compliance.warning_text_exact_match ? 'Exact match' : (compliance.warning_present ? 'Does not match' : 'Not found') }}
        </span>
      </header>
      <dl class="grid grid-cols-3 gap-2 text-sm">
        <dt class="text-navy/60">Present on label</dt>
        <dd class="col-span-2"><span :class="compliance.warning_present ? 'pill-ok' : 'pill-bad'">{{ compliance.warning_present ? 'Yes' : 'No' }}</span></dd>
        <dt class="text-navy/60">Prefix in all caps</dt>
        <dd class="col-span-2"><span :class="compliance.warning_prefix_all_caps ? 'pill-ok' : 'pill-bad'">{{ compliance.warning_prefix_all_caps ? 'Yes — GOVERNMENT WARNING:' : 'No' }}</span></dd>
        <template v-if="compliance.warning_diff">
          <dt class="text-navy/60">Why it does not match</dt>
          <dd class="col-span-2 text-coral">{{ compliance.warning_diff }}</dd>
        </template>
      </dl>
    </section>

    <!-- Application vs label comparison (when present) -->
    <section v-if="comparison" class="card p-5">
      <header class="flex items-start justify-between mb-3">
        <div>
          <h3 class="font-semibold text-lg">Application vs label</h3>
          <p class="text-xs text-navy/50">Comparison against the reference data the agent supplied</p>
        </div>
        <span :class="statusPillClass(comparison.overall_status)">
          Overall: {{ statusLabel(comparison.overall_status) }} ({{ Math.round(comparison.confidence * 100) }}%)
        </span>
      </header>
      <table class="w-full text-sm">
        <thead class="text-xs uppercase tracking-wide text-navy/50">
          <tr>
            <th class="text-left py-1">Field</th>
            <th class="text-left">From label</th>
            <th class="text-left">From application</th>
            <th class="text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="[field, r] in sortedComparisonEntries" :key="field" class="border-t border-navy/10">
            <td class="py-2 font-medium text-navy/80">{{ field.replace(/_/g, ' ') }}</td>
            <td class="py-2">{{ r.extracted || '—' }}</td>
            <td class="py-2">{{ r.reference || '—' }}</td>
            <td class="py-2"><span :class="statusPillClass(r.status)">{{ statusLabel(r.status) }}</span></td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Timing footer -->
    <p v-if="timing.total_ms" class="text-xs text-navy/50">
      Processed in {{ timing.total_ms }} ms (OCR {{ timing.ocr_ms }} ms · LLM {{ timing.llm_ms }} ms).
      Target ≤ 5000 ms.
    </p>
  </div>
</template>
