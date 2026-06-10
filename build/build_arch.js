// Architecture deck for TTB Label Recognition Prototype
// Run: node build_arch.js

const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.author = "Anand Basu";
pres.title = "TTB Label Recognition — Architecture";

const W = 13.333;
const H = 7.5;

const C = {
  navy: "1E2761",
  navyDeep: "141C44",
  ice: "CADCFC",
  white: "FFFFFF",
  offwhite: "F5F7FB",
  card: "FFFFFF",
  cardBorder: "DCE3F1",
  muted: "64748B",
  mutedDark: "475569",
  coral: "F96167",
  coralSoft: "FDE7E8",
  teal: "028090",
  tealSoft: "D8ECEE",
  amber: "D97706",
  amberSoft: "FEF3C7",
};

const FH = "Calibri";
const FB = "Calibri";

// Reusable helpers
const makeShadow = () => ({
  type: "outer",
  blur: 8,
  offset: 2,
  angle: 90,
  color: "000000",
  opacity: 0.08,
});

function addHeader(slide, title, subtitle) {
  // Left navy accent bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: H,
    fill: { color: C.navy }, line: { color: C.navy },
  });
  // Page label tag (top right)
  slide.addText("TTB Label Recognition · Architecture", {
    x: W - 5.5, y: 0.35, w: 5.0, h: 0.3,
    fontFace: FB, fontSize: 9, color: C.muted, align: "right", margin: 0,
  });
  // Title
  slide.addText(title, {
    x: 0.55, y: 0.35, w: 9, h: 0.7,
    fontFace: FH, fontSize: 28, bold: true, color: C.navy, margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.55, y: 1.0, w: 12, h: 0.4,
      fontFace: FB, fontSize: 13, color: C.muted, margin: 0,
    });
  }
}

function addFooter(slide, pageNo, totalPages) {
  slide.addShape(pres.shapes.LINE, {
    x: 0.55, y: H - 0.45, w: W - 1.1, h: 0,
    line: { color: C.cardBorder, width: 0.75 },
  });
  slide.addText("Anand Basu · Prototype v1 · 2026-06-09", {
    x: 0.55, y: H - 0.4, w: 6, h: 0.3,
    fontFace: FB, fontSize: 9, color: C.muted, margin: 0,
  });
  slide.addText(`${pageNo} / ${totalPages}`, {
    x: W - 1.5, y: H - 0.4, w: 0.95, h: 0.3,
    fontFace: FB, fontSize: 9, color: C.muted, align: "right", margin: 0,
  });
}

function card(slide, opts) {
  // opts: x, y, w, h, title, subtitle, body (array of strings), accent (color), tag
  slide.addShape(pres.shapes.RECTANGLE, {
    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
    fill: { color: C.card }, line: { color: C.cardBorder, width: 1 },
    shadow: makeShadow(),
  });
  // accent bar (left)
  if (opts.accent) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: opts.x, y: opts.y, w: 0.08, h: opts.h,
      fill: { color: opts.accent }, line: { color: opts.accent },
    });
  }
  const padL = (opts.accent ? 0.22 : 0.15);
  let curY = opts.y + 0.10;
  if (opts.tag) {
    slide.addText(opts.tag, {
      x: opts.x + padL, y: curY, w: opts.w - padL - 0.15, h: 0.18,
      fontFace: FB, fontSize: 8, bold: true, color: opts.accent || C.muted,
      charSpacing: 2, margin: 0,
    });
    curY += 0.20;
  }
  if (opts.title) {
    slide.addText(opts.title, {
      x: opts.x + padL, y: curY, w: opts.w - padL - 0.15, h: 0.28,
      fontFace: FH, fontSize: 13, bold: true, color: C.navy, margin: 0,
    });
    curY += 0.30;
  }
  if (opts.subtitle) {
    slide.addText(opts.subtitle, {
      x: opts.x + padL, y: curY, w: opts.w - padL - 0.15, h: 0.24,
      fontFace: FB, fontSize: 10, italic: true, color: C.muted, margin: 0,
    });
    curY += 0.26;
  }
  if (opts.body && opts.body.length > 0) {
    const arr = opts.body.map((line, i) => ({
      text: line,
      options: { bullet: { code: "25A0" }, breakLine: i < opts.body.length - 1 },
    }));
    const bodyH = Math.max(0.2, opts.h - (curY - opts.y) - 0.10);
    slide.addText(arr, {
      x: opts.x + padL, y: curY + 0.04, w: opts.w - padL - 0.15, h: bodyH,
      fontFace: FB, fontSize: 9, color: C.mutedDark, paraSpaceAfter: 2, margin: 0,
    });
  }
}

function arrow(slide, x1, y1, x2, y2, color) {
  color = color || C.navy;
  slide.addShape(pres.shapes.LINE, {
    x: x1, y: y1, w: x2 - x1, h: y2 - y1,
    line: { color, width: 1.5, endArrowType: "triangle" },
  });
}

const TOTAL_SLIDES = 7;

