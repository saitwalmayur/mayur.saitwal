import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PoolAudioService {
  private ctx: AudioContext | null = null;
  public isMuted = false;

  private initCtx(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Realistic cue stick strike on cue ball:
   * Crisp chalk scrape + solid wooden thud
   */
  playCueHit(power: number = 0.5): void {
    if (typeof window === 'undefined' || this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const normPower = Math.min(Math.max(power, 0.1), 1.0);

    // 1. Solid wooden pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 * (0.8 + normPower * 0.4), t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);

    gain.gain.setValueAtTime(0.45 * normPower, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);

    // 2. Leather chalk tip scrape / snap (filtered white noise)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.035);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800, t);
    filter.Q.setValueAtTime(2.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3 * normPower, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    whiteNoise.start(t);
  }

  /**
   * Crisp phenolic resin ball-to-ball collision clack
   */
  playBallHit(velocity: number = 1.0): void {
    if (typeof window === 'undefined' || this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const normVel = Math.min(Math.max(velocity / 3.0, 0.05), 1.0);

    // High frequency resin click (dual resonant frequencies ~2200Hz & ~3600Hz)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(2400 + Math.random() * 200, t);
    osc1.frequency.exponentialRampToValueAtTime(800, t + 0.035);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(3600 + Math.random() * 300, t);
    osc2.frequency.exponentialRampToValueAtTime(1200, t + 0.025);

    const vol = 0.5 * normVel;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.04);
    osc2.stop(t + 0.04);
  }

  /**
   * Cushion / rubber rail thud
   */
  playCushionHit(velocity: number = 1.0): void {
    if (typeof window === 'undefined' || this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const normVel = Math.min(Math.max(velocity / 2.5, 0.08), 1.0);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.08);

    gain.gain.setValueAtTime(0.35 * normVel, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * Ball drop into pocket cup and leather funnel
   */
  playPocketDrop(): void {
    if (typeof window === 'undefined' || this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Initial hollow cup thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.18);

    // 2. Secondary rattle
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const t2 = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(260, t2);
      osc2.frequency.exponentialRampToValueAtTime(90, t2 + 0.1);

      gain2.gain.setValueAtTime(0.25, t2);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.12);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t2);
      osc2.stop(t2 + 0.12);
    }, 90);
  }

  /**
   * Foul warning alert
   */
  playFoul(): void {
    if (typeof window === 'undefined' || this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.linearRampToValueAtTime(130, t + 0.25);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.28);
  }

  /**
   * Coin earned chime
   */
  playCoinChime(): void {
    if (typeof window === 'undefined' || this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);

      gain.gain.setValueAtTime(0.25, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.25);
    });
  }

  /**
   * Cue upgrade / purchase fanfare
   */
  playUpgradeSuccess(): void {
    if (typeof window === 'undefined' || this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.09);

      gain.gain.setValueAtTime(0.3, t + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.35);
    });
  }

  /**
   * Victory triumphant fanfare
   */
  playVictory(): void {
    if (typeof window === 'undefined' || this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chords = [
      { notes: [523.25, 659.25, 783.99], time: 0 },
      { notes: [587.33, 739.99, 880.0], time: 0.18 },
      { notes: [659.25, 830.61, 987.77], time: 0.36 },
      { notes: [783.99, 987.77, 1174.66, 1567.98], time: 0.58 },
    ];

    chords.forEach((chord) => {
      chord.notes.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + chord.time);

        gain.gain.setValueAtTime(0.2, t + chord.time);
        gain.gain.exponentialRampToValueAtTime(0.001, t + chord.time + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + chord.time);
        osc.stop(t + chord.time + 0.55);
      });
    });
  }
}
