/**
 * Synthesized Crystalline Web Audio Engine for the Cosmic Diamond Portal.
 *
 * Generates original, non-intrusive procedural audio sequences using the Web Audio API:
 * 1. Extended 3-Phase Fracture Sequence (6.0s):
 *    - Phase A (0.0-2.5s): Delicate glass-like harmonic resonance & progressive micro-fissure chimes
 *    - Phase B (2.5-5.0s): Deep sub-harmonic zero-gravity plate separation layer
 *    - Phase C (5.0-6.0s): Spacious orbital equilibrium chord
 * 2. Core Implosion & Supernova Sequence (2.85s):
 *    - Phase A implosion sweep -> Phase B radial supernova bloom -> Phase C cosmic emergence
 * 3. Organic Gravitational Reassembly & Crystalline Healing Sequence (3.6s):
 *    - Phase A magnetic attraction hum -> Phase B alignment chimes -> Phase C final 0.5s harmonious healing chord
 *
 * Strictly respects browser autoplay policies, uses smooth gain envelopes, and cleans up all nodes.
 */

type AudioContextConstructor = typeof AudioContext;

function getAudioContextClass(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return win.AudioContext || win.webkitAudioContext || null;
}

class CrystalSoundEngine {
  private ctx: AudioContext | null = null;
  private activeNodes: Set<AudioNode> = new Set();
  private activeOscillators: Set<OscillatorNode> = new Set();
  private cleanupTimers: Set<number> = new Set();

  private ensureContext(): AudioContext | null {
    try {
      const Ctor = getAudioContextClass();
      if (!Ctor) return null;
      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new Ctor();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public stopAll(): void {
    for (const timer of this.cleanupTimers) {
      window.clearTimeout(timer);
    }
    this.cleanupTimers.clear();

    const now = this.ctx ? this.ctx.currentTime : 0;
    for (const osc of this.activeOscillators) {
      try {
        osc.stop(now + 0.02);
      } catch {
        // Already stopped
      }
    }
    this.activeOscillators.clear();

    for (const node of this.activeNodes) {
      try {
        node.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }
    this.activeNodes.clear();
  }

  private registerOsc(osc: OscillatorNode, nodes: AudioNode[], stopAtSec: number): void {
    this.activeOscillators.add(osc);
    for (const n of nodes) {
      this.activeNodes.add(n);
    }
    const delayMs = Math.max(100, Math.ceil(stopAtSec * 1000) + 120);
    const tid = window.setTimeout(() => {
      this.cleanupTimers.delete(tid);
      this.activeOscillators.delete(osc);
      for (const n of nodes) {
        try {
          n.disconnect();
        } catch {
          // Ignore
        }
        this.activeNodes.delete(n);
      }
    }, delayMs);
    this.cleanupTimers.add(tid);
  }

  /**
   * Stage 1: 4.5-second progressive crystalline fracture, separation & orbital settling soundscape.
   * - Phase A (0.0 - 1.8s): Internal cracking & rising harmonic resonance
   * - Phase B (1.8 - 3.5s): Progressive separation sub-harmonic & zero-gravity bells
   * - Phase C (3.5 - 4.5s): Orbital stabilization chord
   */
  public playFractureSequence(reducedMotion = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.stopAll();
    const now = ctx.currentTime;

    try {
      if (reducedMotion) {
        this.scheduleGlassBell(ctx, now + 0.02, 528, 0.032, 0.9);
        this.scheduleGlassBell(ctx, now + 0.14, 792, 0.024, 1.1);
        return;
      }

      // 1. Phase A (0.0 - 1.8s): Incipient internal crystalline resonance & rising harmonic tension
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.linearRampToValueAtTime(0.038, now + 0.85);
      masterGain.gain.linearRampToValueAtTime(0.054, now + 1.8);
      masterGain.gain.linearRampToValueAtTime(0.04, now + 3.5);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.65);
      masterGain.connect(ctx.destination);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(3.2, now);
      filter.frequency.setValueAtTime(680, now);
      filter.frequency.exponentialRampToValueAtTime(2200, now + 1.78);
      filter.frequency.exponentialRampToValueAtTime(1250, now + 4.4);
      filter.connect(masterGain);

      const tensionFreqs = [528, 792, 1188];
      tensionFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx === 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);
        // Subtle harmonic tension bend during Phase A crack growth
        osc.frequency.linearRampToValueAtTime(freq * 1.018, now + 1.8);
        osc.frequency.linearRampToValueAtTime(freq, now + 4.2);

        const weight = idx === 0 ? 0.55 : idx === 1 ? 0.35 : 0.2;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(weight, now + 0.32 + idx * 0.18);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 4.55);

        osc.connect(g);
        g.connect(filter);
        osc.start(now);
        osc.stop(now + 4.68);
        this.registerOsc(osc, [osc, g, filter, masterGain], 4.75);
      });

      // Delicate high-frequency crystalline micro-fissure chimes across Phase A (0.18s -> 1.68s)
      const crackTimes = [0.18, 0.44, 0.72, 0.98, 1.24, 1.48, 1.70];
      const crackPitches = [1760, 2112, 2376, 2640, 2966, 3168, 3564];
      crackTimes.forEach((offsetSec, i) => {
        const amp = 0.009 + (i / crackTimes.length) * 0.014;
        this.scheduleGlassBell(ctx, now + offsetSec, crackPitches[i], amp, 0.38);
      });

