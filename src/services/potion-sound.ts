import { Application, knownFolders, path } from '@nativescript/core'
import type { AudioCue, SoundClip } from './audio-types'
import { createSoundClip } from './sound-player'

/** Native audio follows the same scene boundaries as the visual animation. */
export class PotionSound {
  private clips = new Map<AudioCue, SoundClip>()
  private current?: SoundClip
  private resumePlayback = false

  constructor() {
    for (const cue of ['ignition', 'complete'] as const) {
      try {
        const clip = createSoundClip(path.join(knownFolders.currentApp().path, 'audio', `${cue}.wav`))
        clip.setVolume(0.7)
        this.clips.set(cue, clip)
      } catch (error) {
        // A device audio failure should never stop the potion animation.
        console.warn(`[Hexdrop] Could not prepare ${cue} sound:`, error)
      }
    }
    Application.on(Application.suspendEvent, this.pause)
    Application.on(Application.resumeEvent, this.resume)
  }

  setEnabled(enabled: boolean) {
    // Keep the native clock running silently so unmuting stays in sync.
    this.clips.forEach(clip => clip.setVolume(enabled ? 0.7 : 0))
  }

  play(cue: AudioCue) {
    this.stop()
    this.current = this.clips.get(cue)
    if (!Application.suspended) this.startCurrent()
    else this.resumePlayback = !!this.current
  }

  private startCurrent() {
    try { this.current?.play() }
    catch (error) { console.warn('[Hexdrop] Could not play sound:', error) }
  }

  private pause = () => { this.resumePlayback = this.current?.pause() ?? false }
  private resume = () => {
    if (this.resumePlayback) this.startCurrent()
    this.resumePlayback = false
  }

  stop() {
    this.resumePlayback = false
    this.current?.stop()
    this.current = undefined
  }

  dispose() {
    this.stop()
    Application.off(Application.suspendEvent, this.pause)
    Application.off(Application.resumeEvent, this.resume)
    this.clips.forEach(clip => clip.dispose())
    this.clips.clear()
  }
}
