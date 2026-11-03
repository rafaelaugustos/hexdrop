import type { SoundClip } from './audio-types'

export function createSoundClip(filePath: string): SoundClip {
  const player = new android.media.MediaPlayer()
  try {
    player.setAudioAttributes(new android.media.AudioAttributes.Builder()
      .setUsage(android.media.AudioAttributes.USAGE_GAME)
      .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build())
    player.setDataSource(filePath)
    player.prepare()
  } catch (error) {
    player.release()
    throw error
  }
  return {
    play() { player.start() },
    pause() {
      const playing = player.isPlaying()
      if (playing) player.pause()
      return playing
    },
    stop() { if (player.isPlaying()) player.pause(); player.seekTo(0) },
    setVolume(volume) { player.setVolume(volume, volume) },
    dispose() { player.release() },
  }
}
