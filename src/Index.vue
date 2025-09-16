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

const KEY_MAP = {
  1: 'C',
  2: 'D',
  3: 'E',
  4: 'F',
  5: 'G',
  6: 'A',
  7: 'B'
}

const baseNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const octaves = [1, 2, 3, 4, 5, 6, 7]
const audioKeys = octaves.flatMap((octave) =>
  baseNotes.map((note) => `${note}${octave}`)
)

const audioRefs = new Map()

const setAudioRef = (name) => (el) => {
  if (el) {
    audioRefs.set(name, el)
  } else {
    audioRefs.delete(name)
  }
}

const getTempoValue = (tempoCode) => tempoMap[tempoCode] ?? tempoMap.q

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
    const noteStrings = normalizedBar ? normalizedBar.split(',') : []
    const barArr = []
    for (let note of noteStrings) {
      if (!note) {
        continue
      }
      let key = note.replace(/[\^$]*/g, '').replace(/[qwe]{1,4}/g, '')
      const rangeMarkers = note.replace(/[@#0-7]*[qwe]*/g, '')
      const range = rangeMarkers.includes('^') ? rangeMarkers.length : -rangeMarkers.length
      const tempoCode = note.replace(/[\^$@#0-7]*/g, '')
      if (tempoCode.length > 1 && tempoCode[0] === tempoCode[1]) {
        const tempoValue = getTempoValue(tempoCode.slice(0, 1))
        for (let i = tempoCode.length; i > 0; i--) {
          if (i !== tempoCode.length) {
            key = '-'
          }
          barArr.push({ key, range, tempo: tempoValue })
          newKeys.push({
            range,
            key: key.replace(/[#@]/, '').replace('-', '0'),
            tempo: tempoValue
          })
        }
      } else {
        const tempoValue = getTempoValue(tempoCode)
        barArr.push({ key, range, tempo: tempoValue })
        newKeys.push({
          range,
          key: key.replace(/[#@]/, '').replace('-', '0'),
          tempo: tempoValue
        })
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

    let audio
    if (item.key !== '0') {
      const audioKey = `${KEY_MAP[item.key] || ''}${item.range + 4}`
      audio = audioRefs.get(audioKey)
      if (playing.value && audio) {
        audio.currentTime = 0
        audio.play()
      }
    }

    setTimeout(() => {
      if (item.key !== '0' && audio) {
        audio.pause()
        audio.currentTime = 0
      }

      if (!playing.value) {
        return
      }

      index += 1
      if (index < keysArr.value.length) {
        playNext()
      } else {
        playing.value = false
      }
    }, item.tempo * timeUnit)
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