// ============================================================
// SLIDE 1: TITLE
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.navyDeep };

  // Decorative diagonal stripes on right
  for (let i = 0; i < 8; i++) {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 9.5 + i * 0.5, y: -1, w: 0.05, h: 10,
      fill: { color: C.ice, transparency: 80 },
      line: { color: C.ice, transparency: 80, width: 0 },
      rotate: 20,
    });
  }

  // Tag
  s.addText("PROTOTYPE  ·  ARCHITECTURE OVERVIEW", {
    x: 0.7, y: 1.6, w: 8, h: 0.4,
    fontFace: FB, fontSize: 11, bold: true, color: C.ice, charSpacing: 4, margin: 0,
  });

  // Main title
  s.addText("TTB Label Recognition", {
    x: 0.7, y: 2.1, w: 11, h: 1.1,
    fontFace: FH, fontSize: 48, bold: true, color: C.white, margin: 0,
  });
  s.addText("System Architecture", {
    x: 0.7, y: 3.05, w: 11, h: 0.9,
    fontFace: FH, fontSize: 36, color: C.ice, margin: 0,
  });

  // Divider
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.7, y: 4.2, w: 1.2, h: 0.05,
    fill: { color: C.coral }, line: { color: C.coral },
  });

  // Subtitle / stack
  s.addText("OCR + LLM pipeline · PaddleOCR · Groq Llama 3.1 8B", {
    x: 0.7, y: 4.4, w: 11, h: 0.4,
    fontFace: FB, fontSize: 16, color: C.white, margin: 0,
  });
  s.addText("Deployed on fly.io · Web UI + documented API", {
    x: 0.7, y: 4.85, w: 11, h: 0.4,
    fontFace: FB, fontSize: 14, color: C.ice, margin: 0,
  });

  // Footer block
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 6.7, w: W, h: 0.8,
    fill: { color: C.navy }, line: { color: C.navy },
  });
  s.addText("Anand Basu", {
    x: 0.7, y: 6.85, w: 5, h: 0.3,
    fontFace: FB, fontSize: 12, bold: true, color: C.white, margin: 0,
  });
  s.addText("Architecture v1 — 2026-06-09", {
    x: 0.7, y: 7.15, w: 5, h: 0.3,
    fontFace: FB, fontSize: 10, color: C.ice, margin: 0,
  });
  s.addText("Prepared for stakeholder review", {
    x: W - 5.7, y: 7.0, w: 5, h: 0.3,
    fontFace: FB, fontSize: 10, italic: true, color: C.ice, align: "right", margin: 0,
  });
}

// ============================================================
// SLIDE 2: HIGH-LEVEL COMPONENTS
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.offwhite };
  addHeader(s, "System Components", "End-to-end view of the prototype — clients, fly.io services, external API");

  // Three columns: CLIENT | APPLICATION (fly.io) | EXTERNAL
  // Layout area: y 1.6 -> 6.8
  const colY = 1.65;
  const colH = 5.15;

  // CLIENT column
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: colY, w: 2.7, h: colH,
    fill: { color: C.ice, transparency: 60 }, line: { color: C.ice, width: 0.5 },
  });
  s.addText("CLIENT", {
    x: 0.6, y: colY + 0.1, w: 2.7, h: 0.3,
    fontFace: FB, fontSize: 10, bold: true, color: C.navy, align: "center", charSpacing: 4, margin: 0,
  });
  card(s, {
    x: 0.8, y: colY + 0.55, w: 2.3, h: 1.55,
    tag: "BROWSER",
    title: "Web UI",
    body: [
      "Single-screen upload",
      "Batch + history view",
      "Shared-password gate",
    ],
    accent: C.navy,
  });
  card(s, {
    x: 0.8, y: colY + 2.25, w: 2.3, h: 1.55,
    tag: "HTTP",
    title: "API client",
    body: [
      "curl / scripts",
      "JSON in/out",
      "Token-bearer auth",
    ],
    accent: C.navy,
  });

  // APPLICATION column (fly.io)
  s.addShape(pres.shapes.RECTANGLE, {
    x: 3.7, y: colY, w: 5.9, h: colH,
    fill: { color: C.coralSoft, transparency: 40 }, line: { color: C.coral, width: 0.5, dashType: "dash" },
  });
  s.addText("APPLICATION  ·  fly.io", {
    x: 3.7, y: colY + 0.1, w: 5.9, h: 0.3,
    fontFace: FB, fontSize: 10, bold: true, color: C.coral, align: "center", charSpacing: 4, margin: 0,
  });
  card(s, {
    x: 3.9, y: colY + 0.55, w: 5.5, h: 1.35,
    tag: "ENTRY",
    title: "Web / API Gateway",
    subtitle: "Node.js (Express) or Python (FastAPI)",
    body: [
      "Auth, request validation, routing",
      "Streams batch results via SSE",
    ],
    accent: C.coral,
  });
  card(s, {
    x: 3.9, y: colY + 2.05, w: 2.65, h: 2.0,
    tag: "WORKER",
    title: "Extraction Worker",
    subtitle: "PaddleOCR (CPU)",
    body: [
      "Image preprocess",
      "OCR → text + bboxes",
      "Calls Groq for fields",
      "Warning compliance check",
    ],
    accent: C.coral,
  });
  card(s, {
    x: 6.75, y: colY + 2.05, w: 2.65, h: 2.0,
    tag: "DATA",
    title: "fly Postgres",
    subtitle: "1 GB managed",
    body: [
      "scans · extractions",
      "comparisons · batches",
      "Per-scan structured data",
    ],
    accent: C.coral,
  });
  card(s, {
    x: 3.9, y: colY + 4.15, w: 5.5, h: 0.8,
    tag: "BLOB",
    title: "fly Volume · 50 GB",
    body: [
      "Raw uploaded label images, referenced by path",
    ],
    accent: C.coral,
  });

  // EXTERNAL column
  s.addShape(pres.shapes.RECTANGLE, {
    x: 10.0, y: colY, w: 2.7, h: colH,
    fill: { color: C.amberSoft, transparency: 30 }, line: { color: C.amber, width: 0.5, dashType: "dash" },
  });
  s.addText("EXTERNAL", {
    x: 10.0, y: colY + 0.1, w: 2.7, h: 0.3,
    fontFace: FB, fontSize: 10, bold: true, color: C.amber, align: "center", charSpacing: 4, margin: 0,
  });
  card(s, {
    x: 10.2, y: colY + 0.55, w: 2.3, h: 1.95,
    tag: "LLM",
    title: "Groq API",
    subtitle: "Llama 3.1 8B · free tier",
    body: [
      "Structured JSON extraction",
      "~500 ms inference",
      "30 req/min limit",
    ],
    accent: C.amber,
  });
  // Production-target callout
  card(s, {
    x: 10.2, y: colY + 2.65, w: 2.3, h: 2.1,
    tag: "PRODUCTION",
    title: "Future: self-hosted",
    subtitle: "Azure Gov / FedRAMP",
    body: [
      "TTB firewall blocks",
      "many external ML APIs",
      "Swap to local Llama",
      "or Phi on GPU",
    ],
    accent: C.amber,
  });

  // Arrows: both clients enter via the Gateway
  arrow(s, 3.15, colY + 1.32, 3.85, colY + 1.10, C.navy); // Web UI -> Gateway
  arrow(s, 3.15, colY + 3.02, 3.85, colY + 1.50, C.navy); // API client -> Gateway
  // Internal data flows
  arrow(s, 6.55, colY + 3.05, 6.75, colY + 3.05, C.coral); // worker -> postgres
  arrow(s, 5.22, colY + 4.05, 5.22, colY + 4.15, C.coral); // worker -> volume
  // Worker -> Groq is conveyed by adjacency + the "Calls Groq" line inside the worker card

  addFooter(s, 2, TOTAL_SLIDES);
}

