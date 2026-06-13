---
name: Autonomous AI Agent Engine
description: Architecture and key decisions for the real autonomous AI agent job system powering all 5 floors.
---

## Architecture

Two-layer agent system:
- **Floor 1 — DB agents** (ARIA, NEXUS, FORGE, SCOUT, ECHO, VEGA): records in `agentsTable`, jobs tracked in DB columns and `agentJobsTable`.
- **Floors 2-5 — NPC virtual agents** (LUMA, PIXEL, MUSE, VERA/ATLAS, EMBER, QUANT, LYRA/TITAN, PULSE, NOVA, DRIFT/APEX, ZENITH): in-memory `NPC_PROFILES` array in `agentEngine.ts`. Virtual IDs 201-502. No DB records needed.

## Key Files

- `artifacts/api-server/src/lib/agentJobDefs.ts` — All job definitions: Partial<Record<SkillPhase, string[]>> phaseOutputs per job type per floor.
- `artifacts/api-server/src/lib/agentEngine.ts` — Autonomous engine: 6 tick intervals (DB jobs/NPC jobs/collaboration/pipeline/expertise/cleanup).
- `lib/db/src/schema/agents.ts` — Extended with: floor, department, specialty, skills, expertiseLevel, modelVersion, memoryContext, currentJobType, currentJobPhase, currentJobPhaseIndex, totalJobPhases, jobsCompleted, lastCollaboratedWith.
- `lib/db/src/schema/agent_jobs.ts` — New job tracking table.

## Seed Requirement

After any schema push, must re-seed Floor 1 agents via psql INSERT with ON CONFLICT UPDATE. The seed SQL is in session memory (6 rows for ARIA/NEXUS/FORGE/SCOUT/ECHO/VEGA). lib/db has no build script — esbuild resolves source directly (typecheck warnings only, not build errors).

## ML Pipeline Chain (notifyFloor)

Data(F3) dataset_curation → notifyFloor:4 → Training(F4) training_run triggered
Training(F4) training_run → notifyFloor:1 → Engineering(F1) model_deployment triggered
Engineering(F1) model_deployment → notifyFloor:5 → Executive(F5) quality_review triggered
Executive(F5) quality_review → notifyFloor:1 → new cycle

## Model Version Progression

`globalModelVersion` in agentEngine.ts (singleton, shared state). Bumps:
- patch: every 20 total jobs completed across all agents
- minor: every 60 total jobs completed

**Why:** Gives users a sense of collective progress. All agents share one model version as a "collective intelligence" narrative.

## Duplicate Key Gotcha

`phaseOutputs: Record<SkillPhase, string[]>` caused runtime bugs when phases were listed twice (later empty array overwrites real content). Fixed by: `Partial<Record<SkillPhase, string[]>>` — only define phases with real content.

## Tick Timing

- DB agent jobs: every 9s
- NPC agent jobs: every 12s (offset 4s)
- Cross-floor collaboration: every 45s (offset 15s)
- Pipeline progression: every 90s (offset 30s)
- Expertise/model version: every 120s (offset 60s)
- Cleanup: every 180s
