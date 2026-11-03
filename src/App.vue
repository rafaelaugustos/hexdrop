<script setup lang="ts">
import { ref } from 'nativescript-vue'
import { Page, type EventData } from '@nativescript/core'
import HexdropHeader from './components/HexdropHeader.vue'
import PotionStage from './components/PotionStage.vue'
import IngredientPanel from './components/IngredientPanel.vue'
import LaunchScreen from './components/LaunchScreen.vue'
import { usePotion } from './composables/usePotion'

const {
  phase, file, percent, hovering, choosing, error, isExample, soundEnabled,
  attachScene, toggleSound, setHover, primaryAction, brew, chooseFile, prepareDrag, unload, dropTarget,
} = usePotion()
const compact = ref(false)
const launching = ref(true)
const contentVisible = ref(false)
function pageLayout(event: EventData) {
  const page = event.object as Page
  const height = page.getActualSize().height
  page.statusBarStyle = 'light'
  compact.value = height > 0 && height < 690
}
</script>

<template>
  <Page actionBarHidden="true" backgroundColor="#0a090e" @loaded="pageLayout" @layoutChanged="pageLayout" @unloaded="unload">
    <GridLayout>
      <GridLayout v-if="contentVisible" rows="auto,*,auto" class="screen" :class="{ compact }"
        :isUserInteractionEnabled="!launching">
        <HexdropHeader row="0" :sound-enabled="soundEnabled" @toggle-sound="toggleSound" />
        <PotionStage row="1" :phase="phase" :percent="percent" :hovering="hovering" @scene-ready="attachScene" @brew="brew" />
        <IngredientPanel row="2" :phase="phase" :file="file" :percent="percent" :is-example="isExample"
          :choosing="choosing" :error="error" :drop-target="dropTarget"
          @drag-start="prepareDrag" @hover="setHover" @brew="brew" @primary="primaryAction" @choose="chooseFile" />
      </GridLayout>
      <LaunchScreen v-if="launching" @reveal="contentVisible = true" @finished="launching = false" />
    </GridLayout>
  </Page>
</template>
