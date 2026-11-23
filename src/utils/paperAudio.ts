/**
 * Subtle, muted-by-default procedural Web Audio synthesizer for paper & stationery foley.
 * Never autoplays; only produces audio when explicitly enabled by the user.
 */
class PaperAudioEngine {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private volume = 0.45;
  private lastWriteTick = 0;

  setConfig(enabled: boolean, volume: number) {
    this.enabled = enabled;
    this.volume = Math.max(0, Math.min(1, volume));
  }

  private ensureContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private playFilteredNoise(
    durationSec: number,
    centerFreq: number,
    q: number,
    gainPeak: number,
    filterType: BiquadFilterType = 'bandpass'
  ) {
    const ctx = this.ensureContext();
    if (!ctx || this.volume <= 0.01) return;

    const sampleRate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * durationSec));
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = centerFreq;
    filter.Q.value = q;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const amp = gainPeak * this.volume;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0005, amp), now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  }

  playWriteScratch() {
    const now = performance.now();
    if (now - this.lastWriteTick < 75) return;
    this.lastWriteTick = now;
    this.playFilteredNoise(0.032, 2400 + Math.random() * 500, 3.2, 0.035, 'bandpass');
  }

  playInkClick() {
    const ctx = this.ensureContext();
    if (!ctx || this.volume <= 0.01) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.045);
    gain.gain.setValueAtTime(0.08 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  playPageTurn() {
    this.playFilteredNoise(0.24, 950, 0.9, 0.11, 'bandpass');
    setTimeout(() => {
      this.playFilteredNoise(0.09, 620, 1.4, 0.05, 'lowpass');
    }, 95);
  }

  playTear() {
    this.playFilteredNoise(0.28, 1750, 1.8, 0.16, 'bandpass');
    setTimeout(() => {
      this.playFilteredNoise(0.14, 2450, 2.4, 0.09, 'highpass');
    }, 80);
  }

  playFoldOrCrumple(stage = 1) {
    const bursts = Math.min(4, Math.max(1, stage));
    for (let i = 0; i < bursts; i++) {
      setTimeout(() => {
        this.playFilteredNoise(0.09, 1600 + i * 320, 1.6, 0.11, 'bandpass');
      }, i * 48);
    }
  }

  playPaperLand(inWastebasket = false) {
    this.playFilteredNoise(0.08, inWastebasket ? 420 : 280, 1.1, 0.12, 'lowpass');
    if (inWastebasket) {
      const ctx = this.ensureContext();
      if (!ctx || this.volume <= 0.01) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.11);
      gain.gain.setValueAtTime(0.06 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    }
  }
}

export const paperAudio = new PaperAudioEngine();
