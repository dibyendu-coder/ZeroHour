/**
 * Web Audio API synthesizer for focus sounds, metronome ticks, and zen meditation chimes.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Play a clean analog-style click / metronome tick
   */
  public playTick() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (e) {
      console.error("Failed to play tick:", e);
    }
  }

  /**
   * Play a deep, resonant Tibetan/Zen bell chime
   */
  public playZenChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Primary tone
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(293.66, now); // D4 note

      // Harmonic chime ring
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, now); // A4 (harmonic 5th)

      // Warm sub-base resonance
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(146.83, now); // D3 (octave below)

      // Gains
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      gain2.gain.setValueAtTime(0.15, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      gain3.gain.setValueAtTime(0.1, now);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      osc1.connect(gain1);
      osc2.connect(gain2);
      osc3.connect(gain3);

      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(1.0, now);

      gain1.connect(masterGain);
      gain2.connect(masterGain);
      gain3.connect(masterGain);

      masterGain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc3.start();

      osc1.stop(now + 3.1);
      osc2.stop(now + 1.6);
      osc3.stop(now + 2.1);
    } catch (e) {
      console.error("Failed to play Zen chime:", e);
    }
  }

  /**
   * Start or update a continuous, warm calming breathing drone sound
   */
  public startBreathingDrone() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      if (this.droneOsc) {
        this.stopBreathingDrone();
      }

      const now = this.ctx.currentTime;
      this.droneOsc = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();
      this.droneFilter = this.ctx.createBiquadFilter();

      this.droneOsc.type = 'triangle';
      this.droneOsc.frequency.setValueAtTime(110, now); // A2 low drone

      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(200, now);
      this.droneFilter.Q.setValueAtTime(3, now);

      this.droneGain.gain.setValueAtTime(0.02, now);

      this.droneOsc.connect(this.droneFilter);
      this.droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.ctx.destination);

      this.droneOsc.start();
    } catch (e) {
      console.error("Failed to start breathing drone:", e);
    }
  }

  /**
   * Sweep drone cutoff filter frequency to simulate in/out breaths sonically
   */
  public sweepDrone(direction: 'in' | 'out', durationSeconds = 4) {
    if (!this.ctx || !this.droneFilter || !this.droneGain) return;
    const now = this.ctx.currentTime;

    if (direction === 'in') {
      // Inhale: filter opens up, volume swells slightly
      this.droneFilter.frequency.exponentialRampToValueAtTime(450, now + durationSeconds);
      this.droneGain.gain.linearRampToValueAtTime(0.04, now + durationSeconds);
    } else {
      // Exhale: filter closes down, volume dims
      this.droneFilter.frequency.exponentialRampToValueAtTime(150, now + durationSeconds);
      this.droneGain.gain.linearRampToValueAtTime(0.015, now + durationSeconds);
    }
  }

  public stopBreathingDrone() {
    try {
      if (this.droneOsc) {
        this.droneOsc.stop();
        this.droneOsc.disconnect();
        this.droneOsc = null;
      }
      if (this.droneGain) {
        this.droneGain.disconnect();
        this.droneGain = null;
      }
      if (this.droneFilter) {
        this.droneFilter.disconnect();
        this.droneFilter = null;
      }
    } catch (e) {
      console.error("Failed to stop breathing drone:", e);
    }
  }
}

export const synth = new AudioSynthesizer();
