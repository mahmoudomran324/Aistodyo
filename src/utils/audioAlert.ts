class SoundAlertService {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private intervalId: any = null;
  private currentOscillator: OscillatorNode | null = null;

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playNewOrderAlarm() {
    this.initContext();
    if (this.isPlaying) return;
    this.isPlaying = true;

    let high = false;
    const playBeep = () => {
      if (!this.isPlaying) return;
      try {
        if (!this.audioCtx) this.initContext();
        if (!this.audioCtx) return;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        // High frequency alternating siren (880Hz / 1250Hz) - loud and unmistakable
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(high ? 1250 : 880, this.audioCtx.currentTime);

        // Maximum safe audible gain
        gain.gain.setValueAtTime(0.85, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.35);

        high = !high;
      } catch (e) {
        console.warn('Audio play error:', e);
      }
    };

    // Immediate first beep
    playBeep();
    // Continuous repetition every 400ms until stopped
    this.intervalId = setInterval(playBeep, 400);
  }

  public stopAlarm() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public playTestChime() {
    this.initContext();
    try {
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio test chime error:', e);
    }
  }
}

export const soundAlert = new SoundAlertService();