      // 2. Phase B (1.8 - 3.5s): Deep sub-harmonic resonant layer as the 12 crystal fragments separate
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(132, now + 1.76);
      subOsc.frequency.exponentialRampToValueAtTime(198, now + 3.45);
      subGain.gain.setValueAtTime(0.0001, now + 1.76);
      subGain.gain.linearRampToValueAtTime(0.046, now + 2.3);
      subGain.gain.linearRampToValueAtTime(0.03, now + 3.45);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.55);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now + 1.76);
      subOsc.stop(now + 4.6);
      this.registerOsc(subOsc, [subOsc, subGain], 4.65);

      // Shimmering zero-gravity plate separation bells (1.85s -> 3.35s)
      const sepOffsets = [1.85, 2.22, 2.58, 2.95, 3.32];
      const sepFreqs = [880, 1056, 1320, 1584, 1320];
      sepOffsets.forEach((t, i) => {
        this.scheduleGlassBell(ctx, now + t, sepFreqs[i], 0.016, 0.85);
      });

      // 3. Phase C (3.5 - 4.5s): Spacious orbital settling resonance
      const settleChord = [264, 396, 594, 792];
      settleChord.forEach((freq, i) => {
        this.scheduleGlassBell(ctx, now + 3.48 + i * 0.07, freq, 0.014, 1.15);
      });
    } catch {
      // Fail silently if audio graph creation is restricted
    }
  }

  /**
   * Stage 2: Core implosion -> Supernova radial release -> Cosmic emergence soundscape (2.1s).
   */
  public playCoreSupernovaSequence(reducedMotion = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.stopAll();
    const now = ctx.currentTime;

    try {
      if (reducedMotion) {
        this.scheduleGlassBell(ctx, now + 0.02, 396, 0.028, 0.8);
        return;
      }

      // Phase A (0.0 - 0.65s): Core activation inward sweep
      const impOsc = ctx.createOscillator();
      const impGain = ctx.createGain();
      impOsc.type = 'triangle';
      impOsc.frequency.setValueAtTime(320, now);
      impOsc.frequency.exponentialRampToValueAtTime(145, now + 0.62);
      impGain.gain.setValueAtTime(0.0001, now);
      impGain.gain.linearRampToValueAtTime(0.04, now + 0.5);
      impGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.78);
      impOsc.connect(impGain);
      impGain.connect(ctx.destination);
      impOsc.start(now);
      impOsc.stop(now + 0.82);
      this.registerOsc(impOsc, [impOsc, impGain], 0.88);

      // Phase B (0.62 - 2.1s): Supernova radial release & celestial chord
      const burstChord = [146.83, 293.66, 440, 659.25, 880, 1318.5];
      burstChord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = i < 2 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq * 0.98, now + 0.62);
        osc.frequency.exponentialRampToValueAtTime(freq, now + 1.12);
        g.gain.setValueAtTime(0.0001, now + 0.62);
        g.gain.linearRampToValueAtTime(i < 2 ? 0.032 : 0.016, now + 0.92);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.15);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now + 0.62);
        osc.stop(now + 2.2);
        this.registerOsc(osc, [osc, g], 2.25);
      });
    } catch {
      // Ignore audio errors
    }
  }

  /**
   * Stage 3: 3.6-second Organic Gravitational Reassembly & Crystalline Healing soundscape.
   */
  public playReassemblySequence(reducedMotion = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.stopAll();
    const now = ctx.currentTime;

    try {
      if (reducedMotion) {
        this.scheduleGlassBell(ctx, now + 0.02, 528, 0.025, 0.85);
        this.scheduleGlassBell(ctx, now + 0.12, 1056, 0.022, 0.95);
        return;
      }

      // Phase A & B (0.0 - 3.1s): Gentle magnetic attraction hum rising into alignment
      const magOsc = ctx.createOscillator();
      const magGain = ctx.createGain();
      magOsc.type = 'sine';
      magOsc.frequency.setValueAtTime(176, now);
      magOsc.frequency.exponentialRampToValueAtTime(264, now + 3.05);
      magGain.gain.setValueAtTime(0.0001, now);
      magGain.gain.linearRampToValueAtTime(0.032, now + 1.2);
      magGain.gain.linearRampToValueAtTime(0.038, now + 2.9);
      magGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.65);
      magOsc.connect(magGain);
      magGain.connect(ctx.destination);
      magOsc.start(now);
      magOsc.stop(now + 3.7);
      this.registerOsc(magOsc, [magOsc, magGain], 3.75);

      // Ascending crystalline alignment chimes during Phase B (1.4s -> 2.95s)
      const alignTimes = [1.45, 1.82, 2.16, 2.48, 2.78];
      const alignFreqs = [660, 792, 880, 1056, 1320];
      alignTimes.forEach((t, i) => {
        this.scheduleGlassBell(ctx, now + t, alignFreqs[i], 0.013, 0.72);
      });

      // Phase C (3.1 - 3.6s): Final 0.5s harmonious crystalline healing resonance
      const healChord = [528, 660, 792, 1056, 1584];
      healChord.forEach((freq, i) => {
        this.scheduleGlassBell(ctx, now + 3.06 + i * 0.04, freq, 0.018, 1.25);
      });
    } catch {
      // Ignore audio errors
    }
  }

  private scheduleGlassBell(
    ctx: AudioContext,
    startTime: number,
    frequency: number,
    peakGain: number,
    durationSec: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + durationSec + 0.04);

    const stopAfter = Math.max(0.2, startTime - ctx.currentTime + durationSec + 0.1);
    this.registerOsc(osc, [osc, gain], stopAfter);
  }

  public dispose(): void {
    this.stopAll();
    if (this.ctx && this.ctx.state !== 'closed') {
      void this.ctx.close().catch(() => {});
    }
    this.ctx = null;
  }
}

export const crystalSoundEngine = new CrystalSoundEngine();
