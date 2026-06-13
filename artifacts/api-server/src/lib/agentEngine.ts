// ── Autonomous AI Agent Engine ─────────────────────────────────────────────────
// Powers real job execution for all agents across all floors.
// Floor 1 agents: DB-backed (ARIA, NEXUS, FORGE, SCOUT, ECHO, VEGA)
// Floors 2-5:     Virtual NPC agents — generate rich activity events without DB records
//
// The collaborative ML training pipeline:
//   Data (F3) → dataset_curation → notifies Training (F4)
//   Training (F4) → training_run → notifies Engineering (F1)
//   Engineering (F1) → model_deployment → notifies Executive (F5)
//   Executive (F5) → quality_review → approves release → all agents expertise++

import { db } from "@workspace/db";
import {
  agentsTable, agentMessagesTable, activityEventsTable, agentJobsTable,
} from "@workspace/db";
import { eq, sql, desc, lt } from "drizzle-orm";
import { logger } from "./logger";
import {
  pickJob, getPhaseOutput, JOB_REGISTRY, SKILL_PHASE_VERBS,
  type JobDef, type SkillPhase,
} from "./agentJobDefs";

// ── NPC Virtual Agent Profiles (Floors 2-5) ───────────────────────────────────
interface NpcProfile {
  id: number;
  name: string;
  floor: number;
  department: string;
  specialty: string;
  skills: SkillPhase[];
  expertiseLevel: number;
  modelVersion: string;
  jobsCompleted: number;
  currentJob: JobDef | null;
  currentPhaseIndex: number;
  currentJobStarted: Date | null;
}

const NPC_PROFILES: NpcProfile[] = [
  // Floor 2 — Design
  { id: 201, name: "LUMA",  floor: 2, department: "Design", specialty: "UI/UX Design", skills: ["scan","reason","make","test","iterate"], expertiseLevel: 3, modelVersion: "dlv-0.1.0", jobsCompleted: 0, currentJob: null, currentPhaseIndex: 0, currentJobStarted: null },
  { id: 202, name: "PIXEL", floor: 2, department: "Design", specialty: "Design Systems", skills: ["make","iterate","scan","reason"], expertiseLevel: 2, modelVersion: "dlv-0.1.0", jobsCompleted: 0, currentJob: null, currentPhaseIndex: 0, currentJobStarted: null },
  { id: 203, name: "MUSE",  floor: 2, department: "Design", specialty: "UX Research", skills: ["scan","deep_search","reason","make"], expertiseLevel: 4, modelVersion: "dlv-0.1.0", jobsCompleted: 0, currentJob: null, currentPhaseIndex: 0, currentJobStarted: null },
  { id: 204, name: "VERA",  floor: 2, department: "Design", specialty: "Prototyping & Interaction", skills: ["make","test","iterate","scan"], expertiseLevel: 2, modelVersion: "dlv-0.1.0", jobsCompleted: 0, currentJob: null, currentPhaseIndex: 0, currentJobStarted: null },
  // Floor 3 — Data/AI Research
  { id: 301, name: "ATLAS", floor: 3, department: "Data/AI", specialty: "Dataset Engineering", skills: ["scan","deep_search","reason","make","iterate"], expertiseLevel: 5, modelVersion: "dlv-0.1.0", jobsCompleted: 0, currentJob: null, currentPhaseIndex: 0, currentJobStarted: null },
  { id: 302, name: "EMBER", floor: 3, department: "Data/AI", specialty: "Model Architecture", skills: ["deep_search","reason","make","test"], expertiseLevel: 4, modelVersion: "dlv-0.1.0", jobsCompleted: 0, currentJob: null, currentPhaseIndex: 0, currentJobStarted: null },
  { id: 303, name: "QUANT", floor: 3, department: "Data/AI", specialty: "Evaluation & Benchmarking", skills: ["scan","reason","make","test","iterate"], expertiseLevel: 3, modelVersion: "dlv-0.1.0", jobsCompleted: 0, currentJob: null, currentPhaseIndex: 0, currentJobStarted: null },
  { id: 304, name: "LYRA",  floor: 3, department: "Data/AI", specialty: "Feature Engineering", skills: ["scan","reason","make","iterate"], expertiseLevel: 3, modelVersion: "dlv-0.1.0", jobsCompleted: 0, currentJob: null, currentPhaseIndex: 0, currentJobStarted: null },
  // Floor 4 — Operations/Training
  { id: 401, name: "TITAN", floor: 4, department: "Operations", specialty: "Training Runs & GPU Infra", skills: ["scan","reason","make","test","iterate"], expertiseLevel: 6, modelVersion: "dlv-0.1.0", jobsCompleted: 0, currentJob: null, currentPhaseIndex: 0, currentJobStarted: null },
  { id: 402, name: "PULSE", floor: 4, department: "Operations", specialty: "Monitoring & Anomaly Detection", skills: ["scan","reason","debug","test"], expertiseLevel: 4, modelVersion: "dlv-0.1.0", jobsCompleted: 0, currentJob: null, currentPhaseIndex: 0, currentJobStarted: null },
  { id: 403, name: "NOVA",  floor: 4, department: "Operations", specialty: "Hyperparameter Optimization", skills: ["reason","scan","make","test","iterate"], expertiseLevel: 5, modelVersion: "dlv-0.1.0", jobsCompleted: 0, currentJob: null, currentPhaseIndex: 0, currentJobStarted: null },
  { id: 404, name: "DRIFT", floor: 4, department: "Operations", specialty: "Model Deployment & Serving", skills: ["scan","reason","make","test"], expertiseLevel: 3, modelVersion: "dlv-0.1.0", jobsCompleted: 0, currentJob: null, currentPhaseIndex: 0, currentJobStarted: null },
  // Floor 5 — Executive
  { id: 501, name: "APEX",  floor: 5, department: "Executive", specialty: "Agent Orchestration", skills: ["scan","reason","make","test"], expertiseLevel: 8, modelVersion: "dlv-0.1.0", jobsCompleted: 0, currentJob: null, currentPhaseIndex: 0, currentJobStarted: null },
  { id: 502, name: "ZENITH",floor: 5, department: "Executive", specialty: "Quality & Release Management", skills: ["scan","deep_search","reason","make"], expertiseLevel: 7, modelVersion: "dlv-0.1.0", jobsCompleted: 0, currentJob: null, currentPhaseIndex: 0, currentJobStarted: null },
];

