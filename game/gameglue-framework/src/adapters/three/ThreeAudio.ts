import type { AudioSubsystem } from "~/engine/types";

export class ThreeAudio implements AudioSubsystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmGain: GainNode | null = null;

  private ensureContext(): { ctx: AudioContext; masterGain: GainNode } {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return { ctx: this.ctx, masterGain: this.masterGain! };
  }

  getContext(): AudioContext {
    return this.ensureContext().ctx;
  }

  setBuffer(id: string, buffer: AudioBuffer): void {
    this.buffers.set(id, buffer);
  }

  play(soundId: string, options?: { volume?: number; loop?: boolean }): void {
    const buffer = this.buffers.get(soundId);
    if (!buffer) return;

    const { ctx, masterGain } = this.ensureContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = options?.loop ?? false;

    if (options?.volume !== undefined) {
      const gain = ctx.createGain();
      gain.gain.value = options.volume;
      source.connect(gain);
      gain.connect(masterGain);
    } else {
      source.connect(masterGain);
    }

    source.start();
  }

  playBGM(soundId: string, options?: { volume?: number }): void {
    this.stopBGM();

    const buffer = this.buffers.get(soundId);
    if (!buffer) return;

    const { ctx, masterGain } = this.ensureContext();
    this.bgmSource = ctx.createBufferSource();
    this.bgmSource.buffer = buffer;
    this.bgmSource.loop = true;

    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.value = options?.volume ?? 1;

    this.bgmSource.connect(this.bgmGain);
    this.bgmGain.connect(masterGain);
    this.bgmSource.start();
  }

  stopBGM(): void {
    if (this.bgmSource) {
      try {
        this.bgmSource.stop();
      } catch {
        // Already stopped
      }
      this.bgmSource.disconnect();
      this.bgmSource = null;
    }
    if (this.bgmGain) {
      this.bgmGain.disconnect();
      this.bgmGain = null;
    }
  }

  stopAll(): void {
    this.stopBGM();
  }

  setMasterVolume(volume: number): void {
    const { masterGain } = this.ensureContext();
    masterGain.gain.value = volume;
  }
}
