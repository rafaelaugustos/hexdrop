import { computed, onBeforeUnmount, ref, shallowRef } from 'nativescript-vue'
import { Application, ApplicationSettings } from '@nativescript/core'
import type { PotionView } from '../potion/potion-view'
import { EXAMPLE_FILE, fileError, type SpellFile } from '../services/files'
import { pickFile } from '../services/file-picker'

export type PotionPhase = 'ready' | 'brewing' | 'complete'
const SOUND_PREFERENCE = 'hexdrop.soundEnabled'

/** Owns the current ingredient and brew; native artwork owns its playback. */
export function usePotion() {
  const phase = ref<PotionPhase>('ready')
  const file = ref<SpellFile>({ ...EXAMPLE_FILE })
  const percent = ref(0)
  const hovering = ref(false)
  const choosing = ref(false)
  const error = ref('')
  const isExample = ref(true)
  const soundEnabled = ref(ApplicationSettings.getBoolean(SOUND_PREFERENCE, true))
  const scene = shallowRef<PotionView>()
  const busy = computed(() => phase.value === 'brewing' || choosing.value)
  let tick: ReturnType<typeof setInterval> | undefined
  let brewId = 0
  let selectionId = 0

  function attachScene(view: PotionView) {
    scene.value = view
    view.setSoundEnabled(soundEnabled.value)
  }

  function toggleSound() {
    if (Application.suspended) return
    soundEnabled.value = !soundEnabled.value
    ApplicationSettings.setBoolean(SOUND_PREFERENCE, soundEnabled.value)
    scene.value?.setSoundEnabled(soundEnabled.value)
  }

  function setHover(active: boolean) {
    if (hovering.value === active) return
    hovering.value = active
    scene.value?.hover(active)
  }

  function stopTick() {
    if (tick) clearInterval(tick)
    tick = undefined
  }

  function startTick() {
    stopTick()
    // Only the text is sampled in JS. The liquid and spider share a native clock.
    tick = setInterval(() => {
      percent.value = Math.min(99, Math.floor((scene.value?.progress ?? 0) * 100))
    }, 100)
  }

  function reset() {
    brewId++
    stopTick()
    scene.value?.reset()
    phase.value = 'ready'
    percent.value = 0
    error.value = ''
    setHover(false)
  }

  async function brew() {
    if (Application.suspended || !scene.value || busy.value) return
    const validation = fileError(file.value)
    if (validation) { error.value = validation; return }
    const id = ++brewId
    const currentScene = scene.value
    error.value = ''
    phase.value = 'brewing'
    percent.value = 0
    startTick()
    try {
      const finished = await currentScene.brew()
      if (id !== brewId) return
      stopTick()
      phase.value = finished ? 'complete' : 'ready'
      percent.value = finished ? 100 : 0
    } catch (cause) {
      if (id !== brewId) return
      reset()
      error.value = 'The spell was interrupted. Try again.'
      console.error('[Hexdrop]', cause)
    }
  }

  function primaryAction() {
    // UIKit may deliver a pending button action as press feedback is suspended.
    // Only foreground interaction may start or cancel a spell.
    if (Application.suspended) return
    if (phase.value === 'brewing') reset()
    else void brew()
  }

  async function chooseFile() {
    if (Application.suspended || busy.value) return
    const id = ++selectionId
    choosing.value = true
    error.value = ''
    try {
      const selected = await pickFile()
      if (id !== selectionId || !selected) return
      const validation = fileError(selected)
      if (validation) { error.value = validation; return }
      reset()
      file.value = selected
      isExample.value = false
    } catch {
      if (id === selectionId) error.value = 'Could not open this file. Try another.'
    } finally {
      if (id === selectionId) choosing.value = false
    }
  }

  function prepareDrag() {
    if (phase.value === 'complete') reset()
  }

  function resume() {
    if (phase.value === 'brewing') startTick()
  }

  function unload() {
    // NativeScript transiently unloads the root when the app is backgrounded.
    if (Application.suspended) { stopTick(); return }
    selectionId++
    choosing.value = false
    reset()
    scene.value = undefined
  }

  Application.on(Application.suspendEvent, stopTick)
  Application.on(Application.resumeEvent, resume)
  onBeforeUnmount(() => {
    brewId++
    selectionId++
    stopTick()
    scene.value?.disposeScene()
    Application.off(Application.suspendEvent, stopTick)
    Application.off(Application.resumeEvent, resume)
  })

  return {
    phase, file, percent, hovering, choosing, error, isExample, soundEnabled, busy,
    attachScene, toggleSound, setHover, primaryAction, brew, chooseFile, prepareDrag, unload,
    dropTarget: () => scene.value?.dropRect(),
  }
}
