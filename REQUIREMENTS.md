# TTB Label Recognition Prototype — Requirements

**Status:** Draft v1 — pending stakeholder review
**Owner:** Anand Basu
**Date:** 2026-06-09

---

## 1. Purpose

A prototype web tool that helps TTB compliance agents verify that the artwork on an alcohol beverage label matches the data submitted in the corresponding label application. The tool replaces manual visual checks of routine fields (brand name, ABV, net contents, government warning) with AI-assisted extraction and comparison, while preserving agent judgment for borderline cases.

The prototype is a **standalone proof-of-concept**. It does not integrate with the COLA system. Its goal is to demonstrate viability and inform a future procurement decision.

---

## 2. Stakeholders & Users

| Role | Name | Concern |
|---|---|---|
| Sponsor | Sarah Chen, Deputy Director, Label Compliance | Throughput, agent adoption, 5-second response time |
| IT contact | Marcus Williams, Systems Admin | Future Azure / FedRAMP path, firewall constraints |
| Senior agent | Dave Morrison (28 yr tenure) | Nuance, judgment, "don't make my life harder" |
| Junior agent | Jenny Park (8 mo tenure) | Exact warning-text checks, bad-photo handling |
| **End users** | ~47 compliance agents, wide tech-comfort range | Simple UI, no hunting for buttons |

Reviewer cohort: half the team is 50+. UX bar is "Sarah's 73-year-old mother could use it."

---

## 3. Functional Requirements — Prototype Scope

### 3.1 Label image ingestion
- **FR-1.1** Web UI accepts label image uploads (JPG, PNG; up to ~10 MB each).
- **FR-1.2** Documented HTTP API accepts the same uploads programmatically.
- **FR-1.3** Batch upload: an agent can submit up to 300 labels in one operation. Results stream back as each label completes.
- **FR-1.4** Each scan can be tagged with an optional **Application ID** (free-text) entered by the agent.

### 3.2 Field extraction (OCR + LLM pipeline)

Two-stage pipeline (free / open-source):
1. **OCR** — PaddleOCR (Apache 2.0) runs inside the fly.io container and produces raw text + bounding boxes from the label image.
2. **LLM** — Groq-hosted **Llama 3.1 8B** (free tier) takes the OCR output and returns structured JSON for the fields below.

Extract the following fields per TTB requirements:

| Field | Required for | Notes |
|---|---|---|
| Brand name | All | |
| Class/type designation | All | e.g. "Kentucky Straight Bourbon Whiskey" |
| Alcohol content | All (with TTB exceptions) | Capture % ABV **and** proof if present |
| Net contents | All | |
| Bottler / producer name & address | All | |
| Country of origin | Imports | |
| **Government Health Warning Statement** | All | Full text + structural flags (see 3.3) |

Output schema is JSON, one object per label.

### 3.3 Government warning compliance check (deterministic, post-extraction)
This is the highest-value automated check per Jenny's interview.

- **FR-3.1** Exact-text match against the canonical TTB warning string (27 CFR §16.21). Whitespace-normalized, but otherwise exact.
- **FR-3.2** Structural flags returned per scan:
  - `government_warning_prefix_all_caps` — boolean — is `GOVERNMENT WARNING:` in all caps?
  - `government_warning_present` — boolean
  - `government_warning_text_exact_match` — boolean
  - `government_warning_diff` — string — diff against canonical, when not exact

### 3.4 Application-vs-label comparison (when reference data provided)
- **FR-4.1** Agent provides reference data (the application form values) as a JSON payload via API, or via form fields in the UI.
- **FR-4.2** Each field is compared and returned with one of: `match` / `fuzzy_match` / `mismatch` / `missing` plus a confidence score.
- **FR-4.3** Comparison normalizes case, whitespace, punctuation, and common typographic variants. Per Dave's example, `STONE'S THROW` vs `Stone's Throw` should return `fuzzy_match`, not `mismatch`.
- **FR-4.4** Mismatches surface at the top of the result view, with the raw extracted value and the reference value side by side.

### 3.5 Persistence
- **FR-5.1** Every uploaded image is stored.
- **FR-5.2** Every extraction result (JSON) is stored, linked to the image.
- **FR-5.3** Every comparison report (when reference data was provided) is stored.
- **FR-5.4** Scan history view: list of past scans, filterable by date and optional Application ID, with click-through to the original image + extracted data + comparison report.

### 3.6 UI principles
- Single-screen primary workflow: **upload → see results → flag/approve**.
- Large hit targets. No nested menus. Plain English status labels ("Match", "Needs review", "Missing").
- Status communicated by **color + icon + text** — never color alone.
- Batch view: scrollable list, sortable by status, one-click to inspect any row.

---

## 4. Non-Functional Requirements

| ID | Requirement | Target | Source |
|---|---|---|---|
| NFR-1 | End-to-end latency per single label (upload → result rendered) | **≤ 5 s p95** — hard constraint | Sarah (prior vendor failed at 30–40 s) |
| NFR-2 | Batch throughput | 300 labels in ≤ 5 min via parallel processing | Sarah (peak-season importers) |
| NFR-3 | Concurrent users (prototype) | 5–10 | Prototype scale |
| NFR-4 | Availability (prototype) | Best-effort, business hours US Eastern | Prototype scope |
| NFR-5 | Accessibility | Readable at arm's length; color-blind safe; no fine-motor interactions; keyboard-navigable | "My mother could use it" |
| NFR-6 | Browser support | Latest Chrome, Edge, Firefox on desktop | Standard federal-desktop assumption |
| NFR-7 | Cost ceiling (prototype) | Pre-agreed monthly LLM + infra budget (TBD) | Prototype scope |