// ============================================================
// SLIDE 3: SINGLE-LABEL FLOW WITH LATENCY BUDGET
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.offwhite };
  addHeader(s, "Single-Label Request — 5 s Latency Budget",
    "Hard constraint per Sarah: prior vendor failed at 30–40 s. Current estimate: ~3.2 s with 1.8 s headroom.");

  // Headline metric strip
  const metrics = [
    { label: "TARGET (p95)", value: "≤ 5.0 s", color: C.navy },
    { label: "ESTIMATE", value: "~3.2 s", color: C.teal },
    { label: "HEADROOM", value: "1.8 s", color: C.teal },
    { label: "PRIOR VENDOR", value: "30–40 s", color: C.coral },
  ];
  metrics.forEach((m, i) => {
    const x = 0.6 + i * 3.05;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.55, w: 2.85, h: 0.95,
      fill: { color: C.card }, line: { color: C.cardBorder, width: 1 },
      shadow: makeShadow(),
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.55, w: 0.08, h: 0.95,
      fill: { color: m.color }, line: { color: m.color },
    });
    s.addText(m.label, {
      x: x + 0.2, y: 1.62, w: 2.55, h: 0.25,
      fontFace: FB, fontSize: 8, bold: true, color: C.muted, charSpacing: 2, margin: 0,
    });
    s.addText(m.value, {
      x: x + 0.2, y: 1.9, w: 2.55, h: 0.55,
      fontFace: FH, fontSize: 22, bold: true, color: m.color, margin: 0,
    });
  });

  // Waterfall timeline — each step gets a distinct hue so legend swatches are unambiguous
  const stepColors = {
    upload:  "1E2761", // navy
    ocr:     "4F5BAA", // navy-light
    llm:     "D97706", // amber (external)
    warn:    "F96167", // coral
    render:  "028090", // teal
  };
  const steps = [
    { label: "Upload + auth",        time: 0.3, color: stepColors.upload, ext: false },
    { label: "PaddleOCR (CPU)",      time: 1.5, color: stepColors.ocr,    ext: false },
    { label: "Groq LLM extraction",  time: 0.8, color: stepColors.llm,    ext: true  },
    { label: "Warning check + DB",   time: 0.4, color: stepColors.warn,   ext: false },
    { label: "Render to UI",         time: 0.2, color: stepColors.render, ext: false },
  ];
  const total = steps.reduce((a, b) => a + b.time, 0); // 3.2
  const barY = 3.4;
  const barH = 0.6;
  const trackX = 0.8;
  const trackW = 11.8;
  const pxPerSec = trackW / 5.0; // align to 5s budget

  // Track background
  s.addShape(pres.shapes.RECTANGLE, {
    x: trackX, y: barY, w: trackW, h: barH,
    fill: { color: "EFF2F8" }, line: { color: C.cardBorder, width: 0.5 },
  });
  // Headroom segment (transparent green)
  s.addShape(pres.shapes.RECTANGLE, {
    x: trackX + total * pxPerSec, y: barY,
    w: (5.0 - total) * pxPerSec, h: barH,
    fill: { color: C.teal, transparency: 75 }, line: { color: C.teal, width: 0 },
  });
  // Step bars
  let cur = trackX;
  steps.forEach((st) => {
    const segW = st.time * pxPerSec;
    s.addShape(pres.shapes.RECTANGLE, {
      x: cur, y: barY, w: segW, h: barH,
      fill: { color: st.color }, line: { color: C.white, width: 1 },
    });
    s.addText(`${st.time.toFixed(1)}s`, {
      x: cur, y: barY + 0.15, w: segW, h: 0.3,
      fontFace: FB, fontSize: 10, bold: true, color: C.white, align: "center", margin: 0,
    });
    cur += segW;
  });

  // Scale ticks 0..5
  for (let t = 0; t <= 5; t++) {
    const tx = trackX + t * pxPerSec;
    s.addShape(pres.shapes.LINE, {
      x: tx, y: barY + barH, w: 0, h: 0.1,
      line: { color: C.muted, width: 0.75 },
    });
    s.addText(`${t}s`, {
      x: tx - 0.25, y: barY + barH + 0.1, w: 0.5, h: 0.25,
      fontFace: FB, fontSize: 9, color: C.muted, align: "center", margin: 0,
    });
  }
  // Total & budget markers
  s.addText(`Total ≈ ${total.toFixed(1)}s`, {
    x: trackX + total * pxPerSec - 1.2, y: barY - 0.35, w: 2.4, h: 0.3,
    fontFace: FB, fontSize: 11, bold: true, color: C.teal, align: "center", margin: 0,
  });
  s.addShape(pres.shapes.LINE, {
    x: trackX + total * pxPerSec, y: barY - 0.05, w: 0, h: barH + 0.1,
    line: { color: C.teal, width: 1.5, dashType: "dash" },
  });
  s.addText("Budget 5.0s", {
    x: trackX + trackW - 1.0, y: barY - 0.35, w: 1.0, h: 0.3,
    fontFace: FB, fontSize: 11, bold: true, color: C.navy, align: "right", margin: 0,
  });

  // Step legend below
  const legendY = 4.85;
  steps.forEach((st, i) => {
    const lx = 0.6 + i * 2.55;
    s.addShape(pres.shapes.RECTANGLE, {
      x: lx, y: legendY, w: 0.18, h: 0.18,
      fill: { color: st.color }, line: { color: st.color },
    });
    s.addText(st.label, {
      x: lx + 0.28, y: legendY - 0.05, w: 2.3, h: 0.28,
      fontFace: FB, fontSize: 10, bold: true, color: C.navy, margin: 0,
    });
    s.addText(st.ext ? "external dependency" : "internal to fly.io", {
      x: lx + 0.28, y: legendY + 0.2, w: 2.3, h: 0.25,
      fontFace: FB, fontSize: 8, italic: true, color: st.ext ? C.amber : C.muted, margin: 0,
    });
  });

  // Risk callout box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 5.7, w: 12.1, h: 1.15,
    fill: { color: C.coralSoft }, line: { color: C.coral, width: 1 },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 5.7, w: 0.08, h: 1.15,
    fill: { color: C.coral }, line: { color: C.coral },
  });
  s.addText("RISKS TO THE LATENCY BUDGET", {
    x: 0.8, y: 5.78, w: 11, h: 0.25,
    fontFace: FB, fontSize: 8, bold: true, color: C.coral, charSpacing: 3, margin: 0,
  });
  s.addText([
    { text: "Groq cold-start or rate-limit retry can push the LLM step from 0.8 s to 2–3 s.", options: { bullet: { code: "25A0" }, breakLine: true } },
    { text: "PaddleOCR slows on large images; cap upload at ~10 MP and resize before OCR.", options: { bullet: { code: "25A0" }, breakLine: true } },
    { text: "Cold fly.io machine adds 1–2 s on first request; keep web machine always-on.", options: { bullet: { code: "25A0" } } },
  ], {
    x: 0.8, y: 6.02, w: 11.9, h: 0.85,
    fontFace: FB, fontSize: 10, color: C.mutedDark, paraSpaceAfter: 2, margin: 0,
  });

  addFooter(s, 3, TOTAL_SLIDES);
}

