<script setup lang="ts">
import { computed } from 'nativescript-vue'
import type { EventData } from '@nativescript/core'
import type { PotionPhase } from '../composables/usePotion'
import type { PotionView } from '../potion/potion-view'

const props = defineProps<{ phase: PotionPhase; percent: number; hovering: boolean }>()
const emit = defineEmits<{ 'scene-ready': [view: PotionView]; brew: [] }>()
const status = computed(() => props.hovering ? 'Let go. The magic starts here.' :
  props.phase === 'brewing' ? 'A little patience. A little magic.' :
  props.phase === 'complete' ? 'Your spell is ready.' : 'Every spell begins with a file.')
const counter = computed(() => props.phase === 'ready' ? 'Ready for a little magic' :
  props.phase === 'complete' ? 'Potion complete' : 'Brewing your potion')
const sceneLoaded = (event: EventData) => emit('scene-ready', event.object as PotionView)
</script>

<template>
  <GridLayout rows="auto,auto,auto,auto" verticalAlignment="middle" class="hero">
    <Label row="0" :text="phase === 'complete' ? 'TRANSMUTATION COMPLETE' : 'YOUR VIAL OF POSSIBILITIES'" class="eyebrow" horizontalAlignment="center" />
    <PotionView row="1" @loaded="sceneLoaded" @tap="emit('brew')" />
    <StackLayout row="2" class="readout" horizontalAlignment="center">
      <GridLayout columns="auto,auto" horizontalAlignment="center" v-if="phase !== 'ready'">
        <Label col="0" :text="String(percent).padStart(2, '0')" class="percentage" />
        <Label col="1" text="%" class="percent-sign" verticalAlignment="middle" />
      </GridLayout>
      <Label v-else text="drop a little magic here" class="drop-prompt" :class="{ 'is-hovering': hovering }" />
      <Label :text="counter" class="counter-caption" :class="{ success: phase === 'complete' }" horizontalAlignment="center" />
    </StackLayout>
    <Label row="3" :text="status" class="status" textWrap="true" horizontalAlignment="center" />
  </GridLayout>
</template>
