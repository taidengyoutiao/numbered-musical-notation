<template>
  <div class="note" :style="{ width: noteWidth }">
    <div class="note-lines">
      <div
        v-for="(line, index) in noteLines"
        :key="index"
        class="note-line"
      >
        <div v-if="line.highDots" class="range-dots high">
          <div v-for="n in line.highDots" :key="`high-${index}-${n}`" class="range-line">
            <div class="range-line-dot"></div>
          </div>
        </div>
        <div class="note-symbol">
          <sup v-if="line.hasFlat">b</sup>
          <sup v-if="line.hasSharp">#</sup>
          <span>{{ line.displayKey }}</span>
        </div>
        <div v-if="line.lowDots" class="range-dots low">
          <div v-for="n in line.lowDots" :key="`low-${index}-${n}`" class="range-line">
            <div class="range-line-dot"></div>
          </div>
        </div>
      </div>
    </div>
    <!-- tempo decoration -->
    <template v-if="noteTempo === 1">
      <div class="deco-sixteen1"></div>
      <div class="deco-sixteen2"></div>
    </template>
    <template v-if="noteTempo === 2">
      <div class="deco-eight"></div>
    </template>
    <template v-if="noteTempo === 3">
      <div class="deco-eight"></div>
      <div class="deco-dot">
        <div class="dot"></div>
      </div>
    </template>
    <template v-if="noteTempo === 6">
      <div class="deco-dot">
        <div class="dot"></div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  noteData: {
    type: Object,
    default: () => ({})
  }
})

const noteTempo = computed(() => Number(props.noteData?.tempo) || 0)

const noteLines = computed(() => {
  const notes = Array.isArray(props.noteData?.notes)
    ? props.noteData.notes
    : []
  if (!notes.length) {
    return [
      {
        displayKey: '',
        hasSharp: false,
        hasFlat: false,
        highDots: 0,
        lowDots: 0
      }
    ]
  }
  return notes.map((note) => {
    const normalizedKey = String(note?.key ?? '')
    const accidental = note?.accidental ?? ''
    const hasSharp = accidental === '#' || normalizedKey.includes('#')
    const hasFlat = accidental === '@' || normalizedKey.includes('@')
    const cleanKey = normalizedKey.replace(/[@#]/g, '')
    const rangeValue = Number(note?.range) || 0
    return {
      displayKey: cleanKey || normalizedKey || '0',
      hasSharp,
      hasFlat,
      highDots: rangeValue > 0 ? rangeValue : 0,
      lowDots: rangeValue < 0 ? Math.abs(rangeValue) : 0
    }
  })
})

const noteWidth = computed(() => {
  if (noteTempo.value === 1) {
    return '10px'
  }
  if (noteTempo.value === 2 || noteTempo.value === 3) {
    return '20px'
  }
  if (noteTempo.value === 4 || noteTempo.value === 6) {
    return '40px'
  }
  return '40px'
})
</script>

<style scoped lang="scss">
  .note {
    text-align: center;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    line-height: 1.4;
    position: relative;
    min-height: 20px;
    padding: 4px 0 6px;
    box-sizing: border-box;
  }

  .note-lines {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 100%;
  }

  .note-line {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.2;
    width: 100%;
  }

  .note-symbol {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
  }

  .note-symbol span {
    display: inline-block;
  }

  .range-dots {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: 100%;
  }

  .range-dots.high {
    margin-bottom: 2px;
  }

  .range-dots.low {
    margin-top: 2px;
  }

  .range-line {
    position: relative;
    width: 100%;
    height: 1px;
    background-color: #000;
  }

  .range-line-dot {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 2px;
    border-radius: 50%;
    background-color: #000;
    transform: translate(-50%, -50%);
  }

  .deco-sixteen1 {
    position: absolute;
    width: 100%;
    left: 0;
    bottom: 0;
    height: 1px;
    background-color: #000;
  }

  .deco-sixteen2,
  .deco-eight {
    position: absolute;
    width: 100%;
    left: 0;
    bottom: 2px;
    height: 1px;
    background-color: #000;
  }

  .deco-dot {
    position: absolute;
    width: 100%;
    top: 0;
    left: 0;
    height: 100%;

    .dot {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      background-color: #000;
      width: 2px;
      height: 2px;
      border-radius: 50%;
    }
  }

  sup {
    vertical-align: 0;
  }
</style>