// ============================================================
// SLIDE 4: BATCH FLOW
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.offwhite };
  addHeader(s, "Batch Processing — 300 labels in ≤ 5 minutes",
    "Sarah's peak-season ask: importers dump 200–300 applications at once. Parallel workers + streamed results.");

  // Pipeline diagram across the top
  const pipeY = 1.7;
  const pipeH = 1.5;
  const stages = [
    { tag: "1 · UPLOAD", title: "Client posts batch", sub: "multipart, ≤ 300 labels", color: C.navy },
    { tag: "2 · ENQUEUE", title: "Batch row + N scan rows", sub: "Postgres + Volume", color: C.coral },
    { tag: "3 · WORKERS", title: "Parallel extraction", sub: "fly.io auto-scale 1–8", color: C.coral },
    { tag: "4 · STREAM", title: "SSE results to UI", sub: "row appears as each finishes", color: C.navy },
  ];
  stages.forEach((st, i) => {
    const x = 0.6 + i * 3.15;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: pipeY, w: 2.95, h: pipeH,
      fill: { color: C.card }, line: { color: C.cardBorder, width: 1 },
      shadow: makeShadow(),
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: pipeY, w: 2.95, h: 0.32,
      fill: { color: st.color }, line: { color: st.color },
    });
    s.addText(st.tag, {
      x: x + 0.15, y: pipeY + 0.05, w: 2.65, h: 0.25,
      fontFace: FB, fontSize: 9, bold: true, color: C.white, charSpacing: 3, margin: 0,
    });
    s.addText(st.title, {
      x: x + 0.15, y: pipeY + 0.45, w: 2.65, h: 0.4,
      fontFace: FH, fontSize: 13, bold: true, color: C.navy, margin: 0,
    });
    s.addText(st.sub, {
      x: x + 0.15, y: pipeY + 0.85, w: 2.65, h: 0.55,
      fontFace: FB, fontSize: 10, color: C.muted, margin: 0,
    });
    if (i < stages.length - 1) {
      s.addShape(pres.shapes.LINE, {
        x: x + 2.95, y: pipeY + pipeH / 2, w: 0.2, h: 0,
        line: { color: C.navy, width: 2, endArrowType: "triangle" },
      });
    }
  });

  // Worker pool visual
  const poolY = 3.6;
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: poolY, w: 7.6, h: 2.0,
    fill: { color: C.coralSoft, transparency: 40 }, line: { color: C.coral, width: 0.5, dashType: "dash" },
  });
  s.addText("WORKER POOL  ·  fly.io machines", {
    x: 0.6, y: poolY + 0.1, w: 7.6, h: 0.3,
    fontFace: FB, fontSize: 10, bold: true, color: C.coral, align: "center", charSpacing: 3, margin: 0,
  });
  // 8 worker boxes
  for (let i = 0; i < 8; i++) {
    const wx = 0.85 + i * 0.9;
    s.addShape(pres.shapes.RECTANGLE, {
      x: wx, y: poolY + 0.5, w: 0.78, h: 1.35,
      fill: { color: C.card }, line: { color: C.coral, width: 0.75 },
      shadow: makeShadow(),
    });
    s.addText(`W${i + 1}`, {
      x: wx, y: poolY + 0.58, w: 0.78, h: 0.3,
      fontFace: FB, fontSize: 11, bold: true, color: C.navy, align: "center", margin: 0,
    });
    s.addText("OCR", {
      x: wx, y: poolY + 0.92, w: 0.78, h: 0.25,
      fontFace: FB, fontSize: 8, color: C.muted, align: "center", margin: 0,
    });
    s.addText("LLM", {
      x: wx, y: poolY + 1.15, w: 0.78, h: 0.25,
      fontFace: FB, fontSize: 8, color: C.amber, align: "center", margin: 0,
    });
    s.addText("DB", {
      x: wx, y: poolY + 1.38, w: 0.78, h: 0.25,
      fontFace: FB, fontSize: 8, color: C.muted, align: "center", margin: 0,
    });
  }

  // Math callout
  s.addShape(pres.shapes.RECTANGLE, {
    x: 8.4, y: poolY, w: 4.3, h: 2.0,
    fill: { color: C.card }, line: { color: C.cardBorder, width: 1 },
    shadow: makeShadow(),
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 8.4, y: poolY, w: 0.08, h: 2.0,
    fill: { color: C.teal }, line: { color: C.teal },
  });
  s.addText("THROUGHPUT MATH", {
    x: 8.6, y: poolY + 0.1, w: 4.0, h: 0.25,
    fontFace: FB, fontSize: 8, bold: true, color: C.teal, charSpacing: 3, margin: 0,
  });
  s.addText("300 labels × 3.2 s", {
    x: 8.6, y: poolY + 0.4, w: 4.0, h: 0.4,
    fontFace: FH, fontSize: 16, bold: true, color: C.navy, margin: 0,
  });
  s.addText("÷ 8 workers", {
    x: 8.6, y: poolY + 0.8, w: 4.0, h: 0.4,
    fontFace: FH, fontSize: 16, color: C.muted, margin: 0,
  });
  s.addShape(pres.shapes.LINE, {
    x: 8.6, y: poolY + 1.25, w: 3.9, h: 0,
    line: { color: C.cardBorder, width: 0.75 },
  });
  s.addText("≈ 2 minutes", {
    x: 8.6, y: poolY + 1.3, w: 4.0, h: 0.5,
    fontFace: FH, fontSize: 24, bold: true, color: C.teal, margin: 0,
  });

  // Constraints row
  const consY = 5.85;
  const cons = [
    { title: "Groq rate limit", body: "Free tier ≈ 30 req/min. Worker concurrency capped by remaining tokens; degrade to ~4 workers if needed." },
    { title: "Auto-scale", body: "fly.io machines scale 1→8 based on queue depth; idle workers stop after 60 s to stay within ~$20/mo." },
    { title: "Failure isolation", body: "Per-label try/catch. One bad image marks that scan failed; the batch keeps going." },
  ];
  cons.forEach((c, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: consY, w: 3.9, h: 1.0,
      fill: { color: C.card }, line: { color: C.cardBorder, width: 1 },
      shadow: makeShadow(),
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: consY, w: 0.08, h: 1.0,
      fill: { color: C.amber }, line: { color: C.amber },
    });
    s.addText(c.title, {
      x: x + 0.2, y: consY + 0.08, w: 3.6, h: 0.3,
      fontFace: FH, fontSize: 11, bold: true, color: C.navy, margin: 0,
    });
    s.addText(c.body, {
      x: x + 0.2, y: consY + 0.4, w: 3.6, h: 0.55,
      fontFace: FB, fontSize: 9, color: C.mutedDark, margin: 0,
    });
  });

  addFooter(s, 4, TOTAL_SLIDES);
}

