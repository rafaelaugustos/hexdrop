import type { SoundClip } from './audio-types'

export function createSoundClip(filePath: string): SoundClip {
  // Ambient effects mix with other audio and respect the iPhone silent switch.
  AVAudioSession.sharedInstance().setCategoryError(AVAudioSessionCategoryAmbient)
  const player = AVAudioPlayer.alloc().initWithContentsOfURLError(NSURL.fileURLWithPath(filePath))
  player.prepareToPlay()
  return {
    play() { if (!player.play()) throw new Error('Native audio output could not start.') },
    pause() {
      const playing = player.playing
      if (playing) player.pause()
      return playing
    },
    stop() { player.stop(); player.currentTime = 0 },
    setVolume(volume) { player.volume = volume },
    dispose() { player.stop() },
  }
}
