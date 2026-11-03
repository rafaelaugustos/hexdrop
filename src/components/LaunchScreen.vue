<script setup lang="ts">
import { nextTick, onBeforeUnmount } from 'nativescript-vue'
import { Application, type EventData, type GridLayout, type View } from '@nativescript/core'
import { playLaunch } from '../launch/launch-animation'

const emit = defineEmits<{ reveal: []; finished: [] }>()
let playback: ReturnType<typeof playLaunch> | undefined
let disposed = false

function layout(event: EventData) {
  const root = event.object as GridLayout
  const stage = root.getViewById<View>('launch-stage')
  const size = root.getActualSize()
  if (!stage || !size.width || !size.height) return
  const scale = Math.min(1, (size.width - 24) / 320, (size.height - 24) / 360)
  stage.scaleX = scale
  stage.scaleY = scale
  // Native transform pivots need their final bounds before tracks are compiled.
  if (!playback && root.isLoaded) void start(root)
}

async function start(root: GridLayout) {
  if (playback || disposed) return
  try {
    playback = playLaunch(root, async () => {
      emit('reveal')
      await nextTick()
    })
    const completed = await playback.finished
    if (completed && !disposed) emit('finished')
  } catch (error) {
    // The entrance must never prevent access to the actual app.
    console.warn('[Hexdrop] Could not play launch animation:', error)
    if (!disposed) { emit('reveal'); emit('finished') }
  }
}

function dispose() {
  disposed = true
  playback?.dispose()
}

function unloaded() {
  if (!Application.suspended) dispose()
}

onBeforeUnmount(dispose)
</script>

<template>
  <GridLayout class="launch-screen" @loaded="layout" @layoutChanged="layout" @unloaded="unloaded"
    accessible="true" accessibilityLabel="Hexdrop. A little alchemy for your files." automationText="launch-screen">
    <AbsoluteLayout id="launch-stage" width="320" height="360" horizontalAlignment="center" verticalAlignment="middle" accessible="false">
      <GridLayout id="launch-halo" left="10" top="0" width="300" height="300" opacity="0">
        <GridLayout id="launch-halo-paint" width="300" height="300" />
      </GridLayout>
      <GridLayout id="launch-seal" left="32" top="22" width="256" height="256" opacity="0">
        <GridLayout id="launch-seal-paint" width="256" height="256" />
      </GridLayout>
      <GridLayout id="launch-flash" left="32" top="22" width="256" height="256" opacity="0">
        <GridLayout id="launch-flash-paint" width="256" height="256" />
      </GridLayout>
      <Image id="launch-mark" left="50" top="40" width="220" height="220" src="~/assets/hexdrop-mark.png" stretch="aspectFit" accessible="false" />
      <GridLayout id="launch-motes" left="136" top="126" width="48" height="48" />
      <Label id="launch-title" left="0" top="274" width="320" height="48" text="HEXDROP" class="launch-title" opacity="0" accessible="false" />
      <Label id="launch-caption" left="0" top="330" width="320" height="24" text="A little alchemy for your files." class="launch-caption" opacity="0" accessible="false" />
    </AbsoluteLayout>
  </GridLayout>
</template>
