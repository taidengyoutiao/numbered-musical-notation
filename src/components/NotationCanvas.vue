<template>
  <canvas ref="canvasRef" class="notation-canvas"></canvas>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  bars: {
    type: Array,
    default: () => []
  }
})

const canvasRef = ref(null)

const CANVAS_MIN_WIDTH = 360
const CANVAS_MAX_WIDTH = 900
const CANVAS_PADDING_X = 24
const CANVAS_PADDING_Y = 24
const BAR_HEIGHT = 88
const BAR_VERTICAL_GAP = 36
const BAR_HORIZONTAL_GAP = 14
const BAR_PADDING_LEFT = 6
const BAR_PADDING_RIGHT = 12
const BAR_BORDER_WIDTH = 1
const NOTE_AREA_HEIGHT = 56
const NOTE_LINE_SPACING = 18
const NOTE_GROUP_GAP = 10
const RANGE_DOT_SPACING = 6
const DOT_RADIUS = 1.5
const MIN_BAR_WIDTH = 64

const getNoteWidth = (tempo) => {
  switch (tempo) {
    case 1:
      return 10
    case 2:
    case 3:
      return 20
    case 4:
    case 6:
      return 40
    default:
      return 40
  }
}

const createNoteLines = (noteData) => {
  const source = Array.isArray(noteData?.notes) ? noteData.notes : []
  if (!source.length) {
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
  return source.map((note) => {
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
}

const computeGroupBreaks = (bar) => {
  if (!Array.isArray(bar)) {
    return new Set()
  }
  let sum = 0
  const result = new Set()
  bar.forEach((note, index) => {
    const tempo = Number(note?.tempo) || 0
    sum += tempo
    if (sum > 4) {
      sum = tempo
      result.add(index + 1)
    }
  })
  return result
}

const buildBarGeometry = (rawBar) => {
  const bar = Array.isArray(rawBar) ? rawBar : []
  const groupBreaks = computeGroupBreaks(bar)
  const notes = []
  let totalWidth = BAR_PADDING_LEFT

  bar.forEach((noteData, index) => {
    const tempo = Number(noteData?.tempo) || 0
    const width = getNoteWidth(tempo)
    const addLeadingGap = groupBreaks.has(index + 1)
    if (addLeadingGap) {
      totalWidth += NOTE_GROUP_GAP
    }
    totalWidth += width
    notes.push({
      tempo,
      width,
      lines: createNoteLines(noteData),
      addLeadingGap
    })
  })

  totalWidth += BAR_PADDING_RIGHT + BAR_BORDER_WIDTH
  if (!notes.length) {
    totalWidth += MIN_BAR_WIDTH
  }

  return {
    notes,
    totalWidth
  }
}

const drawRangeLine = (ctx, x1, x2, y) => {
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.stroke()
}

const drawRangeDot = (ctx, x, y) => {
  ctx.beginPath()
  ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2)
  ctx.fill()
}

const drawTempoDecoration = (ctx, note, left, right, top, bottom) => {
  const midY = (top + bottom) / 2
  const baseLine = bottom - 4
  if (note.tempo === 1) {
    drawRangeLine(ctx, left, right, baseLine)
    drawRangeLine(ctx, left, right, baseLine + 2)
  }
  if (note.tempo === 2 || note.tempo === 3) {
    drawRangeLine(ctx, left, right, baseLine + 2)
  }
  if (note.tempo === 3 || note.tempo === 6) {
    drawRangeDot(ctx, right - 3, midY)
  }
}

const drawNote = (ctx, note, left, top, bottom) => {
  const noteWidth = note.width
  const centreY = (top + bottom) / 2
  const lines = Array.isArray(note.lines) ? note.lines : []
  const totalLines = lines.length || 1
  const blockHeight = (totalLines - 1) * NOTE_LINE_SPACING
  const firstLineY = centreY - blockHeight / 2

  lines.forEach((line, index) => {
    const lineY = firstLineY + index * NOTE_LINE_SPACING
    for (let i = 0; i < line.highDots; i += 1) {
      const dotY = lineY - (i + 1) * RANGE_DOT_SPACING
      drawRangeLine(ctx, left, left + noteWidth, dotY)
      drawRangeDot(ctx, left + noteWidth / 2, dotY)
    }

    const accidental = line.hasSharp ? '#' : line.hasFlat ? 'b' : ''
    const text = `${accidental}${line.displayKey ?? ''}`
    if (text.trim()) {
      ctx.fillText(text, left + noteWidth / 2, lineY)
    }

    for (let i = 0; i < line.lowDots; i += 1) {
      const dotY = lineY + (i + 1) * RANGE_DOT_SPACING
      drawRangeLine(ctx, left, left + noteWidth, dotY)
      drawRangeDot(ctx, left + noteWidth / 2, dotY)
    }
  })

  drawTempoDecoration(ctx, note, left, left + noteWidth, top, bottom)
}

const drawBar = (ctx, bar) => {
  const barTop = bar.y
  const barLeft = bar.x
  const noteTop = barTop + (BAR_HEIGHT - NOTE_AREA_HEIGHT) / 2
  const noteBottom = noteTop + NOTE_AREA_HEIGHT
  let cursorX = barLeft + BAR_PADDING_LEFT

  bar.notes.forEach((note) => {
    if (note.addLeadingGap) {
      cursorX += NOTE_GROUP_GAP
    }
    drawNote(ctx, note, cursorX, noteTop, noteBottom)
    cursorX += note.width
  })

  const barLineX = cursorX + BAR_PADDING_RIGHT
  const lineTop = barTop + 8
  const lineBottom = barTop + BAR_HEIGHT - 8
  ctx.beginPath()
  ctx.moveTo(barLineX, lineTop)
  ctx.lineTo(barLineX, lineBottom)
  ctx.stroke()
}

const render = () => {
  const canvas = canvasRef.value
  if (!canvas) {
    return
  }

  const barsInput = Array.isArray(props.bars) ? props.bars : []
  const geometries = barsInput.map((bar) => buildBarGeometry(bar))
  const parentWidth = canvas.parentElement?.clientWidth ?? CANVAS_MAX_WIDTH
  const availableWidth = Math.max(
    CANVAS_MIN_WIDTH,
    Math.min(CANVAS_MAX_WIDTH, parentWidth)
  )

  const layoutBars = []
  let cursorX = CANVAS_PADDING_X
  let cursorY = CANVAS_PADDING_Y
  let rowMaxX = cursorX

  geometries.forEach((geometry) => {
    const barWidth = Math.max(geometry.totalWidth, MIN_BAR_WIDTH)
    if (
      layoutBars.length > 0 &&
      cursorX + barWidth > availableWidth - CANVAS_PADDING_X
    ) {
      rowMaxX = Math.max(rowMaxX, cursorX - BAR_HORIZONTAL_GAP)
      cursorX = CANVAS_PADDING_X
      cursorY += BAR_HEIGHT + BAR_VERTICAL_GAP
    }
    layoutBars.push({
      ...geometry,
      x: cursorX,
      y: cursorY,
      width: barWidth
    })
    cursorX += barWidth + BAR_HORIZONTAL_GAP
  })

  if (layoutBars.length > 0) {
    rowMaxX = Math.max(rowMaxX, cursorX - BAR_HORIZONTAL_GAP)
  }

  const contentWidth = layoutBars.length
    ? Math.max(rowMaxX + CANVAS_PADDING_X, availableWidth)
    : availableWidth
  const displayWidth = Math.min(
    Math.max(contentWidth, CANVAS_MIN_WIDTH),
    CANVAS_MAX_WIDTH
  )
  const displayHeight = layoutBars.length
    ? cursorY + BAR_HEIGHT + CANVAS_PADDING_Y
    : BAR_HEIGHT + CANVAS_PADDING_Y * 2

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  canvas.width = displayWidth * dpr
  canvas.height = displayHeight * dpr
  canvas.style.width = `${displayWidth}px`
  canvas.style.height = `${displayHeight}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, displayWidth, displayHeight)
  ctx.lineWidth = 1 / dpr
  ctx.strokeStyle = '#333'
  ctx.fillStyle = '#333'
  ctx.font = '14px "Noto Sans", "Helvetica Neue", Arial, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  layoutBars.forEach((bar) => {
    drawBar(ctx, bar)
  })
}

const requestRender = () => {
  if (typeof window !== 'undefined') {
    window.requestAnimationFrame(() => {
      render()
    })
  } else {
    render()
  }
}

onMounted(() => {
  requestRender()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', requestRender)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', requestRender)
  }
})

watch(
  () => props.bars,
  () => {
    requestRender()
  },
  { deep: true }
)

watch(
  () => canvasRef.value,
  () => {
    nextTick(() => {
      requestRender()
    })
  }
)
</script>

<style scoped>
.notation-canvas {
  width: 100%;
  display: block;
}
</style>
