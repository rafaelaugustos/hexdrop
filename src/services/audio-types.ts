export type AudioCue = 'ignition' | 'complete'

export interface SoundClip {
  play(): void
  /** Pause playback and report whether it was active. */
  pause(): boolean
  stop(): void
  setVolume(volume: number): void
  dispose(): void
}