// ============================================================
// SLIDE 5: FLY.IO DEPLOYMENT TOPOLOGY
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.offwhite };
  addHeader(s, "fly.io Deployment Topology",
    "Single region near Groq · TLS at edge · shared-password gate · ~$15–20/month at idle");

  // Internet / user (left side)
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 1.85, w: 2.0, h: 1.1,
    fill: { color: C.card }, line: { color: C.cardBorder, width: 1 },
    rectRadius: 0.1, shadow: makeShadow(),
  });
  s.addText("USER", {
    x: 0.6, y: 1.92, w: 2.0, h: 0.25,
    fontFace: FB, fontSize: 8, bold: true, color: C.muted, align: "center", charSpacing: 3, margin: 0,
  });
  s.addText("Agent browser", {
    x: 0.6, y: 2.2, w: 2.0, h: 0.32,
    fontFace: FH, fontSize: 12, bold: true, color: C.navy, align: "center", margin: 0,
  });
  s.addText("HTTPS", {
    x: 0.6, y: 2.55, w: 2.0, h: 0.3,
    fontFace: FB, fontSize: 9, italic: true, color: C.muted, align: "center", margin: 0,
  });

  // Arrow to fly.io edge
  arrow(s, 2.65, 2.4, 3.05, 2.4, C.navy);

  // fly.io edge (TLS, password)
  s.addShape(pres.shapes.RECTANGLE, {
    x: 3.1, y: 1.85, w: 1.6, h: 1.1,
    fill: { color: C.navy }, line: { color: C.navy },
    shadow: makeShadow(),
  });
  s.addText("fly.io edge", {
    x: 3.1, y: 2.0, w: 1.6, h: 0.3,
    fontFace: FH, fontSize: 11, bold: true, color: C.white, align: "center", margin: 0,
  });
  s.addText("TLS termination", {
    x: 3.1, y: 2.32, w: 1.6, h: 0.25,
    fontFace: FB, fontSize: 9, color: C.ice, align: "center", margin: 0,
  });
  s.addText("Shared-password gate", {
    x: 3.1, y: 2.55, w: 1.6, h: 0.3,
    fontFace: FB, fontSize: 9, color: C.ice, align: "center", margin: 0,
  });
  arrow(s, 4.75, 2.4, 5.15, 2.4, C.navy);

  // fly.io region box
  const regX = 5.2, regY = 1.6, regW = 6.4, regH = 5.3;
  s.addShape(pres.shapes.RECTANGLE, {
    x: regX, y: regY, w: regW, h: regH,
    fill: { color: C.ice, transparency: 70 }, line: { color: C.navy, width: 1, dashType: "dash" },
  });
  s.addText("fly.io region  ·  iad (US East, near Groq)", {
    x: regX, y: regY + 0.1, w: regW, h: 0.3,
    fontFace: FB, fontSize: 10, bold: true, color: C.navy, align: "center", charSpacing: 3, margin: 0,
  });

  // Web machine
  card(s, {
    x: regX + 0.25, y: regY + 0.55, w: 2.85, h: 1.75,
    tag: "ALWAYS-ON",
    title: "Web / API machine",
    subtitle: "shared-cpu-1x · 256 MB",
    body: [
      "Express / FastAPI",
      "Auth + routing",
      "SSE streaming",
      "Min 1 machine",
    ],
    accent: C.navy,
  });

  // Worker machines stack
  card(s, {
    x: regX + 3.3, y: regY + 0.55, w: 2.85, h: 1.75,
    tag: "AUTO-SCALE 1–8",
    title: "Worker machines",
    subtitle: "shared-cpu-2x · 1 GB",
    body: [
      "PaddleOCR (CPU)",
      "Calls Groq",
      "Stop when idle 60 s",
      "Cost-controlled",
    ],
    accent: C.coral,
  });

  // Postgres
  card(s, {
    x: regX + 0.25, y: regY + 2.45, w: 2.85, h: 1.65,
    tag: "MANAGED",
    title: "fly Postgres",
    subtitle: "single-node · 1 GB",
    body: [
      "scans, extractions",
      "comparisons, batches",
      "users (shared pw)",
    ],
    accent: C.navy,
  });

  // Volume
  card(s, {
    x: regX + 3.3, y: regY + 2.45, w: 2.85, h: 1.65,
    tag: "VOLUME",
    title: "Persistent disk · 50 GB",
    subtitle: "mounted on web + workers",
    body: [
      "Raw label images",
      "Path stored in DB",
      "Backed up via fly snapshot",
    ],
    accent: C.navy,
  });

  // Internal observability
  card(s, {
    x: regX + 0.25, y: regY + 4.25, w: 5.9, h: 0.9,
    tag: "BUILT-IN (PROTOTYPE LEVEL)",
    title: "Logs · metrics · health checks",
    body: [
      "fly logs, fly status, /healthz — no external APM in prototype",
    ],
    accent: C.navy,
  });

  // External Groq card (outside the region) — left column, below USER/edge row
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 3.2, w: 4.3, h: 1.6,
    fill: { color: C.amberSoft }, line: { color: C.amber, width: 1, dashType: "dash" },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 3.2, w: 0.08, h: 1.6,
    fill: { color: C.amber }, line: { color: C.amber },
  });
  s.addText("EXTERNAL · OUTBOUND HTTPS", {
    x: 0.8, y: 3.3, w: 4.0, h: 0.25,
    fontFace: FB, fontSize: 8, bold: true, color: C.amber, charSpacing: 3, margin: 0,
  });
  s.addText("Groq API  ·  Llama 3.1 8B", {
    x: 0.8, y: 3.57, w: 4.0, h: 0.35,
    fontFace: FH, fontSize: 13, bold: true, color: C.navy, margin: 0,
  });
  s.addText("Free tier · ~500 ms inference · 30 req/min", {
    x: 0.8, y: 3.92, w: 4.0, h: 0.3,
    fontFace: FB, fontSize: 10, color: C.mutedDark, margin: 0,
  });
  s.addText("Production: TTB firewall blocks → self-host on Azure Gov", {
    x: 0.8, y: 4.25, w: 4.0, h: 0.45,
    fontFace: FB, fontSize: 9, italic: true, color: C.coral, margin: 0,
  });

  // Cost & topology notes — fills the remaining left-column space
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 5.0, w: 4.3, h: 1.95,
    fill: { color: C.card }, line: { color: C.cardBorder, width: 1 },
    shadow: makeShadow(),
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 5.0, w: 0.08, h: 1.95,
    fill: { color: C.teal }, line: { color: C.teal },
  });
  s.addText("PROTOTYPE NOTES", {
    x: 0.8, y: 5.1, w: 4.0, h: 0.25,
    fontFace: FB, fontSize: 8, bold: true, color: C.teal, charSpacing: 3, margin: 0,
  });
  s.addText("Cost & operational notes", {
    x: 0.8, y: 5.37, w: 4.0, h: 0.32,
    fontFace: FH, fontSize: 13, bold: true, color: C.navy, margin: 0,
  });
  s.addText([
    { text: "≈ $15–20 / month at idle", options: { bullet: { code: "25A0" }, breakLine: true } },
    { text: "Single region — no cross-region hops", options: { bullet: { code: "25A0" }, breakLine: true } },
    { text: "Daily fly snapshot of Postgres + volume", options: { bullet: { code: "25A0" }, breakLine: true } },
    { text: "Egress to Groq: ~30 MB/month at expected load", options: { bullet: { code: "25A0" } } },
  ], {
    x: 0.8, y: 5.75, w: 4.0, h: 1.15,
    fontFace: FB, fontSize: 9, color: C.mutedDark, paraSpaceAfter: 2, margin: 0,
  });

  addFooter(s, 5, TOTAL_SLIDES);
}

