<script setup>
import { ref, computed } from 'vue';
import { scans } from '../api.js';
import ResultPanel from '../components/ResultPanel.vue';

const file = ref(null);
const preview = ref('');
const beverageType = ref('unknown');
const applicationId = ref('');
const useReference = ref(false);
const referenceText = ref('');

const busy = ref(false);
const result = ref(null);
const error = ref('');

const referenceParsed = computed(() => {
  if (!useReference.value || !referenceText.value.trim()) return null;
  try { return JSON.parse(referenceText.value); }
  catch { return 'invalid'; }
});

function onFileChange(e) {
  const f = e.target.files?.[0];
  if (!f) return;
  file.value = f;
  preview.value = URL.createObjectURL(f);
  result.value = null;
  error.value = '';
}

async function submit() {
  if (!file.value) return;
  if (useReference.value && referenceParsed.value === 'invalid') {
    error.value = 'Reference data must be valid JSON.';
    return;
  }
  busy.value = true;
  error.value = '';
  result.value = null;
  try {
    const body = await scans.submitOne({
      image: file.value,
      beverageType: beverageType.value,
      applicationId: applicationId.value || null,
      referenceFields: useReference.value ? referenceParsed.value : null,
    });
    if (body.ok) result.value = body;
    else error.value = body.error || 'Processing failed';
  } catch (err) {
    error.value = err.message || 'Submission failed';
  } finally {
    busy.value = false;
  }
}

const referenceTemplate = `{
  "brand_name": "OLD TOM DISTILLERY",
  "class_type": "Kentucky Straight Bourbon Whiskey",
  "alcohol_content_abv": "45%",
  "net_contents": "750 mL",
  "producer_name": "Old Tom Distillery Co."
}`;
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-8">
    <header class="mb-6">
      <h2 class="text-2xl font-semibold text-navy">Scan a label</h2>
      <p class="text-sm text-navy/60">Upload a label image to extract TTB-required fields and check the Government Warning.</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <!-- Upload column -->
      <section class="card p-5 lg:col-span-2 self-start">
        <h3 class="font-semibold mb-4">1 — Upload</h3>
        <label class="block">
          <span class="label">Label image</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" @change="onFileChange" class="block w-full text-sm" />
        </label>
        <img v-if="preview" :src="preview" alt="Label preview" class="mt-3 rounded-lg border border-navy/10 max-h-64 object-contain mx-auto" />

        <h3 class="font-semibold mt-6 mb-3">2 — Context</h3>
        <div class="space-y-3">
          <label class="block">
            <span class="label">Beverage type</span>
            <select v-model="beverageType" class="input">
              <option value="unknown">Let the system decide</option>
              <option value="wine">Wine</option>
              <option value="spirits">Spirits</option>
              <option value="beer">Beer</option>
            </select>
          </label>
          <label class="block">
            <span class="label">Application ID (optional)</span>
            <input v-model="applicationId" class="input" placeholder="e.g. 24001-12345" />
          </label>
        </div>

        <h3 class="font-semibold mt-6 mb-3">3 — Compare to application (optional)</h3>
        <label class="inline-flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" v-model="useReference" class="h-4 w-4" />
          Compare against application data
        </label>
        <textarea
          v-if="useReference"
          v-model="referenceText"
          class="input mt-2 font-mono text-xs"
          rows="9"
          :placeholder="referenceTemplate"
        />
        <p v-if="useReference && referenceParsed === 'invalid'" class="text-coral text-xs mt-1">Invalid JSON.</p>

        <button class="btn-primary w-full mt-6" :disabled="!file || busy" @click="submit">
          {{ busy ? 'Processing…' : 'Run extraction' }}
        </button>
        <p v-if="error" class="text-coral text-sm mt-3">{{ error }}</p>
      </section>

      <!-- Result column -->
      <section class="lg:col-span-3">
        <div v-if="!result && !busy" class="card p-10 text-center text-navy/50">
          <p class="font-medium">Results will appear here.</p>
          <p class="text-sm mt-1">Upload a label and click <strong>Run extraction</strong>.</p>
        </div>
        <div v-if="busy" class="card p-10 text-center text-navy/70">
          <p class="font-medium">Processing label…</p>
          <p class="text-xs mt-1">OCR → LLM extraction → compliance check</p>
        </div>
        <ResultPanel v-if="result" :result="result" />
      </section>
    </div>
  </div>
</template>
