<template>
  <div>
    <div class="wrapper">
      <h2 class="title">{{ title }}</h2>
      <div>
        <Bar v-for="(item, key) in notes" :key="key" :bar-data="item" />
      </div>
      <hr />
      <div class="title-inp-wrapper"><input type="text" v-model="title" /></div>
      <div>
        <textarea class="content-inp" v-model="content"></textarea>
      </div>
      <i class="material-icons" @click="importFile">add_circle</i>
      <i class="material-icons" @click="exportFile" style="top: 72px;">get_app</i>
      <i v-show="!playing" class="material-icons" @click="playMusic" style="top: 120px;">play_arrow</i>
      <i v-show="playing" class="material-icons" @click="stopMusic" style="top: 120px;">stop</i>
      <input ref="jsonInput" type="file" @change="handleFileChange" />
    </div>
    <div class="info">
      <h2>记谱法：</h2>
      <h3>音高</h3>
      <ul>
        <li>0-7分别代表休止符和音高</li>
        <li>^$ 代表高音低音，支持倍高音和倍低音</li>
        <li>#1 @1 代表升1和降1</li>
      </ul>
      <h3>节奏</h3>
      <ul>
        <li>十六分音符为最小单位</li>
        <li>qwe 分别代表四分音符、八分音符、十六分音符</li>
        <li>qw 代表带附点的四分音符，其他以此类推</li>
        <li>qq qqqq 代表二分音符、全音符</li>
      </ul>
      <h3>其他</h3>
      <ul>
        <li>逗号用来区分音符</li>
        <li>空格用来区分小节</li>
      </ul>
    </div>
    <div class="audio-wrapper">
      <audio
        v-for="name in audioKeys"
        :key="name"
        :ref="setAudioRef(name)"
        :src="`/static/piano/${name}.mp3`"
      ></audio>
    </div>
  </div>
</template>

<script setup>
import { Base64 } from 'js-base64'
import { computed, onMounted, ref } from 'vue'
import Bar from '@/components/Bar.vue'
import song from '@/test.js'

const title = ref('')
const content = ref('')
const playing = ref(false)
const speed = ref(90)
const keysArr = ref([])
const jsonInput = ref(null)

const tempoMap = {
  q: 4,
  rot: 4,
  w: 2,
  e: 1,
  qw: 6,
  wq: 6,
  we: 3,
  ew: 3
}

const DEGREE_TO_SEMITONE = {
  1: 0,
  2: 2,
  3: 4,
  4: 5,
  5: 7,
  6: 9,
  7: 11
}

const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const BASE_OCTAVE = 4

const audioKeyDefinitions = [
  { note: 'A', start: 0, end: 7 },
  { note: 'Bb', start: 0, end: 7 },
  { note: 'B', start: 0, end: 7 },
  { note: 'C', start: 1, end: 8 },
  { note: 'Db', start: 1, end: 8 },
  { note: 'D', start: 1, end: 7 },
  { note: 'Eb', start: 1, end: 7 },
  { note: 'E', start: 1, end: 7 },
  { note: 'F', start: 1, end: 7 },
  { note: 'Gb', start: 1, end: 7 },
  { note: 'G', start: 1, end: 7 },
  { note: 'Ab', start: 1, end: 7 }
]

const audioKeys = audioKeyDefinitions.flatMap(({ note, start, end }) => {
  const keys = []
  for (let octave = start; octave <= end; octave += 1) {
    keys.push(`${note}${octave}`)
  }
  return keys
})

const audioRefs = new Map()

const setAudioRef = (name) => (el) => {
  if (el) {
    audioRefs.set(name, el)
  } else {
    audioRefs.delete(name)
  }
}

const getTempoValue = (tempoCode) => tempoMap[tempoCode] ?? tempoMap.q

const createHoldNotes = () => [
  {
    key: '-',
    range: 0,
    accidental: ''
  }
]

const cloneNotes = (notes) =>
  notes.map((note) => ({
    key: String(note?.key ?? ''),
    range: Number(note?.range) || 0,
    accidental: note?.accidental === '#' || note?.accidental === '@' ? note.accidental : ''
  }))