// ============================================================
// SLIDE 6: DATA MODEL
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.offwhite };
  addHeader(s, "Data Model",
    "Four tables in fly Postgres. Images live on the fly volume and are referenced by path.");

  function tableBox(x, y, w, h, name, columns, accent) {
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h,
      fill: { color: C.card }, line: { color: C.cardBorder, width: 1 },
      shadow: makeShadow(),
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h: 0.38,
      fill: { color: accent }, line: { color: accent },
    });
    s.addText(name, {
      x: x + 0.15, y: y + 0.06, w: w - 0.3, h: 0.26,
      fontFace: FH, fontSize: 12, bold: true, color: C.white, margin: 0,
    });
    let cy = y + 0.44;
    columns.forEach((col, i) => {
      const rowH = 0.28;
      if (i % 2 === 1) {
        s.addShape(pres.shapes.RECTANGLE, {
          x: x + 0.05, y: cy, w: w - 0.1, h: rowH,
          fill: { color: C.offwhite }, line: { color: C.offwhite, width: 0 },
        });
      }
      const isPK = col.k === "PK", isFK = col.k === "FK";
      const tag = isPK ? "PK" : isFK ? "FK" : "";
      s.addText(tag, {
        x: x + 0.15, y: cy + 0.04, w: 0.35, h: 0.25,
        fontFace: FB, fontSize: 8, bold: true,
        color: isPK ? C.coral : (isFK ? C.amber : C.muted),
        margin: 0,
      });
      s.addText(col.n, {
        x: x + 0.55, y: cy + 0.04, w: w - 1.7, h: 0.25,
        fontFace: FB, fontSize: 10, bold: isPK || isFK, color: C.navy, margin: 0,
      });
      s.addText(col.t, {
        x: x + w - 1.2, y: cy + 0.04, w: 1.0, h: 0.25,
        fontFace: FB, fontSize: 9, italic: true, color: C.muted, align: "right", margin: 0,
      });
      cy += rowH;
    });
  }

  // Four tables in a 2x2 grid
  const colW = 3.85;
  const rowH = 2.45;
  const gx = 0.6, gy = 1.55;

  tableBox(gx, gy, colW, rowH, "scans", [
    { k: "PK", n: "id", t: "uuid" },
    { k: "FK", n: "batch_id", t: "uuid?" },
    { k: "",   n: "application_id", t: "text?" },
    { k: "",   n: "beverage_type", t: "enum" },
    { k: "",   n: "image_path", t: "text" },
    { k: "",   n: "status", t: "enum" },
    { k: "",   n: "created_at", t: "timestamptz" },
  ], C.navy);

  tableBox(gx + colW + 0.4, gy, colW, rowH, "extractions", [
    { k: "PK", n: "id", t: "uuid" },
    { k: "FK", n: "scan_id", t: "uuid" },
    { k: "",   n: "fields_json", t: "jsonb" },
    { k: "",   n: "ocr_raw_text", t: "text" },
    { k: "",   n: "warning_present", t: "bool" },
    { k: "",   n: "warning_exact", t: "bool" },
    { k: "",   n: "model_used", t: "text" },
  ], C.coral);

  tableBox(gx, gy + rowH + 0.3, colW, rowH, "comparisons", [
    { k: "PK", n: "id", t: "uuid" },
    { k: "FK", n: "scan_id", t: "uuid" },
    { k: "",   n: "reference_json", t: "jsonb" },
    { k: "",   n: "field_results", t: "jsonb" },
    { k: "",   n: "overall_status", t: "enum" },
    { k: "",   n: "confidence", t: "float" },
    { k: "",   n: "created_at", t: "timestamptz" },
  ], C.teal);

  tableBox(gx + colW + 0.4, gy + rowH + 0.3, colW, rowH, "batches", [
    { k: "PK", n: "id", t: "uuid" },
    { k: "",   n: "submitted_by", t: "text" },
    { k: "",   n: "label_count", t: "int" },
    { k: "",   n: "status", t: "enum" },
    { k: "",   n: "started_at", t: "timestamptz" },
    { k: "",   n: "completed_at", t: "timestamptz?" },
    { k: "",   n: "error_count", t: "int" },
  ], C.amber);

  // Side panel: storage strategy
  const panelH = 2 * rowH + 0.3;  // matches the 2x2 grid height
  s.addShape(pres.shapes.RECTANGLE, {
    x: 9.0, y: gy, w: 3.85, h: panelH,
    fill: { color: C.card }, line: { color: C.cardBorder, width: 1 },
    shadow: makeShadow(),
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 9.0, y: gy, w: 0.08, h: panelH,
    fill: { color: C.navy }, line: { color: C.navy },
  });
  s.addText("STORAGE STRATEGY", {
    x: 9.2, y: gy + 0.1, w: 3.6, h: 0.25,
    fontFace: FB, fontSize: 8, bold: true, color: C.navy, charSpacing: 3, margin: 0,
  });
  s.addText("Postgres", {
    x: 9.2, y: gy + 0.4, w: 3.6, h: 0.32,
    fontFace: FH, fontSize: 13, bold: true, color: C.navy, margin: 0,
  });
  s.addText([
    { text: "Structured data only", options: { bullet: { code: "25A0" }, breakLine: true } },
    { text: "JSONB for flexible extracted fields", options: { bullet: { code: "25A0" }, breakLine: true } },
    { text: "Daily fly snapshot in prototype", options: { bullet: { code: "25A0" } } },
  ], {
    x: 9.2, y: gy + 0.75, w: 3.6, h: 1.3,
    fontFace: FB, fontSize: 9, color: C.mutedDark, paraSpaceAfter: 3, margin: 0,
  });

  s.addText("fly Volume", {
    x: 9.2, y: gy + 2.1, w: 3.6, h: 0.32,
    fontFace: FH, fontSize: 13, bold: true, color: C.navy, margin: 0,
  });
  s.addText([
    { text: "Raw label images (JPG / PNG)", options: { bullet: { code: "25A0" }, breakLine: true } },
    { text: "Path stored in scans.image_path", options: { bullet: { code: "25A0" }, breakLine: true } },
    { text: "50 GB ≈ 50 k images at 1 MB avg", options: { bullet: { code: "25A0" } } },
  ], {
    x: 9.2, y: gy + 2.45, w: 3.6, h: 1.3,
    fontFace: FB, fontSize: 9, color: C.mutedDark, paraSpaceAfter: 3, margin: 0,
  });

  s.addText("Production swap → S3 / Azure Blob with KMS encryption + retention.", {
    x: 9.2, y: gy + 4.0, w: 3.6, h: 0.95,
    fontFace: FB, fontSize: 9, italic: true, color: C.coral, margin: 0,
  });

  addFooter(s, 6, TOTAL_SLIDES);
}

