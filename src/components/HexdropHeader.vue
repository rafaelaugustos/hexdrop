<script setup lang="ts">
defineProps<{ soundEnabled: boolean }>()
const emit = defineEmits<{ 'toggle-sound': [] }>()
</script>

<template>
  <StackLayout class="header">
    <GridLayout columns="auto,*,auto" class="brand-row">
      <Label col="0" text="✧" class="brand-star" accessible="false" />
      <Label col="1" text="HEXDROP" class="wordmark" />
      <Button col="2" :text="soundEnabled ? 'Sound on' : 'Sound off'" class="sound-toggle" @tap="emit('toggle-sound')" :accessibilityLabel="soundEnabled ? 'Mute sound effects' : 'Enable sound effects'" accessible="true" accessibilityRole="button" automationText="sound-toggle" />
    </GridLayout>
    <Label text="One file.&#10;A little alchemy." textWrap="true" class="headline" />
    <Label text="Add an ingredient. Watch the magic happen." textWrap="true" class="intro" />
  </StackLayout>
</template>
