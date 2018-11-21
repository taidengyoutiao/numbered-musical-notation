<template>
  <div>
    <div class="wrapper">
      <h2 class="title">{{title}}</h2>
      <div>
        <Bar v-for="(item, key) in notes" :key="key" :barData="item"></Bar>
      </div>
      <hr>
      <div class="title-inp-wrapper"><input type="text" v-model="title"></div>
      <div>
        <textarea class="content-inp" v-model="content"></textarea>
      </div>
      <i class="material-icons" @click="importFile">add_circle</i>
      <i class="material-icons" @click="exportFile" style="top: 72px;">get_app</i>
      <input type="file" ref="json-input">
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
  </div>
</template>

<script>
import { MdButton } from 'vue-material/dist/components'
import 'vue-material/dist/vue-material.min.css'
import Vue from 'vue'
import Bar from '@/components/Bar'
import song from '@/test.js'
import { Base64 } from 'js-base64'

Vue.use(MdButton)

export default {
  data () {
    return {
      title: '',
      content: '',
      tempoMap: {
        q: 4,
        rot: 'rot',
        w: 2,
        e: 1,
        qw: 6,
        wq: 6,
        we: 3,
        ew: 3
      }
    }
  },
  computed: {
    // 从字符串解码为对象
    notes () {
      let that = this
      let content = this.content
      let arr = []
      // 逗号分隔音符，空格分隔小节，删除一些换行和多余空格
      content = content.replace(/\r|\n/g, ' ')
      content = content.replace(/\s+/g, ' ').trim()
      // 将曲子转换为小节数组组成的数组
      content = content.split(' ')
      for (let bar of content) {
        let barArr = []
        // 将每个小节转换为音符对象组成的数组
        bar = bar.split(',')
        for (let note of bar) {
          let key = 0
          let range = 0
          let tempo = 0
          // 从字符串单元中找回信息
          // key: 用来决定音高，用来渲染0-7和二分音符。表示法: 01234567
          // range: 用来决定音区，用来渲染音符上下的点点。表示法: $, ^
          // tempo: 用来决定音符时长，1为单位，16分音符的长度。表示法: q, w, e, qq, we, qw, qqq
          key = note.replace(/[\^$]*/, '').replace(/[qwe]{1,4}/, '')
          range = note.replace(/[@#0-7]*[qwe]*/, '').indexOf('^') !== -1 ? note.replace(/[@#0-7]*[qwe]*/, '').length : -note.replace(/[@#0-7]*[qwe]*/, '').length
          tempo = note.replace(/[\^$@#0-7]*/, '')
          if (tempo.length > 1 && tempo[0] === tempo[1]) {
            for (let i = tempo.length; i > 0; i--) {
              if (i !== tempo.length) {
                key = '-'
                range = 0
              }
              barArr.push({key, range, tempo: that.tempoMap[tempo.slice(0, 1)]})
            }
          } else {
            barArr.push({key, range, tempo: that.tempoMap[tempo]})
          }
        }
        arr.push(barArr)
      }
      return arr
    }
  },
  methods: {
    importFile () {
      let that = this
      let inputEle = this.$refs['json-input']
      inputEle.click()
      inputEle.addEventListener('change', function () {
        let file = this.files[0]
        if (file) {
          let fr = new FileReader()
          fr.readAsDataURL(file)

          fr.onload = function () {
            let o = JSON.parse(Base64.decode(fr.result.slice(29)))
            that.title = o.title
            that.content = o.content
          }
        }
      })
    },
    exportFile () {
      let blob = new Blob([JSON.stringify({title: this.title, content: this.content}, null, 2)], {type: 'application/json'})
      let a = document.createElement('a')
      a.download = `${this.title}.json`
      a.href = window.URL.createObjectURL(blob)
      a.click()
    }
  },
  components: { Bar },
  mounted () {
    this.content = song.content
    this.title = song.title
  }
}
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
