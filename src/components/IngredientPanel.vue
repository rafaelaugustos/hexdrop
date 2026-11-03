<script setup lang="ts">
import { computed, onBeforeUnmount } from 'nativescript-vue'
import type { EventData, View } from '@nativescript/core'
import { motionScope } from '@rafaelaugusto/jolt'
import type { PotionPhase } from '../composables/usePotion'
import { useIngredientDrag } from '../composables/useIngredientDrag'
import { fileSize, type SpellFile } from '../services/files'
import type { Rect } from '../potion/geometry'

const props = defineProps<{
  phase: PotionPhase
  file: SpellFile
  percent: number
  isExample: boolean
  choosing: boolean
  error: string
  dropTarget: () => Rect | undefined
}>()
const emit = defineEmits<{
  brew: []; primary: []; choose: []; 'drag-start': []; hover: [active: boolean]
}>()
const fileLabel = computed(() => props.isExample ? 'SAMPLE FILE' : 'YOUR INGREDIENT')
const { dragging, loaded: cardLoaded, tap: cardTap } = useIngredientDrag({
  disabled: computed(() => props.phase === 'brewing' || props.choosing),
  target: () => props.dropTarget(),
  onStart: () => emit('drag-start'),
  onHover: active => emit('hover', active),
  onDrop: () => emit('brew'),
})

const controls = motionScope()
const pressedButtons = new WeakSet<View>()
function buttonLoaded(event: EventData) {
  const button = event.object as View
  if (pressedButtons.has(button)) return
  pressedButtons.add(button)
  controls.press(button, { scale: 0.96 })
}
onBeforeUnmount(() => controls.dispose())
</script>

<template>
  <StackLayout class="footer" zIndex="20">
    <GridLayout columns="*,auto" class="ingredient-label">
      <Label col="0" :text="fileLabel" class="eyebrow" />
      <Label col="1" text="UP TO 200 MB" class="eyebrow" />
    </GridLayout>
    <GridLayout columns="48,*,28" class="file-card" :class="{ completed: phase === 'complete', dragging }" @loaded="cardLoaded" @tap="cardTap" accessible="true" accessibilityRole="button" :accessibilityLabel="`${file.name}, ${fileSize(file.size)}. Tap to brew the potion.`" automationText="spell-file">
      <GridLayout col="0" class="file-icon" width="35" height="42" horizontalAlignment="left" verticalAlignment="middle">
        <Label :text="phase === 'complete' ? '✓' : '↓'" class="file-glyph" horizontalAlignment="center" verticalAlignment="middle" accessible="false" />
      </GridLayout>
      <StackLayout col="1" verticalAlignment="middle">
        <Label :text="file.name" class="file-name" textWrap="false" />
        <Label :text="phase === 'complete' ? 'Transformed into pure magic' : phase === 'brewing' ? `${fileSize(file.size * percent / 100)} of ${fileSize(file.size)}` : `${fileSize(file.size)} · drag or tap`" class="file-detail" :class="{ success: phase === 'complete' }" />
      </StackLayout>
      <Label col="2" :text="phase === 'complete' ? '✧' : '⠿'" class="grip" verticalAlignment="middle" horizontalAlignment="right" accessible="false" />
    </GridLayout>
    <Label v-if="error" :text="error" class="error" textWrap="true" accessibilityLiveRegion="polite" />
    <GridLayout columns="*,12,*" class="actions">
      <Button col="0" :text="phase === 'brewing' ? 'Cancel' : phase === 'complete' ? 'Brew again' : 'Brew potion'" class="primary-button" @loaded="buttonLoaded" @tap="emit('primary')" :isEnabled="!dragging && !choosing" accessible="true" accessibilityRole="button" automationText="brew-button" />
      <Button col="2" :text="choosing ? 'Opening…' : 'Choose file'" :isEnabled="phase !== 'brewing' && !choosing && !dragging" class="secondary-button" @loaded="buttonLoaded" @tap="emit('choose')" accessible="true" accessibilityRole="button" automationText="choose-file" />
    </GridLayout>
  </StackLayout>
</template>
