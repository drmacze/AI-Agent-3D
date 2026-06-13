
class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private _masterVolume = 0.7;
  private _musicVolume = 0.45;
  private _sfxVolume = 0.8;

  private musicInterval: ReturnType<typeof setInterval> | null = null;
  private musicScheduledTime = 0;
  private musicNoteIdx = 0;
  private musicActive = false;

  private lastBumpTime = 0;
  private lastChatTimes: Record<string, number> = {};

  private ensureCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this._masterVolume;
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this._musicVolume;
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this._sfxVolume;
        this.sfxGain.connect(this.masterGain);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setMasterVolume(v: number) {
    this._masterVolume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this._masterVolume;
  }

  setMusicVolume(v: number) {
    this._musicVolume = Math.max(0, Math.min(1, v));
    if (this.musicGain) this.musicGain.gain.value = this._musicVolume;
  }

  setSfxVolume(v: number) {
    this._sfxVolume = Math.max(0, Math.min(1, v));
    if (this.sfxGain) this.sfxGain.gain.value = this._sfxVolume;
  }

  getMasterVolume() { return this._masterVolume; }
  getMusicVolume() { return this._musicVolume; }
  getSfxVolume() { return this._sfxVolume; }

  private noiseBuffer(dur: number): AudioBuffer | null {
    const ctx = this.ensureCtx();
    if (!ctx) return null;
    const n = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  playFootstep(running: boolean) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const dur = running ? 0.055 : 0.075;

    const buf = this.noiseBuffer(0.18);
    if (buf) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = running ? 700 : 450;
      filt.Q.value = 1.8;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(running ? 0.38 : 0.22, now + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(filt); filt.connect(env); env.connect(this.sfxGain);
      src.start(now); src.stop(now + dur);
    }

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(running ? 160 : 100, now);
    osc.frequency.exponentialRampToValueAtTime(running ? 45 : 32, now + dur);
    const oscEnv = ctx.createGain();
    oscEnv.gain.setValueAtTime(running ? 0.48 : 0.32, now);
    oscEnv.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(oscEnv); oscEnv.connect(this.sfxGain);
    osc.start(now); osc.stop(now + dur);
  }

  playBump() {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    if (now - this.lastBumpTime < 0.3) return;
    this.lastBumpTime = now;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.28);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.9, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(env); env.connect(this.sfxGain);
    osc.start(now); osc.stop(now + 0.3);

    const buf = this.noiseBuffer(0.12);
    if (buf) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass"; f.frequency.value = 2800; f.Q.value = 2.5;
      const ne = ctx.createGain();
      ne.gain.setValueAtTime(0.55, now);
      ne.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      src.connect(f); f.connect(ne); ne.connect(this.sfxGain);
      src.start(now); src.stop(now + 0.12);
    }
  }

  playNpcChat(npcId: string, pitchSeed = 1) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const last = this.lastChatTimes[npcId] ?? 0;
    if (now - last < 2.5) return;
    this.lastChatTimes[npcId] = now;

    const basePitch = 140 + (pitchSeed % 7) * 28;
    const pulses = 2 + Math.floor(Math.random() * 5);

    for (let i = 0; i < pulses; i++) {
      const t = now + i * (0.075 + Math.random() * 0.055);
      const dur = 0.038 + Math.random() * 0.05;
      const pitch = basePitch * (0.82 + Math.random() * 0.36);

      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(pitch, t);
      osc.frequency.setValueAtTime(pitch * (0.95 + Math.random() * 0.1), t + dur * 0.5);

      const f1 = ctx.createBiquadFilter();
      f1.type = "bandpass";
      f1.frequency.value = 420 + Math.random() * 1400;
      f1.Q.value = 4 + Math.random() * 3;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.13, t + 0.007);
      env.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(f1); f1.connect(env); env.connect(this.sfxGain);
      osc.start(t); osc.stop(t + dur + 0.01);
    }
  }

  playJump() {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(420, now + 0.12);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.5, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(env); env.connect(this.sfxGain);
    osc.start(now); osc.stop(now + 0.2);
  }

  playLand() {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const buf = this.noiseBuffer(0.15);
    if (buf) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = 350;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.55, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      src.connect(f); f.connect(env); env.connect(this.sfxGain);
      src.start(now); src.stop(now + 0.15);
    }
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.12);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.7, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(env); env.connect(this.sfxGain);
    osc.start(now); osc.stop(now + 0.14);
  }

  startAmbientMusic() {
    if (this.musicActive) return;
    this.musicActive = true;

    const ctx = this.ensureCtx();
    if (!ctx || !this.musicGain) return;

    const D_PENT = [
      146.83, 164.81, 185.00, 220.00, 246.94,
      293.66, 329.63, 369.99, 440.00, 493.88,
      587.33, 659.25, 739.99,
    ];
    const BASS = [73.42, 82.41, 98.00, 110.00, 123.47];
    const BEAT = 0.92;

    const pad = (freq: number, t: number, dur: number, vol = 0.07) => {
      if (!ctx || !this.musicGain) return;
      const o1 = ctx.createOscillator();
      o1.type = "sine";
      o1.frequency.value = freq;

      const o2 = ctx.createOscillator();
      o2.type = "triangle";
      o2.frequency.value = freq * 2.003;

      const o3 = ctx.createOscillator();
      o3.type = "sine";
      o3.frequency.value = freq * 0.5;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(vol, t + 0.35);
      env.gain.setValueAtTime(vol, t + dur - 0.5);
      env.gain.linearRampToValueAtTime(0, t + dur);

      const delayNode = ctx.createDelay(1.0);
      delayNode.delayTime.value = BEAT * 0.5;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.28;
      const delayGain = ctx.createGain();
      delayGain.gain.value = 0.22;

      o1.connect(env); o2.connect(env); o3.connect(env);
      env.connect(this.musicGain!);
      env.connect(delayNode);
      delayNode.connect(feedback);
      feedback.connect(delayNode);
      delayNode.connect(delayGain);
      delayGain.connect(this.musicGain!);

      [o1, o2, o3].forEach(o => { o.start(t); o.stop(t + dur + 0.05); });
    };

    this.musicScheduledTime = ctx.currentTime + 0.2;
    this.musicNoteIdx = 0;

    const schedule = () => {
      if (!ctx || !this.musicGain || !this.musicActive) return;
      const ahead = 5;
      while (this.musicScheduledTime < ctx.currentTime + ahead) {
        const idx = this.musicNoteIdx;
        const note = D_PENT[idx % D_PENT.length];
        const bassNote = BASS[Math.floor(idx / 3) % BASS.length];

        pad(note, this.musicScheduledTime, BEAT * 1.8);

        if (idx % 6 === 0) pad(bassNote, this.musicScheduledTime, BEAT * 6, 0.09);
        if (idx % 3 === 0) pad(note * 2, this.musicScheduledTime, BEAT * 1.2, 0.04);

        this.musicNoteIdx++;
        this.musicScheduledTime += BEAT * (idx % 4 === 3 ? 2 : 1);
      }
    };

    schedule();
    this.musicInterval = setInterval(schedule, 2500);
  }

  stopAmbientMusic() {
    this.musicActive = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  resume() {
    if (this.ctx?.state === "suspended") this.ctx.resume().catch(() => {});
  }
}

export const audioManager = new AudioManager();