const extractRangeMarkers = (note) => {
  let range = 0
  let index = 0
  while (index < note.length) {
    const char = note[index]
    if (char === '^') {
      range += 1
      index += 1
      continue
    }
    if (char === '$') {
      range -= 1
      index += 1
      continue
    }
    break
  }
  return { range, length: index }
}

const parseSingleNote = (rawNote) => {
  const trimmed = rawNote.trim()
  if (!trimmed) {
    return null
  }
  const { range, length } = extractRangeMarkers(trimmed)
  let rest = trimmed.slice(length)
  let accidental = ''
  if (rest.startsWith('#') || rest.startsWith('@')) {
    accidental = rest[0]
    rest = rest.slice(1)
  }
  const key = rest || '0'
  return {
    key,
    range,
    accidental
  }
}

const splitChordNotes = (chordContent) => {
  const parts = []
  let current = ''
  for (const char of chordContent) {
    if (char === '+') {
      if (current.trim()) {
        parts.push(current.trim())
      }
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) {
    parts.push(current.trim())
  }
  return parts
}

const splitBarNotes = (bar) => {
  if (!bar) {
    return []
  }
  const tokens = []
  let current = ''
  let depth = 0
  for (const char of bar) {
    if (char === '[') {
      depth += 1
      current += char
      continue
    }
    if (char === ']') {
      if (depth > 0) {
        depth -= 1
      }
      current += char
      continue
    }
    if (char === ',' && depth === 0) {
      if (current.trim()) {
        tokens.push(current.trim())
      }
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) {
    tokens.push(current.trim())
  }
  return tokens
}

const parseNoteCore = (noteCore) => {
  const trimmedCore = noteCore.trim()
  if (!trimmedCore) {
    return []
  }
  if (trimmedCore.startsWith('[') && trimmedCore.endsWith(']')) {
    const inner = trimmedCore.slice(1, -1)
    const chordNotes = splitChordNotes(inner)
    return chordNotes
      .map((note) => parseSingleNote(note))
      .filter((note) => note !== null)
  }
  const single = parseSingleNote(trimmedCore)
  return single ? [single] : []
}

const expandTempo = (notes, tempoCode) => {
  const normalizedTempo = tempoCode || 'q'
  if (
    normalizedTempo.length > 1 &&
    normalizedTempo !== 'rot' &&
    normalizedTempo.split('').every((char) => char === normalizedTempo[0])
  ) {
    const tempoValue = getTempoValue(normalizedTempo[0])
    const events = [
      {
        tempo: tempoValue,
        notes: cloneNotes(notes)
      }
    ]
    for (let i = 1; i < normalizedTempo.length; i += 1) {
      events.push({
        tempo: tempoValue,
        notes: createHoldNotes()
      })
    }
    return events
  }
  return [
    {
      tempo: getTempoValue(normalizedTempo),
      notes: cloneNotes(notes)
    }
  ]
}

const parseNoteToken = (rawNote) => {
  const trimmedNote = rawNote.trim()
  if (!trimmedNote) {
    return []
  }
  const tempoMatch = trimmedNote.match(/(rot|[qwe]+)$/)
  const tempoCode = tempoMatch ? tempoMatch[0] : ''
  const noteCore = tempoCode
    ? trimmedNote.slice(0, -tempoCode.length)
    : trimmedNote
  const notes = parseNoteCore(noteCore)
  if (!notes.length) {
    return []
  }
  return expandTempo(notes, tempoCode)
}

const resolveNoteToAudioKey = (note) => {
  const normalizedKey = String(note?.key ?? '')
  if (!/^[1-7]$/.test(normalizedKey)) {
    return null
  }
  const baseSemitone = DEGREE_TO_SEMITONE[normalizedKey]
  if (typeof baseSemitone !== 'number') {
    return null
  }
  let semitone =
    baseSemitone + (note?.accidental === '#' ? 1 : note?.accidental === '@' ? -1 : 0)
  let octave = BASE_OCTAVE + (Number(note?.range) || 0)
  while (semitone < 0) {
    semitone += 12
    octave -= 1
  }
  while (semitone >= 12) {
    semitone -= 12
    octave += 1
  }
  if (octave < 0 || octave > 8) {
    return null
  }
  const noteName = NOTE_NAMES[semitone]
  return noteName ? `${noteName}${octave}` : null
}

const notes = computed(() => {
  const arr = []
  const newKeys = []
  let contentValue = content.value || ''
  contentValue = contentValue.replace(/\r|\n/g, ' ')
  contentValue = contentValue.replace(/\s+/g, ' ').trim()
  if (!contentValue) {
    keysArr.value = []
    return arr
  }
  const bars = contentValue.split(' ')
  for (const rawBar of bars) {
    const normalizedBar = rawBar.replace(/^[,]*(.*?)[,]*$/, '$1')
    const noteStrings = splitBarNotes(normalizedBar)
    const barArr = []
    for (const note of noteStrings) {
      const events = parseNoteToken(note)
      for (const event of events) {
        barArr.push(event)
        newKeys.push(event)
      }
    }
    arr.push(barArr)
  }
  keysArr.value = newKeys
  return arr
})

const importFile = () => {
  jsonInput.value?.click()
}

const handleFileChange = (event) => {
  const input = event.target
  const file = input.files && input.files[0]
  if (!file) {
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const base64Content = result.includes(',') ? result.split(',')[1] : result
      const data = JSON.parse(Base64.decode(base64Content))
      title.value = data.title || ''
      content.value = data.content || ''
    } catch (error) {
      console.error('无法解析导入的文件', error)
    } finally {
      input.value = ''
    }
  }
  reader.readAsDataURL(file)
}

const exportFile = () => {
  const blob = new Blob([
    JSON.stringify({ title: title.value, content: content.value }, null, 2)
  ], { type: 'application/json' })
  const a = document.createElement('a')
  a.download = `${title.value || 'notation'}.json`
  a.href = window.URL.createObjectURL(blob)
  a.click()
  window.URL.revokeObjectURL(a.href)
}

const stopMusic = () => {
  playing.value = false
  audioRefs.forEach((audio) => {
    audio.pause()
    audio.currentTime = 0
  })
}

const playMusic = () => {
  if (!keysArr.value.length) {
    return
  }
  playing.value = true
  const timeUnit = ((60 / speed.value) * 1000) / 4
  let index = 0

  const playNext = () => {
    const item = keysArr.value[index]
    if (!item) {
      playing.value = false
      return
    }

    const activeAudios = []
    for (const note of item.notes ?? []) {
      const audioKey = resolveNoteToAudioKey(note)
      if (!audioKey) {
        continue
      }
      const audio = audioRefs.get(audioKey)
      if (playing.value && audio) {
        audio.currentTime = 0
        const playPromise = audio.play()
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {})
        }
        activeAudios.push(audio)
      }
    }

    setTimeout(() => {
      activeAudios.forEach((audio) => {
        audio.pause()
        audio.currentTime = 0
      })

      if (!playing.value) {
        return
      }

      index += 1
      if (index < keysArr.value.length) {
        playNext()
      } else {
        playing.value = false
      }
    }, (item.tempo || 0) * timeUnit)
  }

  playNext()
}

onMounted(() => {
  title.value = song.title
  content.value = song.content
})
</script>

<style scoped>
  .wrapper, .info {
    position: relative;
    width: 960px;
    background-color: #fff;
    box-shadow: 0px 0px 10px #ccc;
    margin: 0 auto;
    padding: 30px;
  }
  .wrapper i {
    position: absolute;
    right: -48px;
    top: 24px;
    cursor: pointer;
  }
  .title-inp-wrapper {
    text-align: center;
    margin-top: 20px;
    margin-bottom: 20px;
  }
  .info {
    background-color: #e1e1e1;
    color: #333;
  }
  .title {
    text-align: center;
    margin-bottom: 40px;
  }
  .content-inp {
    width: 100%;
    min-height: 100px;
  }
  input[type="file"] {
    display: none;
  }
</style>
