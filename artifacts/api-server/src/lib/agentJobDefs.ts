// ── Job Definitions for the Autonomous AI Agent System ────────────────────────
// Each department has job types. Each job has skill phases with realistic output
// templates that make agents appear to be genuinely doing domain-expert work.

export type SkillPhase = "scan" | "reason" | "make" | "test" | "iterate" | "debug" | "deep_search";

export interface JobDef {
  type: string;
  title: string;
  department: string;
  floor: number;
  phases: SkillPhase[];
  phaseOutputs: Partial<Record<SkillPhase, string[]>>;
  collaborationTopic?: string;
  notifyFloor?: number;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Engineering — Floor 1 ─────────────────────────────────────────────────────
const ENGINEERING_JOBS: JobDef[] = [
  {
    type: "api_build",
    title: "Build REST Endpoint",
    department: "Engineering",
    floor: 1,
    phases: ["scan", "reason", "make", "test", "iterate"],
    phaseOutputs: {
      scan: [
        "Scanning API surface: 53 routes across 9 routers. Rate-limit missing on /infer and /stream routes. Zod coverage: 91%.",
        "Reviewing existing endpoints — found 3 undocumented params on /agents/:id. OpenAPI spec drift: 14 fields.",
        "Codebase analysis: 47 API handlers, avg cyclomatic complexity 3.2. High-complexity outliers: /train/batch (11), /eval/run (9).",
      ],
      reason: [
        "Decision: cursor-based pagination over offset — O(1) DB lookup vs O(N). Expected 38% p99 latency reduction.",
        "Chose SSE over WebSocket for streaming inference — simpler retry semantics, HTTP/2 multiplexing benefit.",
        "Selected schema-first design: Zod validators auto-generate OpenAPI spec, reducing drift to zero.",
      ],
      make: [
        "Built POST /api/v2/agents/infer with SSE streaming. TypeScript strict: 0 errors. 142 LOC. Zod request schema validated.",
        "Implemented batch endpoint with request coalescing queue. Supports up to 64 concurrent inferences, auto-drains every 50ms.",
        "Generated 6 new API routes with full CRUD. OpenAPI spec auto-populated from Zod schemas. All handlers type-safe.",
      ],
      test: [
        "Test suite: 41 unit tests, 12 integration tests. Coverage: 96.1%. Edge cases: empty payload, token expiry, malformed JSON.",
        "Load test at 500 RPS: p50=8ms, p99=23ms, error rate=0.001%. Peak memory: 142MB. PASS.",
        "Contract tests against OpenAPI spec: 0 violations. Mutation score: 87%. Regression suite: all 203 tests green.",
      ],
      iterate: [
        "Iteration 2: Added request coalescing. Throughput 3.2x. Response compression (gzip) cuts bandwidth 68%.",
        "Refactored error handling to RFC 7807 Problem Details. Ambiguous 500s reduced 81%. Client debugging time ↓40%.",
        "Applied connection pooling: concurrent DB queries up from 10→100. Tail latency improved 55% under load.",
      ],
    },
    collaborationTopic: "New inference endpoint ready — schema locked, rate limits applied.",
    notifyFloor: 4,
  },
  {
    type: "schema_design",
    title: "Database Schema Optimization",
    department: "Engineering",
    floor: 1,
    phases: ["scan", "reason", "make", "test", "iterate"],
    phaseOutputs: {
      scan: [
        "Schema analysis: 14 tables, 3 missing indexes on FK columns. Largest table: agent_events (2.1M rows). Hotspot: status column (full-scan every tick).",
        "Query profiling: 7 slow queries >100ms. Root cause: sequential scan on agents.status without index. EXPLAIN ANALYZE running.",
        "Discovered 4 N+1 query patterns in agent roster endpoint. Each request triggers 6 child queries. Fix: JOIN with SELECT.",
      ],
      reason: [
        "Added partial index on agents(status) WHERE status != 'idle' — covers 92% of hot-path queries. Index size: 4KB.",
        "Normalized message_content out of agentMessagesTable into separate LOB table. Main table row width ↓68%.",
        "Chose JSONB over TEXT for memoryContext — enables GIN index for key-path queries. Storage overhead: +12%.",
      ],
      make: [
        "Generated migration: 4 new indexes, 2 materialized views, 1 partition on activity_events by month. DDL validated on schema copy.",
        "Refactored 3 N+1 patterns to single JOIN queries. Query count per request: 6→1. Estimated response time ↓62%.",
        "Added BRIN index on timestamp columns — 94% smaller than B-tree, 200ms → 12ms for time-range scans.",
      ],
      test: [
        "Ran pgbench at 100 concurrent connections: TPS improved from 1,240→3,880. p99 query time: 340ms→28ms. PASS.",
        "Verified index hit ratio: 99.3% on modified queries. VACUUM ANALYZE completed without table lock. Zero downtime.",
        "Stress test with 10M rows: all queries <50ms. Bloom filter false-positive rate: 0.02%. Schema change: APPROVED.",
      ],
      iterate: [
        "Tuned work_mem=64MB for sort-heavy queries. Additional 22% improvement on ORDER BY clauses in analytics path.",
        "Added connection pooling via pgBouncer config: max_client_conn=500, pool_size=20. Connection overhead ↓91%.",
        "Enabled parallel query plans (max_parallel_workers_per_gather=4). Complex aggregation: 8.3s→2.1s.",
      ],
    },
    collaborationTopic: "Schema optimized — indexes deployed, N+1 fixed. Query perf baseline updated.",
  },
  {
    type: "security_audit",
    title: "Security Vulnerability Scan",
    department: "Engineering",
    floor: 1,
    phases: ["scan", "deep_search", "reason", "make", "test"],
    phaseOutputs: {
      scan: [
        "SAST scan: 247 files, 3 HIGH findings (SQL injection pattern, missing CSRF header, insecure deserialization), 8 MEDIUM. Runtime: 4.2s.",
        "Dependency audit: 156 packages. 2 critical CVEs (CVE-2024-4321, CVE-2024-8892). 7 packages >2yr behind latest. SBOM generated.",
        "Auth flow analysis: JWT expiry not enforced in 2 routes. Refresh token rotation missing. Bearer token in URL params on 1 endpoint.",
      ],
      deep_search: [
        "CVE-2024-4321 analysis: RCE via prototype pollution in lodash <4.17.21. CVSS 9.8 (CRITICAL). Patch: upgrade + Object.freeze on inputs.",
        "OWASP Top 10 2024 applicability: A01 (Broken Access Control) affects 2 admin routes. A03 (Injection) — 1 raw SQL pattern found.",
        "Threat model updated: 4 new attack surfaces from recent API expansion. Auth bypass potential in /api/npc/:id — no session validation.",
      ],
      reason: [
        "Risk-ranked: P0=JWT bypass, P1=prototype pollution, P2=CSRF on mutation endpoints. P0 patch window: 24h.",
        "Defence-in-depth: add request signing on internal agent comms + IP allowlist for /admin/* routes.",
        "Rate limiting strategy: token bucket at 100 req/min per IP, 500 req/min per authenticated user. Redis-backed counter.",
      ],
      make: [
        "Patched P0: enforced JWT expiry middleware on all routes. Added audience validation. Refresh token rotation implemented. LOC: 87.",
        "Upgraded 2 critical CVE packages. Added npm audit check to CI — build fails on HIGH severity. SBOM auto-updated.",
        "Implemented CSRF protection via double-submit cookie pattern. Added Content-Security-Policy headers. Helmet.js configured.",
      ],
      test: [
        "Penetration test: 0 exploitable SQL injections, 0 XSS, CSRF tokens validated on all state-change endpoints.",
        "Auth bypass attempts: 12 test vectors, 0 successful. JWT tampering detected and rejected in all cases. Rate limiter verified.",
        "Re-ran SAST: 0 HIGH, 2 MEDIUM (accepted risks, documented). Compliance score: 94/100. Ready for security sign-off.",
      ],
    },
    collaborationTopic: "Security audit complete — 2 CVEs patched, auth hardened. Compliance report filed.",
  },
  {
    type: "debug_session",
    title: "Production Bug Investigation",
    department: "Engineering",
    floor: 1,
    phases: ["scan", "reason", "debug", "test", "iterate"],
    phaseOutputs: {
      scan: [
        "Log analysis: 47 OOM errors in last 6h, all from /agents/batch. Heap snapshots show retained ClosureScope from event listeners.",
        "APM trace: 99th percentile latency spike from 23ms→1.4s starting 02:15 UTC. Correlated with deploy #847. Memory leak suspected.",
        "Error pattern: TypeError: Cannot read properties of undefined (reading 'phase') — agentEngine.ts:247. Frequency: 12/hr.",
      ],
      reason: [
        "Root cause: EventEmitter listener added in request handler but never removed. After 1000 requests, max listener warning, then leak.",
        "Hypothesis confirmed via heap diff: retained listener count = request count. Fix: cleanup in request finalizer / AbortController.",
        "Race condition in job phase advancement — two ticks can overlap if DB query is slow. Fix: advisory lock or optimistic concurrency.",
      ],
      debug: [
        "Applied fix: added cleanup in res.on('finish') handler. Heap growth flat. Verified via clinic.js flamegraph. Memory leak eliminated.",
        "Wrapped phase advancement in advisory lock: SELECT pg_advisory_xact_lock(agent_id). Prevents concurrent phase updates. Race eliminated.",
        "Added structured error logging with full stack + request context. Sentry breadcrumbs configured. MTTR estimated ↓65%.",
      ],
      test: [
        "Soak test 24h: memory stable at 148MB ±12MB. Zero OOM events. Listener count plateaus at 12 (expected). PASS.",
        "Concurrent load test: 200 simultaneous /batch requests for 1hr. Zero race conditions, all jobs completed correctly.",
        "Regression suite green. Incident post-mortem written. Runbook updated with detection steps and rollback procedure.",
      ],
      iterate: [
        "Added heap monitoring alert at 80% threshold. Auto-restart if two consecutive alerts. Pagerduty integration configured.",
        "Refactored event handling to use AbortController pattern across all request handlers. Future leak risk eliminated.",
      ],
    },
    collaborationTopic: "Production bug resolved — OOM from listener leak patched. Runbook updated.",
  },
  {
    type: "model_deployment",
    title: "Deploy Updated AI Model",
    department: "Engineering",
    floor: 1,
    phases: ["scan", "reason", "make", "test", "iterate"],
    phaseOutputs: {
      scan: [
        "Reviewing model artifact from Training floor. Checkpoint: dlv-next. Size: 2.4GB. Format: SafeTensors. Integrity: SHA256 verified.",
        "Assessing serving infra: 3 nodes, current utilization 34%. New model: +180MB RAM, -12ms inference latency. No scale-up needed.",
        "Canary analysis plan: 5% traffic → 20% → 50% → 100% over 4h. Rollback trigger: p99 >200ms OR error rate >0.5%.",
      ],
      reason: [
        "Blue-green deployment chosen over rolling — zero inference interruption during cutover. DNS switchover: <100ms.",
        "Quantized INT8 serving config selected: 4x throughput vs FP32, 0.3% accuracy delta (within tolerance). ONNX runtime.",
        "Shadow mode test before canary: route 10% duplicate traffic to new model, compare outputs. Agreement rate target: >98%.",
      ],
      make: [
        "Deployed dlv-next to staging. Kubernetes HPA: min=2 pods, max=12, CPU threshold=70%. Health probe: /infer/ping.",
        "Built model serving pipeline: request queue → batch aggregator (wait 50ms) → GPU dispatch. Throughput: 840 req/s per node.",
        "Canary config live: 5% traffic routed to new model. Shadow comparison running. Sidecar logging all inference pairs.",
      ],
      test: [
        "Canary results after 1h: p50=6ms, p99=19ms (new) vs p50=7ms, p99=31ms (old). Error rate: 0.001%. Shadow agreement: 99.2%. PROMOTING.",
        "100% traffic on new model. 15-minute burn-in: all SLOs green. Rollback window: 2h (old model kept warm). Status: PRODUCTION.",
        "A/B eval: new model +2.3% F1, +1.8% ROUGE-L. -0.4% on edge-case distribution (flagged for next training).",
      ],
      iterate: [
        "Post-deploy: enabled request-level caching for identical prompts. Cache hit rate settled at 22%. Effective throughput +28%.",
        "Tuned batch aggregation window: 50ms→30ms. Reduced tail latency 18% with minimal throughput impact.",
      ],
    },
    collaborationTopic: "New model live in production. SLOs green. Notifying Exec for release approval.",
    notifyFloor: 5,
  },
];

// ── Design — Floor 2 ──────────────────────────────────────────────────────────
const DESIGN_JOBS: JobDef[] = [
  {
    type: "ui_component",
    title: "Design & Build UI Component",
    department: "Design",
    floor: 2,
    phases: ["scan", "reason", "make", "test", "iterate"],
    phaseOutputs: {
      scan: [
        "Audit: 47 components across 3 design systems. Inconsistent spacing (12 variants for 'md'). Button has 9 prop booleans — needs decomposition.",
        "User feedback: 73 sessions, avg task completion 68%. Drop-off at form step 3 (field density). Heatmap: CTA ignored in 44% of sessions.",
        "Competitive analysis: 5 leading AI dashboard UIs. Agent status indicators: color + icon dual-coding recommended for accessibility.",
      ],
      reason: [
        "Decision: compound component pattern over boolean props. AgentCard → AgentCard.Status + AgentCard.Actions. API surface -67%.",
        "Chose Radix UI primitives for accessibility base — ARIA roles, keyboard nav, focus management. Custom styling via CSS variables.",
        "Typography scale: Major Third (1.250). Base: 16px. Scale: 12/14/16/20/25/31/39px. Line heights: tight 1.2, body 1.5, loose 1.75.",
      ],
      make: [
        "Built AgentStatusBadge: 5 states (idle/working/chatting/moving/error), color+icon+animation. WCAG AA contrast verified.",
        "Implemented AgentCard compound with sub-components. 12 Storybook stories, all states documented. Dark/light: CSS custom properties.",
        "Design token migration: 47 hardcoded values → 12 semantic tokens. Theme switching: 0 code changes. Output: CSS + JS + Android XML.",
      ],
      test: [
        "Accessibility audit: 0 WCAG AA violations, 2 WCAG AAA improvements flagged (optional). Screen reader test: NVDA + JAWS — all correct.",
        "Cross-browser: Chrome 126, Firefox 127, Safari 17.4, Edge 126 — all passing. Mobile: iOS 17 + Android 14 tested.",
        "Performance: component FCP <8ms, zero layout shift (CLS=0). Bundle: +2.4KB gzipped. Tree-shakeable: yes.",
      ],
      iterate: [
        "Added skeleton loading states — perceived performance improvement: 31% faster 'feels loaded' in user test.",
        "Refactored AgentCard animations: JS-driven → CSS @keyframes. CPU usage during render ↓40%. No jank at 60fps.",
        "User test round 2: task completion 68%→84%. Form step 3 redesign (progressive disclosure) resolved drop-off.",
      ],
    },
    collaborationTopic: "AgentCard component shipped. Design tokens updated. Engineering can consume via @workspace/ui.",
    notifyFloor: 1,
  },
  {
    type: "ux_research",
    title: "UX Research & Usability Study",
    department: "Design",
    floor: 2,
    phases: ["scan", "deep_search", "reason", "make", "iterate"],
    phaseOutputs: {
      scan: [
        "Session recordings: 120 sessions, 4.2h footage analyzed. Top 3 pain points: agent discovery (38%), chat initiation (29%), status interpretation (22%).",
        "Survey results: NPS=31. Promoters cite 'visual agent presence'. Detractors cite 'unclear what agents are doing'.",
        "Funnel analysis: 62% drop between landing→agent interaction. Primary barrier: user doesn't understand agent specializations.",
      ],
      deep_search: [
        "Literature review: 23 papers on human-AI interaction. Key finding: explicit agent goal display increases trust +41% (Amershi et al., 2019).",
        "Competitor pattern library: 8 products analyzed. Best practice: status shown as verb+object ('Training model batch #47'). Currently: nouns only.",
        "Cognitive load theory: current UI shows 9 simultaneous agent states. Miller's Law: max 7±2. Recommendation: progressive disclosure, focus mode.",
      ],
      reason: [
        "Synthesis: users don't form mental model of what agents can do. Solution: contextual capability hints + current-task verbosity.",
        "Prioritized: (1) richer agent status copy, (2) agent interaction history, (3) simplified onboarding. Estimated NPS impact: +18 points.",
        "Design principles: Show agent work in progress, not just state. Use domain language. Make collaboration visible between agents.",
      ],
      make: [
        "Wireframes: 24 screens. Prototype built in Figma — 8 key flows, 0 dead-ends. User test script written (task-based, 6 tasks).",
        "UX copy guidelines: agent status always verb+object format. 32 example strings written for all states. Copy library in Notion.",
        "Journey map: 5 user types × 3 job-to-be-done. Opportunity areas ranked by effort/impact. 7 quick wins identified.",
      ],
      iterate: [
        "Prototype test: task success rate 91% (+23% vs current). Time-on-task for agent interaction: 14s→6s.",
        "Iterated on agent detail panel: added 'What I do' capability bullets. Comprehension test: 94% vs 61% baseline.",
      ],
    },
    collaborationTopic: "UX research complete. Agent comprehension issues identified. Recommendations handed to Dev.",
  },
  {
    type: "accessibility_audit",
    title: "Accessibility Compliance Audit",
    department: "Design",
    floor: 2,
    phases: ["scan", "reason", "make", "test"],
    phaseOutputs: {
      scan: [
        "aXe scan: 127 components, 14 WCAG AA violations (color contrast, missing labels, focus traps). 3 AA+ violations.",
        "Keyboard navigation test: 8 flows, 3 blocked (modal trap, skip-link missing, focus not restored after dialog close).",
        "Screen reader audit (NVDA/JAWS/VoiceOver): 11 unlabelled interactive elements, 4 live regions not announced.",
      ],
      reason: [
        "Priority map: P0=focus traps (blocks users with motor disabilities), P1=color contrast (cognitive accessibility), P2=ARIA labels.",
        "Chose semantic HTML-first over ARIA overlays — reduces maintenance burden, better SR behavior. 9 components refactored.",
        "Color system audit: 6 text/background combos fail AA (4.5:1 ratio). New palette selected maintaining brand identity.",
      ],
      make: [
        "Fixed all 3 keyboard nav blockers: restored focus after dialog, added skip-link, resolved modal trap. All verified with keyboard-only.",
        "Updated 6 color combos to AA-compliant values. Generated accessibility token layer on top of brand tokens.",
        "Added aria-labels to 11 elements, 4 live regions (role='status' aria-live='polite'). ARIA landmarks added to all major sections.",
      ],
      test: [
        "Re-audit: 0 WCAG AA violations, 1 AAA violation (accepted with documented exception). aXe score: 100/100.",
        "Keyboard navigation: all 8 flows fully accessible. Tab order logical. Focus visible on all interactive elements.",
        "Screen reader: all interactions correctly announced. Live regions update on agent status change. PASS.",
      ],
    },
    collaborationTopic: "Accessibility audit complete. WCAG AA: 100% compliant. Report filed.",
  },
];

// ── Data & AI Research — Floor 3 ──────────────────────────────────────────────
const DATA_AI_JOBS: JobDef[] = [
  {
    type: "dataset_curation",
    title: "Dataset Curation & Cleaning",
    department: "Data/AI",
    floor: 3,
    phases: ["scan", "deep_search", "reason", "make", "iterate"],
    phaseOutputs: {
      scan: [
        "Raw corpus: 2.3M samples from 847 sources. Language: EN=78%, ID=8%, ZH=6%, others=8%. Dedup run in progress.",
        "Quality scan: 14.7% noise (HTML artifacts, encoding errors, truncated sequences). 3.2% near-duplicates via MinHash LSH (threshold=0.85).",
        "Domain coverage: code=31%, reasoning=24%, dialogue=22%, factual=14%, instruction=9%. Target mismatch: need more instruction samples.",
      ],
      deep_search: [
        "Literature: Dolma, RedPajama, OpenWebMath quality filtering pipelines studied. Adopting: fastText language classifier + perplexity filter (KenLM 3-gram).",
        "ROOTS dataset dedup methodology analyzed. Implementing SimHash at sentence-level for finer granularity than full-document MinHash.",
        "Constitutional AI alignment criteria applied. 847 synthetic augmentation templates drafted for low-resource domains.",
      ],
      reason: [
        "Decision: 4-stage pipeline — (1) language filter >0.85 confidence, (2) length 20-8192 tokens, (3) perplexity <2500, (4) dedup.",
        "Instruction tuning strategy: 200K high-quality pairs from seed data + template augmentation. Quality > quantity principle.",
        "Train/val/test split: 95/3/2 stratified by domain and length. Contamination check vs benchmarks (MMLU, HumanEval) running.",
      ],
      make: [
        "Pipeline deployed: 2.3M→847K samples after all filters. Final distribution meets target. Dataset card written. Pushed to registry v3.2.",
        "Generated 47K instruction pairs via template augmentation. Human-verified sample: 98.3% acceptable quality. Added to SFT corpus.",
        "Tokenized with DLavie tokenizer: 847K docs, avg 412 tokens. Pack efficiency: 94.2% (minimal padding waste). Stored as Arrow.",
      ],
      iterate: [
        "Iteration 2: Tightened perplexity threshold 2500→1800. Lost 12% data, gained 0.8% downstream accuracy. Trade-off accepted.",
        "Added curriculum ordering: sort by document complexity. Training expected to converge 18% faster vs random shuffle.",
        "Contamination check complete: 0 benchmark overlap in train split. Val/test sets finalized. Dataset ready for Floor 4 handoff.",
      ],
    },
    collaborationTopic: "Training dataset ready: 847K samples, 4-stage quality pipeline. Pushing to model registry. Notifying Training floor.",
    notifyFloor: 4,
  },
  {
    type: "model_research",
    title: "Model Architecture Research",
    department: "Data/AI",
    floor: 3,
    phases: ["deep_search", "reason", "make", "test", "iterate"],
    phaseOutputs: {
      deep_search: [
        "Literature review: 34 papers on transformer variants. Key: Grouped Query Attention (GQA) reduces KV cache 60% with <0.5% quality loss.",
        "Sliding window attention: Longformer, BigBird, FlashAttention-2. Target: 32K context. FlashAttention-2 viable — O(N) memory.",
        "MoE survey: 8 router architectures. Top-k=2 routing stable. Expert collapse risk at <10M tokens training — needs load-balancing loss.",
      ],
      reason: [
        "Architecture decision: GQA + FlashAttention-2 + RoPE. Expected: 40% faster training, 60% smaller KV cache, 32K context native.",
        "Parameter budget: 7B dense equivalent, MoE with 16 experts (top-2 routing) → 13B params, 7B active. Inference cost same as 7B dense.",
        "Training objective: CLM pre-training + SFT with DLavie instruction dataset. No RLHF in v1 — DPO planned for v2.",
      ],
      make: [
        "Architecture spec: 32 layers, 4096 hidden, 32 heads, GQA groups=8, FFN dim=14336. Config YAML written and version-controlled.",
        "Implemented custom attention kernel with FlashAttention-2. Benchmarked: 2.1x speedup at seq_len=2048. Memory: -52%.",
        "Forward pass unit tests: shape assertions, numerical stability, gradient flow (checked via autograd). All passing.",
      ],
      test: [
        "Architecture ablation on 1B-param toy model: GQA +0.0 perplexity vs MHA. FlashAttention numerical diff: max error 1e-5 (float32). PASS.",
        "Training stability test: LR warmup 2000 steps, cosine decay. Loss curve smooth through 10K steps. Gradient norm: stable 0.8-1.2.",
        "Scaling law fit: 4 model sizes (0.1B, 0.4B, 1B, 3B). Chinchilla-optimal point estimated: 7B params, 140B tokens for DLavie.",
      ],
      iterate: [
        "Adjusted init std from 0.02→0.01/√layers. Output logit variance reduced 3x. Loss spike at step 1 eliminated.",
        "Added z-loss regularization (0.001 coefficient) to MoE routers. Expert load balance entropy +0.4 bits. No collapse through 20K steps.",
      ],
    },
    collaborationTopic: "Architecture spec finalized: 7B MoE, GQA+FlashAttention-2, 32K context. Ready for training. Notifying Training.",
    notifyFloor: 4,
  },
  {
    type: "benchmark_eval",
    title: "Model Benchmark Evaluation",
    department: "Data/AI",
    floor: 3,
    phases: ["scan", "reason", "make", "test", "iterate"],
    phaseOutputs: {
      scan: [
        "Benchmark suite: MMLU (57 tasks), HumanEval (164 problems), GSM8K (1319 problems), TruthfulQA (817 questions). Baseline loaded.",
        "Current model: dlv-0.1.0. Evaluating vs: Mistral-7B, Llama-3.1-8B, Gemma-7B. Hardware: 2×A100-80GB.",
        "Eval harness: lm-evaluation-harness v0.4.3. Few-shot: MMLU=5-shot, HumanEval=0-shot+pass@1, GSM8K=8-shot CoT.",
      ],
      reason: [
        "Evaluation design: 3 seeds per benchmark to estimate variance. Greedy decoding for determinism. Temperature=0.",
        "Added DLavie-specific evals: agent instruction following (50 tasks), multi-turn dialogue coherence (100 conversations).",
        "Metrics: MMLU accuracy, HumanEval pass@1, GSM8K exact match, TruthfulQA MC1+MC2, DLavie agent benchmark.",
      ],
      make: [
        "Eval pipeline: checkpoint → quantize (INT8) → run all benchmarks → compute CI → generate report. Runtime: 4.2h on 2×A100.",
        "Results: MMLU=61.3%, HumanEval=38.4%, GSM8K=44.7%, TruthfulQA=51.2%. DLavie agent benchmark: 72.1%.",
        "Radar chart and leaderboard table generated. Strength: agent following. Weakness: math reasoning. Report sent.",
      ],
      test: [
        "Reproducibility check: re-ran MMLU with 3 seeds. Variance: ±0.4%. Statistically significant vs Mistral-7B (p=0.02). Reliable.",
        "Human eval correlation: n=50 prompts, preference rate vs greedy output: 71%. Acceptable for v0.1 baseline.",
        "Error analysis: GSM8K failures — 67% arithmetic errors in multi-step problems. Priority: more CoT math data next training.",
      ],
      iterate: [
        "Identified top-20 failure modes. Filed dataset requests with Data team for targeted augmentation.",
        "Updated eval suite with 15 new agent-specific tasks. DLavie benchmark now 65 tasks. Score updated: 72.1%.",
      ],
    },
    collaborationTopic: "Eval complete: MMLU 61.3%, HumanEval 38.4%, Agent benchmark 72.1%. Math reasoning flagged for improvement.",
    notifyFloor: 5,
  },
];

// ── Operations & Training — Floor 4 ──────────────────────────────────────────
const OPS_TRAINING_JOBS: JobDef[] = [
  {
    type: "training_run",
    title: "Model Training Run",
    department: "Operations",
    floor: 4,
    phases: ["scan", "reason", "make", "test", "iterate"],
    phaseOutputs: {
      scan: [
        "Pre-training checklist: dataset v3.2 (847K samples) verified. GPU cluster: 8×H100-80GB available. Estimated compute: 2.4e21 FLOPs. ETA: 72h.",
        "Reviewing incoming dataset from Data floor. SHA256 match: ✓. Sample inspection: 200 random samples, quality acceptable.",
        "Infrastructure check: NVLink 900GB/s, InfiniBand 200Gb/s, NFS shared storage at 89% capacity (clearing old checkpoints). GO.",
      ],
      reason: [
        "Training config: batch_size=2048, seq_len=2048, lr=3e-4 (warmup 2000 steps, cosine to 3e-5), weight_decay=0.1, grad_clip=1.0.",
        "Gradient accumulation steps=8 → effective batch 16384. ZeRO-3 sharding across 8 GPUs. Mixed precision: bf16 forward + fp32 grads.",
        "Checkpoint strategy: every 1000 steps. Best-of-N selection by val loss. EMA model maintained at 0.9999 decay for stable eval.",
      ],
      make: [
        "Training launched. Step 0: loss=12.43 (expected ~log vocab_size=10.8). GPU util: 94.3%. MFU: 47.2%. All nodes healthy.",
        "Checkpoint at step 5000: train_loss=3.21, val_loss=3.38, perplexity=29.4. Loss curve: smooth descent, no spikes.",
        "Midpoint checkpoint step 15000: train_loss=2.64, val_loss=2.71. Perplexity=15.0. On track — Chinchilla pace maintained.",
      ],
      test: [
        "Eval at step 20000: MMLU=59.1% (+3.4% vs baseline), HumanEval=35.2%, GSM8K=41.8%. DLavie agent benchmark: 69.4%. Trend: positive.",
        "Gradient norm: stable 0.9-1.1. No spike events. Activation stats: no dead neurons. Weight norms growing 0.02/1000 steps (healthy).",
        "Hardware health: all 8 GPUs 34-36°C, power 3.1-3.2kW/unit. No memory errors. Training throughput: 18,400 tokens/s. STABLE.",
      ],
      iterate: [
        "Step 28000 — learning rate decay phase. Loss rate slowing — expected. Reduced to 8e-5 (cosine schedule).",
        "Training complete step 48000: final loss=2.18, val_loss=2.24. Perplexity=9.4. Saving final checkpoint + EMA model. Handing to Eng.",
      ],
    },
    collaborationTopic: "Training complete — dlv-next ready. Val perplexity 9.4. Pushing to model registry. Notify Engineering.",
    notifyFloor: 1,
  },
  {
    type: "hyperparameter_tune",
    title: "Hyperparameter Optimization",
    department: "Operations",
    floor: 4,
    phases: ["scan", "reason", "make", "test", "iterate"],
    phaseOutputs: {
      scan: [
        "Sweep config: lr ∈ [1e-4, 1e-3], batch_size ∈ {512, 1024, 2048}, warmup_steps ∈ [500, 4000]. Bayesian optimization, 40 trials via Optuna.",
        "Previous run analysis: loss variance by seed=0.08 (acceptable). LR sensitivity: loss degrades 12× faster above 6e-4. Sharp upper bound.",
        "Baseline: lr=3e-4, batch=2048, warmup=2000 → val_loss=2.71 at 20K steps. This is the reference point.",
      ],
      reason: [
        "Bayesian prior: lr log-uniform (log-sensitive). Batch: {512, 1024, 2048}. Warmup: linear interpolation.",
        "Early stopping at 5000 steps per trial if val_loss > baseline + 0.3. Budget: 40 trials × 5000 steps = 200K total steps.",
        "Using successive halving: 40 trials → keep top 10 → run 15K steps → keep top 3 → full 30K step run on winners.",
      ],
      make: [
        "Trial 1/40 launched: lr=2.1e-4, batch=1024, warmup=1500. Step 500: loss=10.2 (on track). Optuna TPE estimator updating.",
        "Trial 12 — Optuna suggests lr=1.8e-4: val_loss=2.68 (new best). Confidence interval updating. Batch=2048 consistently better.",
        "Sweep complete. Best: lr=2.2e-4, batch=2048, warmup=1800. val_loss=2.65 vs baseline 2.71. Improvement: 2.2%.",
      ],
      test: [
        "Best config validated: 3 seeds, val_loss: [2.63, 2.65, 2.67]. Variance acceptable. Significant vs baseline (p=0.01, Mann-Whitney).",
        "MMLU improvement with optimal HP: 59.1%→61.3% (+2.2%). GSM8K: 41.8%→44.7% (+2.9%). Sensitive to batch size on math tasks.",
        "Config shipped to training config file. Expected compute saving: 15% fewer steps to same loss. ROI: positive.",
      ],
      iterate: [
        "Second sweep: finer grid around winner. lr ∈ [1.9e-4, 2.5e-4]. Found lr=2.18e-4 marginally better (+0.003 val_loss). Updated config.",
        "Added: weight decay {0.05, 0.1, 0.15} → 0.1 optimal. Gradient clip {0.5, 1.0, 2.0} → 1.0 optimal.",
      ],
    },
    collaborationTopic: "Optimal HP found: lr=2.2e-4, batch=2048, warmup=1800. 2.2% val_loss improvement. Config pushed for next run.",
  },
  {
    type: "monitor_training",
    title: "Monitor Training & Detect Anomalies",
    department: "Operations",
    floor: 4,
    phases: ["scan", "reason", "debug", "test", "iterate"],
    phaseOutputs: {
      scan: [
        "Training monitor: current run step 18,420/48,000. train_loss=2.79, val_loss=2.83. Loss gap 0.04 — healthy, no overfit. GPU util 93.1%.",
        "Anomaly detection: 12 metrics monitored. Alert thresholds: loss spike >0.5 in 100 steps, gradient norm >5.0, GPU temp >85°C.",
        "Log analysis: 3 NaN gradients at steps 4201-4203. Recovered automatically (gradient clipping engaged). Logging for audit.",
      ],
      reason: [
        "NaN gradients at steps 4201-4203 — likely unstable batch (very long sequences, low token diversity). Increased clip 1.0→0.8 preventively.",
        "Loss plateau for 800 steps (12000-12800): LR possibly too high at this stage. Cosine schedule should reduce. Watching next 500 steps.",
        "GPU memory increased 8% over last 5000 steps — possible tensor accumulation. Trigger cleanup at next checkpoint.",
      ],
      debug: [
        "Plateau cause: attention sink forming at position 0. Applied mitigation: scale first token attention by 0.5. Loss resumed descent.",
        "Memory growth fixed: gc.collect() + torch.cuda.empty_cache() in checkpoint callback. Memory stable at 78% after step 12800.",
        "NaN root cause: batch with 0-token segments after tokenization. Added guard: skip batches with >1% empty tokens. Guard active.",
      ],
      test: [
        "Post-fix: 500-step observation. No NaN gradients. Loss curve smooth descent resumed. Memory: stable. All clear.",
        "NaN guard validation: replayed problematic batch — correctly detected and skipped. Normal batches: pass through unaffected.",
        "Loss at step 15000: 2.71 (on Chinchilla-optimal trajectory). Projected final perplexity: 9.2-9.6. Within target.",
      ],
      iterate: [
        "Added proactive monitoring: early warning at 80% of alert thresholds. Dashboard updated. Pagerduty escalation configured.",
        "Implemented auto-LR reduction on plateau: val_loss improvement <0.01 over 2000 steps → reduce LR 20%. Activated at step 22000.",
      ],
    },
    collaborationTopic: "Training stable after anomaly mitigation. NaN guard active. Projected final perplexity 9.2-9.6. On schedule.",
  },
];

// ── Executive — Floor 5 ───────────────────────────────────────────────────────
const EXECUTIVE_JOBS: JobDef[] = [
  {
    type: "orchestrate_agents",
    title: "Orchestrate Multi-Agent Pipeline",
    department: "Executive",
    floor: 5,
    phases: ["scan", "reason", "make", "test"],
    phaseOutputs: {
      scan: [
        "Agent status: 6 Eng (4 working, 2 idle), 6 Design (5 working), 6 Data (all working), 6 Training (3 on training run). Pipeline: GREEN.",
        "Bottleneck analysis: Training floor has 3 datasets waiting for GPU allocation. Engineering model serving has 1 blocked PR. 2 blockers found.",
        "Cross-floor dependency map: Data→Training (2 handoffs pending), Training→Engineering (1 model ready). Design→Engineering (3 PRs open).",
      ],
      reason: [
        "Priority: unblock Training floor first (highest ROI — training on critical path). Assign idle Eng agents to GPU provisioning.",
        "Conflict resolution: Data vs Engineering on dataset format spec. Decision: Parquet over Arrow. Documented in ADR-047.",
        "Resource rebalancing: Design floor has excess capacity. Assign 2 Design agents to assist Engineering with model playground UI.",
      ],
      make: [
        "Directives issued: (1) ARIA unblock Training GPU handoff, (2) NEXUS review dataset format PR, (3) LUMA+PIXEL assist model playground.",
        "Sprint board updated: 14 cross-floor dependencies mapped, owners assigned, deadlines set. Blockers have escalation paths.",
        "Conflict resolution memo sent. ADR-047 published. ARIA acknowledged. Training floor GPU ticket: UNBLOCKED.",
      ],
      test: [
        "Compliance check: ARIA completed GPU handoff (3h, on time). NEXUS merged format PR. Training run resumed. All 2 blockers resolved.",
        "Pipeline health re-assessed: GREEN across all 4 floors. Cross-floor handoff latency: avg 4.2h (target <6h). SLA: MET.",
        "Sprint velocity: 18/22 story points completed. Remaining 4 deferred to next sprint. Stakeholder aligned.",
      ],
    },
    collaborationTopic: "Cross-floor pipeline unblocked. GPU handoff complete. Training resumed. All agents at full capacity.",
  },
  {
    type: "quality_review",
    title: "Model Quality & Release Review",
    department: "Executive",
    floor: 5,
    phases: ["scan", "deep_search", "reason", "make"],
    phaseOutputs: {
      scan: [
        "Model candidate: dlv-next. Evals: MMLU=63.7%, HumanEval=41.2%, GSM8K=47.3%, DLavie Agent=75.4%. Previous: 61.3%/38.4%/44.7%/72.1%.",
        "Safety eval: TruthfulQA=54.8% (+3.6%). Refusal rate on harmful prompts: 99.2%. Jailbreak attempts: 0/47 successful.",
        "Production readiness: p99=19ms (-38%), throughput (+3.2x), cost per inference (-41% via quantization). Rollback tested.",
      ],
      deep_search: [
        "External benchmark: dlv-next vs public leaderboard Q4 2024. Competitive with 7B-class. MMLU 63.7% in top-30% of 7B models.",
        "Failure mode analysis: 47 known edge cases from v0.1 — 39 resolved (83%), 8 remain (4 low-priority, 4 need training data). Acceptable.",
        "User impact projection: 2.2% MMLU improvement → estimated 8-12% reduction in user-reported incorrect responses. Agent task success: +4.1%.",
      ],
      reason: [
        "Release decision: APPROVED. Evidence: +2.4% avg benchmark, no safety regressions, latency improved. 8 remaining failure modes documented.",
        "Version bump: dlv-0.1.0 → dlv-0.2.0 (minor version: significant capability improvement). Changelog written. Release notes ready.",
        "Monitoring plan: 48h heightened monitoring post-release. SLO: p99 <30ms, error rate <0.1%, agent task success >95%.",
      ],
      make: [
        "Release approved and signed off. dlv-0.2.0 tag created. Release notes published. All floors notified. 🎉 Model milestone achieved.",
        "Post-release: VEGA assigned to start architecture research for v0.3 (target: +5% math reasoning). Data team: prioritize CoT math corpus.",
        "Retrospective scheduled: all-floor sync in 48h. Agenda: pipeline bottlenecks, improvements for next release cycle.",
      ],
    },
    collaborationTopic: "dlv-0.2.0 APPROVED and released. All agents expertise leveled up. Next cycle: math reasoning improvement.",
    notifyFloor: 1,
  },
  {
    type: "roadmap_plan",
    title: "Product Roadmap Planning",
    department: "Executive",
    floor: 5,
    phases: ["scan", "reason", "make", "test"],
    phaseOutputs: {
      scan: [
        "Quarterly review: 14 features shipped, 3 deferred. Model version: dlv-0.2.0. User satisfaction: NPS=38 (+7 QoQ). Revenue: +22%.",
        "Agent utilization: 91% avg across all floors. Bottleneck: Training GPU capacity (73% queue time). Next investment priority clear.",
        "Competitive landscape update: 2 new entrants in AI office simulation space. Differentiation: real agent autonomy + memory. Hold.",
      ],
      reason: [
        "Q3 priorities: (1) memory system upgrade (episodic + semantic), (2) cross-agent skill transfer, (3) model v0.3 (math reasoning).",
        "Resource allocation: 40% Engineering (infrastructure), 30% Data (curriculum improvement), 20% Training (scale GPU), 10% Design (UX polish).",
        "Success metrics: MMLU >68%, HumanEval >50%, agent task success >97%, user session length +30%.",
      ],
      make: [
        "Roadmap doc written: 12 epics, 47 stories, 8 technical debts. Published to all floors. Q3 capacity: 180 story points.",
        "OKR set: O1=Ship dlv-0.3.0, O2=Memory system v2, O3=Agent collaboration protocol v1. All floors acknowledged.",
        "Risk register updated: 3 HIGH risks (GPU supply, dataset quality plateau, key agent attrition). Mitigations documented.",
      ],
      test: [
        "Roadmap review with all floor leads: 0 blockers, 2 dependency adjustments, 1 scope reduction (deferred agent-to-user voice to Q4).",
        "Capacity check: 180 story points vs 190 needed. Solution: defer 2 tech debts, parallelize memory + model work. Feasible.",
        "Stakeholder sign-off: roadmap approved. Kickoff: Monday. All floor leads: CONFIRMED.",
      ],
    },
    collaborationTopic: "Q3 roadmap approved: dlv-0.3.0, memory system v2, collaboration protocol v1. All floors aligned.",
  },
];

// ── Master Job Registry ───────────────────────────────────────────────────────
export const JOB_REGISTRY: Record<number, JobDef[]> = {
  1: ENGINEERING_JOBS,
  2: DESIGN_JOBS,
  3: DATA_AI_JOBS,
  4: OPS_TRAINING_JOBS,
  5: EXECUTIVE_JOBS,
};

export function pickJob(floor: number): JobDef {
  const jobs = JOB_REGISTRY[floor] ?? ENGINEERING_JOBS;
  return pick(jobs);
}

export function getPhaseOutput(job: JobDef, phase: SkillPhase): string {
  const outputs = job.phaseOutputs[phase];
  if (!outputs || outputs.length === 0) {
    return `[${phase.toUpperCase()}] Processing ${job.title}...`;
  }
  return pick(outputs);
}

export const SKILL_PHASE_VERBS: Record<SkillPhase, string> = {
  scan:        "Scanning",
  reason:      "Reasoning",
  make:        "Building",
  test:        "Testing",
  iterate:     "Iterating",
  debug:       "Debugging",
  deep_search: "Researching",
};
