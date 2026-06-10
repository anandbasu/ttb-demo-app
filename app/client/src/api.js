async function jsonFetch(url, opts = {}) {
  const res = await fetch(url, { credentials: 'same-origin', ...opts });
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export const auth = {
  async isAuthed() {
    try {
      const r = await jsonFetch('/api/auth/status');
      return Boolean(r.authed);
    } catch { return false; }
  },
  login(password) {
    return jsonFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
  },
  logout() {
    return jsonFetch('/api/auth/logout', { method: 'POST' });
  },
};

export const scans = {
  async submitOne({ image, beverageType, applicationId, referenceFields }) {
    const fd = new FormData();
    fd.append('image', image);
    if (beverageType) fd.append('beverage_type', beverageType);
    if (applicationId) fd.append('application_id', applicationId);
    if (referenceFields) fd.append('reference_fields', JSON.stringify(referenceFields));
    const res = await fetch('/api/scans', { method: 'POST', body: fd, credentials: 'same-origin' });
    const body = await res.json();
    if (!res.ok && !body.scan_id) throw new Error(body.error || res.statusText);
    return body;
  },
  list(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return jsonFetch(`/api/scans${qs ? `?${qs}` : ''}`);
  },
  get(id) {
    return jsonFetch(`/api/scans/${id}`);
  },
};

export const batches = {
  list() { return jsonFetch('/api/batches'); },
  get(id) { return jsonFetch(`/api/batches/${id}`); },
  // Streaming submit — caller passes an onEvent callback.
  async submit({ images, beverageType }, onEvent) {
    const fd = new FormData();
    for (const img of images) fd.append('images', img);
    if (beverageType) fd.append('beverage_type', beverageType);
    const res = await fetch('/api/batches', { method: 'POST', body: fd, credentials: 'same-origin' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || res.statusText);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const lines = raw.split('\n');
        let event = 'message';
        const dataLines = [];
        for (const line of lines) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
        }
        if (!dataLines.length) continue;
        try {
          const data = JSON.parse(dataLines.join('\n'));
          onEvent?.(event, data);
        } catch {}
      }
    }
  },
};