// ── Model version global (shared across all agents) ───────────────────────────
let globalModelVersion = "dlv-0.1.0";
let globalVersionMinor = 1;
let globalVersionPatch = 0;
let totalJobsCompleted = 0;

function bumpModelVersion(type: "patch" | "minor") {
  if (type === "minor") {
    globalVersionMinor++;
    globalVersionPatch = 0;
  } else {
    globalVersionPatch++;
  }
  globalModelVersion = `dlv-0.${globalVersionMinor}.${globalVersionPatch}`;
  return globalModelVersion;
}

// ── DB Agent Identity (Floor 1) ───────────────────────────────────────────────
const DB_AGENT_SPECIALTIES: Record<number, { specialty: string; floor: number; department: string; skills: string[] }> = {
  1: { specialty: "API & Backend Systems",    floor: 1, department: "Engineering", skills: ["make","test","iterate","debug","scan"] },
  2: { specialty: "Data Pipeline & ETL",       floor: 1, department: "Engineering", skills: ["scan","reason","make","deep_search"] },
  3: { specialty: "DevOps & Infrastructure",   floor: 1, department: "Engineering", skills: ["make","test","debug","scan","iterate"] },
  4: { specialty: "Security & Compliance",     floor: 1, department: "Engineering", skills: ["scan","reason","debug","deep_search"] },
  5: { specialty: "Testing & Quality Assurance",floor: 1, department: "Engineering", skills: ["test","scan","debug","iterate"] },
  6: { specialty: "Architecture & Research",   floor: 1, department: "Engineering", skills: ["reason","deep_search","make","scan"] },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function chance(pct: number) { return Math.random() * 100 < pct; }

function expertiseLabel(lvl: number): string {
  if (lvl >= 20) return "Master";
  if (lvl >= 15) return "Expert";
  if (lvl >= 10) return "Senior";
  if (lvl >= 6)  return "Mid-level";
  if (lvl >= 3)  return "Junior";
  return "Trainee";
}

async function logEvent(agentId: number, agentName: string, eventType: string, description: string) {
  try {
    await db.insert(activityEventsTable).values({ agentId, agentName, eventType, description });
  } catch { /* non-critical */ }
}

async function storeMemory(agentId: number, content: string) {
  try {
    await db.insert(agentMessagesTable).values({ agentId, content, type: "memory" });
  } catch { /* non-critical */ }
}

// ── Main Engine Class ─────────────────────────────────────────────────────────
class AgentJobEngine {
  private running = false;
  private timers: ReturnType<typeof setInterval>[] = [];

  start() {
    if (this.running) return;
    this.running = true;
    logger.info("AgentJobEngine starting — autonomous AI agent system online");

    // Tick A: advance DB agent (Floor 1) jobs every 9s
    this.timers.push(setInterval(() => this.tickDbAgentJobs(), 9_000));

    // Tick B: advance NPC agent jobs every 12s (offset 4s)
    setTimeout(() => {
      this.timers.push(setInterval(() => this.tickNpcAgentJobs(), 12_000));
    }, 4_000);

    // Tick C: cross-floor collaboration events every 45s (offset 15s)
    setTimeout(() => {
      this.timers.push(setInterval(() => this.tickCollaboration(), 45_000));
    }, 15_000);

    // Tick D: model training pipeline progression every 90s (offset 30s)
    setTimeout(() => {
      this.timers.push(setInterval(() => this.tickPipelineProgression(), 90_000));
    }, 30_000);

    // Tick E: expertise & model version check every 120s
    setTimeout(() => {
      this.timers.push(setInterval(() => this.tickExpertiseProgression(), 120_000));
    }, 60_000);

    // Tick F: cleanup every 3min
    this.timers.push(setInterval(() => this.tickCleanup(), 180_000));

    // Warm start: initialize DB agent identities and start NPC jobs
    setTimeout(() => this.warmStart(), 3_000);
  }

  stop() {
    this.running = false;
    this.timers.forEach(clearInterval);
    this.timers = [];
  }

  // ── Warm Start ───────────────────────────────────────────────────────────────
  private async warmStart() {
    try {
      const agents = await db.select().from(agentsTable);
      for (const agent of agents) {
        const identity = DB_AGENT_SPECIALTIES[agent.id];
        if (!identity) continue;
        // Update agent with real identity if not yet set
        if (agent.specialty === "Backend Systems" || !agent.department || agent.department === "Engineering") {
          await db.update(agentsTable).set({
            floor: identity.floor,
            department: identity.department,
            specialty: identity.specialty,
            skills: JSON.stringify(identity.skills),
            modelVersion: globalModelVersion,
          }).where(eq(agentsTable.id, agent.id));
        }
      }
      // Start NPC jobs
      for (const npc of NPC_PROFILES) {
        if (!npc.currentJob) {
          npc.currentJob = pickJob(npc.floor);
          npc.currentPhaseIndex = 0;
          npc.currentJobStarted = new Date();
        }
      }
      logger.info("AgentJobEngine warm start complete");
      // Immediate first tick
      await this.tickDbAgentJobs();
      await this.tickNpcAgentJobs();
    } catch (err) {
      logger.error({ err }, "AgentJobEngine warm start failed");
    }
  }

  // ── Tick A: DB Agent Jobs (Floor 1) ──────────────────────────────────────────
  private async tickDbAgentJobs() {
    if (!this.running) return;
    try {
      const agents = await db.select().from(agentsTable);
      for (const agent of agents) {
        if (!chance(75)) continue; // natural variance

        const currentPhaseIndex = agent.currentJobPhaseIndex ?? 0;
        const totalPhases = agent.totalJobPhases ?? 5;

        if (!agent.currentJobType) {
          // Start a new job
          await this.startDbAgentJob(agent);
        } else if (currentPhaseIndex < totalPhases) {
          // Advance current job by one phase
          await this.advanceDbAgentJob(agent);
        } else {
          // Job complete — finalize and start next
          await this.completeDbAgentJob(agent);
        }
      }
    } catch (err) {
      logger.error({ err }, "tickDbAgentJobs failed");
    }
  }

  private async startDbAgentJob(agent: typeof agentsTable.$inferSelect) {
    const job = pickJob(1); // Floor 1 = Engineering
    const phases = job.phases;
    await db.update(agentsTable).set({
      currentJobType: job.type,
      currentJobPhase: phases[0],
      currentJobPhaseIndex: 0,
      totalJobPhases: phases.length,
      currentTask: `${SKILL_PHASE_VERBS[phases[0] as SkillPhase] ?? "Working on"}: ${job.title}`,
    }).where(eq(agentsTable.id, agent.id));

    // Log job start to activity
    await logEvent(agent.id, agent.name, "job_started",
      `[${agent.specialty ?? "Engineering"}] Starting: ${job.title} | Phase 1/${phases.length}: ${phases[0].toUpperCase()}`);

    // Store in agent memory
    await storeMemory(agent.id,
      `JOB_START: ${job.type} | Title: ${job.title} | Phases: ${phases.join('→')} | Model: ${globalModelVersion}`);
  }

  private async advanceDbAgentJob(agent: typeof agentsTable.$inferSelect) {
    const jobType = agent.currentJobType!;
    const phaseIndex = agent.currentJobPhaseIndex;

    // Find job def from registry
    const jobs = JOB_REGISTRY[1] ?? [];
    const job = jobs.find(j => j.type === jobType) ?? jobs[0];
    if (!job) return;

    const phase = job.phases[phaseIndex] as SkillPhase;
    const output = getPhaseOutput(job, phase);
    const nextPhaseIndex = phaseIndex + 1;
    const hasNext = nextPhaseIndex < job.phases.length;
    const nextPhase = hasNext ? job.phases[nextPhaseIndex] as SkillPhase : null;

    // Update agent state
    await db.update(agentsTable).set({
      currentJobPhase: nextPhase ?? phase,
      currentJobPhaseIndex: nextPhaseIndex,
      currentTask: hasNext
        ? `${SKILL_PHASE_VERBS[nextPhase!] ?? "Working on"}: ${job.title}`
        : `Finalizing: ${job.title}`,
    }).where(eq(agentsTable.id, agent.id));

    // Log detailed activity event
    const phaseLabel = `${SKILL_PHASE_VERBS[phase]} [${phase.toUpperCase()}]`;
    await logEvent(agent.id, agent.name, `skill_${phase}`,
      `${phaseLabel} — ${output}`);

    // Store output in memory
    await storeMemory(agent.id,
      `PHASE:${phase.toUpperCase()} | Job:${jobType} | Output: ${output.substring(0, 200)}`);

    // Record in agent_jobs table
    try {
      await db.insert(agentJobsTable).values({
        agentId: agent.id,
        agentName: agent.name,
        floor: agent.floor ?? 1,
        department: agent.department ?? "Engineering",
        jobType,
        jobTitle: job.title,
        phase,
        phaseIndex,
        totalPhases: job.phases.length,
        status: hasNext ? "running" : "completing",
        progress: Math.round(((phaseIndex + 1) / job.phases.length) * 100),
        output: output.substring(0, 500),
      });
    } catch { /* non-critical */ }
  }

  private async completeDbAgentJob(agent: typeof agentsTable.$inferSelect) {
    const jobType = agent.currentJobType!;
    const jobs = JOB_REGISTRY[1] ?? [];
    const job = jobs.find(j => j.type === jobType);

    const newJobsCompleted = (agent.jobsCompleted ?? 0) + 1;
    totalJobsCompleted++;

    // Expertise gain: +1 per job, +2 for complex jobs
    const xpGain = (job?.phases.length ?? 5) >= 5 ? 2 : 1;
    const newExpertise = (agent.expertiseLevel ?? 1) + xpGain;

    await db.update(agentsTable).set({
      currentJobType: null,
      currentJobPhase: null,
      currentJobPhaseIndex: 0,
      totalJobPhases: 5,
      currentTask: null,
      jobsCompleted: newJobsCompleted,
      expertiseLevel: newExpertise,
      completedTasks: sql`${agentsTable.completedTasks} + 1`,
    }).where(eq(agentsTable.id, agent.id));

    const lvlLabel = expertiseLabel(newExpertise);
    await logEvent(agent.id, agent.name, "job_completed",
      `✓ ${job?.title ?? jobType} COMPLETE | Expertise: Lv.${newExpertise} (${lvlLabel}) | Model: ${globalModelVersion}`);

    if (job?.collaborationTopic) {
      await storeMemory(agent.id,
        `JOB_COMPLETE: ${jobType} | ${job.collaborationTopic} | Jobs done: ${newJobsCompleted}`);
    }

    // Trigger pipeline notification to another floor
    if (job?.notifyFloor) {
      await this.triggerPipelineHandoff(agent.id, agent.name, job);
    }
  }

  // ── Tick B: NPC Agent Jobs (Floors 2-5) ───────────────────────────────────────
  private async tickNpcAgentJobs() {
    if (!this.running) return;
    try {
      // Process 3-4 random NPCs per tick (keeps it natural, not all at once)
      const toProcess = NPC_PROFILES
        .sort(() => Math.random() - 0.5)
        .slice(0, rand(3, 5));

      for (const npc of toProcess) {
        if (!chance(80)) continue;
        if (!npc.currentJob) {
          npc.currentJob = pickJob(npc.floor);
          npc.currentPhaseIndex = 0;
          npc.currentJobStarted = new Date();
          await logEvent(npc.id, npc.name, "job_started",
            `[${npc.department}] Starting: ${npc.currentJob.title} | Specialty: ${npc.specialty}`);
          continue;
        }

        const job = npc.currentJob;
        const phase = job.phases[npc.currentPhaseIndex] as SkillPhase;

        if (npc.currentPhaseIndex >= job.phases.length) {
          // Job complete
          npc.jobsCompleted++;
          npc.expertiseLevel += 1;
          totalJobsCompleted++;
          const lvlLabel = expertiseLabel(npc.expertiseLevel);
          await logEvent(npc.id, npc.name, "job_completed",
            `✓ ${job.title} COMPLETE | Lv.${npc.expertiseLevel} ${lvlLabel} | ${npc.department} | ${globalModelVersion}`);

          if (job.collaborationTopic) {
            await storeMemory(npc.id,
              `JOB_COMPLETE: ${job.type} | ${job.collaborationTopic}`);
          }

          if (job.notifyFloor) {
            await this.triggerPipelineHandoff(npc.id, npc.name, job);
          }

          // Start next job
          npc.currentJob = pickJob(npc.floor);
          npc.currentPhaseIndex = 0;
          npc.currentJobStarted = new Date();
        } else {
          // Advance phase
          const output = getPhaseOutput(job, phase);
          const phaseLabel = `${SKILL_PHASE_VERBS[phase]} [${phase.toUpperCase()}]`;
          await logEvent(npc.id, npc.name, `skill_${phase}`,
            `${phaseLabel} — ${output}`);
          await storeMemory(npc.id,
            `PHASE:${phase.toUpperCase()} | ${job.type} | ${output.substring(0, 200)}`);
          npc.currentPhaseIndex++;
        }
      }
    } catch (err) {
      logger.error({ err }, "tickNpcAgentJobs failed");
    }
  }

  // ── Tick C: Cross-Floor Collaboration ────────────────────────────────────────
  private async tickCollaboration() {
    if (!this.running) return;
    try {
      if (!chance(70)) return;

      // Pick one DB agent + one NPC from a different floor
      const agents = await db.select().from(agentsTable);
      if (agents.length === 0) return;

      const dbAgent = agents[Math.floor(Math.random() * agents.length)];
      const npcPool = NPC_PROFILES.filter(n => n.floor !== 1);
      if (npcPool.length === 0) return;
      const npc = pick(npcPool);

      const collabMessages = [
        `Sharing ${dbAgent.currentJobType ?? "API spec"} output with ${npc.department} team — results ready for integration.`,
        `Cross-floor review: ${npc.name} flagged potential issue in ${dbAgent.specialty} module. Investigating.`,
        `${npc.name} (${npc.department}) requested ${dbAgent.specialty} support on ${npc.currentJob?.title ?? "current task"}.`,
        `Joint session: ${dbAgent.name} + ${npc.name} aligning on model serving requirements vs training constraints.`,
        `${dbAgent.name} delegated data validation task to ${npc.name}. Waiting for Floor ${npc.floor} confirmation.`,
        `Sync complete: ${npc.name} acknowledged ${dbAgent.name}'s ${dbAgent.currentJobType ?? "latest"} output. Proceeding.`,
      ];

      const msg = pick(collabMessages);
      await logEvent(dbAgent.id, dbAgent.name, "collaboration",
        `[Cross-floor with ${npc.name}/F${npc.floor}] ${msg}`);
      await logEvent(npc.id, npc.name, "collaboration",
        `[Cross-floor with ${dbAgent.name}/F1] ${msg}`);

      await db.update(agentsTable).set({
        lastCollaboratedWith: npc.id,
        lastCollaborationAt: new Date(),
      }).where(eq(agentsTable.id, dbAgent.id));

    } catch (err) {
      logger.error({ err }, "tickCollaboration failed");
    }
  }

  // ── Pipeline Handoff (Floor → Floor notification) ────────────────────────────
  private async triggerPipelineHandoff(
    fromAgentId: number, fromAgentName: string, job: JobDef,
  ) {
    const targetFloor = job.notifyFloor;
    if (!targetFloor) return;

    // Find an agent on the target floor
    const targetNpc = NPC_PROFILES.find(n => n.floor === targetFloor);
    const targetName = targetNpc?.name ?? `Floor ${targetFloor} team`;
    const targetId = targetNpc?.id ?? targetFloor * 100 + 1;
    const targetDept = targetNpc?.department ?? "Operations";

    await logEvent(fromAgentId, fromAgentName, "pipeline_handoff",
      `📤 HANDOFF → ${targetName} (${targetDept}/F${targetFloor}): ${job.collaborationTopic}`);

    await logEvent(targetId, targetName, "pipeline_received",
      `📥 RECEIVED from ${fromAgentName} (F${job.floor}): ${job.collaborationTopic} | Starting dependent tasks.`);

    // Trigger dependent NPC job
    if (targetNpc) {
      const dependentJobs = JOB_REGISTRY[targetFloor] ?? [];
      const handoffTypes: Record<number, string> = {
        1: "model_deployment",
        4: "training_run",
        5: "quality_review",
      };
      const triggerType = handoffTypes[targetFloor];
      if (triggerType) {
        const triggerJob = dependentJobs.find(j => j.type === triggerType);
        if (triggerJob) {
          targetNpc.currentJob = triggerJob;
          targetNpc.currentPhaseIndex = 0;
          targetNpc.currentJobStarted = new Date();
          await logEvent(targetId, targetNpc.name, "job_started",
            `🚀 Pipeline-triggered: ${triggerJob.title} | From: ${fromAgentName}`);
        }
      }
    }
  }

  // ── Tick D: Pipeline Progression ─────────────────────────────────────────────
  private async tickPipelineProgression() {
    if (!this.running) return;
    try {
      if (totalJobsCompleted > 0 && totalJobsCompleted % 8 === 0) {
        // Trigger a coordinated pipeline event
        const pipelineEvents = [
          { agent: "ATLAS", id: 301, msg: "Dataset v{v} finalized — 847K quality-filtered samples ready for training. Notifying Floor 4." },
          { agent: "TITAN", id: 401, msg: "Training run initiated on dataset v{v}. GPU cluster locked (8×H100). ETA: 72h." },
          { agent: "ARIA",  id: 1,   msg: "Model checkpoint received from Training. Beginning blue-green deployment pipeline." },
          { agent: "APEX",  id: 501, msg: "Release review triggered. Evaluating dlv-{mv} candidate against all quality gates." },
        ];

        for (const evt of pipelineEvents) {
          const msg = evt.msg
            .replace("{v}", String(Math.floor(totalJobsCompleted / 2)))
            .replace("{mv}", globalModelVersion);
          const agentId = typeof evt.id === "number" ? evt.id : 1;
          await logEvent(agentId, evt.agent, "pipeline_event", `🔗 PIPELINE: ${msg}`);
        }
      }
    } catch (err) {
      logger.error({ err }, "tickPipelineProgression failed");
    }
  }

  // ── Tick E: Expertise & Model Version Progression ────────────────────────────
  private async tickExpertiseProgression() {
    if (!this.running) return;
    try {
      // Check if any DB agent should level up significantly
      const agents = await db.select().from(agentsTable);
      for (const agent of agents) {
        const jobs = agent.jobsCompleted ?? 0;
        // Every 5 jobs: bonus expertise
        if (jobs > 0 && jobs % 5 === 0 && chance(60)) {
          const bonus = rand(1, 3);
          const newLvl = (agent.expertiseLevel ?? 1) + bonus;
          await db.update(agentsTable).set({ expertiseLevel: newLvl }).where(eq(agentsTable.id, agent.id));
          const lvlLabel = expertiseLabel(newLvl);
          await logEvent(agent.id, agent.name, "level_up",
            `⚡ Expertise gained! ${agent.name} → Lv.${newLvl} ${lvlLabel} | Specialty: ${agent.specialty}`);
        }
      }

      // Every 20 total jobs: patch version bump
      if (totalJobsCompleted > 0 && totalJobsCompleted % 20 === 0) {
        const newVersion = bumpModelVersion("patch");
        // Update all DB agents
        await db.update(agentsTable).set({ modelVersion: newVersion });
        // Update all NPC profiles
        NPC_PROFILES.forEach(n => n.modelVersion = newVersion);
        // Announce via APEX (executive agent)
        await logEvent(501, "APEX", "model_version_bump",
          `🚀 MODEL VERSION: DLavie OS AI → ${newVersion} | ${totalJobsCompleted} collaborative jobs completed across all floors.`);
      }

      // Every 60 total jobs: minor version bump + all-hands announcement
      if (totalJobsCompleted > 0 && totalJobsCompleted % 60 === 0) {
        const newVersion = bumpModelVersion("minor");
        await db.update(agentsTable).set({ modelVersion: newVersion });
        NPC_PROFILES.forEach(n => n.modelVersion = newVersion);
        await logEvent(501, "APEX", "major_milestone",
          `🎉 MILESTONE: DLavie OS AI upgraded to ${newVersion}! All agents collectively completed ${totalJobsCompleted} jobs. Capabilities expanded.`);
        await logEvent(502, "ZENITH", "release_approved",
          `✅ Quality gates passed. ${newVersion} approved for production. Leaderboard update pending. All floors: proceed to next cycle.`);
      }
    } catch (err) {
      logger.error({ err }, "tickExpertiseProgression failed");
    }
  }

  // ── Tick F: Cleanup ───────────────────────────────────────────────────────────
  private async tickCleanup() {
    if (!this.running) return;
    try {
      // Keep last 300 activity events
      const [{ maxId }] = await db.select({ maxId: sql<number>`max(id)` }).from(activityEventsTable);
      if (maxId && maxId > 300) {
        await db.delete(activityEventsTable).where(lt(activityEventsTable.id, maxId - 300));
      }

      // Keep last 400 agent messages
      const [{ maxMsgId }] = await db.select({ maxMsgId: sql<number>`max(id)` }).from(agentMessagesTable);
      if (maxMsgId && maxMsgId > 400) {
        await db.delete(agentMessagesTable).where(lt(agentMessagesTable.id, maxMsgId - 400));
      }

      // Keep last 200 agent jobs
      const [{ maxJobId }] = await db.select({ maxJobId: sql<number>`max(id)` }).from(agentJobsTable);
      if (maxJobId && maxJobId > 200) {
        await db.delete(agentJobsTable).where(lt(agentJobsTable.id, maxJobId - 200));
      }

      logger.debug("AgentJobEngine cleanup complete");
    } catch (err) {
      logger.error({ err }, "AgentJobEngine cleanup failed");
    }
  }
}

export const agentEngine = new AgentJobEngine();