// ============================================================
// SLIDE 7: PROTOTYPE vs PRODUCTION
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.offwhite };
  addHeader(s, "Prototype Today vs. Production Tomorrow",
    "Everything on the right is acknowledged but explicitly deferred — tracked in REQUIREMENTS.md §8.");

  // Two columns
  const protoX = 0.6, prodX = 6.95;
  const colW = 6.05, colY = 1.55, colH = 5.5;

  // LEFT: Prototype
  s.addShape(pres.shapes.RECTANGLE, {
    x: protoX, y: colY, w: colW, h: colH,
    fill: { color: C.card }, line: { color: C.cardBorder, width: 1 },
    shadow: makeShadow(),
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: protoX, y: colY, w: colW, h: 0.5,
    fill: { color: C.teal }, line: { color: C.teal },
  });
  s.addText("PROTOTYPE — WHAT WE'RE BUILDING", {
    x: protoX + 0.2, y: colY + 0.1, w: colW - 0.4, h: 0.3,
    fontFace: FB, fontSize: 10, bold: true, color: C.white, charSpacing: 3, margin: 0,
  });

  const protoItems = [
    { cat: "Hosting",    val: "fly.io single region (iad)" },
    { cat: "OCR",        val: "PaddleOCR in container" },
    { cat: "LLM",        val: "Groq Llama 3.1 8B (free tier)" },
    { cat: "Storage",    val: "fly Postgres + 50 GB volume" },
    { cat: "Auth",       val: "Shared password" },
    { cat: "Audit",      val: "Application logs only" },
    { cat: "Encryption", val: "fly defaults (TLS + at-rest)" },
    { cat: "HA / DR",    val: "Single machine, daily snapshots" },
    { cat: "Observability", val: "fly logs + /healthz" },
    { cat: "Cost",       val: "≈ $15–20 / month" },
  ];
  protoItems.forEach((it, i) => {
    const ry = colY + 0.7 + i * 0.45;
    if (i % 2 === 0) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: protoX + 0.15, y: ry, w: colW - 0.3, h: 0.42,
        fill: { color: C.offwhite }, line: { color: C.offwhite, width: 0 },
      });
    }
    s.addText(it.cat, {
      x: protoX + 0.3, y: ry + 0.08, w: 1.6, h: 0.3,
      fontFace: FB, fontSize: 10, bold: true, color: C.muted, charSpacing: 1, margin: 0,
    });
    s.addText(it.val, {
      x: protoX + 1.95, y: ry + 0.08, w: colW - 2.1, h: 0.3,
      fontFace: FB, fontSize: 11, color: C.navy, margin: 0,
    });
  });

  // RIGHT: Production
  s.addShape(pres.shapes.RECTANGLE, {
    x: prodX, y: colY, w: colW, h: colH,
    fill: { color: C.card }, line: { color: C.cardBorder, width: 1 },
    shadow: makeShadow(),
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: prodX, y: colY, w: colW, h: 0.5,
    fill: { color: C.coral }, line: { color: C.coral },
  });
  s.addText("PRODUCTION — DEFERRED BACKLOG", {
    x: prodX + 0.2, y: colY + 0.1, w: colW - 0.4, h: 0.3,
    fontFace: FB, fontSize: 10, bold: true, color: C.white, charSpacing: 3, margin: 0,
  });

  const prodItems = [
    { cat: "Hosting",       val: "Azure Gov · FedRAMP region" },
    { cat: "OCR",           val: "Same, hardened pipeline + preprocess" },
    { cat: "LLM",           val: "Self-hosted Llama (firewall) on GPU" },
    { cat: "Storage",       val: "Azure Blob / S3 + KMS + retention" },
    { cat: "Auth",          val: "SSO · PIV-card · RBAC" },
    { cat: "Audit",         val: "Immutable audit log per NARA schedule" },
    { cat: "Encryption",    val: "FIPS 140-2 validated at-rest + in-transit" },
    { cat: "HA / DR",       val: "Multi-AZ Postgres · regional failover" },
    { cat: "Observability", val: "APM, metrics, alerting, on-call rota" },
    { cat: "Cost",          val: "Procurement-driven, TBD" },
  ];
  prodItems.forEach((it, i) => {
    const ry = colY + 0.7 + i * 0.45;
    if (i % 2 === 0) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: prodX + 0.15, y: ry, w: colW - 0.3, h: 0.42,
        fill: { color: C.coralSoft }, line: { color: C.coralSoft, width: 0 },
      });
    }
    s.addText(it.cat, {
      x: prodX + 0.3, y: ry + 0.08, w: 1.6, h: 0.3,
      fontFace: FB, fontSize: 10, bold: true, color: C.muted, charSpacing: 1, margin: 0,
    });
    s.addText(it.val, {
      x: prodX + 1.95, y: ry + 0.08, w: colW - 2.1, h: 0.3,
      fontFace: FB, fontSize: 11, color: C.navy, margin: 0,
    });
  });

  addFooter(s, 7, TOTAL_SLIDES);
}

// ============================================================
// WRITE
// ============================================================
pres.writeFile({ fileName: "/Users/anandbasu/Documents/label-recognition-app/ARCHITECTURE.pptx" })
  .then((f) => console.log("Wrote:", f))
  .catch((e) => { console.error(e); process.exit(1); });