---

## 5. Out of Scope — Prototype

- Integration with the COLA system (multi-year federal authorization path).
- Authentication, SSO, per-agent identity, RBAC.
- FedRAMP / Azure Gov deployment.
- PII handling, retention policies, full audit logging.
- Native mobile app.
- OCR fallback / non-LLM extraction pipeline.
- Image preprocessing for bad photos (deskew, glare removal, low-light) — Jenny's ask, deferred.
- Parsing real COLA application PDFs (reference data is structured input in prototype).
- Multi-language warning statements.

---

## 6. Assumptions (please confirm or correct)

1. **Prototype deployment is fly.io**, *not* the TTB Azure environment. Production migration to Azure Gov / FedRAMP is a separate effort and is acknowledged as future work.
2. **Extraction is OCR + LLM, all free or open-source.** PaddleOCR runs inside the fly.io container (Apache 2.0). Groq's free tier hosts Llama 3.1 8B for the structured-extraction step. Marcus's firewall constraint applies to the TTB production environment, not the fly.io prototype, which has unrestricted egress. Production may need to swap Groq for a self-hosted model.
3. **No real PII, no real submitted images, no real applicant data** is used in the prototype. Test corpus is synthetic and/or publicly available labels.
4. **Reference data ("what the application says")** is supplied as structured JSON via the API, or typed into form fields in the UI. The prototype does **not** parse COLA application PDFs.
5. **The canonical Government Warning text** is hardcoded as a single string from 27 CFR §16.21. Variants and translations are out of scope.
6. **Beverage type (wine / spirits / beer)** is selected by the agent at upload time. The LLM may also infer it, but agent selection wins on conflict.
7. **One scan = one label image.** Front and back panels of the same product are submitted as two scans linked by the agent's Application ID tag.
8. **Image storage uses fly.io persistent volumes** for the prototype (≤ 50 GB). An S3-compatible object store is a drop-in upgrade if we exceed that.
9. **Authentication for the prototype is a single shared password** (or no auth, behind a fly.io-issued URL not publicly advertised). Per-agent identity is a production concern.
10. **The tool is advisory, not authoritative.** Agents always make the final call. The UI never auto-approves or auto-rejects an application.
11. **Application ID** is free-text entered by the agent. The prototype does not validate it against any external system.
12. **Fuzzy-match thresholds** are set to sensible defaults and surfaced in config; tuning UI is a production feature.

---

## 7. Stakeholder Decisions (resolved 2026-06-09)

| # | Decision | Notes |
|---|---|---|
| D1 | **Prototype runs on fly.io.** | Production Azure / FedRAMP migration is acknowledged future work, not in scope. |
| D2 | **OCR + LLM pipeline, free / open-source stack: PaddleOCR + Groq Llama 3.1 8B.** | Vision-LLM swap-in is a deferred option if bad-photo handling becomes critical. |
| D3 | **API supports both modes.** Image-only requests return extracted fields + warning-compliance check. Image + reference data also returns a field-by-field comparison report. | |
| D4 | **Batch target: 300 labels in ≤ 5 min.** | Drives parallel-worker sizing in the architecture. |
| D5 | **Shared-password auth for the prototype.** | Per-agent identity is deferred to production. |
| D6 | **Infra cost ceiling: ~$20/month.** | Free Groq tier + smallest fly.io machine class. |

---

## 8. Production-Readiness Backlog (tracked, not built)

These items are explicitly deferred. They are listed here so they are not forgotten when the prototype graduates.

### Security & compliance
- Deployment to Azure Gov region with FedRAMP-compliant services
- SSO / PIV-card auth, per-agent identity, RBAC
- Audit log: who reviewed what, when, what decision
- Encryption at rest and in transit using FIPS 140-2 validated modules
- Document retention policy enforcement (per NARA schedule)
- Privacy review and PIA if any PII enters the system
- Self-hosted vision model option, since the TTB firewall blocks many external ML endpoints

### Scale & reliability
- Object storage (S3-compatible) for images, not local volumes
- Database HA + backups
- Multi-region failover or active-passive DR
- Rate limiting, abuse protection, per-tenant quotas
- Queue-backed batch processing with retry and dead-letter handling
- Observability: structured logs, metrics, traces, alerting

### Functionality
- Image preprocessing pipeline (deskew, glare, low-light) — Jenny's ask. **More important under OCR+LLM than it would be under a vision LLM**, because OCR is less tolerant of bad photos.
- **Vision-LLM swap-in option** (e.g. Claude, GPT-4V) if bad-photo handling becomes a blocker; would replace the OCR+LLM pipeline with a single multimodal call. Trade-off: better robustness, higher cost, external API dependency conflicts with TTB firewall.
- COLA system integration (read application, write decision)
- Confidence-threshold tuning UI for compliance leads
- Per-agent dashboards & throughput metrics
- A/B model evaluation harness
- Active-learning loop: agent overrides become training data

---

## 9. Success Criteria for the Prototype

- A compliance agent can upload a label image and see extracted fields + compliance flags in **≤ 5 seconds**.
- A compliance agent can upload **300 labels in a batch** and have all results back within 5 minutes.
- The tool **correctly identifies** missing or non-conforming Government Warning statements on a curated test set (target accuracy TBD with Sarah's team).
- Dave can use it without training. Jenny finds it faster than her printed checklist.
- A short demo with Sarah's team produces qualitative thumbs-up on the UX.
