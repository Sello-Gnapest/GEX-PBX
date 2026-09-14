// Web Audio API engine for realistic PBX sound effects: DTMF, Ringtone, Ringback, Hold Music, Call tones

class AudioEngine {
  private ctx: AudioContext | null = null;
  private ringOsc1: OscillatorNode | null = null;
  private ringOsc2: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;
  private ringInterval: number | null = null;
  private holdInterval: number | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopRingtone();
      this.stopRingback();
      this.stopHoldMusic();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Play DTMF Dual-Tone Multi-Frequency for telephone dialpad
   */
  public playDtmf(key: string, durationMs: number = 140) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const dtmfFrequencies: Record<string, [number, number]> = {
        '1': [697, 1209],
        '2': [697, 1336],
        '3': [697, 1477],
        '4': [770, 1209],
        '5': [770, 1336],
        '6': [770, 1477],
        '7': [852, 1209],
        '8': [852, 1336],
        '9': [852, 1477],
        '*': [941, 1209],
        '0': [941, 1336],
        '#': [941, 1477],
      };

      const freqs = dtmfFrequencies[key] || [941, 1336];
      const now = ctx.currentTime;
      const durationSec = durationMs / 1000;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freqs[0], now);
      osc2.frequency.setValueAtTime(freqs[1], now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + durationSec);
      osc2.stop(now + durationSec);
    } catch {
      // Ignore audio context autoplay constraints
    }
  }

  /**
   * Incoming phone ringtone (400Hz + 450Hz South African standard cadence: 0.4s on, 0.2s off, 0.4s on, 2.0s off)
   */
  public startRingtone() {
    if (this.isMuted) return;
    this.stopRingtone();
    try {
      const ctx = this.getContext();

      const playRingBurst = () => {
        if (this.isMuted) return;
        const now = ctx.currentTime;
        // First burst: 0.4s
        this.createDualBurst(ctx, 400, 450, now, 0.4);
        // Second burst: after 0.6s, duration 0.4s
        this.createDualBurst(ctx, 400, 450, now + 0.6, 0.4);
      };

      playRingBurst();
      this.ringInterval = window.setInterval(playRingBurst, 3000);
    } catch {
      // Audio context error
    }
  }

  private createDualBurst(ctx: AudioContext, f1: number, f2: number, startTime: number, duration: number) {
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();

    o1.type = 'sine';
    o2.type = 'sine';
    o1.frequency.setValueAtTime(f1, startTime);
    o2.frequency.setValueAtTime(f2, startTime);

    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(0.18, startTime + 0.05);
    g.gain.setValueAtTime(0.18, startTime + duration - 0.05);
    g.gain.linearRampToValueAtTime(0, startTime + duration);

    o1.connect(g);
    o2.connect(g);
    g.connect(ctx.destination);

    o1.start(startTime);
    o2.start(startTime);
    o1.stop(startTime + duration);
    o2.stop(startTime + duration);
  }

  public stopRingtone() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  /**
   * Ringback tone for outbound dialing (400Hz + 450Hz standard)
   */
  public startRingback() {
    if (this.isMuted) return;
    this.stopRingback();
    try {
      const ctx = this.getContext();
      const playBeep = () => {
        if (this.isMuted) return;
        const now = ctx.currentTime;
        this.createDualBurst(ctx, 400, 450, now, 0.8);
      };
      playBeep();
      this.ringInterval = window.setInterval(playBeep, 2400);
    } catch {
      // Ignore
    }
  }

  public stopRingback() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  /**
   * Call connected chime
   */
  public playConnectChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.08);
        gain.gain.setValueAtTime(0.08, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Call disconnect tone (standard busy tone pulses)
   */
  public playDisconnectTone() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const start = now + i * 0.35;
        this.createDualBurst(ctx, 480, 620, start, 0.2);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Play an arbitrary sequence of melodic tones for button or status confirmation
   */
  public playToneSequence(frequencies: number[], stepDurationMs: number = 80) {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const stepSec = stepDurationMs / 1000;

      frequencies.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * stepSec);
        gain.gain.setValueAtTime(0.08, now + idx * stepSec);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * stepSec);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * stepSec);
        osc.stop(now + (idx + 1) * stepSec);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Ambient PBX on-hold music loop
   */
  public startHoldMusic() {
    if (this.isMuted) return;
    this.stopHoldMusic();
    try {
      const ctx = this.getContext();
      const chords = [
        [261.63, 329.63, 392.00], // C major
        [220.00, 261.63, 329.63], // A minor
        [174.61, 220.00, 261.63], // F major
        [196.00, 246.94, 293.66], // G major
      ];
      let step = 0;

      const playChord = () => {
        if (this.isMuted) return;
        const now = ctx.currentTime;
        const currentChord = chords[step % chords.length];
        step++;

        currentChord.forEach((f) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now);
          gain.gain.setValueAtTime(0.025, now);
          gain.gain.linearRampToValueAtTime(0.04, now + 0.8);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 2.0);
        });
      };

      playChord();
      this.holdInterval = window.setInterval(playChord, 2000);
    } catch {
      // Ignore
    }
  }

  public stopHoldMusic() {
    if (this.holdInterval) {
      clearInterval(this.holdInterval);
      this.holdInterval = null;
    }
  }

  /**
   * Voicemail greeting / prompt beep
   */
  public playVoicemailTone() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    } catch {
      // Ignore
    }
  }

  /**
   * Speak text via SpeechSynthesis if available, or play greeting tone
   */
  public speakText(text: string, onEnd?: () => void) {
    if (this.isMuted) {
      onEnd?.();
      return;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => onEnd?.();
      utterance.onerror = () => onEnd?.();
      window.speechSynthesis.speak(utterance);
    } else {
      this.playVoicemailTone();
      setTimeout(() => onEnd?.(), 1200);
    }
  }

  public stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioEngine = new AudioEngine();
